import React, { useCallback, useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  StatusBar,
  Animated,
  Dimensions
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

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  // Animación para los botones
  const [fadeAnim] = useState(new Animated.Value(0));
  const [token, setToken] = useState<string | null>(null);

  // Verificación de autenticación al entrar a la pantalla
  useFocusEffect(
    useCallback(() => {
      const checkAuth = async () => {
        try {
          const token_check = await AsyncStorage.getItem('userToken');
          if (!token_check) {
            router.replace('/auth/login');
          } else {
            setToken(token_check);
            // Iniciar animación cuando se verifica auth
            Animated.stagger(200, [
              Animated.timing(fadeAnim, {
                toValue: 1,
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
    // Limpiar el efecto al desmontar
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

  // Handlers para navegación
  const handleCreateEventPress = () => router.push('/event');
  const handleJoinEventPress = () => router.push('/guest');
  const handleProfilePress = () => router.push('/profile');

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header con gradiente mejorado */}
      <LinearGradient
        colors={['#6a0dad', '#9b59b6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerTextContainer}>
            <Text style={styles.welcomeTitle}>¡Hola!</Text>
            <Text style={styles.welcomeSubtitle}>¿Qué haremos hoy?</Text>
          </View>
          <TouchableOpacity
            style={styles.profileButton}
            onPress={handleProfilePress}
          >
            <Ionicons name="person-circle" size={46} color="white" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Contenido principal */}
      <View style={styles.mainContent}>
        <Text style={styles.sectionTitle}>Organiza eventos con amigos</Text>

        {/* Grid de botones en lugar de columna */}
        <Animated.View style={[styles.actionGrid, { opacity: fadeAnim }]}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleCreateEventPress}
          >
            <LinearGradient
              colors={['#6a0dad', '#8e44ad']}
              style={styles.actionButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="add-circle" size={32} color="white" />
            </LinearGradient>
            <Text style={styles.actionButtonText}>Mis eventos</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleJoinEventPress}
          >
            <LinearGradient
              colors={['#8e44ad', '#9b59b6']}
              style={styles.actionButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="people" size={32} color="white" />
            </LinearGradient>
            <Text style={styles.actionButtonText}>Unirme</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleProfilePress}
          >
            <LinearGradient
              colors={['#9b59b6', '#b16bce']}
              style={styles.actionButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="person" size={32} color="white" />
            </LinearGradient>
            <Text style={styles.actionButtonText}>Mi Perfil</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Cartas de características */}
        <View style={styles.featureCardsContainer}>
          <FeatureCard
            title="Simplifica tus eventos"
            subtitle="Organiza, invita y diviértete"
            icon="calendar"
          />

          <FeatureCard
            title="Divide gastos fácilmente"
            subtitle="Gestiona todos los pagos en un solo lugar"
            icon="card"
          />
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <CleanTokenButton />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 25,
  },
  headerTextContainer: {
    flex: 1,
  },
  welcomeTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  welcomeSubtitle: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  profileButton: {
    padding: 5,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  mainContent: {
    flex: 1,
    paddingHorizontal: 25,
    paddingTop: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 25,
    textAlign: 'center',
  },
  actionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  actionButton: {
    width: width / 3.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonGradient: {
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  actionButtonText: {
    color: '#444',
    fontWeight: '600',
    fontSize: 14,
  },
  featureCardsContainer: {
    gap: 16,
  },
  footer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
});