import { useCallback, useEffect, useState } from 'react';
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
  Pressable,
  Image,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { API_BASE } from '../constants/api';
import type { Etudiant } from '../types/etudiant';
import type { Classe } from '../types/classe';

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

export default function Etudiants() {
  const [etudiants, setEtudiants] = useState<Etudiant[]>([]);
  const [classes, setClasses] = useState<Classe[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [email, setEmail] = useState('');
  const [matricule, setMatricule] = useState('');
  const [selectedClasse, setSelectedClasse] = useState<Classe | null>(null);
  const [photoUri, setPhotoUri] = useState<string | null>(null);

  const loadEtudiants = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/etudiants`);
      if (response.ok) {
        setEtudiants(await response.json());
      } else {
        setEtudiants([]);
      }
    } catch {
      setEtudiants([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEtudiants();
  }, [loadEtudiants]);

  useEffect(() => {
    const loadClasses = async () => {
      try {
        const response = await fetch(`${API_BASE}/classes`);
        if (response.ok) {
          setClasses(await response.json());
        }
      } catch {
        setClasses([]);
      }
    };

    loadClasses();
  }, []);

  const resetForm = () => {
    setNom('');
    setPrenom('');
    setEmail('');
    setMatricule('');
    setSelectedClasse(null);
    setPhotoUri(null);
    setFormError(null);
  };

  const openForm = () => {
    resetForm();
    setShowForm(true);
  };

  const pickPhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setFormError('Autorisation galerie refusée');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
      setFormError(null);
    }
  };

  const handleSubmit = async () => {
    if (!nom.trim() || !prenom.trim() || !email.trim() || !matricule.trim()) {
      setFormError('Veuillez remplir tous les champs obligatoires');
      return;
    }
    if (!selectedClasse) {
      setFormError('Veuillez sélectionner une classe');
      return;
    }

    setSubmitting(true);
    setFormError(null);

    try {
      const response = await fetch(`${API_BASE}/etudiants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nom: nom.trim(),
          prenom: prenom.trim(),
          email: email.trim(),
          matricule: matricule.trim(),
          photoUrl: photoUri ?? '',
          classe: { id: selectedClasse.id },
        }),
      });

      if (response.ok) {
        setShowForm(false);
        resetForm();
        await loadEtudiants();
      } else {
        setFormError('Impossible d\'ajouter l\'étudiant');
      }
    } catch {
      setFormError('Impossible d\'ajouter l\'étudiant');
    } finally {
      setSubmitting(false);
    }
  };

  const renderEtudiant = ({ item }: { item: Etudiant }) => (
    <View style={styles.card}>
      <View style={styles.cardRow}>
        {item.photoUrl ? (
          <Image source={{ uri: item.photoUrl }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Ionicons name="person" size={28} color="#8B4513" />
          </View>
        )}
        <View style={styles.cardInfo}>
          <Text style={styles.name}>
            {item.prenom} {item.nom}
          </Text>
          <Text style={styles.matricule}>Matricule : {item.matricule}</Text>
          <View style={styles.classeChip}>
            <Ionicons name="school-outline" size={14} color="#8B4513" />
            <Text style={styles.classeText}>{item.classe?.nom ?? '—'}</Text>
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconButton} onPress={() => router.back()} activeOpacity={0.85}>
          <Ionicons name="arrow-back" size={22} color="#8B4513" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mes étudiants</Text>
        <TouchableOpacity style={styles.addButton} onPress={openForm} activeOpacity={0.85}>
          <Ionicons name="add" size={26} color="#ffffff" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#8B4513" style={styles.loader} />
      ) : (
        <FlatList
          data={etudiants}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderEtudiant}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.emptyText}>Aucun étudiant enregistré</Text>
          }
        />
      )}

      <Modal visible={showForm} animationType="slide" transparent onRequestClose={() => setShowForm(false)}>
        <View style={styles.formOverlay}>
          <View style={styles.formCard}>
            <View style={styles.formHeader}>
              <Text style={styles.formTitle}>Nouvel étudiant</Text>
              <TouchableOpacity onPress={() => setShowForm(false)}>
                <Ionicons name="close" size={24} color="#7D6B5A" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.label}>Nom</Text>
              <TextInput
                style={styles.input}
                value={nom}
                onChangeText={setNom}
                placeholder="Nom"
                placeholderTextColor="#94a3b8"
              />

              <Text style={styles.label}>Prénom</Text>
              <TextInput
                style={styles.input}
                value={prenom}
                onChangeText={setPrenom}
                placeholder="Prénom"
                placeholderTextColor="#94a3b8"
              />

              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="email@exemple.com"
                placeholderTextColor="#94a3b8"
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <Text style={styles.label}>Matricule</Text>
              <TextInput
                style={styles.input}
                value={matricule}
                onChangeText={setMatricule}
                placeholder="E2026001"
                placeholderTextColor="#94a3b8"
              />

              <Dropdown
                label="Classe"
                placeholder="Sélectionner une classe"
                options={classes}
                selected={selectedClasse}
                getLabel={(c) => `${c.nom} (${c.niveau})`}
                onSelect={setSelectedClasse}
              />

              <Text style={styles.label}>Photo</Text>
              <TouchableOpacity style={styles.photoButton} onPress={pickPhoto} activeOpacity={0.85}>
                <Ionicons name="image-outline" size={22} color="#8B4513" />
                <Text style={styles.photoButtonText}>
                  {photoUri ? 'Changer la photo' : 'Choisir depuis la galerie'}
                </Text>
              </TouchableOpacity>
              {photoUri && <Image source={{ uri: photoUri }} style={styles.photoPreview} />}

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
                  <Text style={styles.submitText}>Ajouter l'étudiant</Text>
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
  },
  card: {
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
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  avatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F5DEB3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardInfo: {
    flex: 1,
  },
  name: {
    fontSize: 17,
    fontWeight: '700',
    color: '#5C3317',
    marginBottom: 4,
  },
  matricule: {
    fontSize: 14,
    color: '#7D6B5A',
    marginBottom: 8,
  },
  classeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    backgroundColor: '#F5DEB3',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  classeText: {
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
    maxHeight: '92%',
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
  photoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#FAF3E0',
    borderWidth: 1,
    borderColor: '#E8D5BF',
    borderRadius: 10,
    paddingVertical: 14,
    marginBottom: 12,
  },
  photoButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#8B4513',
  },
  photoPreview: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignSelf: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#E8D5BF',
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
});
