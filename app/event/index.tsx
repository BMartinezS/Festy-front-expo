// app/(tabs)/events.tsx
import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    FlatList,
    RefreshControl,
    ActivityIndicator,
    Image,
} from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Event, eventService } from '@/services/event.service';
import { Ionicons } from '@expo/vector-icons';

export default function EventsScreen() {
    const [events, setEvents] = useState<Event[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeFilter, setActiveFilter] = useState('all'); // 'all', 'active', 'upcoming', 'past'

    // Cargar eventos al montar el componente
    useEffect(() => {
        loadEvents();
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
    const renderEventCard = ({ item: event }: { item: Event }) => {
        const eventDate = new Date(event.fechaInicio);

        return (
            <TouchableOpacity
                style={styles.card}
                onPress={() => router.push(`/event/${event._id}`)}
                activeOpacity={0.7}
            >
                {event.imagen ? (
                    <Image source={{ uri: event.imagen }} style={styles.cardImage} />
                ) : (
                    <View style={styles.cardImagePlaceholder}>
                        <Ionicons name="calendar-outline" size={30} color="#ccc" />
                    </View>
                )}

                <View style={styles.cardContent}>
                    <View style={styles.cardHeader}>
                        <Text style={styles.cardTitle} numberOfLines={1} ellipsizeMode="tail">
                            {event.nombre}
                        </Text>

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

                    <View style={styles.cardInfo}>
                        <View style={styles.infoItem}>
                            <Ionicons name="time-outline" size={16} color="#666" />
                            <Text style={styles.infoText}>
                                {eventDate.toLocaleDateString()} {eventDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </Text>
                        </View>

                        <View style={styles.infoItem}>
                            <Ionicons name="location-outline" size={16} color="#666" />
                            <Text style={styles.infoText} numberOfLines={1} ellipsizeMode="tail">
                                {event.ubicacion.address}
                            </Text>
                        </View>

                        <View style={styles.infoItem}>
                            <Ionicons name="people-outline" size={16} color="#666" />
                            <Text style={styles.infoText}>
                                {event.invitados.length} / {event.cantidadInvitados || 0} invitados
                            </Text>
                        </View>
                    </View>

                    {event.requiresPayment && (
                        <View style={styles.paymentInfo}>
                            <Ionicons name="cash-outline" size={16} color="rgb(71, 25, 82)" />
                            <Text style={styles.paymentText}>
                                ${event.cuotaAmount} por persona
                            </Text>
                        </View>
                    )}
                </View>
            </TouchableOpacity>
        );
    };

    // Función para renderizar estado vacío
    const renderEmptyState = () => (
        <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={60} color="#ccc" />
            <Text style={styles.emptyTitle}>No hay eventos</Text>
            <Text style={styles.emptySubtitle}>
                ¡Crea tu primer evento usando el botón + en la esquina inferior!
            </Text>
        </View>
    );

    // Función para renderizar los filtros
    const renderFilters = () => (
        <View style={styles.filterContainer}>
            <TouchableOpacity
                style={[styles.filterButton, activeFilter === 'all' && styles.activeFilterButton]}
                onPress={() => setActiveFilter('all')}
            >
                <Text style={[styles.filterText, activeFilter === 'all' && styles.activeFilterText]}>
                    Todos
                </Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={[styles.filterButton, activeFilter === 'active' && styles.activeFilterButton]}
                onPress={() => setActiveFilter('active')}
            >
                <Text style={[styles.filterText, activeFilter === 'active' && styles.activeFilterText]}>
                    Activos
                </Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={[styles.filterButton, activeFilter === 'upcoming' && styles.activeFilterButton]}
                onPress={() => setActiveFilter('upcoming')}
            >
                <Text style={[styles.filterText, activeFilter === 'upcoming' && styles.activeFilterText]}>
                    Próximos
                </Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={[styles.filterButton, activeFilter === 'past' && styles.activeFilterButton]}
                onPress={() => setActiveFilter('past')}
            >
                <Text style={[styles.filterText, activeFilter === 'past' && styles.activeFilterText]}>
                    Pasados
                </Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Mis Eventos</Text>
            </View>

            {renderFilters()}

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            {loading ? (
                <ActivityIndicator
                    size="large"
                    color="rgb(51, 18, 59)"
                    style={styles.loader}
                />
            ) : (
                <FlatList
                    data={getFilteredEvents()}
                    renderItem={renderEventCard}
                    keyExtractor={(item) => item._id}
                    contentContainerStyle={[
                        styles.listContainer,
                        getFilteredEvents().length === 0 && styles.emptyListContainer,
                    ]}
                    ItemSeparatorComponent={() => <View style={styles.separator} />}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={loadEvents} />
                    }
                    ListEmptyComponent={renderEmptyState}
                />
            )}

            <TouchableOpacity
                style={styles.fab}
                onPress={() => router.push('/event/create')}
            >
                <Ionicons name="add" size={24} color="#ffffff" />
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
        backgroundColor: 'rgb(51, 18, 59)',
        paddingTop: 60,
        paddingBottom: 20,
        paddingHorizontal: 20,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#ffffff',
    },
    filterContainer: {
        flexDirection: 'row',
        paddingHorizontal: 15,
        paddingVertical: 10,
        backgroundColor: '#ffffff',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    filterButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        marginRight: 8,
    },
    activeFilterButton: {
        backgroundColor: 'rgb(51, 18, 59)',
    },
    filterText: {
        fontSize: 14,
        color: '#666',
    },
    activeFilterText: {
        color: '#ffffff',
        fontWeight: '500',
    },
    listContainer: {
        padding: 15,
    },
    emptyListContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    card: {
        backgroundColor: '#ffffff',
        borderRadius: 10,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#eee',
    },
    cardImage: {
        width: '100%',
        height: 120,
    },
    cardImagePlaceholder: {
        width: '100%',
        height: 120,
        backgroundColor: '#f5f5f5',
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardContent: {
        padding: 15,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: 'rgb(51, 18, 59)',
        flex: 1,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        marginLeft: 10,
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
        fontSize: 10,
        color: '#ffffff',
        fontWeight: 'bold',
    },
    cardInfo: {
        marginBottom: 10,
    },
    infoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 5,
    },
    infoText: {
        fontSize: 14,
        color: '#666',
        marginLeft: 8,
    },
    paymentInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
    },
    paymentText: {
        fontSize: 14,
        color: 'rgb(71, 25, 82)',
        fontWeight: '500',
        marginLeft: 8,
    },
    separator: {
        height: 15,
    },
    fab: {
        position: 'absolute',
        right: 20,
        bottom: 20,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: 'rgb(51, 18, 59)',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.27,
        shadowRadius: 4.65,
    },
    errorText: {
        color: '#ff4646',
        textAlign: 'center',
        marginTop: 20,
        marginHorizontal: 20,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 30,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#666',
        marginTop: 15,
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 16,
        color: '#999',
        textAlign: 'center',
        lineHeight: 22,
    },
    loader: {
        marginTop: 50,
    },
});