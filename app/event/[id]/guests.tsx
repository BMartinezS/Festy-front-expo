// app/event/[id]/guests.tsx - Pantalla para gestionar invitados
import React, { useState, useCallback } from 'react';
import {
    StyleSheet,
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Modal,
    ActivityIndicator,
    Alert,
    FlatList,
    RefreshControl,
} from 'react-native';
import { useLocalSearchParams, Stack, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { Event, eventService } from '@/services/event.service';
import { whatsappService } from '@/services/whatsapp.service';
import { paymentService } from '@/services/payment.service';
import * as Clipboard from 'expo-clipboard';
import * as Sharing from 'expo-sharing';

// Componente para cada invitado
interface Guest {
    phone: string;
    status: 'confirmed' | 'declined' | 'registered' | 'pending';
    hasPaid: boolean;
}

const GuestItem = ({
    guest,
    eventId,
    token,
    cuotaAmount,
    requiresPayment,
    refreshGuests,
    eventName
}: {
    guest: Guest;
    eventId: string;
    token: string;
    cuotaAmount: number;
    requiresPayment: boolean;
    refreshGuests: () => void;
    eventName: string;
}) => {
    const [isLoading, setIsLoading] = useState(false);

    // Función para generar un enlace de pago
    const generatePaymentLink = async () => {
        try {
            setIsLoading(true);
            const paymentLink = await paymentService.generatePaymentLink(token, eventId, guest.phone);

            // Mostrar opciones para compartir el enlace
            Alert.alert(
                'Enlace de Pago',
                '¿Qué deseas hacer con el enlace de pago?',
                [
                    {
                        text: 'Copiar',
                        onPress: async () => {
                            await Clipboard.setStringAsync(paymentLink);
                            Alert.alert('Éxito', 'Enlace copiado al portapapeles');
                        },
                    },
                    {
                        text: 'Compartir por WhatsApp',
                        onPress: async () => {
                            try {
                                // Mensaje para WhatsApp
                                const message = `Hola! Te envío el enlace para pagar tu cuota del evento "${eventName}": ${paymentLink}`;
                                // Compartir por WhatsApp (usando Sharing API)
                                if (await Sharing.isAvailableAsync()) {
                                    await Sharing.shareAsync(message, {
                                        dialogTitle: 'Compartir enlace de pago',
                                        mimeType: 'text/plain',
                                        UTI: 'public.plain-text',
                                    });
                                } else {
                                    await Clipboard.setStringAsync(message);
                                    Alert.alert('Info', 'Mensaje copiado al portapapeles. Compártelo manualmente en WhatsApp.');
                                }
                            } catch (error) {
                                console.error('Error al compartir:', error);
                                Alert.alert('Error', 'No se pudo compartir el enlace');
                            }
                        },
                    },
                    {
                        text: 'Cancelar',
                        style: 'cancel',
                    },
                ]
            );
        } catch (error) {
            console.error('Error al generar enlace de pago:', error);
            Alert.alert('Error', 'No se pudo generar el enlace de pago');
        } finally {
            setIsLoading(false);
        }
    };

    // Marcar invitado como pagado
    const markAsPaid = async () => {
        try {
            setIsLoading(true);
            await eventService.markGuestAsPaid(token, eventId, guest.phone);
            Alert.alert('Éxito', 'El invitado ha sido marcado como pagado');
            refreshGuests();
        } catch (error) {
            console.error('Error al marcar como pagado:', error);
            Alert.alert('Error', 'No se pudo marcar al invitado como pagado');
        } finally {
            setIsLoading(false);
        }
    };

    // Remover invitado
    const removeGuest = async () => {
        Alert.alert(
            'Eliminar Invitado',
            '¿Estás seguro que deseas eliminar a este invitado del evento?',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Eliminar',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            setIsLoading(true);
                            await eventService.removeGuest(token, eventId, guest.phone);
                            Alert.alert('Éxito', 'Invitado eliminado correctamente');
                            refreshGuests();
                        } catch (error) {
                            console.error('Error al eliminar invitado:', error);
                            Alert.alert('Error', 'No se pudo eliminar al invitado');
                        } finally {
                            setIsLoading(false);
                        }
                    }
                }
            ]
        );
    };

    // Determinar el color del badge según el estado
    const getBadgeStyle = () => {
        switch (guest.status) {
            case 'confirmed':
                return styles.confirmedBadge;
            case 'declined':
                return styles.declinedBadge;
            case 'registered':
                return styles.registeredBadge;
            default:
                return styles.pendingBadge;
        }
    };

    // Texto del estado
    const getStatusText = () => {
        switch (guest.status) {
            case 'confirmed':
                return 'CONFIRMADO';
            case 'declined':
                return 'RECHAZADO';
            case 'registered':
                return 'REGISTRADO';
            default:
                return 'PENDIENTE';
        }
    };

    return (
        <View style={styles.guestCard}>
            <View style={styles.guestInfo}>
                <Text style={styles.guestPhone}>{guest.phone}</Text>

                <View style={styles.statusRow}>
                    <View style={[styles.badge, getBadgeStyle()]}>
                        <Text style={styles.badgeText}>{getStatusText()}</Text>
                    </View>

                    {requiresPayment && (
                        <View style={[
                            styles.badge,
                            guest.hasPaid ? styles.paidBadge : styles.unpaidBadge
                        ]}>
                            <Text style={styles.badgeText}>
                                {guest.hasPaid ? 'PAGADO' : 'NO PAGADO'}
                            </Text>
                        </View>
                    )}
                </View>
            </View>

            <View style={styles.guestActions}>
                {isLoading ? (
                    <ActivityIndicator size="small" color="rgb(71, 25, 82)" />
                ) : (
                    <View style={styles.actionButtons}>
                        {requiresPayment && !guest.hasPaid && (
                            <>
                                <TouchableOpacity
                                    style={styles.actionButton}
                                    onPress={generatePaymentLink}
                                >
                                    <Ionicons name="cash-outline" size={22} color="rgb(71, 25, 82)" />
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.actionButton}
                                    onPress={markAsPaid}
                                >
                                    <Ionicons name="checkmark-circle-outline" size={22} color="#28a745" />
                                </TouchableOpacity>
                            </>
                        )}

                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={removeGuest}
                        >
                            <Ionicons name="trash-outline" size={22} color="#dc3545" />
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        </View>
    );
};

