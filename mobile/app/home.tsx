import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Image } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { Enseignant } from '../types/enseignant';

type MenuCard = {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
};

export default function Home() {
  const { enseignant: enseignantParam } = useLocalSearchParams<{ enseignant: string }>();

  let enseignant: Enseignant | null = null;
  try {
    enseignant = enseignantParam ? JSON.parse(enseignantParam) : null;
  } catch {
    enseignant = null;
  }

  const handleLogout = () => {
    router.replace('/');
  };

  const menuCards: MenuCard[] = [
    {
      title: 'Prendre les présences',
      icon: 'camera-outline',
      onPress: () =>
        router.push({
          pathname: '/presence',
          params: { enseignant: JSON.stringify(enseignant) },
        }),
    },
    {
      title: 'Voir les absences',
      icon: 'list-outline',
      onPress: () =>
        router.push({
          pathname: '/absences',
          params: { enseignant: JSON.stringify(enseignant) },
        }),
    },
    {
      title: 'Mes séances',
      icon: 'calendar-outline',
      onPress: () =>
        router.push({
          pathname: '/seances',
          params: { enseignant: JSON.stringify(enseignant) },
        }),
    },
    {
      title: 'Mes étudiants',
      icon: 'people-outline',
      onPress: () =>
        router.push({
          pathname: '/etudiants',
          params: { enseignant: JSON.stringify(enseignant) },
        }),
    },
  ];

  if (!enseignant) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.fallback}>
          <Text style={styles.fallbackText}>Session invalide</Text>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutText}>Retour à la connexion</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Image
            source={require('../assets/images/fst-logo.png')}
            style={styles.headerLogo}
            resizeMode="contain"
          />
          <Text style={styles.headerAppName}>Campus Présence</Text>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.85}>
          <Ionicons name="log-out-outline" size={20} color="#8B4513" />
          <Text style={styles.logoutText}>Déconnexion</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.welcome}>Bienvenue,</Text>
        <Text style={styles.name}>
          {enseignant.prenom} {enseignant.nom}
        </Text>
        <Text style={styles.matricule}>Matricule : {enseignant.matricule}</Text>

        <View style={styles.cards}>
          {menuCards.map((card) => (
            <TouchableOpacity
              key={card.title}
              style={styles.card}
              onPress={card.onPress}
              activeOpacity={0.85}
            >
              <View style={styles.iconCircle}>
                <Ionicons name={card.icon} size={28} color="#8B4513" />
              </View>
              <Text style={styles.cardTitle}>{card.title}</Text>
              <Ionicons name="chevron-forward" size={22} color="#CD853F" />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    backgroundColor: '#FFFEF9',
    borderBottomWidth: 1,
    borderBottomColor: '#E8D5BF',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  headerLogo: {
    width: 90,
    height: 34,
  },
  headerAppName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#5C3317',
  },
  headerSpacer: {
    flex: 1,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFEF9',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#DEB887',
  },
  logoutText: {
    color: '#8B4513',
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  welcome: {
    fontSize: 18,
    color: '#7D6B5A',
    marginTop: 16,
  },
  name: {
    fontSize: 30,
    fontWeight: '700',
    color: '#5C3317',
    marginTop: 4,
  },
  matricule: {
    fontSize: 14,
    color: '#7D6B5A',
    marginTop: 8,
    marginBottom: 28,
  },
  cards: {
    gap: 14,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFEF9',
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E8D5BF',
    shadowColor: '#5C3317',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#F5DEB3',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cardTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#5C3317',
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
});
