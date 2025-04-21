// app/event/[id]/dashboard.tsx - Dashboard para organizadores
import React, { useState, useEffect, useCallback } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    Dimensions,
    Alert,
    StatusBar,
    Animated,
} from 'react-native';
import { useLocalSearchParams, Stack, useFocusEffect, router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { Event, eventService } from '@/services/event.service';
import { paymentService } from '@/services/payment.service';
import { LineChart, PieChart } from 'react-native-chart-kit';
import { LinearGradient } from 'expo-linear-gradient';
import ActionButton from '@/components/ui/ActionButton';

// Componente para una tarjeta de estadísticas
const StatCard = ({ title, value, icon, color, subtitle, onPress }: any) => {

    return (
        <TouchableOpacity
            style={styles.card}
            onPress={onPress}
            disabled={!onPress}
            activeOpacity={0.8}
        >
            <View style={styles.cardContent}>
                <View style={[styles.cardIconContainer, { backgroundColor: `${color}20` }]}>
                    <Ionicons name={icon} size={24} color={color} />
                </View>
                <View style={styles.cardTextContainer}>
                    <Text style={styles.cardTitle}>{title}</Text>
                    <Text style={[styles.cardValue, { color }]}>{value}</Text>
                    {subtitle && <Text style={styles.cardSubtitle}>{subtitle}</Text>}
                </View>
            </View>
            <View style={[styles.cardIndicator, { backgroundColor: color }]} />
        </TouchableOpacity>
    );
};

export default function EventDashboardScreen() {
    const { id: eventId } = useLocalSearchParams();
    const [event, setEvent] = useState<Event | null>(null);
    const [fadeAnim] = useState(new Animated.Value(0));

    interface PaymentStatus {
        totalPaid: number;
        totalPending: number;
        guests: {
            paid: number;
            pending: number;
        };
    }

    const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | null>(null);
    const [attendanceStats, setAttendanceStats] = useState({
        confirmed: 0,
        pending: 0,
        declined: 0,
        total: 0,
    });
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState('');
    const [paymentHistory, setPaymentHistory] = useState([]);
    const [token, setToken] = useState<string | null>(null);

    const screenWidth = Dimensions.get('window').width - 40;

    // Animación de entrada
    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
        }).start();
    }, []);

    // Obtener datos del evento y estadísticas
    const loadDashboardData = useCallback(async () => {
        try {
            setError('');

            const userToken = await AsyncStorage.getItem('userToken');
            setToken(userToken);

            if (!userToken || !eventId) {
                setError('No se pudo obtener la información necesaria');
                return;
            }

            // Obtener detalles del evento
            const eventData: any = await eventService.getEventById(userToken, eventId.toString());

            if ('error' in eventData) {
                setError('Error al cargar la información del evento');
                return;
            }


            setEvent(eventData.data);

            // Calcular estadísticas de asistencia
            const invitados = eventData.data.invitados || [];

            const stats = {
                confirmed: invitados.filter((i: any) => i.status === 'confirmed').length,
                pending: invitados.filter((i: any) => i.status === 'pending').length,
                declined: invitados.filter((i: any) => i.status === 'declined').length,
                total: invitados.length,
            };

            setAttendanceStats(stats);

            // Obtener estado de pagos si el evento requiere pago
            if (eventData.data.requiresPayment) {
                const payments: any = await paymentService.getEventPaymentStatus(userToken, eventId.toString());
                setPaymentStatus(payments);

                // Obtener historial de pagos
                const history: any = await paymentService.getEventPaymentHistory(userToken, eventId.toString());
                setPaymentHistory(history);
            }

        } catch (error) {
            console.error('Error al cargar datos del dashboard:', error);
            setError('Error al cargar la información del evento');
        } finally {
            setLoading(false);
        }
    }, [eventId]);

    // Cargar datos al enfocar la pantalla
    useFocusEffect(
        useCallback(() => {
            loadDashboardData();
        }, [loadDashboardData])
    );

    // Refrescar manualmente
    const handleRefresh = async () => {
        setRefreshing(true);
        await loadDashboardData();
        setRefreshing(false);
    };

    // Navegar a la gestión de invitados
    const navigateToGuests = () => {
        router.push(`/event/${eventId}/guests`);
    };

    // Datos para el gráfico de asistencia
    const getAttendanceChartData = () => {
        const { confirmed, pending, declined } = attendanceStats;

        return [
            {
                name: 'Confirmados',
                population: confirmed,
                color: '#28a745',
                legendFontColor: '#7F7F7F',
                legendFontSize: 12,
            },
            {
                name: 'Pendientes',
                population: pending,
                color: '#ffc107',
                legendFontColor: '#7F7F7F',
                legendFontSize: 12,
            },
            {
                name: 'Rechazados',
                population: declined,
                color: '#dc3545',
                legendFontColor: '#7F7F7F',
                legendFontSize: 12,
            },
        ];
    };

    // Datos para el gráfico de pagos
    const getPaymentChartData = () => {
        if (!paymentStatus) return {
            labels: [],
            datasets: [
                {
                    data: [],
                    color: (opacity = 1) => `rgba(106, 13, 173, ${opacity})`,
                    strokeWidth: 2,
                },
            ],
        };

        const { totalPaid, totalPending } = paymentStatus;
        const labels: any = [];
        const data: any = [];

        // Convertir historial de pagos a datos para el gráfico
        // Agrupar por fecha y sumar montos
        const dateGroups: { [key: string]: number } = {};
        paymentHistory.forEach((payment: any) => {
            const date = new Date(payment.createdAt).toLocaleDateString();
            if (!dateGroups[date]) {
                dateGroups[date] = 0;
            }
            if (payment.status === 'succeeded') {
                dateGroups[date] += payment.amount;
            }
        });

        // Convertir a arrays para el gráfico
        Object.keys(dateGroups).forEach(date => {
            labels.push(date);
            data.push(dateGroups[date]);
        });

        return {
            labels,
            datasets: [
                {
                    data,
                    color: (opacity = 1) => `rgba(106, 13, 173, ${opacity})`,
                    strokeWidth: 2,
                },
            ],
        };
    };

    // Función para obtener color de estado
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return '#28a745';
            case 'completed': return '#6c757d';
            case 'cancelled': return '#dc3545';
            case 'draft': return '#ffc107';
            default: return '#6a0dad';
        }
    };

    if (loading && !refreshing) {
        return (
            <View style={styles.loadingContainer}>
                <StatusBar barStyle="light-content" backgroundColor="#6a0dad" />
                <ActivityIndicator size="large" color="#6a0dad" />
                <Text style={styles.loadingText}>Cargando dashboard...</Text>
            </View>
        );
    }

    return (
        <>
            <Stack.Screen
                options={{
                    headerTitle: 'Dashboard',
                    headerShown: true,
                    headerTitleStyle: { fontWeight: 'bold' },
                    headerTintColor: '#fff',
                    headerStyle: {
                        backgroundColor: '#6a0dad',
                    }
                }}
            />

            <Animated.ScrollView
                style={[styles.container, { opacity: fadeAnim }]}
                contentContainerStyle={styles.contentContainer}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        colors={['#6a0dad']}
                        tintColor="#6a0dad"
                    />
                }
            >
                <StatusBar barStyle="light-content" backgroundColor="#6a0dad" />

                {error ? (
                    <View style={styles.errorContainer}>
                        <Ionicons name="alert-circle" size={24} color="#ff4646" />
                        <Text style={styles.errorText}>{error}</Text>
                    </View>
                ) : null}

                {/* Información general del evento */}
                {event && (
                    <View style={styles.eventInfoCard}>
                        <LinearGradient
                            colors={['#6a0dad', '#8e44ad']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.eventHeaderGradient}
                        >
                            <Text style={styles.eventName}>{event.nombre}</Text>
                            <View style={[
                                styles.statusBadge,
                                { backgroundColor: getStatusColor(event.status) }
                            ]}>
                                <Text style={styles.statusBadgeText}>{event.status.toUpperCase()}</Text>
                            </View>
                        </LinearGradient>

                        <View style={styles.eventDetailsContainer}>
                            <View style={styles.eventDetail}>
                                <View style={styles.eventDetailIconContainer}>
                                    <Ionicons name="calendar" size={18} color="#6a0dad" />
                                </View>
                                <Text style={styles.eventDetailText}>
                                    {new Date(event.fechaInicio).toLocaleDateString()}
                                </Text>
                            </View>

                            <View style={styles.eventDetail}>
                                <View style={styles.eventDetailIconContainer}>
                                    <Ionicons name="location" size={18} color="#6a0dad" />
                                </View>
                                <Text style={styles.eventDetailText}>
                                    {event.ubicacion.address}
                                </Text>
                            </View>
                        </View>
                    </View>
                )}

                {/* Estadísticas de invitados */}
                <View style={styles.sectionContainer}>
                    <Text style={styles.sectionTitle}>
                        Estadísticas de Invitados
                    </Text>

                    <View style={styles.cardsGrid}>
                        <StatCard
                            title="Total Invitados"
                            value={attendanceStats.total.toString()}
                            icon="people"
                            color="#6a0dad"
                            onPress={navigateToGuests}
                        />

                        <StatCard
                            title="Confirmados"
                            value={attendanceStats.confirmed.toString()}
                            icon="checkmark-circle"
                            color="#28a745"
                            subtitle={`${Math.round((attendanceStats.confirmed / (attendanceStats.total || 1)) * 100)}%`}
                            onPress={navigateToGuests}
                        />

                        <StatCard
                            title="Pendientes"
                            value={attendanceStats.pending.toString()}
                            icon="time"
                            color="#ffc107"
                            subtitle={`${Math.round((attendanceStats.pending / (attendanceStats.total || 1)) * 100)}%`}
                            onPress={navigateToGuests}
                        />

                        <StatCard
                            title="Rechazados"
                            value={attendanceStats.declined.toString()}
                            icon="close-circle"
                            color="#dc3545"
                            subtitle={`${Math.round((attendanceStats.declined / (attendanceStats.total || 1)) * 100)}%`}
                            onPress={navigateToGuests}
                        />
                    </View>

                    {/* Gráfico de asistencia */}
                    {attendanceStats.total > 0 && (
                        <View style={styles.chartContainer}>
                            <Text style={styles.chartTitle}>Distribución de Invitados</Text>
                            <PieChart
                                data={getAttendanceChartData()}
                                width={screenWidth}
                                height={200}
                                chartConfig={{
                                    backgroundColor: '#ffffff',
                                    backgroundGradientFrom: '#ffffff',
                                    backgroundGradientTo: '#ffffff',
                                    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                                }}
                                accessor="population"
                                backgroundColor="transparent"
                                paddingLeft="15"
                                absolute
                            />
                        </View>
                    )}
                </View>

                {/* Estadísticas de pagos (si aplica) */}
                {event && event.requiresPayment && paymentStatus && (
                    <View style={styles.sectionContainer}>
                        <Text style={styles.sectionTitle}>
                            Estadísticas de Pagos
                        </Text>

                        <View style={styles.cardsGrid}>
                            <StatCard
                                title="Total Recaudado"
                                value={`$${paymentStatus.totalPaid.toLocaleString()}`}
                                icon="cash"
                                color="#28a745"
                            />

                            <StatCard
                                title="Pendiente por Cobrar"
                                value={`$${paymentStatus.totalPending.toLocaleString()}`}
                                icon="alert-circle"
                                color="#ffc107"
                            />

                            <StatCard
                                title="Invitados Pagados"
                                value={paymentStatus.guests.paid.toString()}
                                icon="checkmark-done"
                                color="#28a745"
                                subtitle={`${Math.round((paymentStatus.guests.paid / (attendanceStats.total || 1)) * 100)}%`}
                                onPress={navigateToGuests}
                            />

                            <StatCard
                                title="Invitados sin Pagar"
                                value={paymentStatus.guests.pending.toString()}
                                icon="wallet"
                                color="#dc3545"
                                subtitle={`${Math.round((paymentStatus.guests.pending / (attendanceStats.total || 1)) * 100)}%`}
                                onPress={navigateToGuests}
                            />
                        </View>

                        {/* Gráfico de pagos */}
                        {paymentHistory.length > 0 && (
                            <View style={styles.chartContainer}>
                                <Text style={styles.chartTitle}>Evolución de Pagos</Text>
                                <LineChart
                                    data={getPaymentChartData()}
                                    width={screenWidth}
                                    height={220}
                                    chartConfig={{
                                        backgroundColor: '#ffffff',
                                        backgroundGradientFrom: '#ffffff',
                                        backgroundGradientTo: '#ffffff',
                                        decimalPlaces: 0,
                                        color: (opacity = 1) => `rgba(106, 13, 173, ${opacity})`,
                                        labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                                        style: { borderRadius: 16 },
                                        propsForDots: {
                                            r: '6',
                                            strokeWidth: '2',
                                            stroke: '#6a0dad',
                                        },
                                    }}
                                    bezier
                                    style={{ marginVertical: 8, borderRadius: 16 }}
                                />
                            </View>
                        )}
                    </View>
                )}

                {/* Acciones rápidas */}
                <View style={styles.sectionContainer}>
                    <Text style={styles.sectionTitle}>Acciones Rápidas</Text>

                    <View style={styles.actionButtonsContainer}>
                        <ActionButton
                            icon="people"
                            title="Gestionar invitados"
                            onPress={() => navigateToGuests()}
                            color="#17a2b8"
                        />

                        <ActionButton
                            icon="create"
                            title="Detalles del evento"
                            onPress={() => router.push(`/event/${eventId}`)}
                            color="#17a2b8"
                        />

                        {event && event.requiresPayment && (
                            <ActionButton
                                icon="notifications"
                                title="Recordar Pagos"
                                onPress={() => {
                                    // Implementar lógica para enviar recordatorios de pago
                                    Alert.alert(
                                        'Recordatorio de Pago',
                                        '¿Deseas enviar un recordatorio de pago a todos los invitados pendientes?',
                                        [
                                            { text: 'Cancelar', style: 'cancel' },
                                            {
                                                text: 'Enviar',
                                                onPress: async () => {
                                                    // Implementar el envío de recordatorios
                                                    Alert.alert('Éxito', 'Recordatorios enviados correctamente');
                                                }
                                            }
                                        ]
                                    );
                                }}
                                color="#17a2b8"
                            />
                        )}
                    </View>
                </View>
            </Animated.ScrollView>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    contentContainer: {
        padding: 15,
        paddingBottom: 30,
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
        color: '#6a0dad',
        fontWeight: '500',
    },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ffebee',
        padding: 12,
        borderRadius: 10,
        marginBottom: 15,
    },
    errorText: {
        color: '#ff4646',
        marginLeft: 10,
        fontSize: 14,
        flex: 1,
    },
    eventInfoCard: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        marginBottom: 20,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 3,
    },
    eventHeaderGradient: {
        padding: 15,
        paddingTop: 20,
        paddingBottom: 20,
        position: 'relative',
    },
    eventName: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#ffffff',
        marginBottom: 5,
        paddingRight: 80, // Espacio para el badge
    },
    eventDetailsContainer: {
        padding: 15,
    },
    eventDetail: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    eventDetailIconContainer: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(106, 13, 173, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    eventDetailText: {
        fontSize: 14,
        color: '#555',
    },
    statusBadge: {
        position: 'absolute',
        top: 15,
        right: 15,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    statusBadgeText: {
        color: '#ffffff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    sectionContainer: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 20,
    },
    cardsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    card: {
        width: '48%',
        backgroundColor: '#ffffff',
        borderRadius: 12,
        padding: 15,
        marginBottom: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
        position: 'relative',
        overflow: 'hidden',
    },
    cardContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    cardIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    cardTextContainer: {
        flex: 1,
    },
    cardTitle: {
        fontSize: 12,
        color: '#666',
        marginBottom: 2,
    },
    cardValue: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    cardSubtitle: {
        fontSize: 12,
        color: '#888',
        marginTop: 2,
    },
    cardIndicator: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: 4,
        borderTopLeftRadius: 12,
        borderBottomLeftRadius: 12,
    },
    chartContainer: {
        marginTop: 15,
        paddingTop: 15,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
    },
    chartTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 15,
        textAlign: 'center',
    },
    actionButtonsContainer: {
        flexDirection: 'column',
        gap: 12,
    },
});