// Pantalla principal
export default function GuestManagementScreen() {
    const { id: eventId } = useLocalSearchParams();
    const [event, setEvent] = useState<Event | null>(null);
    const [guests, setGuests] = useState<any>([]);
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [isInviteModalVisible, setInviteModalVisible] = useState(false);
    const [phoneInput, setPhoneInput] = useState('');
    const [phoneList, setPhoneList] = useState<string[]>([]);
    const [error, setError] = useState('');
    const [filter, setFilter] = useState('all'); // 'all', 'confirmed', 'pending', 'paid', 'unpaid'
    const [searchQuery, setSearchQuery] = useState('');
    const [groupActionLoading, setGroupActionLoading] = useState(false);

    // Cargar datos del evento y lista de invitados
    const loadEventData = useCallback(async () => {
        try {
            setLoading(true);

            const userToken = await AsyncStorage.getItem('userToken');
            
            setToken(userToken);
            if (!userToken || !eventId) {
                setError('No se pudo obtener la información necesaria');
                return;
            }
            
            const eventData: Event = await eventService.getEventById(userToken, eventId.toString());
            setEvent(eventData);

            // Los invitados ya vienen en eventData.data.invitados
            setGuests(eventData.invitados || []);

        } catch (error) {
            console.error('Error al cargar datos:', error);
            setError('Error al cargar la información del evento');
        } finally {
            setLoading(false);
        }
    }, [eventId]);

    // Refrescar datos al enfocar la pantalla
    useFocusEffect(
        useCallback(() => {
            loadEventData();
        }, [loadEventData])
    );

    // Función para refrescar manualmente
    const handleRefresh = async () => {
        setRefreshing(true);
        await loadEventData();
        setRefreshing(false);
    };

    // Agregar número de teléfono a la lista
    const addPhoneToList = () => {

        if (!phoneInput) {
            Alert.alert('Error', 'Debes ingresar un número de teléfono');
            return;
        }

        if (!phoneInput.trim()) {
            return;
        }

        // Validar formato del teléfono (simple)
        const phoneRegex = /^\+?[0-9]{8,15}$/;
        if (!phoneRegex.test(phoneInput)) {
            Alert.alert('Error', 'Formato de teléfono inválido. Usa formato internacional (ej: +56912345678)');
            return;
        }

        // Verificar si ya está en la lista
        if (phoneList.includes(phoneInput)) {
            Alert.alert('Error', 'Este número ya está en la lista');
            return;
        }

        setPhoneList([...phoneList, phoneInput]);
        setPhoneInput('');
    };

    // Remover teléfono de la lista
    const removePhoneFromList = (phone: string) => {
        setPhoneList(phoneList.filter(p => p !== phone));
    };

    // Enviar invitaciones
    const sendInvitations = async () => {
        if (phoneList.length === 0) {
            Alert.alert('Error', 'Debes agregar al menos un número de teléfono');
            return;
        }

        try {
            setGroupActionLoading(true);

            if (!eventId || !token) {
                Alert.alert('Error', 'No se pudo enviar las invitaciones');
                return;
            }

            // Invitar a los invitados
            await eventService.inviteGuests(token, eventId.toString(), phoneList);

            // Limpiar y cerrar modal
            setPhoneList([]);
            setInviteModalVisible(false);

            // Refrescar lista de invitados
            await loadEventData();

            Alert.alert('Éxito', 'Invitaciones enviadas correctamente');
        } catch (error) {
            console.error('Error al enviar invitaciones:', error);
            setError('Error al enviar invitaciones');
            Alert.alert('Error', 'No se pudieron enviar las invitaciones');
        } finally {
            setGroupActionLoading(false);
        }
    };

    // Crear grupo de WhatsApp
    const createWhatsAppGroup = async () => {
        if (!event) return;

        try {

            if (!eventId || !token) {
                Alert.alert('Error', 'No se pudo crear el grupo de WhatsApp');
                return;
            }

            setGroupActionLoading(true);

            // Nombre del grupo
            const groupName = `${event.nombre} - ${new Date(event.fechaInicio).toLocaleDateString()}`;

            // Crear grupo
            const groupData = await whatsappService.createGroup(token, eventId.toString(), groupName);

            Alert.alert(
                'Grupo Creado',
                `El grupo "${groupName}" ha sido creado exitosamente. Puedes compartir el enlace de invitación.`,
                [
                    {
                        text: 'Copiar Enlace',
                        onPress: async () => {
                            await Clipboard.setStringAsync(groupData.inviteLink);
                            Alert.alert('Éxito', 'Enlace copiado al portapapeles');
                        }
                    },
                    { text: 'OK' }
                ]
            );

            // Refrescar datos
            await loadEventData();
        } catch (error) {
            console.error('Error al crear grupo de WhatsApp:', error);
            Alert.alert('Error', 'No se pudo crear el grupo de WhatsApp');
        } finally {
            setGroupActionLoading(false);
        }
    };

    // Filtrar invitados según criterio
    const getFilteredGuests = () => {
        let filtered = [...guests];

        // Aplicar filtro por estado/pago
        switch (filter) {
            case 'confirmed':
                filtered = filtered.filter(g => g.status === 'confirmed');
                break;
            case 'pending':
                filtered = filtered.filter(g => g.status === 'pending');
                break;
            case 'paid':
                filtered = filtered.filter(g => g.hasPaid);
                break;
            case 'unpaid':
                filtered = filtered.filter(g => !g.hasPaid);
                break;
        }

        // Aplicar búsqueda por número
        if (searchQuery.trim()) {
            filtered = filtered.filter(g =>
                g.phone.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        return filtered;
    };

    // Renderizar cada filtro
    const renderFilterButton = (filterName: string, label: string) => (
        <TouchableOpacity
            style={[styles.filterButton, filter === filterName && styles.activeFilterButton]}
            onPress={() => setFilter(filterName)}
        >
            <Text style={[styles.filterText, filter === filterName && styles.activeFilterText]}>
                {label}
            </Text>
        </TouchableOpacity>
    );

    if (loading && !refreshing) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="rgb(51, 18, 59)" />
                <Text style={styles.loadingText}>Cargando invitados...</Text>
            </View>
        );
    }

    return (
        <>
            <Stack.Screen
                options={{
                    headerTitle: 'Gestión de Invitados',
                    headerShown: true,
                    headerTintColor: 'rgb(51, 18, 59)',
                }}
            />

            <View style={styles.container}>
                {/* Panel de estadísticas */}
                {event && (
                    <View style={styles.statsContainer}>
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>{guests.length}</Text>
                            <Text style={styles.statLabel}>Invitados</Text>
                        </View>

                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>
                                {guests.filter((g: any) => g.status === 'confirmed').length}
                            </Text>
                            <Text style={styles.statLabel}>Confirmados</Text>
                        </View>

                        {event.requiresPayment && (
                            <View style={styles.statItem}>
                                <Text style={styles.statValue}>
                                    {guests.filter((g: any) => g.hasPaid).length}
                                </Text>
                                <Text style={styles.statLabel}>Pagados</Text>
                            </View>
                        )}
                    </View>
                )}

                {/* Barra de búsqueda */}
                <View style={styles.searchBar}>
                    <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Buscar por número..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        placeholderTextColor="#999"
                    />
                    {searchQuery ? (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <Ionicons name="close-circle" size={20} color="#999" />
                        </TouchableOpacity>
                    ) : null}
                </View>

                {/* Filtros */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.filtersContainer}
                >
                    {renderFilterButton('all', 'Todos')}
                    {renderFilterButton('confirmed', 'Confirmados')}
                    {renderFilterButton('pending', 'Pendientes')}
                    {event?.requiresPayment && (
                        <>
                            {renderFilterButton('paid', 'Pagados')}
                            {renderFilterButton('unpaid', 'No Pagados')}
                        </>
                    )}
                </ScrollView>

                {error ? <Text style={styles.errorText}>{error}</Text> : null}

                {/* Lista de invitados */}
                <FlatList
                    data={getFilteredGuests()}
                    keyExtractor={(item, index) => item.phone || index.toString()}
                    renderItem={({ item }) => {
                        if (!token) return null;
                        return (
                            <GuestItem
                                guest={item}
                                eventId={eventId.toString()}
                                token={token}
                                cuotaAmount={event?.cuotaAmount ?? 0}
                                requiresPayment={event?.requiresPayment ?? false}
                                refreshGuests={handleRefresh}
                                eventName={event?.nombre ?? ''}
                            />
                        );
                    }}
                    contentContainerStyle={styles.guestList}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="people" size={50} color="#ccc" />
                            <Text style={styles.emptyText}>
                                No hay invitados{filter !== 'all' ? ' en este filtro' : ''}
                            </Text>
                            <Text style={styles.emptySubtext}>
                                Agrega invitados usando el botón de abajo
                            </Text>
                        </View>
                    }
                />

                {/* Botones de acción flotantes */}
                <View style={styles.fabContainer}>
                    {/* Botón para crear grupo WhatsApp */}
                    <TouchableOpacity
                        style={[styles.fabSecondary, { right: 90 }]}
                        onPress={createWhatsAppGroup}
                        disabled={groupActionLoading}
                    >
                        {groupActionLoading ? (
                            <ActivityIndicator size="small" color="#ffffff" />
                        ) : (
                            <Ionicons name="logo-whatsapp" size={24} color="#ffffff" />
                        )}
                    </TouchableOpacity>

                    {/* Botón para invitar */}
                    <TouchableOpacity
                        style={styles.fab}
                        onPress={() => setInviteModalVisible(true)}
                        disabled={groupActionLoading}
                    >
                        {groupActionLoading ? (
                            <ActivityIndicator size="small" color="#ffffff" />
                        ) : (
                            <Ionicons name="person-add" size={24} color="#ffffff" />
                        )}
                    </TouchableOpacity>
                </View>

                {/* Modal para invitar */}
                <Modal
                    visible={isInviteModalVisible}
                    transparent={true}
                    animationType="slide"
                    onRequestClose={() => setInviteModalVisible(false)}
                >
                    <View style={styles.modalContainer}>
                        <View style={styles.modalContent}>
                            <Text style={styles.modalTitle}>Invitar Personas</Text>

                            <View style={styles.phoneInputContainer}>
                                <TextInput
                                    style={styles.phoneInput}
                                    placeholder="Número de teléfono (+56...)"
                                    value={phoneInput}
                                    onChangeText={setPhoneInput}
                                    keyboardType="phone-pad"
                                    placeholderTextColor="#999"
                                />
                                <TouchableOpacity
                                    style={styles.addPhoneButton}
                                    onPress={addPhoneToList}
                                >
                                    <Ionicons name="add" size={24} color="#ffffff" />
                                </TouchableOpacity>
                            </View>

                            <Text style={styles.listTitle}>Números a invitar:</Text>

                            <ScrollView style={styles.phoneList}>
                                {phoneList.length > 0 ? (
                                    phoneList.map((phone, index) => (
                                        <View key={index} style={styles.phoneItem}>
                                            <Text style={styles.phoneItemText}>{phone}</Text>
                                            <TouchableOpacity
                                                onPress={() => removePhoneFromList(phone)}
                                                style={styles.removePhoneButton}
                                            >
                                                <Ionicons name="close-circle" size={20} color="#dc3545" />
                                            </TouchableOpacity>
                                        </View>
                                    ))
                                ) : (
                                    <Text style={styles.emptyListText}>
                                        Agrega teléfonos para invitar
                                    </Text>
                                )}
                            </ScrollView>

                            <View style={styles.modalButtons}>
                                <TouchableOpacity
                                    style={[styles.modalButton, styles.cancelButton]}
                                    onPress={() => {
                                        setPhoneList([]);
                                        setInviteModalVisible(false);
                                    }}
                                >
                                    <Text style={styles.cancelButtonText}>Cancelar</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[
                                        styles.modalButton,
                                        styles.inviteButton,
                                        phoneList.length === 0 && styles.disabledButton
                                    ]}
                                    onPress={sendInvitations}
                                    disabled={phoneList.length === 0 || groupActionLoading}
                                >
                                    {groupActionLoading ? (
                                        <ActivityIndicator size="small" color="#ffffff" />
                                    ) : (
                                        <Text style={styles.inviteButtonText}>Invitar</Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>
            </View>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: 'rgb(71, 25, 82)',
    },
    errorText: {
        color: '#ff4646',
        textAlign: 'center',
        marginVertical: 10,
        paddingHorizontal: 15,
    },
    statsContainer: {
        flexDirection: 'row',
        backgroundColor: '#ffffff',
        borderRadius: 10,
        marginHorizontal: 15,
        marginTop: 15,
        paddingVertical: 15,
        borderWidth: 1,
        borderColor: '#eee',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
        borderRightWidth: 1,
        borderRightColor: '#eee',
    },
    statValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: 'rgb(51, 18, 59)',
    },
    statLabel: {
        fontSize: 12,
        color: '#666',
        marginTop: 5,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ffffff',
        marginHorizontal: 15,
        marginTop: 15,
        paddingHorizontal: 15,
        height: 50,
        borderRadius: 25,
        borderWidth: 1,
        borderColor: '#eee',
    },
    searchIcon: {
        marginRight: 10,
    },
    searchInput: {
        flex: 1,
        height: '100%',
        fontSize: 16,
        color: '#333',
    },
    filtersContainer: {
        flexDirection: 'row',
        paddingHorizontal: 15,
        paddingVertical: 15,
    },
    filterButton: {
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 20,
        marginRight: 10,
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: '#eee',
    },
    activeFilterButton: {
        backgroundColor: 'rgb(51, 18, 59)',
        borderColor: 'rgb(51, 18, 59)',
    },
    filterText: {
        fontSize: 14,
        color: '#666',
    },
    activeFilterText: {
        color: '#ffffff',
        fontWeight: '500',
    },
    guestList: {
        padding: 15,
        paddingBottom: 80, // Espacio para el FAB
    },
    guestCard: {
        flexDirection: 'row',
        backgroundColor: '#ffffff',
        padding: 15,
        borderRadius: 10,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#eee',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    guestInfo: {
        flex: 1,
    },
    guestPhone: {
        fontSize: 16,
        fontWeight: '500',
        color: '#333',
        marginBottom: 5,
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 20,
        marginRight: 5,
        marginBottom: 5,
    },
    confirmedBadge: {
        backgroundColor: '#28a745',
    },
    registeredBadge: {
        backgroundColor: '#17a2b8',
    },
    declinedBadge: {
        backgroundColor: '#dc3545',
    },
    pendingBadge: {
        backgroundColor: '#ffc107',
    },
    paidBadge: {
        backgroundColor: '#28a745',
    },
    unpaidBadge: {
        backgroundColor: '#dc3545',
    },
    badgeText: {
        color: '#ffffff',
        fontSize: 10,
        fontWeight: 'bold',
    },
    guestActions: {
        justifyContent: 'center',
        marginLeft: 10,
    },
    actionButtons: {
        flexDirection: 'row',
    },
    actionButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f0f0f0',
        marginLeft: 5,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 30,
    },
    emptyText: {
        fontSize: 18,
        color: '#666',
        marginTop: 10,
        fontWeight: '500',
    },
    emptySubtext: {
        fontSize: 14,
        color: '#999',
        marginTop: 5,
        textAlign: 'center',
    },
    fabContainer: {
        position: 'absolute',
        right: 20,
        bottom: 20,
    },
    fab: {
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
    fabSecondary: {
        position: 'absolute',
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#25D366', // Color de WhatsApp
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.27,
        shadowRadius: 4.65,
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
        width: '90%',
        maxHeight: '80%',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.27,
        shadowRadius: 4.65,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: 'rgb(51, 18, 59)',
        marginBottom: 20,
        textAlign: 'center',
    },
    phoneInputContainer: {
        flexDirection: 'row',
        marginBottom: 20,
    },
    phoneInput: {
        flex: 1,
        height: 45,
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 10,
        paddingHorizontal: 15,
        fontSize: 16,
        color: '#333',
        marginRight: 10,
    },
    addPhoneButton: {
        width: 45,
        height: 45,
        backgroundColor: 'rgb(51, 18, 59)',
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listTitle: {
        fontSize: 16,
        fontWeight: '500',
        color: '#333',
        marginBottom: 10,
    },
    phoneList: {
        maxHeight: 200,
        marginBottom: 20,
    },
    phoneItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderRadius: 8,
        marginBottom: 8,
    },
    phoneItemText: {
        flex: 1,
        fontSize: 16,
        color: '#333',
    },
    removePhoneButton: {
        padding: 5,
    },
    emptyListText: {
        textAlign: 'center',
        color: '#999',
        fontStyle: 'italic',
        paddingVertical: 20,
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    modalButton: {
        flex: 1,
        height: 45,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginHorizontal: 5,
    },
    cancelButton: {
        backgroundColor: '#f5f5f5',
        borderWidth: 1,
        borderColor: '#ddd',
    },
    inviteButton: {
        backgroundColor: 'rgb(51, 18, 59)',
    },
    disabledButton: {
        opacity: 0.5,
    },
    cancelButtonText: {
        color: '#666',
        fontSize: 16,
        fontWeight: '500',
    },
    inviteButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '500',
    },
});