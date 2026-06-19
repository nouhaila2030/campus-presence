import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { API_BASE } from '../constants/api';
import type { Enseignant } from '../types/enseignant';
import type { Seance } from '../types/seance';
import type { Absence } from '../types/absence';

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
}

function formatTime(timeStr: string): string {
  return timeStr?.length >= 5 ? timeStr.substring(0, 5) : timeStr;
}

export default function Absences() {
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
  const [loadingSeances, setLoadingSeances] = useState(true);
  const [selectedSeance, setSelectedSeance] = useState<Seance | null>(null);
  const selectedSeanceId = selectedSeance?.id ?? null;

  const [absences, setAbsences] = useState<Absence[]>([]);
  const [loadingAbsences, setLoadingAbsences] = useState(false);

  const loadSeances = useCallback(async () => {
    if (enseignantId == null) {
      setLoadingSeances(false);
      return;
    }
    setLoadingSeances(true);
    try {
      const response = await fetch(`${API_BASE}/seances?enseignantId=${enseignantId}`);
      if (response.ok) {
        setSeances(await response.json());
      } else {
        setSeances([]);
      }
    } catch {
      setSeances([]);
    } finally {
      setLoadingSeances(false);
    }
  }, [enseignantId]);

  useEffect(() => {
    loadSeances();
  }, [loadSeances]);

  useEffect(() => {
    if (selectedSeanceId == null) {
      setAbsences([]);
      return;
    }

    let cancelled = false;

    const loadAbsences = async () => {
      setLoadingAbsences(true);
      try {
        const response = await fetch(`${API_BASE}/absences?seanceId=${selectedSeanceId}`);
        if (!cancelled) {
          if (response.ok) {
            setAbsences(await response.json());
          } else {
            setAbsences([]);
          }
        }
      } catch {
        if (!cancelled) {
          setAbsences([]);
        }
      } finally {
        if (!cancelled) {
          setLoadingAbsences(false);
        }
      }
    };

    loadAbsences();

    return () => {
      cancelled = true;
    };
  }, [selectedSeanceId]);

  const handleBack = () => {
    if (selectedSeance) {
      setSelectedSeance(null);
    } else {
      router.back();
    }
  };

  const renderSeance = ({ item }: { item: Seance }) => (
    <TouchableOpacity
      style={styles.seanceCard}
      onPress={() => setSelectedSeance(item)}
      activeOpacity={0.85}
    >
      <View style={styles.seanceHeader}>
        <Ionicons name="calendar-outline" size={20} color="#8B4513" />
        <Text style={styles.seanceDate}>{formatDate(item.date)}</Text>
      </View>
      <Text style={styles.seanceTime}>
        {formatTime(item.heureDebut)} – {formatTime(item.heureFin)}
      </Text>
      <View style={styles.seanceMeta}>
        <Text style={styles.metaText}>{item.classe?.nom}</Text>
        <Text style={styles.metaDot}>•</Text>
        <Text style={styles.metaText}>{item.matiere?.nom}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#CD853F" style={styles.chevron} />
    </TouchableOpacity>
  );

  const renderAbsence = ({ item }: { item: Absence }) => (
    <View style={styles.absenceCard}>
      <View style={styles.absenceHeader}>
        <Ionicons name="person-outline" size={20} color="#8B4513" />
        <Text style={styles.studentName}>
          {item.etudiant?.prenom} {item.etudiant?.nom}
        </Text>
      </View>
      <Text style={styles.matricule}>Matricule : {item.etudiant?.matricule ?? '—'}</Text>
      <Text style={styles.absenceDate}>Date : {formatDate(item.date)}</Text>
      <View
        style={[
          styles.statusBadge,
          item.justifiee ? styles.statusJustified : styles.statusUnjustified,
        ]}
      >
        <Text
          style={[
            styles.statusText,
            item.justifiee ? styles.statusTextJustified : styles.statusTextUnjustified,
          ]}
        >
          {item.justifiee ? 'Justifiée' : 'Non justifiée'}
        </Text>
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
        <TouchableOpacity style={styles.iconButton} onPress={handleBack} activeOpacity={0.85}>
          <Ionicons name="arrow-back" size={22} color="#8B4513" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {selectedSeance ? 'Absences' : 'Choisir une séance'}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      {selectedSeance && (
        <View style={styles.selectedBanner}>
          <Text style={styles.selectedBannerText}>
            {formatDate(selectedSeance.date)} · {selectedSeance.classe?.nom} ·{' '}
            {selectedSeance.matiere?.nom}
          </Text>
        </View>
      )}

      {selectedSeance ? (
        loadingAbsences ? (
          <ActivityIndicator size="large" color="#8B4513" style={styles.loader} />
        ) : (
          <FlatList
            data={absences}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderAbsence}
            contentContainerStyle={styles.list}
            ListEmptyComponent={
              <Text style={styles.emptyText}>Aucune absence pour cette séance</Text>
            }
          />
        )
      ) : loadingSeances ? (
        <ActivityIndicator size="large" color="#8B4513" style={styles.loader} />
      ) : (
        <FlatList
          data={seances}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderSeance}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.emptyText}>Aucune séance disponible</Text>
          }
        />
      )}
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
  headerSpacer: {
    width: 40,
  },
  selectedBanner: {
    marginHorizontal: 20,
    marginBottom: 8,
    backgroundColor: '#F5DEB3',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E8D5BF',
  },
  selectedBannerText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5C3317',
    textAlign: 'center',
  },
  loader: {
    marginTop: 40,
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 24,
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
    marginBottom: 8,
  },
  seanceMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 14,
    color: '#7D6B5A',
    fontWeight: '500',
  },
  metaDot: {
    color: '#CD853F',
  },
  chevron: {
    position: 'absolute',
    right: 16,
    top: '50%',
    marginTop: -10,
  },
  absenceCard: {
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
  absenceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  studentName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#5C3317',
  },
  matricule: {
    fontSize: 14,
    color: '#7D6B5A',
    marginBottom: 4,
  },
  absenceDate: {
    fontSize: 14,
    color: '#7D6B5A',
    marginBottom: 12,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusJustified: {
    backgroundColor: '#dcfce7',
  },
  statusUnjustified: {
    backgroundColor: '#fee2e2',
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
  },
  statusTextJustified: {
    color: '#15803d',
  },
  statusTextUnjustified: {
    color: '#dc2626',
  },
  emptyText: {
    textAlign: 'center',
    color: '#7D6B5A',
    fontSize: 15,
    marginTop: 40,
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
