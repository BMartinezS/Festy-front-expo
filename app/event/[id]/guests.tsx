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
    StatusBar,
    Animated,
} from 'react-native';
import { useLocalSearchParams, Stack, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { Event, eventService } from '@/services/event.service';
import { whatsappService } from '@/services/whatsapp.service';
import { paymentService } from '@/services/payment.service';
import * as Clipboard from 'expo-clipboard';
import * as Sharing from 'expo-sharing';
import { LinearGradient } from 'expo-linear-gradient';

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
                    <ActivityIndicator size="small" color="#6a0dad" />
                ) : (
                    <View style={styles.actionButtons}>
                        {requiresPayment && !guest.hasPaid && (
                            <>
                                <TouchableOpacity
                                    style={styles.actionButton}
                                    onPress={generatePaymentLink}
                                >
                                    <View style={[styles.actionButtonInner, { backgroundColor: 'rgba(106, 13, 173, 0.1)' }]}>
                                        <Ionicons name="cash" size={18} color="#6a0dad" />
                                    </View>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.actionButton}
                                    onPress={markAsPaid}
                                >
                                    <View style={[styles.actionButtonInner, { backgroundColor: 'rgba(40, 167, 69, 0.1)' }]}>
                                        <Ionicons name="checkmark-circle" size={18} color="#28a745" />
                                    </View>
                                </TouchableOpacity>
                            </>
                        )}

                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={removeGuest}
                        >
                            <View style={[styles.actionButtonInner, { backgroundColor: 'rgba(220, 53, 69, 0.1)' }]}>
                                <Ionicons name="trash" size={18} color="#dc3545" />
                            </View>
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
    const [phoneInput, setPhoneInput] = useState('');
    const [phoneList, setPhoneList] = useState<string[]>([]);
    const [error, setError] = useState('');
    const [filter, setFilter] = useState('all'); // 'all', 'confirmed', 'pending', 'paid', 'unpaid'
    const [searchQuery, setSearchQuery] = useState('');
    const [groupActionLoading, setGroupActionLoading] = useState(false);

    // Animación para elementos
    const [fadeAnim] = useState(new Animated.Value(0));

    // Iniciar animación cuando se monta el componente
    React.useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
        }).start();
    }, []);

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
            activeOpacity={0.7}
        >
            <Text style={[styles.filterText, filter === filterName && styles.activeFilterText]}>
                {label}
            </Text>
        </TouchableOpacity>
    );

    if (loading && !refreshing) {
        return (
            <View style={styles.loadingContainer}>
                <StatusBar barStyle="light-content" backgroundColor="#6a0dad" />
                <ActivityIndicator size="large" color="#6a0dad" />
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
                    headerTitleStyle: { fontWeight: 'bold' },
                    headerTintColor: '#fff',
                    headerStyle: {
                        backgroundColor: '#6a0dad',
                    }
                }}
            />

            <View style={styles.container}>
                <StatusBar barStyle="light-content" backgroundColor="#6a0dad" />

                {/* Panel de estadísticas */}
                {event && (
                    <Animated.View
                        style={[styles.statsContainer, { opacity: fadeAnim }]}
                    >
                        <LinearGradient
                            colors={['#6a0dad', '#8e44ad']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.statsGradient}
                        >
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
                        </LinearGradient>
                    </Animated.View>
                )}

                {/* Barra de búsqueda */}
                <View style={styles.searchBarContainer}>
                    <View style={styles.searchBar}>
                        <Ionicons name="search" size={20} color="#6a0dad" style={styles.searchIcon} />
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

                {error ? (
                    <View style={styles.errorContainer}>
                        <Ionicons name="alert-circle" size={20} color="#ff4646" />
                        <Text style={styles.errorText}>{error}</Text>
                    </View>
                ) : null}

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
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={handleRefresh}
                            colors={['#6a0dad']}
                            tintColor="#6a0dad"
                        />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <View style={styles.emptyIconContainer}>
                                <LinearGradient
                                    colors={['#6a0dad', '#8e44ad']}
                                    style={styles.emptyIconGradient}
                                >
                                    <Ionicons name="people" size={40} color="rgba(255,255,255,0.9)" />
                                </LinearGradient>
                            </View>
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
                    {/* Botón para invitar */}
                    <TouchableOpacity
                        style={styles.fab}
                        disabled={groupActionLoading}
                        activeOpacity={0.8}
                    >
                        <LinearGradient
                            colors={['#6a0dad', '#8e44ad']}
                            style={styles.fabGradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                        >
                            {groupActionLoading ? (
                                <ActivityIndicator size="small" color="#ffffff" />
                            ) : (
                                <>
                                    <Ionicons name="person-add" size={24} color="#ffffff" />
                                    <Text style={styles.fabText}>Generar invitaciones</Text>
                                </>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
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
        backgroundColor: '#f8f9fa',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        fontWeight: '500',
        color: '#6a0dad',
    },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ffebee',
        marginHorizontal: 15,
        marginBottom: 10,
        padding: 10,
        borderRadius: 8,
    },
    errorText: {
        color: '#ff4646',
        marginLeft: 8,
        fontSize: 14,
        flex: 1,
    },
    statsContainer: {
        margin: 15,
        marginBottom: 10,
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 5,
    },
    statsGradient: {
        flexDirection: 'row',
        padding: 20,
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statValue: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#ffffff',
    },
    statLabel: {
        fontSize: 13,
        fontWeight: '500',
        color: 'rgba(255, 255, 255, 0.8)',
        marginTop: 5,
    },
    searchBarContainer: {
        paddingHorizontal: 15,
        marginBottom: 5,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ffffff',
        paddingHorizontal: 15,
        height: 50,
        borderRadius: 25,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
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
        paddingHorizontal: 15,
        paddingVertical: 10,
    },
    filterButton: {
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 20,
        marginRight: 10,
        backgroundColor: '#ffffff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 1,
    },
    activeFilterButton: {
        backgroundColor: '#6a0dad',
    },
    filterText: {
        fontSize: 14,
        color: '#555',
        fontWeight: '500',
    },
    activeFilterText: {
        color: '#ffffff',
        fontWeight: '600',
    },
    guestList: {
        padding: 15,
        paddingBottom: 90, // Espacio para el FAB
    },
    guestCard: {
        flexDirection: 'row',
        backgroundColor: '#ffffff',
        padding: 15,
        borderRadius: 12,
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 3,
    },
    guestInfo: {
        flex: 1,
    },
    guestPhone: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
    },
    badge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
        marginRight: 6,
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
        marginLeft: 5,
    },
    actionButtonInner: {
        width: 34,
        height: 34,
        borderRadius: 17,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
    },
    emptyIconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        overflow: 'hidden',
        marginBottom: 16,
    },
    emptyIconGradient: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 18,
        color: '#555',
        fontWeight: '600',
        marginBottom: 8,
    },
    emptySubtext: {
        fontSize: 14,
        color: '#888',
        textAlign: 'center',
        maxWidth: '80%',
    },
    fabContainer: {
        position: 'absolute',
        right: 20,
        bottom: 20,
    },
    fab: {
        width: 150,
        height: 60,
        borderRadius: 10,
        overflow: 'hidden',
        elevation: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
    },
    fabGradient: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
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
        justifyContent: 'flex-end',
    },
    blurView: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    modalContent: {
        backgroundColor: '#ffffff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 24,
        paddingBottom: 40,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 10,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 20,
        textAlign: 'center',
    },
    phoneInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    phoneInputWrapper: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        borderRadius: 12,
        paddingHorizontal: 15,
        height: 50,
        marginRight: 10,
    },
    phoneInputIcon: {
        marginRight: 10,
    },
    phoneInput: {
        flex: 1,
        height: '100%',
        fontSize: 16,
        color: '#333',
    },
    addPhoneButton: {
        width: 50,
        height: 50,
        borderRadius: 12,
        overflow: 'hidden',
    },
    addPhoneGradient: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    listTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 12,
    },
    phoneList: {
        maxHeight: 220,
        marginBottom: 20,
    },
    phoneItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8f8f8',
        paddingVertical: 12,
        paddingHorizontal: 15,
        borderRadius: 12,
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
    removePhoneButtonInner: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: 'rgba(220, 53, 69, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyListText: {
        textAlign: 'center',
        color: '#999',
        fontStyle: 'italic',
        paddingVertical: 30,
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    modalButton: {
        flex: 1,
        height: 50,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginHorizontal: 5,
    },
    cancelButton: {
        backgroundColor: '#f5f5f5',
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    inviteButton: {
        backgroundColor: '#6a0dad',
    },
    disabledButton: {
        opacity: 0.5,
    },
    cancelButtonText: {
        color: '#666',
        fontSize: 16,
        fontWeight: '600',
    },
    inviteButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '600',
    },
    fabText: {
        color: '#ffffff',
        fontWeight: '600',
        fontSize: 16,
    }
});