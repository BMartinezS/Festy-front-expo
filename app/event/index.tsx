// app/event/index.tsx
import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    View,
    Text,
    FlatList,
    TouchableOpacity,
    RefreshControl,
    ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { Event, eventService } from '@/services/event.service';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function EventsScreen() {
    const [events, setEvents] = useState<Event[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState('');

    const loadEvents = async () => {
        try {
            setRefreshing(true);
            const token = await AsyncStorage.getItem('userToken');
            if (!token) throw new Error('No token found');

            const data = await eventService.getEvents(token);
            setEvents(data);
            setError('');
        } catch (error: any) {
            setError(error.message || 'Error al cargar eventos');
        } finally {
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadEvents();
    }, []);

    const renderEventCard = ({ item: event }: { item: Event }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => router.push(`/event/${event._id}`)}
        >
            <Text style={styles.cardTitle}>{event.nombre}</Text>
            <Text style={styles.cardDate}>
                {new Date(event.fecha).toLocaleDateString()}
            </Text>
            <Text style={styles.cardAddress}>{event.ubicacion.address}</Text>

            <View style={styles.cardFooter}>
                <Text style={[
                    styles.cardStatus,
                    event.status === 'active' && styles.activeStatus
                ]}>
                    {event.status.toUpperCase()}
                </Text>
                <Text style={styles.cardGuests}>
                    {event.invitados.length} invitados
                </Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <FlatList
                data={events}
                renderItem={renderEventCard}
                keyExtractor={(item) => item._id}
                contentContainerStyle={styles.listContainer}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={loadEvents} />
                }
            />

            <TouchableOpacity
                style={styles.fab}
                onPress={() => router.push('/event/create')}
            >
                <Text style={styles.fabText}>+</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    listContainer: {
        padding: 20,
    },
    card: {
        backgroundColor: '#ffffff',
        borderRadius: 10,
        padding: 15,
        borderWidth: 1,
        borderColor: 'rgb(71, 25, 82)',
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: 'rgb(51, 18, 59)',
        marginBottom: 8,
    },
    cardDate: {
        fontSize: 14,
        color: '#666',
        marginBottom: 4,
    },
    cardAddress: {
        fontSize: 14,
        color: '#666',
        marginBottom: 8,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 8,
    },
    cardStatus: {
        fontSize: 12,
        color: '#666',
    },
    activeStatus: {
        color: '#28a745',
    },
    cardGuests: {
        fontSize: 12,
        color: '#666',
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
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    fabText: {
        fontSize: 24,
        color: '#ffffff',
        fontWeight: 'bold',
    },
    errorText: {
        color: '#ff4646',
        textAlign: 'center',
        marginTop: 20,
        marginHorizontal: 20,
    },
});