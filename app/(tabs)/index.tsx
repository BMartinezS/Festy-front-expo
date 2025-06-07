import React, { useCallback, useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  StatusBar,
  Animated,
  Dimensions,
  ScrollView
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
// Componentes
import { CleanTokenButton } from '@/components/CleanTokenButton';
import ActionButton from '@/components/ui/ActionButton';
import FeatureCard from '@/components/ui/FeatureCard';
import { API_URL } from '@/constants';

const { width, height } = Dimensions.get('window');

export default function HomeScreen() {
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));
  const [token, setToken] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      const checkAuth = async () => {
        try {
          const token_check = await AsyncStorage.getItem('userToken');
          if (!token_check) {
            router.replace('/auth/login');
          } else {
            setToken(token_check);
            // Animaciones de entrada más suaves
            Animated.parallel([
              Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 1000,
                useNativeDriver: true,
              }),
              Animated.timing(slideAnim, {
                toValue: 0,
                duration: 800,
                useNativeDriver: true,
              })
            ]).start();
          }
        } catch (error) {
          console.error('Error checking auth:', error);
          router.replace('/auth/login');
        }
      };
      checkAuth();
    }, [])
  );

  useEffect(() => {
    const fetchData = async () => {
      await getAllEvents();
    };

    if (token) {
      fetchData();
    }
    return () => {
      setToken(null);
    }
  }, [token]);

  const getAllEvents = async () => {
    if (!token) {
      console.error('No token found');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/events`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      console.log('Eventos:', data);
    }
    catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  const handleCreateEventPress = () => router.push('/event');
  const handleJoinEventPress = () => router.push('/guest');
  const handleProfilePress = () => router.push('/profile');
  const handleNotificationsPress = () => router.push('/notification');

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#7C3AED" />

      {/* Header con nuevo diseño */}
      <LinearGradient
        colors={['#8B5CF6', '#7C3AED', '#6D28D9']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        {/* Decoraciones de fondo */}
        <View style={styles.headerDecorations}>
          <View style={styles.headerCircle1} />
          <View style={styles.headerCircle2} />
          <View style={styles.headerShape} />
        </View>

        <Animated.View
          style={[
            styles.headerContent,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <View style={styles.headerTextContainer}>
            <Text style={styles.welcomeTitle}>¡Hola!</Text>
            <Text style={styles.welcomeSubtitle}>¿Qué organizamos hoy?</Text>
          </View>
          <TouchableOpacity
            style={styles.profileButton}
            onPress={handleProfilePress}
            activeOpacity={0.8}
          >
            <View style={styles.profileIconContainer}>
              <Ionicons name="person" size={24} color="#8B5CF6" />
            </View>
          </TouchableOpacity>
        </Animated.View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Sección principal */}
        <Animated.View
          style={[
            styles.mainContent,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <Text style={styles.sectionTitle}>Organiza eventos increíbles</Text>
          <Text style={styles.sectionSubtitle}>Todo lo que necesitas en un solo lugar</Text>

          {/* Grid de acciones mejorado */}
          <View style={styles.actionGrid}>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={handleCreateEventPress}
              activeOpacity={0.9}
            >
              <View style={styles.actionIconContainer}>
                <LinearGradient
                  colors={['#8B5CF6', '#7C3AED']}
                  style={styles.actionIconGradient}
                >
                  <Ionicons name="calendar-outline" size={28} color="white" />
                </LinearGradient>
              </View>
              <Text style={styles.actionCardTitle}>Mis Eventos</Text>
              <Text style={styles.actionCardSubtitle}>Crea y gestiona</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={handleJoinEventPress}
              activeOpacity={0.9}
            >
              <View style={styles.actionIconContainer}>
                <LinearGradient
                  colors={['#06B6D4', '#0891B2']}
                  style={styles.actionIconGradient}
                >
                  <Ionicons name="people-outline" size={28} color="white" />
                </LinearGradient>
              </View>
              <Text style={styles.actionCardTitle}>Unirme</Text>
              <Text style={styles.actionCardSubtitle}>A eventos existentes</Text>
            </TouchableOpacity>
          </View>

          {/* Botones secundarios */}
          <View style={styles.secondaryGrid}>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={handleProfilePress}
              activeOpacity={0.8}
            >
              <View style={styles.secondaryIconContainer}>
                <Ionicons name="person-outline" size={20} color="#8B5CF6" />
              </View>
              <Text style={styles.secondaryButtonText}>Mi Perfil</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={handleNotificationsPress}
              activeOpacity={0.8}
            >
              <View style={styles.secondaryIconContainer}>
                <Ionicons name="notifications-outline" size={20} color="#8B5CF6" />
              </View>
              <Text style={styles.secondaryButtonText}>Notificaciones</Text>
            </TouchableOpacity>
          </View>

          {/* Cards de características mejoradas */}
          <View style={styles.featureSection}>
            <Text style={styles.featureTitle}>¿Por qué EventApp?</Text>

            <View style={styles.featureCardsContainer}>
              <View style={styles.featureCard}>
                <View style={styles.featureIconContainer}>
                  <Ionicons name="sparkles" size={24} color="#8B5CF6" />
                </View>
                <Text style={styles.featureCardTitle}>Organización Simple</Text>
                <Text style={styles.featureCardDescription}>
                  Crea eventos, invita amigos y gestiona todo desde una sola app
                </Text>
              </View>

              <View style={styles.featureCard}>
                <View style={styles.featureIconContainer}>
                  <Ionicons name="card-outline" size={24} color="#06B6D4" />
                </View>
                <Text style={styles.featureCardTitle}>División de Gastos</Text>
                <Text style={styles.featureCardDescription}>
                  Divide cuentas automáticamente y mantén todo transparente
                </Text>
              </View>

              <View style={styles.featureCard}>
                <View style={styles.featureIconContainer}>
                  <Ionicons name="chatbubbles-outline" size={24} color="#F59E0B" />
                </View>
                <Text style={styles.featureCardTitle}>WhatsApp Integrado</Text>
                <Text style={styles.featureCardDescription}>
                  Conecta directamente con WhatsApp para comunicarte mejor
                </Text>
              </View>
            </View>
          </View>
        </Animated.View>
      </ScrollView>

      {/* Footer minimalista */}
      <View style={styles.footer}>
        <CleanTokenButton />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAF9',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 40,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    position: 'relative',
    overflow: 'hidden',
  },
  headerDecorations: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  headerCircle1: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    top: -100,
    right: -50,
  },
  headerCircle2: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    bottom: -75,
    left: -30,
  },
  headerShape: {
    position: 'absolute',
    width: 100,
    height: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    transform: [{ rotate: '45deg' }],
    top: 100,
    left: width - 80,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    zIndex: 1,
  },
  headerTextContainer: {
    flex: 1,
  },
  welcomeTitle: {
    fontSize: 36,
    fontWeight: '800',
    color: 'white',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  profileButton: {
    padding: 4,
  },
  profileIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  mainContent: {
    paddingHorizontal: 24,
    paddingTop: 32,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 32,
  },
  actionGrid: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  actionCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  actionIconContainer: {
    marginBottom: 16,
  },
  actionIconGradient: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionCardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  actionCardSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  secondaryGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 40,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  secondaryIconContainer: {
    marginRight: 8,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  featureSection: {
    marginBottom: 32,
  },
  featureTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 20,
    textAlign: 'center',
  },
  featureCardsContainer: {
    gap: 16,
  },
  featureCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  featureIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  featureCardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 6,
  },
  featureCardDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  footer: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    backgroundColor: '#FAFAF9',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
});