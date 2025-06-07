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
    Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Event, eventService } from '@/services/event.service';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

export default function EventsScreen() {
    const [events, setEvents] = useState<Event[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeFilter, setActiveFilter] = useState('all');
    const [scrollY] = useState(new Animated.Value(0));
    const [fadeAnim] = useState(new Animated.Value(0));

    useEffect(() => {
        loadEvents();
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
        }).start();
    }, []);

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

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'active':
                return 'Activo';
            case 'completed':
                return 'Finalizado';
            case 'cancelled':
                return 'Cancelado';
            default:
                return 'Borrador';
        }
    };

    const renderEventCard = ({ item: event, index }: { item: Event, index: number }) => {
        const eventDate = new Date(event.fechaInicio);

        return (
            <Animated.View
                style={[
                    styles.cardWrapper,
                    {
                        opacity: fadeAnim,
                        transform: [{
                            translateY: fadeAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [30, 0]
                            })
                        }]
                    }
                ]}
            >
                <TouchableOpacity
                    style={styles.card}
                    onPress={() => router.push(`/event/${event._id}`)}
                    activeOpacity={0.95}
                >
                    {/* Header del card con imagen/placeholder */}
                    <View style={styles.cardHeader}>
                        {event.imagen ? (
                            <Image source={{ uri: event.imagen }} style={styles.cardImage} />
                        ) : (
                            <LinearGradient
                                colors={['#8B5CF6', '#7C3AED']}
                                style={styles.cardImagePlaceholder}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                            >
                                <Ionicons name="calendar-outline" size={32} color="rgba(255,255,255,0.9)" />
                            </LinearGradient>
                        )}

                        {/* Badge de estado */}
                        <View style={styles.statusBadgeContainer}>
                            <LinearGradient
                                colors={['#8B5CF6', '#7C3AED']}
                                style={styles.statusBadge}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                            >
                                <Text style={styles.statusText}>
                                    {getStatusLabel(event.status)}
                                </Text>
                            </LinearGradient>
                        </View>

                        {/* Decoración superior */}
                        <View style={styles.cardDecoration} />
                    </View>

                    {/* Contenido del card */}
                    <View style={styles.cardContent}>
                        <Text style={styles.cardTitle} numberOfLines={2} ellipsizeMode="tail">
                            {event.nombre}
                        </Text>

                        <View style={styles.cardDetails}>
                            <View style={styles.detailRow}>
                                <View style={styles.iconContainer}>
                                    <Ionicons name="time-outline" size={16} color="#8B5CF6" />
                                </View>
                                <Text style={styles.detailText}>
                                    {eventDate.toLocaleDateString('es-ES', {
                                        day: '2-digit',
                                        month: 'short',
                                        year: 'numeric'
                                    })} • {eventDate.toLocaleTimeString('es-ES', {
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </Text>
                            </View>

                            <View style={styles.detailRow}>
                                <View style={styles.iconContainer}>
                                    <Ionicons name="location-outline" size={16} color="#06B6D4" />
                                </View>
                                <Text style={styles.detailText} numberOfLines={1} ellipsizeMode="tail">
                                    {event.ubicacion.address}
                                </Text>
                            </View>

                            <View style={styles.detailRow}>
                                <View style={styles.iconContainer}>
                                    <Ionicons name="people-outline" size={16} color="#F59E0B" />
                                </View>
                                <Text style={styles.detailText}>
                                    {event.invitados.length} de {event.cantidadInvitados || 0} invitados
                                </Text>
                            </View>
                        </View>

                        {/* Información de pago */}
                        {event.requiresPayment && (
                            <View style={styles.paymentContainer}>
                                <LinearGradient
                                    colors={['#8B5CF6', '#7C3AED']}
                                    style={styles.paymentBadge}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                >
                                    <Ionicons name="card-outline" size={14} color="#fff" />
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

    const renderEmptyState = () => (
        <Animated.View
            style={[styles.emptyContainer, { opacity: fadeAnim }]}
        >
            <View style={styles.emptyIllustration}>
                <LinearGradient
                    colors={['#8B5CF6', '#7C3AED']}
                    style={styles.emptyIconGradient}
                >
                    <Ionicons name="calendar-outline" size={48} color="white" />
                </LinearGradient>
                <View style={styles.emptyDecorations}>
                    <View style={styles.emptyDot1} />
                    <View style={styles.emptyDot2} />
                    <View style={styles.emptyDot3} />
                </View>
            </View>

            <Text style={styles.emptyTitle}>Sin eventos aún</Text>
            <Text style={styles.emptySubtitle}>
                ¡Organiza tu primer evento y comienza a crear momentos increíbles con tus amigos!
            </Text>

            <TouchableOpacity
                style={styles.createButton}
                onPress={() => router.push('/event/create')}
                activeOpacity={0.9}
            >
                <LinearGradient
                    colors={['#8B5CF6', '#7C3AED']}
                    style={styles.createButtonGradient}
                >
                    <Ionicons name="add" size={20} color="white" />
                    <Text style={styles.createButtonText}>Crear mi primer evento</Text>
                </LinearGradient>
            </TouchableOpacity>
        </Animated.View>
    );

    const renderFilters = () => (
        <View style={styles.filterContainer}>
            <View style={styles.filterScrollWrapper}>
                {[
                    { key: 'all', label: 'Todos', count: events.length },
                    { key: 'active', label: 'Activos', count: events.filter(e => e.status === 'active').length },
                    { key: 'upcoming', label: 'Próximos', count: events.filter(e => new Date(e.fechaInicio) > new Date()).length },
                    { key: 'past', label: 'Pasados', count: events.filter(e => new Date(e.fechaInicio) < new Date() && e.status !== 'draft').length }
                ].map((filter) => (
                    <TouchableOpacity
                        key={filter.key}
                        style={[
                            styles.filterChip,
                            activeFilter === filter.key && styles.activeFilterChip
                        ]}
                        onPress={() => setActiveFilter(filter.key)}
                        activeOpacity={0.8}
                    >
                        {activeFilter === filter.key && (
                            <LinearGradient
                                colors={['#8B5CF6', '#7C3AED']}
                                style={styles.filterChipGradient}
                            />
                        )}
                        <Text
                            style={[
                                styles.filterText,
                                activeFilter === filter.key && styles.activeFilterText
                            ]}
                        >
                            {filter.label}
                        </Text>
                        {filter.count > 0 && (
                            <View style={[
                                styles.filterBadge,
                                activeFilter === filter.key && styles.activeFilterBadge
                            ]}>
                                <Text style={[
                                    styles.filterBadgeText,
                                    activeFilter === filter.key && styles.activeFilterBadgeText
                                ]}>
                                    {filter.count}
                                </Text>
                            </View>
                        )}
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );

    const headerHeight = scrollY.interpolate({
        inputRange: [0, 100],
        outputRange: [120, 80],
        extrapolate: 'clamp'
    });

    const headerOpacity = scrollY.interpolate({
        inputRange: [0, 50],
        outputRange: [1, 0.9],
        extrapolate: 'clamp'
    });

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#7C3AED" />

            {/* Header animado */}
            <Animated.View style={[styles.header, { height: headerHeight, opacity: headerOpacity }]}>
                <LinearGradient
                    colors={['#8B5CF6', '#7C3AED', '#6D28D9']}
                    style={styles.headerGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                >
                    <View style={styles.headerDecorations}>
                        <View style={styles.headerCircle} />
                        <View style={styles.headerShape} />
                    </View>
                    <View style={styles.headerContent}>
                        <Text style={styles.headerTitle}>Mis Eventos</Text>
                        <Text style={styles.headerSubtitle}>
                            {events.length} {events.length === 1 ? 'evento' : 'eventos'} creados
                        </Text>
                    </View>
                </LinearGradient>
            </Animated.View>

            {/* Filtros */}
            {renderFilters()}

            {/* Error */}
            {error ? (
                <View style={styles.errorContainer}>
                    <View style={styles.errorContent}>
                        <Ionicons name="alert-circle-outline" size={20} color="#EF4444" />
                        <Text style={styles.errorText}>{error}</Text>
                    </View>
                </View>
            ) : null}

            {/* Lista de eventos */}
            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#8B5CF6" />
                    <Text style={styles.loadingText}>Cargando eventos...</Text>
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
                            colors={['#8B5CF6']}
                            tintColor="#8B5CF6"
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

            {/* FAB */}
            <TouchableOpacity
                style={styles.fab}
                onPress={() => router.push('/event/create')}
                activeOpacity={0.9}
            >
                <LinearGradient
                    colors={['#8B5CF6', '#7C3AED']}
                    style={styles.fabGradient}
                >
                    <Ionicons name="add" size={28} color="#ffffff" />
                </LinearGradient>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FAFAF9',
    },
    header: {
        overflow: 'hidden',
    },
    headerGradient: {
        flex: 1,
        position: 'relative',
    },
    headerDecorations: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    headerCircle: {
        position: 'absolute',
        width: 150,
        height: 150,
        borderRadius: 75,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        top: -75,
        right: -30,
    },
    headerShape: {
        position: 'absolute',
        width: 80,
        height: 80,
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        transform: [{ rotate: '45deg' }],
        bottom: -40,
        left: width - 60,
    },
    headerContent: {
        flex: 1,
        justifyContent: 'flex-end',
        paddingHorizontal: 24,
        paddingBottom: 20,
        zIndex: 1,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '800',
        color: 'white',
        marginBottom: 2,
    },
    headerSubtitle: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.8)',
        fontWeight: '500',
    },
    filterContainer: {
        backgroundColor: '#FFFFFF',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    filterScrollWrapper: {
        flexDirection: 'row',
        paddingHorizontal: 24,
        gap: 8,
    },
    filterChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#F9FAFB',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        position: 'relative',
        overflow: 'hidden',
    },
    activeFilterChip: {
        backgroundColor: 'transparent',
    },
    filterChipGradient: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    filterText: {
        fontSize: 14,
        color: '#6B7280',
        fontWeight: '600',
    },
    activeFilterText: {
        color: '#FFFFFF',
    },
    filterBadge: {
        backgroundColor: '#E5E7EB',
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 6,
    },
    activeFilterBadge: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
    filterBadgeText: {
        fontSize: 12,
        color: '#6B7280',
        fontWeight: '600',
    },
    activeFilterBadgeText: {
        color: '#FFFFFF',
    },
    listContainer: {
        padding: 24,
        paddingTop: 16,
    },
    emptyListContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    cardWrapper: {
        marginBottom: 20,
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 6,
    },
    cardHeader: {
        position: 'relative',
        height: 120,
    },
    cardImage: {
        width: '100%',
        height: '100%',
    },
    cardImagePlaceholder: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardDecoration: {
        position: 'absolute',
        top: 0,
        right: 0,
        width: 60,
        height: 60,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderBottomLeftRadius: 30,
    },
    statusBadgeContainer: {
        position: 'absolute',
        top: 12,
        left: 12,
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    statusText: {
        fontSize: 12,
        color: '#FFFFFF',
        fontWeight: '700',
    },
    cardContent: {
        padding: 20,
    },
    cardTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 16,
        lineHeight: 24,
    },
    cardDetails: {
        gap: 10,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconContainer: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#F9FAFB',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    detailText: {
        fontSize: 14,
        color: '#6B7280',
        fontWeight: '500',
        flex: 1,
    },
    paymentContainer: {
        marginTop: 16,
    },
    paymentBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        alignSelf: 'flex-start',
    },
    paymentText: {
        fontSize: 14,
        color: '#FFFFFF',
        fontWeight: '600',
        marginLeft: 6,
    },
    emptyContainer: {
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    emptyIllustration: {
        position: 'relative',
        marginBottom: 32,
    },
    emptyIconGradient: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyDecorations: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    emptyDot1: {
        position: 'absolute',
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#06B6D4',
        top: 10,
        right: 15,
    },
    emptyDot2: {
        position: 'absolute',
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#F59E0B',
        bottom: 15,
        right: 10,
    },
    emptyDot3: {
        position: 'absolute',
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#EF4444',
        top: 20,
        left: 10,
    },
    emptyTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 16,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 32,
    },
    createButton: {
        borderRadius: 24,
        overflow: 'hidden',
        shadowColor: '#8B5CF6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    createButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 16,
        gap: 8,
    },
    createButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
    fab: {
        position: 'absolute',
        right: 24,
        bottom: 24,
        width: 64,
        height: 64,
        borderRadius: 32,
        overflow: 'hidden',
        shadowColor: '#8B5CF6',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
    },
    fabGradient: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorContainer: {
        margin: 24,
        marginTop: 16,
    },
    errorContent: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FEF2F2',
        borderWidth: 1,
        borderColor: '#FECACA',
        borderRadius: 12,
        padding: 16,
    },
    errorText: {
        color: '#EF4444',
        marginLeft: 8,
        fontWeight: '500',
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 16,
    },
    loadingText: {
        color: '#8B5CF6',
        fontSize: 16,
        fontWeight: '500',
    },
});