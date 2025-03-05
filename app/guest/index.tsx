// app/payment/[id].tsx - Pantalla de pago para invitados
import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    View,
    Text,
    ScrollView,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    Image,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { eventService } from '@/services/event.service';
import { paymentService, PaymentMethod } from '@/services/payment.service';

// Componente para método de pago
const PaymentMethodItem = ({
    method,
    selected,
    onSelect
}: {
    method: PaymentMethod;
    selected: boolean;
    onSelect: () => void;
}) => (
    <TouchableOpacity
        style={[styles.paymentMethodItem, selected && styles.selectedPaymentMethod]}
        onPress={onSelect}
    >
        <View style={styles.paymentMethodIcon}>
            {method.type === 'card' ? (
                <Ionicons name="card-outline" size={24} color="rgb(71, 25, 82)" />
            ) : method.type === 'transfer' ? (
                <Ionicons name="swap-horizontal-outline" size={24} color="rgb(71, 25, 82)" />
            ) : (
                <Ionicons name="cash-outline" size={24} color="rgb(71, 25, 82)" />
            )}
        </View>
        <View style={styles.paymentMethodInfo}>
            <Text style={styles.paymentMethodTitle}>
                {method.type === 'card'
                    ? `${method.brand} **** ${method.last4}`
                    : method.type === 'transfer'
                        ? 'Transferencia bancaria'
                        : 'Efectivo'}
            </Text>
            {method.name && <Text style={styles.paymentMethodSubtitle}>{method.name}</Text>}
        </View>
        <View style={styles.paymentMethodRadio}>
            <View style={[styles.radioOuter, selected && styles.radioOuterSelected]}>
                {selected && <View style={styles.radioInner} />}
            </View>
        </View>
    </TouchableOpacity>
);

