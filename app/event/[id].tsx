// app/event/[id].tsx
import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    RefreshControl,
    TextInput,
    Modal,
    FlatList,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Event, eventService } from '@/services/event.service';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function EventDetailScreen() {
    const { id } = useLocalSearchParams();
    const [event, setEvent] = useState<Event | null>(null);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState('');
    const [modalVisible, setModalVisible] = useState(false);
    const [newPhone, setNewPhone] = useState('');
    const [inviteError, setInviteError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const loadEvent = async () => {
        try {
            setRefreshing(true);
            const token = await AsyncStorage.getItem('userToken');
            if (!token || !id) throw new Error('No token found');

            const data = await eventService.getEventById(token, id as string);
            setEvent(data);
            setError('');
        } catch (error: any) {
            setError(error.message || 'Error al cargar el evento');
        } finally {
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadEvent();
    }, [id]);

    const handleInvite = async () => {
        if (!newPhone) {
            setInviteError('Por favor ingresa un número de teléfono');
            return;
        }

        try {
            setIsLoading(true);
            setInviteError('');
            const token = await AsyncStorage.getItem('userToken');
            if (!token || !id) throw new Error('No token found');

            await eventService.inviteGuests(token, id as string, [newPhone]);
            await loadEvent(); // Recargar el evento para mostrar el nuevo invitado
            setModalVisible(false);
            setNewPhone('');
        } catch (error: any) {
            setInviteError(error.message || 'Error al invitar');
        } finally {
            setIsLoading(false);
        }
    };

    if (!event) return null;

    return (
        <View style={styles.container}>
            <ScrollView
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={loadEvent} />
                }
            >
                {error ? <Text style={styles.errorText}>{error}</Text> : null}

                <View style={styles.headerSection}>
                    <Text style={styles.title}>{event.nombre}</Text>
                    <Text style={styles.description}>{event.descripcion}</Text>
                </View>

                <View style={styles.infoCard}>
                    <Text style={styles.sectionTitle}>Detalles del Evento</Text>
                    <Text style={styles.infoText}>
                        📅 {new Date(event.fecha).toLocaleDateString()}
                    </Text>
                    <Text style={styles.infoText}>📍 {event.ubicacion.address}</Text>
                    {event.requiresPayment && (
                        <Text style={styles.infoText}>
                            💰 Cuota: ${event.cuotaAmount}
                        </Text>
                    )}
                    <Text style={styles.statusText}>
                        Estado: {event.status.toUpperCase()}
                    </Text>
                </View>

                <View style={styles.guestsSection}>
                    <View style={styles.guestsHeader}>
                        <Text style={styles.sectionTitle}>Invitados</Text>
                        <TouchableOpacity
                            style={styles.addButton}
                            onPress={() => setModalVisible(true)}
                        >
                            <Text style={styles.addButtonText}>+ Invitar</Text>
                        </TouchableOpacity>
                    </View>

                    {event.invitados.map((invitado, index) => (
                        <View key={index} style={styles.guestCard}>
                            <View>
                                <Text style={styles.guestPhone}>{invitado.phone}</Text>
                                <Text style={[
                                    styles.guestStatus,
                                    invitado.status === 'confirmed' && styles.confirmedStatus
                                ]}>
                                    {invitado.status.toUpperCase()}
                                </Text>
                            </View>
                            {invitado.hasPaid && (
                                <Text style={styles.paidBadge}>PAGADO</Text>
                            )}
                        </View>
                    ))}
                </View>
            </ScrollView>

            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Invitar Persona</Text>

                        {inviteError ? (
                            <Text style={styles.errorText}>{inviteError}</Text>
                        ) : null}

                        <TextInput
                            style={styles.input}
                            placeholder="Número de teléfono"
                            placeholderTextColor="#666"
                            value={newPhone}
                            onChangeText={setNewPhone}
                            keyboardType="phone-pad"
                        />

                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.cancelButton]}
                                onPress={() => setModalVisible(false)}
                            >
                                <Text style={styles.cancelButtonText}>Cancelar</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.modalButton, styles.inviteButton]}
                                onPress={handleInvite}
                                disabled={isLoading}
                            >
                                <Text style={styles.inviteButtonText}>
                                    {isLoading ? 'Invitando...' : 'Invitar'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    headerSection: {
        padding: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: 'rgb(51, 18, 59)',
        marginBottom: 10,
    },
    description: {
        fontSize: 16,
        color: '#666',
        marginBottom: 20,
    },
    infoCard: {
        backgroundColor: '#ffffff',
        marginHorizontal: 20,
        padding: 15,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: 'rgb(71, 25, 82)',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: 'rgb(51, 18, 59)',
        marginBottom: 10,
    },
    infoText: {
        fontSize: 16,
        color: '#666',
        marginBottom: 5,
    },
    statusText: {
        fontSize: 14,
        color: 'rgb(71, 25, 82)',
        fontWeight: 'bold',
        marginTop: 10,
    },
    guestsSection: {
        padding: 20,
    },
    guestsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    addButton: {
        backgroundColor: 'rgb(51, 18, 59)',
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 20,
    },
    addButtonText: {
        color: '#ffffff',
        fontSize: 14,
        fontWeight: 'bold',
    },
    guestCard: {
        backgroundColor: '#ffffff',
        padding: 15,
        borderRadius: 10,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: 'rgb(71, 25, 82)',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    guestPhone: {
        fontSize: 16,
        color: '#333',
        marginBottom: 5,
    },
    guestStatus: {
        fontSize: 12,
        color: '#666',
    },
    confirmedStatus: {
        color: '#28a745',
    },
    paidBadge: {
        backgroundColor: '#28a745',
        color: '#ffffff',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 15,
        fontSize: 12,
        fontWeight: 'bold',
    },
    errorText: {
        color: '#ff4646',
        marginBottom: 15,
        textAlign: 'center',
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContent: {
        backgroundColor: '#ffffff',
        borderRadius: 10,
        padding: 20,
        width: '80%',
        maxWidth: 400,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: 'rgb(51, 18, 59)',
        marginBottom: 20,
        textAlign: 'center',
    },
    input: {
        width: '100%',
        height: 50,
        backgroundColor: '#ffffff',
        borderRadius: 10,
        paddingHorizontal: 15,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: 'rgb(71, 25, 82)',
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    modalButton: {
        flex: 1,
        height: 40,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginHorizontal: 5,
    },
    cancelButton: {
        backgroundColor: '#f8f9fa',
        borderWidth: 1,
        borderColor: 'rgb(71, 25, 82)',
    },
    inviteButton: {
        backgroundColor: 'rgb(51, 18, 59)',
    },
    cancelButtonText: {
        color: 'rgb(71, 25, 82)',
        fontSize: 16,
        fontWeight: 'bold',
    },
    inviteButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});