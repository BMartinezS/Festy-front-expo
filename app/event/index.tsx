// app/(tabs)/events.tsx
import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    RefreshControl,
    ActivityIndicator,
    Image,
    StatusBar,
    Animated,
} from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Event, eventService } from '@/services/event.service';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function EventsScreen() {
    const [events, setEvents] = useState<Event[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeFilter, setActiveFilter] = useState('all'); // 'all', 'active', 'upcoming', 'past'
    const [scrollY] = useState(new Animated.Value(0));

    // Animación para los elementos que aparecen
    const [fadeAnim] = useState(new Animated.Value(0));

    // Cargar eventos al montar el componente
    useEffect(() => {
        loadEvents();

        // Iniciar animación
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
        }).start();
    }, []);

    // Función para cargar los eventos
    const loadEvents = async () => {
        try {
            setRefreshing(true);

            const token = await AsyncStorage.getItem('userToken');
            if (!token) {
                router.replace('/auth/login');
                return;
            }

            const response = await eventService.getEvents(token);

            if ('error' in response) {
                setError(response.error);
                setEvents([]);
                return;
            }

            setEvents(response.data || []);
            setError('');
        } catch (error: any) {
            setError(error.message || 'Error al cargar eventos');
            console.error('Error al cargar eventos:', error);
        } finally {
            setRefreshing(false);
            setLoading(false);
        }
    };

    // Función para filtrar eventos según el filtro activo
    const getFilteredEvents = () => {
        const now = new Date();

        switch (activeFilter) {
            case 'active':
                return events.filter(event => event.status === 'active');
            case 'upcoming':
                return events.filter(event => new Date(event.fechaInicio) > now);
            case 'past':
                return events.filter(event => new Date(event.fechaInicio) < now && event.status !== 'draft');
            default:
                return events;
        }
    };

    // Función para renderizar cada evento en la lista
    const renderEventCard = ({ item: event, index }: { item: Event, index: number }) => {
        const eventDate = new Date(event.fechaInicio);

        return (
            <Animated.View
                style={{
                    opacity: fadeAnim,
                    transform: [{
                        translateY: fadeAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [50, 0]
                        })
                    }],
                    marginBottom: 15
                }}
            >
                <TouchableOpacity
                    style={styles.card}
                    onPress={() => router.push(`/event/${event._id}`)}
                    activeOpacity={0.8}
                >
                    <View style={styles.cardImageContainer}>
                        {event.imagen ? (
                            <Image source={{ uri: event.imagen }} style={styles.cardImage} />
                        ) : (
                            <LinearGradient
                                colors={['#8e44ad', '#6a0dad']}
                                style={styles.cardImagePlaceholder}
                            >
                                <Ionicons name="calendar" size={36} color="rgba(255,255,255,0.9)" />
                            </LinearGradient>
                        )}

                        <View style={[
                            styles.statusBadge,
                            event.status === 'active' ? styles.activeBadge :
                                event.status === 'completed' ? styles.completedBadge :
                                    event.status === 'cancelled' ? styles.cancelledBadge :
                                        styles.draftBadge
                        ]}>
                            <Text style={styles.statusText}>
                                {event.status.toUpperCase()}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.cardContent}>
                        <Text style={styles.cardTitle} numberOfLines={1} ellipsizeMode="tail">
                            {event.nombre}
                        </Text>

                        <View style={styles.cardInfo}>
                            <View style={styles.infoItem}>
                                <Ionicons name="time" size={16} color="#8e44ad" />
                                <Text style={styles.infoText}>
                                    {eventDate.toLocaleDateString()} {eventDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </Text>
                            </View>

                            <View style={styles.infoItem}>
                                <Ionicons name="location" size={16} color="#8e44ad" />
                                <Text style={styles.infoText} numberOfLines={1} ellipsizeMode="tail">
                                    {event.ubicacion.address}
                                </Text>
                            </View>

                            <View style={styles.infoItem}>
                                <Ionicons name="people" size={16} color="#8e44ad" />
                                <Text style={styles.infoText}>
                                    {event.invitados.length} / {event.cantidadInvitados || 0} invitados
                                </Text>
                            </View>
                        </View>

                        {event.requiresPayment && (
                            <View style={styles.paymentContainer}>
                                <LinearGradient
                                    colors={['#8e44ad', '#9b59b6']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={styles.paymentInfo}
                                >
                                    <Ionicons name="cash" size={16} color="#fff" />
                                    <Text style={styles.paymentText}>
                                        ${event.cuotaAmount} por persona
                                    </Text>
                                </LinearGradient>
                            </View>
                        )}
                    </View>
                </TouchableOpacity>
            </Animated.View>
        );
    };

    // Función para renderizar estado vacío
    const renderEmptyState = () => (
        <Animated.View
            style={[
                styles.emptyContainer,
                { opacity: fadeAnim }
            ]}
        >
            <View style={styles.emptyIconContainer}>
                <LinearGradient
                    colors={['#8e44ad', '#6a0dad']}
                    style={styles.emptyIconGradient}
                >
                    <Ionicons name="calendar" size={40} color="white" />
                </LinearGradient>
            </View>
            <Text style={styles.emptyTitle}>No hay eventos</Text>
            <Text style={styles.emptySubtitle}>
                ¡Crea tu primer evento usando el botón + en la esquina inferior!
            </Text>
            <TouchableOpacity
                style={styles.emptyButton}
                onPress={() => router.push('/event/create')}
            >
                <Text style={styles.emptyButtonText}>Crear evento</Text>
            </TouchableOpacity>
        </Animated.View>
    );

    // Transformar el header mientras se hace scroll
    const headerHeight = scrollY.interpolate({
        inputRange: [0, 100],
        outputRange: [150, 80],
        extrapolate: 'clamp'
    });

    const headerTitleSize = scrollY.interpolate({
        inputRange: [0, 100],
        outputRange: [24, 20],
        extrapolate: 'clamp'
    });

    const headerTitleOpacity = scrollY.interpolate({
        inputRange: [0, 40, 70],
        outputRange: [1, 0.3, 1],
        extrapolate: 'clamp'
    });

    const headerTitlePosition = scrollY.interpolate({
        inputRange: [0, 100],
        outputRange: [0, 8],
        extrapolate: 'clamp'
    });

    // Función para renderizar los filtros
    const renderFilters = () => (
        <View style={styles.filterContainer}>
            {['all', 'active', 'upcoming', 'past'].map((filter) => (
                <TouchableOpacity
                    key={filter}
                    style={[
                        styles.filterButton,
                        activeFilter === filter && styles.activeFilterButton
                    ]}
                    onPress={() => setActiveFilter(filter)}
                >
                    <Text
                        style={[
                            styles.filterText,
                            activeFilter === filter && styles.activeFilterText
                        ]}
                    >
                        {filter === 'all' ? 'Todos' :
                            filter === 'active' ? 'Activos' :
                                filter === 'upcoming' ? 'Próximos' : 'Pasados'}
                    </Text>
                </TouchableOpacity>
            ))}
        </View>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            {/* Header con animación */}
            <Animated.View style={[styles.header, { height: headerHeight }]}>
                <LinearGradient
                    colors={['#6a0dad', '#9b59b6']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.headerGradient}
                >
                    <Animated.Text
                        style={[
                            styles.headerTitle,
                            {
                                fontSize: headerTitleSize,
                                opacity: headerTitleOpacity,
                                transform: [{ translateY: headerTitlePosition }]
                            }
                        ]}
                    >
                        Mis Eventos
                    </Animated.Text>
                </LinearGradient>
            </Animated.View>

            {/* Filtros */}
            {renderFilters()}

            {/* Mensaje de error */}
            {error ? (
                <View style={styles.errorContainer}>
                    <Ionicons name="alert-circle" size={24} color="#ff4646" />
                    <Text style={styles.errorText}>{error}</Text>
                </View>
            ) : null}

            {/* Lista de eventos o pantalla de carga */}
            {loading ? (
                <View style={styles.loaderContainer}>
                    <ActivityIndicator
                        size="large"
                        color="#6a0dad"
                    />
                    <Text style={styles.loaderText}>Cargando eventos...</Text>
                </View>
            ) : (
                <Animated.FlatList
                    data={getFilteredEvents()}
                    renderItem={renderEventCard}
                    keyExtractor={(item) => item._id}
                    contentContainerStyle={[
                        styles.listContainer,
                        getFilteredEvents().length === 0 && styles.emptyListContainer,
                    ]}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={loadEvents}
                            colors={['#6a0dad']}
                            tintColor="#6a0dad"
                        />
                    }
                    ListEmptyComponent={renderEmptyState}
                    showsVerticalScrollIndicator={false}
                    onScroll={Animated.event(
                        [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                        { useNativeDriver: false }
                    )}
                    scrollEventThrottle={16}
                />
            )}

            {/* Botón flotante para crear evento */}
            <TouchableOpacity
                style={styles.fab}
                onPress={() => router.push('/event/create')}
                activeOpacity={0.8}
            >
                <LinearGradient
                    colors={['#8e44ad', '#6a0dad']}
                    style={styles.fabGradient}
                >
                    <Ionicons name="add" size={24} color="#ffffff" />
                </LinearGradient>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    header: {
        overflow: 'hidden',
    },
    headerGradient: {
        flex: 1,
        justifyContent: 'flex-end',
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    headerTitle: {
        fontWeight: 'bold',
        color: '#ffffff',
    },
    filterContainer: {
        flexDirection: 'row',
        paddingHorizontal: 15,
        paddingVertical: 12,
        backgroundColor: '#ffffff',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
    },
    filterButton: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        marginRight: 8,
        backgroundColor: '#f4f4f4',
    },
    activeFilterButton: {
        backgroundColor: '#6a0dad',
    },
    filterText: {
        fontSize: 14,
        color: '#666',
        fontWeight: '500',
    },
    activeFilterText: {
        color: '#ffffff',
        fontWeight: '600',
    },
    listContainer: {
        padding: 15,
        paddingTop: 10,
    },
    emptyListContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    card: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 4,
    },
    cardImageContainer: {
        position: 'relative',
    },
    cardImage: {
        width: '100%',
        height: 140,
    },
    cardImagePlaceholder: {
        width: '100%',
        height: 140,
        justifyContent: 'center',
        alignItems: 'center',
    },
    statusBadge: {
        position: 'absolute',
        top: 12,
        right: 12,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 20,
    },
    activeBadge: {
        backgroundColor: '#28a745',
    },
    completedBadge: {
        backgroundColor: '#6c757d',
    },
    cancelledBadge: {
        backgroundColor: '#dc3545',
    },
    draftBadge: {
        backgroundColor: '#ffc107',
    },
    statusText: {
        fontSize: 11,
        color: '#ffffff',
        fontWeight: 'bold',
    },
    cardContent: {
        padding: 16,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 12,
    },
    cardInfo: {
        marginBottom: 10,
    },
    infoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    infoText: {
        fontSize: 14,
        color: '#666',
        marginLeft: 8,
    },
    paymentContainer: {
        marginTop: 8,
    },
    paymentInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
    },
    paymentText: {
        fontSize: 14,
        color: '#ffffff',
        fontWeight: '600',
        marginLeft: 8,
    },
    fab: {
        position: 'absolute',
        right: 20,
        bottom: 20,
        width: 60,
        height: 60,
        borderRadius: 30,
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        overflow: 'hidden',
    },
    fabGradient: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#ffebee',
        paddingVertical: 10,
        paddingHorizontal: 20,
        margin: 15,
        borderRadius: 8,
    },
    errorText: {
        color: '#ff4646',
        marginLeft: 8,
        fontWeight: '500',
    },
    loaderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loaderText: {
        marginTop: 10,
        color: '#6a0dad',
        fontSize: 16,
    },
    emptyContainer: {
        alignItems: 'center',
        paddingHorizontal: 30,
    },
    emptyIconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        overflow: 'hidden',
        marginBottom: 20,
    },
    emptyIconGradient: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 12,
    },
    emptySubtitle: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 25,
    },
    emptyButton: {
        paddingVertical: 12,
        paddingHorizontal: 24,
        backgroundColor: '#6a0dad',
        borderRadius: 30,
    },
    emptyButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 16,
    },
});