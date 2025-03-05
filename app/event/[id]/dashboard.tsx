// app/event/[id]/dashboard.tsx - Dashboard para organizadores
import React, { useState, useEffect, useCallback } from 'react';
import {
    StyleSheet,
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    Dimensions,
    Alert,
} from 'react-native';
import { useLocalSearchParams, Stack, useFocusEffect, router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { Event, eventService } from '@/services/event.service';
import { paymentService } from '@/services/payment.service';
import { LineChart, PieChart } from 'react-native-chart-kit';

// Componente para una tarjeta de estadísticas
const StatCard = ({ title, value, icon, color, subtitle, onPress }: any) => (
    <TouchableOpacity
        style={[styles.card, { borderLeftColor: color, borderLeftWidth: 5 }]}
        onPress={onPress}
        disabled={!onPress}
    >
        <View style={styles.cardContent}>
            <View style={styles.cardIconContainer}>
                <Ionicons name={icon} size={24} color={color} />
            </View>
            <View style={styles.cardTextContainer}>
                <Text style={styles.cardTitle}>{title}</Text>
                <Text style={[styles.cardValue, { color }]}>{value}</Text>
                {subtitle && <Text style={styles.cardSubtitle}>{subtitle}</Text>}
            </View>
        </View>
    </TouchableOpacity>
);

export default function EventDashboardScreen() {
    const { id: eventId } = useLocalSearchParams();
    const [event, setEvent] = useState<Event | null>(null);
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
                    color: (opacity = 1) => `rgba(71, 25, 82, ${opacity})`,
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
                    color: (opacity = 1) => `rgba(71, 25, 82, ${opacity})`,
                    strokeWidth: 2,
                },
            ],
        };
    };

    if (loading && !refreshing) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="rgb(51, 18, 59)" />
                <Text style={styles.loadingText}>Cargando dashboard...</Text>
            </View>
        );
    }

    return (
        <>
            <Stack.Screen
                options={{
                    headerTitle: 'Dashboard del Evento',
                    headerShown: true,
                    headerTintColor: 'rgb(51, 18, 59)',
                }}
            />

            <ScrollView
                style={styles.container}
                contentContainerStyle={styles.contentContainer}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
                }
            >
                {error ? <Text style={styles.errorText}>{error}</Text> : null}

                {/* Información general del evento */}
                {event && (
                    <View style={styles.eventInfoCard}>
                        <Text style={styles.eventName}>{event.nombre}</Text>

                        <View style={styles.eventDetail}>
                            <Ionicons name="calendar-outline" size={18} color="rgb(71, 25, 82)" />
                            <Text style={styles.eventDetailText}>
                                {new Date(event.fechaInicio).toLocaleDateString()}
                            </Text>
                        </View>

                        <View style={styles.eventDetail}>
                            <Ionicons name="location-outline" size={18} color="rgb(71, 25, 82)" />
                            <Text style={styles.eventDetailText}>
                                {event.ubicacion.address}
                            </Text>
                        </View>

                        <View style={styles.statusBadge}>
                            <Text style={styles.statusBadgeText}>{event.status.toUpperCase()}</Text>
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
                            icon="people-outline"
                            color="#6c757d"
                            onPress={navigateToGuests}
                        />

                        <StatCard
                            title="Confirmados"
                            value={attendanceStats.confirmed.toString()}
                            icon="checkmark-circle-outline"
                            color="#28a745"
                            subtitle={`${Math.round((attendanceStats.confirmed / (attendanceStats.total || 1)) * 100)}%`}
                            onPress={navigateToGuests}
                        />

                        <StatCard
                            title="Pendientes"
                            value={attendanceStats.pending.toString()}
                            icon="time-outline"
                            color="#ffc107"
                            subtitle={`${Math.round((attendanceStats.pending / (attendanceStats.total || 1)) * 100)}%`}
                            onPress={navigateToGuests}
                        />

                        <StatCard
                            title="Rechazados"
                            value={attendanceStats.declined.toString()}
                            icon="close-circle-outline"
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
                                icon="cash-outline"
                                color="#28a745"
                            />

                            <StatCard
                                title="Pendiente por Cobrar"
                                value={`$${paymentStatus.totalPending.toLocaleString()}`}
                                icon="alert-circle-outline"
                                color="#ffc107"
                            />

                            <StatCard
                                title="Invitados Pagados"
                                value={paymentStatus.guests.paid.toString()}
                                icon="checkmark-done-outline"
                                color="#28a745"
                                subtitle={`${Math.round((paymentStatus.guests.paid / (attendanceStats.total || 1)) * 100)}%`}
                                onPress={navigateToGuests}
                            />

                            <StatCard
                                title="Invitados sin Pagar"
                                value={paymentStatus.guests.pending.toString()}
                                icon="wallet-outline"
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
                                        color: (opacity = 1) => `rgba(71, 25, 82, ${opacity})`,
                                        labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                                        style: { borderRadius: 16 },
                                        propsForDots: {
                                            r: '6',
                                            strokeWidth: '2',
                                            stroke: 'rgb(51, 18, 59)',
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
                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={navigateToGuests}
                        >
                            <View style={[styles.actionButtonIcon, { backgroundColor: 'rgba(71, 25, 82, 0.1)' }]}>
                                <Ionicons name="people" size={24} color="rgb(71, 25, 82)" />
                            </View>
                            <Text style={styles.actionButtonText}>Gestionar Invitados</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={() => router.push(`/event/${eventId}`)}
                        >
                            <View style={[styles.actionButtonIcon, { backgroundColor: 'rgba(23, 162, 184, 0.1)' }]}>
                                <Ionicons name="create" size={24} color="#17a2b8" />
                            </View>
                            <Text style={styles.actionButtonText}>Editar Evento</Text>
                        </TouchableOpacity>

                        {event && event.requiresPayment && (
                            <TouchableOpacity
                                style={styles.actionButton}
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
                            >
                                <View style={[styles.actionButtonIcon, { backgroundColor: 'rgba(255, 193, 7, 0.1)' }]}>
                                    <Ionicons name="notifications" size={24} color="#ffc107" />
                                </View>
                                <Text style={styles.actionButtonText}>Recordar Pagos</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </ScrollView>
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
    },
    eventInfoCard: {
        backgroundColor: '#ffffff',
        borderRadius: 10,
        padding: 15,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#eee',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
        position: 'relative',
    },
    eventName: {
        fontSize: 20,
        fontWeight: 'bold',
        color: 'rgb(51, 18, 59)',
        marginBottom: 10,
        paddingRight: 80, // Espacio para el badge
    },
    eventDetail: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 5,
    },
    eventDetailText: {
        marginLeft: 10,
        fontSize: 14,
        color: '#666',
    },
    statusBadge: {
        position: 'absolute',
        top: 15,
        right: 15,
        backgroundColor: 'rgb(51, 18, 59)',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 15,
    },
    statusBadgeText: {
        color: '#ffffff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    sectionContainer: {
        backgroundColor: '#ffffff',
        borderRadius: 10,
        padding: 15,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#eee',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: 'rgb(51, 18, 59)',
        marginBottom: 15,
    },
    cardsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    card: {
        width: '48%',
        backgroundColor: '#ffffff',
        borderRadius: 8,
        padding: 12,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: '#eee',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 1,
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
        backgroundColor: 'rgba(0, 0, 0, 0.05)',
        marginRight: 10,
    },
    cardTextContainer: {
        flex: 1,
    },
    cardTitle: {
        fontSize: 12,
        color: '#666',
    },
    cardValue: {
        fontSize: 18,
        fontWeight: 'bold',
        marginTop: 2,
    },
    cardSubtitle: {
        fontSize: 12,
        color: '#999',
        marginTop: 2,
    },
    chartContainer: {
        marginTop: 10,
        paddingTop: 15,
        borderTopWidth: 1,
        borderTopColor: '#eee',
    },
    chartTitle: {
        fontSize: 16,
        fontWeight: '500',
        color: '#333',
        marginBottom: 10,
        textAlign: 'center',
    },
    actionButtonsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    actionButton: {
        width: '48%',
        backgroundColor: '#ffffff',
        borderRadius: 8,
        padding: 15,
        marginBottom: 15,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#eee',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 1,
    },
    actionButtonIcon: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
    },
    actionButtonText: {
        fontSize: 14,
        color: '#333',
        textAlign: 'center',
    },
});