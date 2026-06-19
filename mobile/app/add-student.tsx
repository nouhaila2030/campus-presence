import { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  TextInput, ActivityIndicator, Alert, Platform, ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';

const IA_URL = Platform.OS === 'web'
  ? 'http://localhost:5000'
  : 'http://10.92.93.120:5000';

const STUDENTS = [
  'Hajar elasri',
  'hiba hajouji',
  'Nouhaila elhamal',
  'Rania sellak',
];

export default function AddStudent() {
  const [name, setName] = useState('');
  const [filiere, setFiliere] = useState('IRISI');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const pickPhoto = async () => {
    if (Platform.OS === 'web') {
      const input = document.createElement('input');
      input.type = 'file'; input.accept = 'image/*';
      input.onchange = (e: any) => {
        const file = e.target.files?.[0];
        if (file) { (window as any)._addStudentFile = file; setPhotoUri(URL.createObjectURL(file)); setResult(null); }
      };
      input.click(); return;
    }
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      const gal = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!gal.granted) { Alert.alert('Permission refusée'); return; }
      const res = await ImagePicker.launchImageLibraryAsync({ quality: 0.8 });
      if (!res.canceled && res.assets?.[0]) { setPhotoUri(res.assets[0].uri); setResult(null); }
      return;
    }
    const res = await ImagePicker.launchCameraAsync({ quality: 0.8 });
    if (!res.canceled && res.assets?.[0]) { setPhotoUri(res.assets[0].uri); setResult(null); }
  };

  const addStudent = async () => {
    if (!name.trim()) { Alert.alert('Erreur', 'Sélectionne un étudiant'); return; }
    if (!photoUri) { Alert.alert('Erreur', 'Prends une photo d\'abord'); return; }

    setLoading(true);
    setResult(null);
    try {
      const formData = new FormData();
      formData.append('name', name.trim());
      formData.append('filiere', filiere);

      if (Platform.OS === 'web') {
        const file = (window as any)._addStudentFile;
        if (file) formData.append('image', file);
        else { const blob = await fetch(photoUri).then(r => r.blob()); formData.append('image', blob, 'photo.jpg'); }
      } else {
        formData.append('image', { uri: photoUri, type: 'image/jpeg', name: 'photo.jpg' } as any);
      }

      const response = await fetch(`${IA_URL}/add-student`, {
        method: 'POST',
        body: formData,
        headers: { 'bypass-tunnel-reminder': 'true' },
      });

      const data = await response.json();
      if (response.ok) {
        setResult(`✅ ${data.encodings_added} encodages ajoutés pour ${data.student}\nTotal étudiants : ${data.total_students}`);
        setPhotoUri(null);
      } else {
        setResult(`❌ Erreur : ${data.error}`);
      }
    } catch (e: any) {
      setResult(`❌ Erreur réseau : ${e?.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#8B4513" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ajouter une photo réelle</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.info}>
          Prends une photo dans les mêmes conditions que la salle de classe pour améliorer la détection.
        </Text>

        {/* Sélection étudiant */}
        <Text style={styles.label}>Étudiant</Text>
        <View style={styles.studentList}>
          {STUDENTS.map(s => (
            <TouchableOpacity key={s}
              style={[styles.studentChip, name === s && styles.studentChipSelected]}
              onPress={() => { setName(s); setResult(null); }}>
              <Text style={[styles.studentChipText, name === s && styles.studentChipTextSelected]}>
                {s}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Filière */}
        <Text style={styles.label}>Filière</Text>
        <View style={styles.filiereRow}>
          {['IRISI', 'SIT'].map(f => (
            <TouchableOpacity key={f}
              style={[styles.filiereChip, filiere === f && styles.filiereChipSelected]}
              onPress={() => setFiliere(f)}>
              <Text style={[styles.filiereChipText, filiere === f && styles.filiereChipTextSelected]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Photo */}
        <Text style={styles.label}>Photo (conditions réelles)</Text>
        <TouchableOpacity style={styles.photoArea} onPress={pickPhoto} activeOpacity={0.85}>
          {photoUri
            ? <Image source={{ uri: photoUri }} style={styles.photoImg} contentFit="cover" />
            : <View style={styles.photoEmpty}>
                <Ionicons name="camera-outline" size={40} color="#CD853F" />
                <Text style={styles.photoEmptyText}>Prendre une photo en conditions réelles</Text>
              </View>
          }
        </TouchableOpacity>

        {/* Bouton ajouter */}
        <TouchableOpacity
          style={[styles.addBtn, (!name || !photoUri || loading) && styles.addBtnOff]}
          onPress={addStudent}
          disabled={!name || !photoUri || loading}
          activeOpacity={0.85}>
          {loading
            ? <><ActivityIndicator color="#fff" size="small" /><Text style={styles.addBtnText}> Encodage en cours...</Text></>
            : <><Ionicons name="person-add-outline" size={20} color="#fff" />
                <Text style={styles.addBtnText}>Ajouter au modèle IA</Text></>
          }
        </TouchableOpacity>

        {/* Résultat */}
        {result && (
          <View style={[styles.resultBox, result.startsWith('✅') ? styles.resultOk : styles.resultErr]}>
            <Text style={styles.resultText}>{result}</Text>
          </View>
        )}

        <Text style={styles.tip}>
          💡 Conseil : prends plusieurs photos sous différents angles et éclairages pour de meilleurs résultats.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF3E0' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, gap: 10, backgroundColor: '#FFFEF9', borderBottomWidth: 1, borderBottomColor: '#E8D5BF' },
  iconBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#FAF3E0', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#E8D5BF' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#5C3317' },
  content: { padding: 16, paddingBottom: 40 },
  info: { fontSize: 13, color: '#7D6B5A', backgroundColor: '#F5DEB3', padding: 12, borderRadius: 10, marginBottom: 20, lineHeight: 20 },
  label: { fontSize: 12, fontWeight: '700', color: '#8B4513', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8, marginTop: 16 },
  studentList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  studentChip: { backgroundColor: '#FFFEF9', borderWidth: 1.5, borderColor: '#E8D5BF', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 },
  studentChipSelected: { backgroundColor: '#8B4513', borderColor: '#8B4513' },
  studentChipText: { fontSize: 13, fontWeight: '600', color: '#8B4513' },
  studentChipTextSelected: { color: '#FFFEF9' },
  filiereRow: { flexDirection: 'row', gap: 10 },
  filiereChip: { backgroundColor: '#FFFEF9', borderWidth: 1.5, borderColor: '#E8D5BF', borderRadius: 10, paddingHorizontal: 20, paddingVertical: 8 },
  filiereChipSelected: { backgroundColor: '#5C3317', borderColor: '#5C3317' },
  filiereChipText: { fontSize: 13, fontWeight: '600', color: '#5C3317' },
  filiereChipTextSelected: { color: '#FFFEF9' },
  photoArea: { borderRadius: 12, overflow: 'hidden', borderWidth: 1.5, borderColor: '#E8D5BF', marginTop: 4 },
  photoImg: { width: '100%', height: 200 },
  photoEmpty: { height: 160, backgroundColor: '#FAF3E0', justifyContent: 'center', alignItems: 'center', gap: 8 },
  photoEmptyText: { fontSize: 13, color: '#A89880', textAlign: 'center', paddingHorizontal: 20 },
  addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#8B4513', borderRadius: 12, paddingVertical: 14, marginTop: 16 },
  addBtnOff: { backgroundColor: '#DEB887' },
  addBtnText: { color: '#FFFEF9', fontSize: 15, fontWeight: '700' },
  resultBox: { marginTop: 16, padding: 14, borderRadius: 10 },
  resultOk: { backgroundColor: '#dcfce7' },
  resultErr: { backgroundColor: '#fee2e2' },
  resultText: { fontSize: 14, fontWeight: '600', color: '#5C3317' },
  tip: { marginTop: 20, fontSize: 12, color: '#A89880', textAlign: 'center', lineHeight: 18 },
});
