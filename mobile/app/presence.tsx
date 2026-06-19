import { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ActivityIndicator, ScrollView, Alert, Platform, Switch,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { API_BASE } from '../constants/api';
import type { Enseignant } from '../types/enseignant';
import type { Etudiant } from '../types/etudiant';
import type { Seance } from '../types/seance';

const IA_URL = Platform.OS === 'web'
  ? 'http://localhost:5000'
  : 'http://10.92.93.120:5000';

type StudentStatus = {
  etudiant: Etudiant;
  present: boolean;
  detectedByIA: boolean;
};

export default function Presence() {
  const { enseignant: enseignantParam } = useLocalSearchParams<{ enseignant: string }>();
  const enseignant: Enseignant | null = enseignantParam ? JSON.parse(enseignantParam) : null;

  const [seances, setSeances] = useState<Seance[]>([]);
  const [selectedSeance, setSelectedSeance] = useState<Seance | null>(null);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [saving, setSaving] = useState(false);
  const [statuses, setStatuses] = useState<StudentStatus[]>([]);
  const [scanned, setScanned] = useState(false);

  // Charger séances
  useEffect(() => {
    const url = enseignant?.id
      ? `${API_BASE}/seances?enseignantId=${enseignant.id}`
      : `${API_BASE}/seances`;
    fetch(url, { headers: { 'bypass-tunnel-reminder': 'true' } })
      .then(r => r.json())
      .then(d => setSeances(Array.isArray(d) ? d : []))
      .catch(() => setSeances([]));
  }, [enseignant?.id]);

  // Charger étudiants quand séance sélectionnée
  useEffect(() => {
    if (!selectedSeance) return;
    fetch(`${API_BASE}/etudiants`, { headers: { 'bypass-tunnel-reminder': 'true' } })
      .then(r => r.json())
      .then((data: Etudiant[]) => {
        const list = Array.isArray(data) ? data : [];
        setStatuses(list.map(e => ({ etudiant: e, present: true, detectedByIA: false })));
        setScanned(false);
        setPhotoUri(null);
      })
      .catch(() => setStatuses([]));
  }, [selectedSeance]);

  const pickPhoto = async () => {
    if (Platform.OS === 'web') {
      const input = document.createElement('input');
      input.type = 'file'; input.accept = 'image/*';
      input.onchange = (e: any) => {
        const file = e.target.files?.[0];
        if (file) { (window as any)._photoFile = file; setPhotoUri(URL.createObjectURL(file)); setScanned(false); }
      };
      input.click(); return;
    }
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      const gal = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!gal.granted) { Alert.alert('Permission refusée'); return; }
      const res = await ImagePicker.launchImageLibraryAsync({ quality: 0.7 });
      if (!res.canceled && res.assets?.[0]) { setPhotoUri(res.assets[0].uri); setScanned(false); }
      return;
    }
    const res = await ImagePicker.launchCameraAsync({ quality: 0.7 });
    if (!res.canceled && res.assets?.[0]) { setPhotoUri(res.assets[0].uri); setScanned(false); }
  };

  const scanPresence = async () => {
    if (!photoUri) return;
    setScanning(true);
    try {
      const formData = new FormData();
      if (Platform.OS === 'web') {
        const file = (window as any)._photoFile;
        if (file) formData.append('image', file);
        else { const blob = await fetch(photoUri).then(r => r.blob()); formData.append('image', blob, 'photo.jpg'); }
      } else {
        formData.append('image', { uri: photoUri, type: 'image/jpeg', name: 'photo.jpg' } as any);
      }
      const response = await fetch(`${IA_URL}/scan-group`, {
        method: 'POST', body: formData,
        headers: { 'bypass-tunnel-reminder': 'true' },
      });
      if (!response.ok) { Alert.alert('Erreur IA', await response.text()); return; }
      const data = await response.json();
     const presentNames: string[] = data.present || [];
      setStatuses(prev => prev.map(s => {
        const n1 = `${s.etudiant.prenom} ${s.etudiant.nom}`.toLowerCase().trim().replace(/\s+/g, ' ');
        const n2 = `${s.etudiant.nom} ${s.etudiant.prenom}`.toLowerCase().trim().replace(/\s+/g, ' ');
        const detected = presentNames.some(n => {
          const nl = n.toLowerCase().trim().replace(/\s+/g, ' ');
          return nl === n1 || nl === n2 ||
                 nl.includes(s.etudiant.nom.toLowerCase().trim()) ||
                 nl.includes(s.etudiant.prenom.toLowerCase().trim());
        });
        return { ...s, present: detected, detectedByIA: detected };
      }));
      setScanned(true);
    } catch (e: any) {
      Alert.alert('Erreur réseau', e?.message || String(e));
    } finally {
      setScanning(false);
    }
  };

  const togglePresence = (id: number) => {
    setStatuses(prev => prev.map(s => s.etudiant.id === id ? { ...s, present: !s.present } : s));
  };

  const validateAndSend = async () => {
    if (!selectedSeance) { Alert.alert('Sélectionne une séance'); return; }
    setSaving(true);
    try {
      const absents = statuses.filter(s => !s.present);
      await Promise.all(absents.map(s =>
        fetch(`${API_BASE}/absences`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'bypass-tunnel-reminder': 'true' },
          body: JSON.stringify({
            date: selectedSeance.date,
            justifiee: false,
            etudiant: { id: s.etudiant.id },
            seance: { id: selectedSeance.id },
          }),
        })
      ));
      Alert.alert('✅ Validé',
        `${absents.length} absence(s) enregistrée(s)\nSéance : ${selectedSeance.date} · ${selectedSeance.matiere?.nom}`,
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (e: any) {
      Alert.alert('Erreur', e?.message);
    } finally {
      setSaving(false);
    }
  };

  // Grouper par filière (classe.nom)
  const grouped = statuses.reduce((acc, s) => {
    const key = s.etudiant.classe?.nom ?? 'Autre';
    if (!acc[key]) acc[key] = [];
    acc[key].push(s);
    return acc;
  }, {} as Record<string, StudentStatus[]>);

  const presentCount = statuses.filter(s => s.present).length;
  const absentCount = statuses.filter(s => !s.present).length;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#8B4513" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Prise de présence</Text>
        {statuses.length > 0 && (
          <View style={styles.counters}>
            <Text style={styles.countPresent}>✓{presentCount}</Text>
            <Text style={styles.countAbsent}>✗{absentCount}</Text>
          </View>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* SÉANCE */}
        <Text style={styles.sectionLabel}>Séance</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
          {seances.map(s => (
            <TouchableOpacity key={s.id}
              style={[styles.chip, selectedSeance?.id === s.id && styles.chipSelected]}
              onPress={() => { setSelectedSeance(s); setScanned(false); setPhotoUri(null); }}>
              <Text style={[styles.chipText, selectedSeance?.id === s.id && styles.chipTextSelected]}>
                {s.date}
              </Text>
              <Text style={[styles.chipSub, selectedSeance?.id === s.id && { color: '#F5DEB3' }]}>
                {s.matiere?.nom} · {s.classe?.nom}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {selectedSeance && (
          <>
            {/* PHOTO */}
            <Text style={styles.sectionLabel}>Photo du groupe</Text>
            <TouchableOpacity style={styles.photoArea} onPress={pickPhoto} activeOpacity={0.85}>
              {photoUri
                ? <Image source={{ uri: photoUri }} style={styles.photoImg} contentFit="cover" />
                : <View style={styles.photoEmpty}>
                    <Ionicons name="camera-outline" size={36} color="#CD853F" />
                    <Text style={styles.photoEmptyText}>Appuyer pour prendre une photo</Text>
                  </View>
              }
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.scanBtn, (!photoUri || scanning) && styles.scanBtnOff]}
              onPress={scanPresence} disabled={!photoUri || scanning} activeOpacity={0.85}>
              {scanning
                ? <><ActivityIndicator color="#fff" size="small" /><Text style={styles.scanBtnText}> Analyse en cours...</Text></>
                : <><Ionicons name="scan-outline" size={20} color="#fff" />
                    <Text style={styles.scanBtnText}>{scanned ? 'Rescanner' : 'Scanner les présences'}</Text></>
              }
            </TouchableOpacity>

            {/* TABLEAU PAR FILIÈRE */}
            {statuses.length > 0 && Object.entries(grouped).map(([filiere, students]) => (
              <View key={filiere} style={styles.filiereBlock}>
                <View style={styles.filiereHeader}>
                  <Text style={styles.filiereTitle}>{filiere}</Text>
                  <Text style={styles.filiereCount}>
                    {students.filter(s => s.present).length}/{students.length} présents
                  </Text>
                </View>

                {/* En-tête tableau */}
                <View style={styles.tableHeader}>
                  <Text style={[styles.tableCell, styles.tableCellName, styles.tableHeaderText]}>Étudiant</Text>
                  <Text style={[styles.tableCell, styles.tableCellMatricule, styles.tableHeaderText]}>Matricule</Text>
                  <Text style={[styles.tableCell, styles.tableCellStatus, styles.tableHeaderText]}>Présent</Text>
                </View>

                {students.map((s, i) => (
                  <View key={s.etudiant.id}
                    style={[styles.tableRow, i % 2 === 0 && styles.tableRowEven, !s.present && styles.tableRowAbsent]}>
                    <View style={[styles.tableCell, styles.tableCellName]}>
                      <Text style={styles.studentName} numberOfLines={1}>
                        {s.etudiant.prenom} {s.etudiant.nom}
                      </Text>
                      {s.detectedByIA && <Text style={styles.iaTag}>🤖 IA</Text>}
                    </View>
                    <Text style={[styles.tableCell, styles.tableCellMatricule, styles.matriculeText]} numberOfLines={1}>
                      {s.etudiant.matricule}
                    </Text>
                    <View style={[styles.tableCell, styles.tableCellStatus, { alignItems: 'center' }]}>
                      <Switch
                        value={s.present}
                        onValueChange={() => togglePresence(s.etudiant.id)}
                        trackColor={{ false: '#fca5a5', true: '#86efac' }}
                        thumbColor={s.present ? '#22c55e' : '#ef4444'}
                        style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
                      />
                    </View>
                  </View>
                ))}
              </View>
            ))}

            {/* BOUTON VALIDER */}
            {statuses.length > 0 && (
              <TouchableOpacity
                style={[styles.validateBtn, saving && { opacity: 0.6 }]}
                onPress={validateAndSend} disabled={saving} activeOpacity={0.85}>
                {saving
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <><Ionicons name="checkmark-circle-outline" size={22} color="#fff" />
                      <Text style={styles.validateBtnText}>
                        Valider — {absentCount} absent{absentCount > 1 ? 's' : ''}
                      </Text></>
                }
              </TouchableOpacity>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF3E0' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, gap: 10, backgroundColor: '#FFFEF9', borderBottomWidth: 1, borderBottomColor: '#E8D5BF' },
  iconBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#FAF3E0', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#DEB887' },
  headerTitle: { flex: 1, fontSize: 17, fontWeight: '700', color: '#5C3317' },
  counters: { flexDirection: 'row', gap: 8 },
  countPresent: { fontSize: 13, fontWeight: '700', color: '#166534', backgroundColor: '#dcfce7', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  countAbsent: { fontSize: 13, fontWeight: '700', color: '#7A3F1A', backgroundColor: '#FFF8EF', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  content: { padding: 16, paddingBottom: 40 },
  sectionLabel: { fontSize: 12, fontWeight: '700', color: '#7D6B5A', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  chip: { backgroundColor: '#FFFEF9', borderWidth: 1.5, borderColor: '#DEB887', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, marginRight: 8, minWidth: 120 },
  chipSelected: { backgroundColor: '#8B4513', borderColor: '#8B4513' },
  chipText: { fontSize: 13, fontWeight: '700', color: '#8B4513' },
  chipTextSelected: { color: '#FFFEF9' },
  chipSub: { fontSize: 11, color: '#7D6B5A', marginTop: 2 },
  photoArea: { borderRadius: 12, overflow: 'hidden', borderWidth: 1.5, borderColor: '#DEB887', marginBottom: 10 },
  photoImg: { width: '100%', height: 160 },
  photoEmpty: { height: 120, backgroundColor: '#FAF3E0', justifyContent: 'center', alignItems: 'center', gap: 6 },
  photoEmptyText: { fontSize: 13, color: '#A89880' },
  scanBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#8B4513', borderRadius: 10, paddingVertical: 13, marginBottom: 16 },
  scanBtnOff: { backgroundColor: '#DEB887' },
  scanBtnText: { color: '#FFFEF9', fontSize: 14, fontWeight: '700' },
  filiereBlock: { marginBottom: 16, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#E8D5BF' },
  filiereHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#5C3317', paddingHorizontal: 12, paddingVertical: 8 },
  filiereTitle: { fontSize: 14, fontWeight: '700', color: '#FFFEF9' },
  filiereCount: { fontSize: 12, color: '#DEB887' },
  tableHeader: { flexDirection: 'row', backgroundColor: '#FAF3E0', paddingVertical: 6 },
  tableHeaderText: { fontSize: 11, fontWeight: '700', color: '#8B4513' },
  tableRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, backgroundColor: '#FFFEF9' },
  tableRowEven: { backgroundColor: '#FAF3E0' },
  tableRowAbsent: { backgroundColor: '#FFF8EF' },
  tableCell: { paddingHorizontal: 8 },
  tableCellName: { flex: 3 },
  tableCellMatricule: { flex: 2 },
  tableCellStatus: { flex: 1.5, justifyContent: 'center' },
  studentName: { fontSize: 13, fontWeight: '600', color: '#5C3317' },
  iaTag: { fontSize: 10, color: '#CD853F' },
  matriculeText: { fontSize: 11, color: '#7D6B5A' },
  validateBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: '#5C3317', borderRadius: 12, paddingVertical: 15, marginTop: 8 },
  validateBtnText: { color: '#FFFEF9', fontSize: 15, fontWeight: '700' },
});