// Pantalla principal de pago
export default function GuestPaymentScreen() {
    const { id: eventId, phone: guestPhone } = useLocalSearchParams();
    const [event, setEvent] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [processingPayment, setProcessingPayment] = useState(false);
    const [error, setError] = useState('');
    const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null);
    const [showAddCard, setShowAddCard] = useState(false);
    const [newCard, setNewCard] = useState({
        number: '',
        expMonth: '',
        expYear: '',
        cvc: '',
        name: '',
    });
    const [token, setToken] = useState<string | null>(null);

    // Cargar datos del evento y métodos de pago disponibles
    useEffect(() => {
        const loadData = async () => {
            try {
                const userToken = await AsyncStorage.getItem('userToken');
                setToken(userToken);

                if (!eventId) {
                    setError('ID de evento no proporcionado');
                    setLoading(false);
                    return;
                }

                if (userToken) {
                    // Cargar información del evento
                    const eventData: any = await eventService.getEventById(userToken, eventId as string);
                    setEvent(eventData.data);

                    // Cargar métodos de pago del usuario
                    const methods = await paymentService.getPaymentMethods(userToken);
                    setPaymentMethods(methods);

                    // Seleccionar método de pago por defecto si existe
                    const defaultMethod = methods.find(m => m.isDefault);
                    if (defaultMethod) {
                        setSelectedPaymentMethod(defaultMethod.id);
                    }
                } else {
                    setError('Usuario no autenticado');
                }
            } catch (error: any) {
                console.error('Error al cargar datos:', error);
                setError(error.message || 'Error al cargar datos');
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [eventId]);

    // Procesar el pago
    const handlePayment = async () => {
        if (!selectedPaymentMethod) {
            Alert.alert('Error', 'Por favor selecciona un método de pago');
            return;
        }

        if (!event || !event.cuotaAmount) {
            Alert.alert('Error', 'Información del evento incompleta');
            return;
        }

        if (!token) {
            Alert.alert('Error', 'Usuario no autenticado');
            return;
        }

        try {
            setProcessingPayment(true);
            setError('');

            // Crear intención de pago
            const paymentIntent = await paymentService.createPaymentIntent(
                token,
                eventId as string,
                event.cuotaAmount,
                selectedPaymentMethod
            );

            // Confirmar el pago
            const confirmedPayment = await paymentService.confirmPayment(
                token,
                paymentIntent.id,
                selectedPaymentMethod
            );

            if (confirmedPayment.status === 'succeeded') {
                Alert.alert(
                    '¡Pago Exitoso!',
                    'Tu pago ha sido procesado correctamente.',
                    [{ text: 'OK', onPress: () => { } }]
                );
            } else {
                throw new Error('El pago no pudo ser procesado');
            }
        } catch (error: any) {
            console.error('Error al procesar pago:', error);
            setError(error.message || 'Error al procesar el pago');
            Alert.alert('Error', error.message || 'Error al procesar el pago');
        } finally {
            setProcessingPayment(false);
        }
    };

    // Agregar una nueva tarjeta
    const handleAddCard = async () => {
        const { number, expMonth, expYear, cvc, name } = newCard;

        if (!number || !expMonth || !expYear || !cvc || !name) {
            Alert.alert('Error', 'Por favor completa todos los campos');
            return;
        }

        if (!token) {
            Alert.alert('Error', 'Usuario no autenticado');
            return;
        }

        try {
            setProcessingPayment(true);
            setError('');

            // Ejemplo de datos para crear un nuevo método de pago (esto normalmente sería procesado por una librería como Stripe)
            const paymentMethodData = {
                type: 'card',
                card: {
                    number,
                    exp_month: expMonth,
                    exp_year: expYear,
                    cvc,
                },
                billing_details: {
                    name,
                },
            };

            // Añadir nuevo método de pago
            const newPaymentMethod = await paymentService.addPaymentMethod(token, paymentMethodData);

            // Actualizar lista de métodos de pago y seleccionar el nuevo
            setPaymentMethods(prev => [...prev, newPaymentMethod]);
            setSelectedPaymentMethod(newPaymentMethod.id);
            setShowAddCard(false);
            setNewCard({
                number: '',
                expMonth: '',
                expYear: '',
                cvc: '',
                name: '',
            });

            Alert.alert('Éxito', 'Tarjeta agregada correctamente');
        } catch (error: any) {
            console.error('Error al agregar tarjeta:', error);
            setError(error.message || 'Error al agregar tarjeta');
            Alert.alert('Error', error.message || 'Error al agregar tarjeta');
        } finally {
            setProcessingPayment(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="rgb(51, 18, 59)" />
                <Text style={styles.loadingText}>Cargando información del pago...</Text>
            </View>
        );
    }

    return (
        <>
            <Stack.Screen
                options={{
                    headerTitle: 'Pago de Cuota',
                    headerShown: true,
                    headerTintColor: 'rgb(51, 18, 59)',
                }}
            />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={styles.container}
            >
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    {error ? <Text style={styles.errorText}>{error}</Text> : null}

                    {/* Información del evento */}
                    {event && (
                        <View style={styles.eventCard}>
                            <View style={styles.eventHeader}>
                                <Text style={styles.eventTitle}>{event.nombre}</Text>
                                {event.imagen && (
                                    <Image
                                        source={{ uri: event.imagen }}
                                        style={styles.eventImage}
                                        resizeMode="cover"
                                    />
                                )}
                            </View>

                            <View style={styles.eventDetails}>
                                <View style={styles.detailRow}>
                                    <Ionicons name="calendar" size={20} color="rgb(71, 25, 82)" />
                                    <Text style={styles.detailText}>
                                        {new Date(event.fechaInicio).toLocaleDateString()}
                                    </Text>
                                </View>

                                <View style={styles.detailRow}>
                                    <Ionicons name="location" size={20} color="rgb(71, 25, 82)" />
                                    <Text style={styles.detailText}>{event.ubicacion.address}</Text>
                                </View>

                                <View style={styles.detailRow}>
                                    <Ionicons name="person" size={20} color="rgb(71, 25, 82)" />
                                    <Text style={styles.detailText}>
                                        Invitado: {guestPhone || 'Invitado'}
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.paymentAmount}>
                                <Text style={styles.paymentLabel}>Monto a pagar:</Text>
                                <Text style={styles.paymentValue}>
                                    ${event.cuotaAmount?.toLocaleString() || '0'}
                                </Text>
                            </View>
                        </View>
                    )}

                    {/* Métodos de pago */}
                    <View style={styles.sectionContainer}>
                        <Text style={styles.sectionTitle}>Método de Pago</Text>

                        {paymentMethods.map(method => (
                            <PaymentMethodItem
                                key={method.id}
                                method={method}
                                selected={selectedPaymentMethod === method.id}
                                onSelect={() => setSelectedPaymentMethod(method.id)}
                            />
                        ))}

                        {/* Botón para agregar nueva tarjeta */}
                        <TouchableOpacity
                            style={styles.addPaymentMethodButton}
                            onPress={() => setShowAddCard(!showAddCard)}
                        >
                            <Ionicons name={showAddCard ? 'remove' : 'add'} size={20} color="rgb(71, 25, 82)" />
                            <Text style={styles.addPaymentMethodText}>
                                {showAddCard ? 'Cancelar' : 'Agregar nueva tarjeta'}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Formulario para agregar tarjeta */}
                    {showAddCard && (
                        <View style={styles.cardFormContainer}>
                            <Text style={styles.cardFormTitle}>Nueva Tarjeta</Text>

                            <TextInput
                                style={styles.input}
                                placeholder="Número de tarjeta"
                                value={newCard.number}
                                onChangeText={(text) => setNewCard({ ...newCard, number: text })}
                                keyboardType="number-pad"
                                maxLength={16}
                            />

                            <View style={styles.row}>
                                <TextInput
                                    style={[styles.input, styles.inputSmall]}
                                    placeholder="MM"
                                    value={newCard.expMonth}
                                    onChangeText={(text) => setNewCard({ ...newCard, expMonth: text })}
                                    keyboardType="number-pad"
                                    maxLength={2}
                                />
                                <TextInput
                                    style={[styles.input, styles.inputSmall]}
                                    placeholder="AA"
                                    value={newCard.expYear}
                                    onChangeText={(text) => setNewCard({ ...newCard, expYear: text })}
                                    keyboardType="number-pad"
                                    maxLength={2}
                                />
                                <TextInput
                                    style={[styles.input, styles.inputSmall]}
                                    placeholder="CVC"
                                    value={newCard.cvc}
                                    onChangeText={(text) => setNewCard({ ...newCard, cvc: text })}
                                    keyboardType="number-pad"
                                    maxLength={4}
                                    secureTextEntry
                                />
                            </View>

                            <TextInput
                                style={styles.input}
                                placeholder="Nombre en la tarjeta"
                                value={newCard.name}
                                onChangeText={(text) => setNewCard({ ...newCard, name: text })}
                            />

                            <TouchableOpacity
                                style={[styles.button, { marginTop: 10 }]}
                                onPress={handleAddCard}
                                disabled={processingPayment}
                            >
                                {processingPayment ? (
                                    <ActivityIndicator size="small" color="#ffffff" />
                                ) : (
                                    <Text style={styles.buttonText}>Agregar Tarjeta</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Botón para realizar el pago */}
                    <TouchableOpacity
                        style={[styles.payButton, !selectedPaymentMethod && styles.payButtonDisabled]}
                        onPress={handlePayment}
                        disabled={!selectedPaymentMethod || processingPayment}
                    >
                        {processingPayment ? (
                            <ActivityIndicator size="small" color="#ffffff" />
                        ) : (
                            <>
                                <Ionicons name="checkmark-circle" size={20} color="#fff" />
                                <Text style={styles.payButtonText}>Realizar Pago</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    scrollContent: {
        padding: 15,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 10,
        color: 'rgb(71, 25, 82)',
        fontSize: 16,
    },
    errorText: {
        color: '#ff4646',
        marginVertical: 15,
        textAlign: 'center',
    },
    eventCard: {
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
    eventHeader: {
        marginBottom: 15,
    },
    eventTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: 'rgb(51, 18, 59)',
        marginBottom: 10,
    },
    eventImage: {
        width: '100%',
        height: 150,
        borderRadius: 8,
    },
    eventDetails: {
        marginBottom: 15,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    detailText: {
        marginLeft: 10,
        fontSize: 15,
        color: '#333',
    },
    paymentAmount: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 15,
        borderTopWidth: 1,
        borderTopColor: '#eee',
    },
    paymentLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    paymentValue: {
        fontSize: 22,
        fontWeight: 'bold',
        color: 'rgb(51, 18, 59)',
    },
    sectionContainer: {
        backgroundColor: '#ffffff',
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
    paymentMethodItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 10,
        borderWidth: 1,
        borderColor: '#eee',
        borderRadius: 8,
        marginBottom: 10,
    },
    selectedPaymentMethod: {
        borderColor: 'rgb(71, 25, 82)',
        backgroundColor: 'rgba(71, 25, 82, 0.05)',
    },
    paymentMethodIcon: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(71, 25, 82, 0.1)',
        borderRadius: 20,
        marginRight: 10,
    },
    paymentMethodInfo: {
        flex: 1,
    },
    paymentMethodTitle: {
        fontSize: 16,
        fontWeight: '500',
        color: '#333',
    },
    paymentMethodSubtitle: {
        fontSize: 14,
        color: '#666',
    },
    paymentMethodRadio: {
        width: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    radioOuter: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: '#ccc',
        justifyContent: 'center',
        alignItems: 'center',
    },
    radioOuterSelected: {
        borderColor: 'rgb(71, 25, 82)',
    },
    radioInner: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: 'rgb(71, 25, 82)',
    },
    addPaymentMethodButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        justifyContent: 'center',
    },
    addPaymentMethodText: {
        marginLeft: 8,
        fontSize: 16,
        color: 'rgb(71, 25, 82)',
        fontWeight: '500',
    },
    cardFormContainer: {
        backgroundColor: '#ffffff',
        borderRadius: 10,
        padding: 15,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#eee',
    },
    cardFormTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 15,
        color: 'rgb(51, 18, 59)',
    },
    input: {
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        marginBottom: 10,
        fontSize: 16,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    inputSmall: {
        flex: 1,
        marginHorizontal: 5,
    },
    button: {
        backgroundColor: 'rgb(51, 18, 59)',
        borderRadius: 8,
        paddingVertical: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    payButton: {
        backgroundColor: 'rgb(51, 18, 59)',
        borderRadius: 10,
        paddingVertical: 15,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 30,
    },
    payButtonDisabled: {
        backgroundColor: '#ccc',
    },
    payButtonText: {
        color: '#ffffff',
        fontSize: 18,
        fontWeight: 'bold',
        marginLeft: 8,
    },
});