import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Modal,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Platform,
  Pressable,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { API_BASE } from '../constants/api';
import type { Enseignant } from '../types/enseignant';
import type { Seance } from '../types/seance';
import type { Classe } from '../types/classe';
import type { Matiere } from '../types/matiere';

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
}

function formatTime(timeStr: string): string {
  return timeStr?.length >= 5 ? timeStr.substring(0, 5) : timeStr;
}

function formatDateForApi(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function normalizeTime(value: string): string | null {
  const trimmed = value.trim();
  if (/^\d{2}:\d{2}$/.test(trimmed)) {
    return `${trimmed}:00`;
  }
  if (/^\d{2}:\d{2}:\d{2}$/.test(trimmed)) {
    return trimmed;
  }
  return null;
}

type DropdownProps<T extends { id: number }> = {
  label: string;
  placeholder: string;
  options: T[];
  selected: T | null;
  getLabel: (item: T) => string;
  onSelect: (item: T) => void;
};

function Dropdown<T extends { id: number }>({
  label,
  placeholder,
  options,
  selected,
  getLabel,
  onSelect,
}: DropdownProps<T>) {
  const [open, setOpen] = useState(false);

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity style={styles.dropdown} onPress={() => setOpen(true)} activeOpacity={0.85}>
        <Text style={selected ? styles.dropdownText : styles.dropdownPlaceholder}>
          {selected ? getLabel(selected) : placeholder}
        </Text>
        <Ionicons name="chevron-down" size={20} color="#7D6B5A" />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setOpen(false)}>
          <View style={styles.dropdownModal}>
            <Text style={styles.dropdownModalTitle}>{label}</Text>
            <ScrollView>
              {options.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.dropdownItem}
                  onPress={() => {
                    onSelect(item);
                    setOpen(false);
                  }}
                >
                  <Text style={styles.dropdownItemText}>{getLabel(item)}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

export default function Seances() {
  const { enseignant: enseignantParam } = useLocalSearchParams<{ enseignant: string }>();

  const enseignant = useMemo<Enseignant | null>(() => {
    if (!enseignantParam) return null;
    try {
      return JSON.parse(enseignantParam) as Enseignant;
    } catch {
      return null;
    }
  }, [enseignantParam]);

  const enseignantId = enseignant?.id ?? null;

  const [seances, setSeances] = useState<Seance[]>([]);
  const [classes, setClasses] = useState<Classe[]>([]);
  const [matieres, setMatieres] = useState<Matiere[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [heureDebut, setHeureDebut] = useState('');
  const [heureFin, setHeureFin] = useState('');
  const [selectedClasse, setSelectedClasse] = useState<Classe | null>(null);
  const [selectedMatiere, setSelectedMatiere] = useState<Matiere | null>(null);

  const loadSeances = useCallback(async () => {
    if (enseignantId == null) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/seances?enseignantId=${enseignantId}`);
      if (response.ok) {
        const data: Seance[] = await response.json();
        setSeances(data);
      }
    } catch {
      setSeances([]);
    } finally {
      setLoading(false);
    }
  }, [enseignantId]);

  useEffect(() => {
    loadSeances();
  }, [loadSeances]);

  useEffect(() => {
    const loadFormData = async () => {
      try {
        const [classesRes, matieresRes] = await Promise.all([
          fetch(`${API_BASE}/classes`),
          fetch(`${API_BASE}/matieres`),
        ]);
        if (classesRes.ok) {
          setClasses(await classesRes.json());
        }
        if (matieresRes.ok) {
          setMatieres(await matieresRes.json());
        }
      } catch {
        setClasses([]);
        setMatieres([]);
      }
    };

    loadFormData();
  }, []);

  const resetForm = () => {
    setDate(new Date());
    setHeureDebut('');
    setHeureFin('');
    setSelectedClasse(null);
    setSelectedMatiere(null);
    setFormError(null);
  };

  const openForm = () => {
    resetForm();
    setShowForm(true);
  };

  const onDateChange = (_event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  const handleSubmit = async () => {
    if (enseignantId == null) return;

    const debut = normalizeTime(heureDebut);
    const fin = normalizeTime(heureFin);

    if (!debut || !fin) {
      setFormError('Format horaire invalide (HH:MM)');
      return;
    }
    if (!selectedClasse || !selectedMatiere) {
      setFormError('Veuillez sélectionner une classe et une matière');
      return;
    }

    setSubmitting(true);
    setFormError(null);

    try {
      const response = await fetch(`${API_BASE}/seances`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: formatDateForApi(date),
          heureDebut: debut,
          heureFin: fin,
          enseignant: { id: enseignantId },
          classe: { id: selectedClasse.id },
          matiere: { id: selectedMatiere.id },
        }),
      });

      if (response.ok) {
        setShowForm(false);
        resetForm();
        await loadSeances();
      } else {
        setFormError('Impossible de créer la séance');
      }
    } catch {
      setFormError('Impossible de créer la séance');
    } finally {
      setSubmitting(false);
    }
  };

  const renderSeance = ({ item }: { item: Seance }) => (
    <View style={styles.seanceCard}>
      <View style={styles.seanceHeader}>
        <Ionicons name="calendar-outline" size={20} color="#8B4513" />
        <Text style={styles.seanceDate}>{formatDate(item.date)}</Text>
      </View>
      <Text style={styles.seanceTime}>
        {formatTime(item.heureDebut)} – {formatTime(item.heureFin)}
      </Text>
      <View style={styles.seanceMeta}>
        <View style={styles.metaChip}>
          <Ionicons name="school-outline" size={14} color="#8B4513" />
          <Text style={styles.metaText}>{item.classe?.nom ?? '—'}</Text>
        </View>
        <View style={styles.metaChip}>
          <Ionicons name="book-outline" size={14} color="#8B4513" />
          <Text style={styles.metaText}>{item.matiere?.nom ?? '—'}</Text>
        </View>
      </View>
    </View>
  );

  if (!enseignant) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.fallback}>
          <Text style={styles.fallbackText}>Session invalide</Text>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backBtnText}>Retour</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconButton} onPress={() => router.back()} activeOpacity={0.85}>
          <Ionicons name="arrow-back" size={22} color="#8B4513" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mes séances</Text>
        <TouchableOpacity style={styles.addButton} onPress={openForm} activeOpacity={0.85}>
          <Ionicons name="add" size={26} color="#ffffff" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#8B4513" style={styles.loader} />
      ) : (
        <FlatList
          data={seances}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderSeance}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.emptyText}>Aucune séance planifiée</Text>
          }
        />
      )}

      <Modal visible={showForm} animationType="slide" transparent onRequestClose={() => setShowForm(false)}>
        <View style={styles.formOverlay}>
          <View style={styles.formCard}>
            <View style={styles.formHeader}>
              <Text style={styles.formTitle}>Nouvelle séance</Text>
              <TouchableOpacity onPress={() => setShowForm(false)}>
                <Ionicons name="close" size={24} color="#7D6B5A" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.label}>Date</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowDatePicker(true)}
                activeOpacity={0.85}
              >
                <Ionicons name="calendar-outline" size={20} color="#8B4513" />
                <Text style={styles.dateButtonText}>{formatDate(formatDateForApi(date))}</Text>
              </TouchableOpacity>

              {showDatePicker && (
                <DateTimePicker
                  value={date}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={onDateChange}
                />
              )}

              <Text style={styles.label}>Heure début</Text>
              <TextInput
                style={styles.input}
                value={heureDebut}
                onChangeText={setHeureDebut}
                placeholder="08:00"
                placeholderTextColor="#94a3b8"
                keyboardType="numbers-and-punctuation"
              />

              <Text style={styles.label}>Heure fin</Text>
              <TextInput
                style={styles.input}
                value={heureFin}
                onChangeText={setHeureFin}
                placeholder="10:00"
                placeholderTextColor="#94a3b8"
                keyboardType="numbers-and-punctuation"
              />

              <Dropdown
                label="Classe"
                placeholder="Sélectionner une classe"
                options={classes}
                selected={selectedClasse}
                getLabel={(c) => `${c.nom} (${c.niveau})`}
                onSelect={setSelectedClasse}
              />

              <Dropdown
                label="Matière"
                placeholder="Sélectionner une matière"
                options={matieres}
                selected={selectedMatiere}
                getLabel={(m) => m.nom}
                onSelect={setSelectedMatiere}
              />

              {formError && <Text style={styles.formError}>{formError}</Text>}

              <TouchableOpacity
                style={[styles.submitButton, submitting && styles.submitDisabled]}
                onPress={handleSubmit}
                disabled={submitting}
                activeOpacity={0.85}
              >
                {submitting ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.submitText}>Créer la séance</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF3E0',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    backgroundColor: '#FFFEF9',
    borderBottomWidth: 1,
    borderBottomColor: '#E8D5BF',
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FAF3E0',
    borderWidth: 1,
    borderColor: '#E8D5BF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    color: '#5C3317',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#8B4513',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loader: {
    marginTop: 40,
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    gap: 12,
  },
  seanceCard: {
    backgroundColor: '#FFFEF9',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E8D5BF',
    marginBottom: 12,
    shadowColor: '#8B4513',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  seanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  seanceDate: {
    fontSize: 17,
    fontWeight: '700',
    color: '#5C3317',
  },
  seanceTime: {
    fontSize: 15,
    color: '#7D6B5A',
    marginBottom: 12,
  },
  seanceMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F5DEB3',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  metaText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8B4513',
  },
  emptyText: {
    textAlign: 'center',
    color: '#7D6B5A',
    fontSize: 15,
    marginTop: 40,
  },
  formOverlay: {
    flex: 1,
    backgroundColor: 'rgba(92, 51, 23, 0.45)',
    justifyContent: 'flex-end',
  },
  formCard: {
    backgroundColor: '#FFFEF9',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    maxHeight: '90%',
  },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#5C3317',
  },
  field: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8B4513',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FAF3E0',
    borderWidth: 1,
    borderColor: '#E8D5BF',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#5C3317',
    marginBottom: 16,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FAF3E0',
    borderWidth: 1,
    borderColor: '#E8D5BF',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 16,
  },
  dateButtonText: {
    fontSize: 16,
    color: '#5C3317',
    fontWeight: '500',
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FAF3E0',
    borderWidth: 1,
    borderColor: '#E8D5BF',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  dropdownText: {
    fontSize: 16,
    color: '#5C3317',
  },
  dropdownPlaceholder: {
    fontSize: 16,
    color: '#A89880',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(92, 51, 23, 0.45)',
    justifyContent: 'center',
    padding: 24,
  },
  dropdownModal: {
    backgroundColor: '#FFFEF9',
    borderRadius: 14,
    padding: 16,
    maxHeight: '60%',
  },
  dropdownModalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#5C3317',
    marginBottom: 12,
  },
  dropdownItem: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E8D5BF',
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#5C3317',
  },
  formError: {
    color: '#dc2626',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  submitButton: {
    backgroundColor: '#8B4513',
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  submitDisabled: {
    opacity: 0.7,
  },
  submitText: {
    color: '#FFFEF9',
    fontSize: 17,
    fontWeight: '600',
  },
  fallback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  fallbackText: {
    fontSize: 16,
    color: '#7D6B5A',
    marginBottom: 16,
  },
  backBtn: {
    backgroundColor: '#8B4513',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  backBtnText: {
    color: '#FFFEF9',
    fontWeight: '600',
  },
});
