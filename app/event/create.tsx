import React, { useState, useCallback, useEffect } from 'react';
import {
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StatusBar,
    View,
    Text,
    Animated,
    Dimensions
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { eventService } from '@/services/event.service';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

// Importamos los componentes separados
import ImageSelector from '@/components/EventForm/ImageSelector';
import EventInfoForm from '@/components/EventForm/EventInfoForm';
import RequerimientosForm from '@/components/EventForm/RequerimientosForm';
import DateTimePickerSection from '@/components/EventForm/DateTimePickerSection';
import MapSection from '@/components/EventForm/MapSection';
import ProductSearchSection from '@/components/EventForm/ProductSearchSection';
import PaymentDetailsSection from '@/components/EventForm/PaymentDetailsSection';
import Footer from '@/components/EventForm/Footer';
import PaymentSwitch from '@/components/EventForm/PaymentSwitch';
import { EventForm } from '@/types/event_types';
import { INITIAL_FORM_STATE } from '@/types/event_types';

const { width } = Dimensions.get('window');

const INITIAL_COORDINATES = {
    latitude: -33.441622,
    longitude: -70.654049,
};

export default function CreateEventScreen() {
    const [form, setForm] = useState<EventForm>(INITIAL_FORM_STATE);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [fadeAnim] = useState(new Animated.Value(0));
    const [slideAnim] = useState(new Animated.Value(30));

    // Steps para el progreso
    const steps = [
        { id: 'info', title: 'Información', icon: 'information-circle-outline' },
        { id: 'details', title: 'Detalles', icon: 'calendar-outline' },
        { id: 'location', title: 'Ubicación', icon: 'location-outline' },
        { id: 'products', title: 'Productos', icon: 'bag-outline' },
        { id: 'payment', title: 'Pago', icon: 'card-outline' },
    ];

    useEffect(() => {
        // Animación de entrada
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 600,
                useNativeDriver: true,
            })
        ]).start();
    }, []);

    const updateForm = useCallback((field: keyof EventForm, value: any) => {
        setForm((prev) => ({ ...prev, [field]: value }));
    }, []);

    useEffect(() => {
        if (form.requiresPayment && (form.productos.length > 0 || parseInt(form.cantidadInvitados) > 0)) {
            const totalProductos = form.productos.reduce((sum, p) => {
                if (p.product && typeof p.product === 'object') {
                    const price = p.product.price || 0;
                    const quantity = p.quantity || 1;
                    return sum + (price * quantity);
                }
                else if (p.price && typeof p.price === 'number') {
                    return sum + (p.price * (p.quantity || 1));
                }
                return sum;
            }, 0);

            const cantidadPersonas = parseInt(form.cantidadInvitados) || 0;
            const cuotaPorPersona = cantidadPersonas > 0 ? totalProductos / cantidadPersonas : 0;
            const cuotaRedondeada = Math.ceil(cuotaPorPersona);

            updateForm('cuotaCalculada', {
                totalProductos,
                cuotaPorPersona,
                cantidadPersonas,
            });

            if (!form.cuotaAmount || form.cuotaAmount === '0' || isNaN(Number(form.cuotaAmount))) {
                updateForm('cuotaAmount', cuotaRedondeada.toString());
            }
        }
    }, [form.productos, form.cantidadInvitados, form.requiresPayment]);

    const handleSubmit = async () => {
        if (!form.nombre.trim()) {
            setError('El nombre del evento es requerido');
            return;
        }
        if (!form.ubicacion.address) {
            setError('La ubicación es requerida');
            return;
        }
        if (!form.tipo) {
            setError('El tipo de evento es requerido');
            return;
        }
        if (form.requiresPayment && (!form.cuotaAmount || parseFloat(form.cuotaAmount) <= 0)) {
            setError('Ingresa un monto válido para la cuota');
            return;
        }

        try {
            setIsLoading(true);
            setError('');
            const token = await AsyncStorage.getItem('userToken');
            if (!token) throw new Error('No hay sesión activa');

            const { productos } = form;

            const productosSinInstanceId = productos.map((producto: any) => {
                const { instanceId, ...resto } = producto;
                return resto;
            })

            const productosTransformados = productosSinInstanceId.map((item: any) => {
                if (item.product) {
                    return item.product;
                }
                return item;
            });

            form.productos = productosTransformados;

            const response = await eventService.createEvent(token, {
                ...form,
                cuotaAmount: form.requiresPayment ? parseFloat(form.cuotaAmount) : 0,
                cantidadInvitados: parseInt(form.cantidadInvitados) || 0,
            });

            if ('success' in response) {
                console.log('Evento creado con éxito!');
                router.push('/event')
            }
        } catch (error: any) {
            setError(error.message || 'Error al crear el evento');
        } finally {
            setIsLoading(false);
        }
    };

    const getCompletionPercentage = () => {
        let completed = 0;
        const total = 8; // Total de campos importantes

        if (form.nombre.trim()) completed++;
        if (form.tipo.trim()) completed++;
        if (form.descripcion.trim()) completed++;
        if (form.fechaInicio) completed++;
        if (form.ubicacion.address) completed++;
        if (form.cantidadInvitados && parseInt(form.cantidadInvitados) > 0) completed++;
        if (form.productos.length > 0) completed++;
        if (!form.requiresPayment || (form.requiresPayment && form.cuotaAmount && parseFloat(form.cuotaAmount) > 0)) completed++;

        return Math.round((completed / total) * 100);
    };

    const renderErrorBanner = () => {
        if (!error) return null;

        return (
            <Animated.View
                style={[
                    styles.errorBanner,
                    { opacity: fadeAnim }
                ]}
            >
                <View style={styles.errorContent}>
                    <Ionicons name="alert-circle-outline" size={20} color="#EF4444" />
                    <Text style={styles.errorText}>{error}</Text>
                    <Text
                        style={styles.errorDismiss}
                        onPress={() => setError('')}
                    >
                        ✕
                    </Text>
                </View>
            </Animated.View>
        );
    };

    return (
        <>
            <StatusBar barStyle="light-content" backgroundColor="#7C3AED" />

            {/* Header */}
            <LinearGradient
                colors={['#8B5CF6', '#7C3AED', '#6D28D9']}
                style={styles.header}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <View style={styles.headerDecorations}>
                    <View style={styles.headerCircle1} />
                    <View style={styles.headerCircle2} />
                    <View style={styles.headerShape} />
                </View>

                <Animated.View
                    style={[
                        styles.headerContent,
                        {
                            opacity: fadeAnim,
                            transform: [{ translateY: slideAnim }]
                        }
                    ]}
                >
                    <View style={styles.headerText}>
                        <Text style={styles.headerTitle}>Crear Evento</Text>
                        <Text style={styles.headerSubtitle}>Organiza algo increíble</Text>
                    </View>
                    <View style={styles.headerIcon}>
                        <Ionicons name="calendar" size={28} color="rgba(255,255,255,0.9)" />
                    </View>
                </Animated.View>
            </LinearGradient>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.container}
            >
                <Animated.ScrollView
                    style={[
                        styles.scrollView,
                        { opacity: fadeAnim }
                    ]}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >

                    {/* Error banner */}
                    {renderErrorBanner()}

                    {/* Form sections */}
                    <View style={styles.formContainer}>
                        {/* Image selector */}
                        <View style={styles.formSection}>
                            <View style={styles.sectionHeader}>
                                <View style={styles.sectionIcon}>
                                    <Ionicons name="image-outline" size={20} color="#8B5CF6" />
                                </View>
                                <Text style={styles.sectionTitle}>Imagen del evento</Text>
                            </View>
                            <ImageSelector
                                image={form.imagen}
                                updateImage={(uri) => updateForm('imagen', uri)}
                                setError={setError}
                            />
                        </View>

                        {/* Event info */}
                        <View style={styles.formSection}>
                            <View style={styles.sectionHeader}>
                                <View style={styles.sectionIcon}>
                                    <Ionicons name="information-circle-outline" size={20} color="#8B5CF6" />
                                </View>
                                <Text style={styles.sectionTitle}>Información básica</Text>
                                <Text style={styles.sectionBadge}>Requerido</Text>
                            </View>
                            <EventInfoForm form={form} updateForm={updateForm} />
                        </View>

                        {/* Requirements */}
                        <View style={styles.formSection}>
                            <View style={styles.sectionHeader}>
                                <View style={styles.sectionIcon}>
                                    <Ionicons name="list-outline" size={20} color="#06B6D4" />
                                </View>
                                <Text style={styles.sectionTitle}>Requerimientos</Text>
                                <Text style={styles.sectionOptional}>Opcional</Text>
                            </View>
                            <RequerimientosForm
                                requerimientos={form.requerimientos}
                                updateForm={updateForm}
                            />
                        </View>

                        {/* Date and time */}
                        <View style={styles.formSection}>
                            <View style={styles.sectionHeader}>
                                <View style={styles.sectionIcon}>
                                    <Ionicons name="calendar-outline" size={20} color="#F59E0B" />
                                </View>
                                <Text style={styles.sectionTitle}>Fecha y hora</Text>
                                <Text style={styles.sectionBadge}>Requerido</Text>
                            </View>
                            <DateTimePickerSection form={form} updateForm={updateForm} />
                        </View>

                        {/* Location */}
                        <View style={styles.formSection}>
                            <View style={styles.sectionHeader}>
                                <View style={styles.sectionIcon}>
                                    <Ionicons name="location-outline" size={20} color="#EF4444" />
                                </View>
                                <Text style={styles.sectionTitle}>Ubicación</Text>
                                <Text style={styles.sectionBadge}>Requerido</Text>
                            </View>
                            <MapSection
                                initialCoordinates={INITIAL_COORDINATES}
                                onLocationSelect={(lat, lng, address) =>
                                    updateForm('ubicacion', {
                                        coordinates: [lat, lng],
                                        address: address || 'Dirección pendiente'
                                    })
                                }
                            />
                        </View>

                        {/* Products */}
                        <View style={styles.formSection}>
                            <View style={styles.sectionHeader}>
                                <View style={styles.sectionIcon}>
                                    <Ionicons name="bag-outline" size={20} color="#8B5CF6" />
                                </View>
                                <Text style={styles.sectionTitle}>Productos y compras</Text>
                                <Text style={styles.sectionOptional}>Opcional</Text>
                            </View>
                            <ProductSearchSection form={form} updateForm={updateForm} setError={setError} />
                        </View>

                        {/* Payment switch */}
                        <View style={styles.formSection}>
                            <View style={styles.sectionHeader}>
                                <View style={styles.sectionIcon}>
                                    <Ionicons name="card-outline" size={20} color="#06B6D4" />
                                </View>
                                <Text style={styles.sectionTitle}>Configuración de pago</Text>
                            </View>
                            <PaymentSwitch
                                requiresPayment={form.requiresPayment}
                                onToggle={(value) => updateForm('requiresPayment', value)}
                            />
                        </View>

                        {/* Payment details */}
                        {form.requiresPayment && (
                            <Animated.View
                                style={[
                                    styles.formSection,
                                    styles.paymentSection
                                ]}
                            >
                                <View style={styles.sectionHeader}>
                                    <View style={styles.sectionIcon}>
                                        <Ionicons name="cash-outline" size={20} color="#8B5CF6" />
                                    </View>
                                    <Text style={styles.sectionTitle}>Detalles del pago</Text>
                                    <Text style={styles.sectionBadge}>Requerido</Text>
                                </View>
                                <PaymentDetailsSection form={form} updateForm={updateForm} />
                            </Animated.View>
                        )}

                        {/* Summary card */}
                        <View style={styles.summaryCard}>
                            <View style={styles.summaryHeader}>
                                <Ionicons name="document-text-outline" size={24} color="#8B5CF6" />
                                <Text style={styles.summaryTitle}>Resumen del evento</Text>
                            </View>

                            <View style={styles.summaryContent}>
                                <View style={styles.summaryItem}>
                                    <Text style={styles.summaryLabel}>Nombre:</Text>
                                    <Text style={styles.summaryValue}>
                                        {form.nombre || 'Sin definir'}
                                    </Text>
                                </View>

                                <View style={styles.summaryItem}>
                                    <Text style={styles.summaryLabel}>Fecha:</Text>
                                    <Text style={styles.summaryValue}>
                                        {form.fechaInicio ?
                                            new Date(form.fechaInicio).toLocaleDateString('es-ES') :
                                            'Sin definir'
                                        }
                                    </Text>
                                </View>

                                <View style={styles.summaryItem}>
                                    <Text style={styles.summaryLabel}>Invitados:</Text>
                                    <Text style={styles.summaryValue}>
                                        {form.cantidadInvitados || '0'} personas
                                    </Text>
                                </View>

                                <View style={styles.summaryItem}>
                                    <Text style={styles.summaryLabel}>Productos:</Text>
                                    <Text style={styles.summaryValue}>
                                        {form.productos.length} items seleccionados
                                    </Text>
                                </View>

                                {form.requiresPayment && (
                                    <View style={styles.summaryItem}>
                                        <Text style={styles.summaryLabel}>Cuota:</Text>
                                        <Text style={[styles.summaryValue, styles.summaryPrice]}>
                                            ${form.cuotaAmount || '0'} por persona
                                        </Text>
                                    </View>
                                )}
                            </View>
                        </View>
                    </View>

                    {/* Footer */}
                    <Footer onSubmit={handleSubmit} isLoading={isLoading} />
                </Animated.ScrollView>
            </KeyboardAvoidingView>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FAFAF9',
    },
    header: {
        paddingTop: 50,
        paddingBottom: 32,
        position: 'relative',
        overflow: 'hidden',
    },
    headerDecorations: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    headerCircle1: {
        position: 'absolute',
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        top: -30,
        right: -20,
    },
    headerCircle2: {
        position: 'absolute',
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        bottom: -20,
        left: -10,
    },
    headerShape: {
        position: 'absolute',
        width: 60,
        height: 60,
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        transform: [{ rotate: '45deg' }],
        top: 60,
        left: width - 40,
    },
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        zIndex: 1,
    },
    headerText: {
        flex: 1,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '800',
        color: '#FFFFFF',
        marginBottom: 2,
    },
    headerSubtitle: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.8)',
        fontWeight: '500',
    },
    headerIcon: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 40,
    },

    // Progress
    progressContainer: {
        backgroundColor: '#FFFFFF',
        margin: 20,
        marginTop: 16,
        borderRadius: 16,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
    },
    progressHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    progressTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
    },
    progressPercentage: {
        fontSize: 16,
        fontWeight: '700',
        color: '#8B5CF6',
    },
    progressBarBackground: {
        height: 8,
        backgroundColor: '#F3F4F6',
        borderRadius: 4,
        overflow: 'hidden',
        marginBottom: 16,
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 4,
    },
    progressGradient: {
        flex: 1,
    },
    progressSteps: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    progressStep: {
        alignItems: 'center',
        flex: 1,
    },
    progressStepIcon: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 4,
    },
    progressStepIconCompleted: {
        backgroundColor: '#8B5CF6',
    },
    progressStepText: {
        fontSize: 11,
        color: '#6B7280',
        fontWeight: '500',
        textAlign: 'center',
    },
    progressStepTextCompleted: {
        color: '#8B5CF6',
        fontWeight: '600',
    },

    // Error
    errorBanner: {
        marginHorizontal: 20,
        marginBottom: 16,
    },
    errorContent: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FEF2F2',
        borderWidth: 1,
        borderColor: '#FECACA',
        borderRadius: 12,
        padding: 16,
        gap: 8,
    },
    errorText: {
        flex: 1,
        color: '#EF4444',
        fontSize: 14,
        fontWeight: '500',
    },
    errorDismiss: {
        color: '#EF4444',
        fontSize: 16,
        fontWeight: '700',
        paddingHorizontal: 8,
    },

    // Form
    formContainer: {
        paddingHorizontal: 20,
        gap: 24,
    },
    formSection: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
    },
    paymentSection: {
        borderWidth: 2,
        borderColor: '#C4B5FD',
        backgroundColor: '#FDFBFF',
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        gap: 8,
    },
    sectionIcon: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#F9FAFB',
        justifyContent: 'center',
        alignItems: 'center',
    },
    sectionTitle: {
        flex: 1,
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
    },
    sectionBadge: {
        backgroundColor: '#EF4444',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
        fontSize: 10,
        color: '#FFFFFF',
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    sectionOptional: {
        backgroundColor: '#F3F4F6',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
        fontSize: 10,
        color: '#6B7280',
        fontWeight: '700',
        textTransform: 'uppercase',
    },

    // Summary
    summaryCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 24,
        marginTop: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 6,
        borderWidth: 2,
        borderColor: '#E5E7EB',
    },
    summaryHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        gap: 12,
    },
    summaryTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
    },
    summaryContent: {
        gap: 12,
    },
    summaryItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 4,
    },
    summaryLabel: {
        fontSize: 14,
        color: '#6B7280',
        fontWeight: '500',
    },
    summaryValue: {
        fontSize: 14,
        color: '#111827',
        fontWeight: '600',
        textAlign: 'right',
        flex: 1,
        marginLeft: 16,
    },
    summaryPrice: {
        color: '#8B5CF6',
        fontWeight: '700',
    },
});