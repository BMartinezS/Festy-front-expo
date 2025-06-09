import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    RefreshControl,
    TextInput,
    Modal,
    Alert,
    Image,
    ActivityIndicator,
    Platform,
    KeyboardAvoidingView,
    Switch,
    StatusBar,
    Animated,
    Dimensions,
} from 'react-native';
import { useLocalSearchParams, Stack, router } from 'expo-router';
import { eventService, EventToUpdate } from '@/services/event.service';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as ImagePicker from 'expo-image-picker';
import MapSection from '@/components/EventForm/MapSection';
import ProductSearchSection from '@/components/EventForm/ProductSearchSection';
import { paymentService } from '@/services/payment.service';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import ActionButton from '@/components/ui/ActionButton';

const { width } = Dimensions.get('window');

export default function EventDetailScreen() {
    const { id } = useLocalSearchParams();
    const [event, setEvent] = useState<EventToUpdate | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editableEvent, seteditableEvent] = useState<Partial<EventToUpdate>>({});
    const [showDatePickerStart, setShowDatePickerStart] = useState(false);
    const [showDatePickerEnd, setShowDatePickerEnd] = useState(false);
    const [showImagePickerModal, setShowImagePickerModal] = useState(false);
    const [scrollY] = useState(new Animated.Value(0));
    const [fadeAnim] = useState(new Animated.Value(0));

    useEffect(() => {
        const loadData = async () => {
            try {
                const userToken = await AsyncStorage.getItem('userToken');
                setToken(userToken);

                if (userToken && id) {
                    await loadEvent(userToken);
                }
            } catch (error: any) {
                setError(error.message || 'Error al cargar datos');
            }
        };

        loadData();

        // Animación de entrada
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
        }).start();
    }, [id]);

    useEffect(() => {
        if (event) {
            console.log('Evento:', event);
            seteditableEvent(event);
        }
    }, [event]);

    const loadEvent = async (userToken: string) => {
        try {
            setRefreshing(true);
            setError('');

            const data: any = await eventService.getEventById(userToken, id as string);

            if ('error' in data) {
                setError('Error al cargar el evento');
                return;
            }

            setEvent(data.data);
        } catch (error: any) {
            setError(error.message || 'Error al cargar el evento');
        } finally {
            setRefreshing(false);
        }
    };

    const handleRefresh = async () => {
        if (token) {
            await loadEvent(token);
        }
    };

    const handleStartEditing = () => {
        if (event) {
            seteditableEvent(event);
            setIsEditing(true);
        }
    };

    const handleCancelEditing = () => {
        setIsEditing(false);
        setError('');
    };

    const handleSaveChanges = async () => {
        if (!event) return;

        if (!editableEvent.nombre || !editableEvent.fechaInicio) {
            Alert.alert('Campos requeridos', 'El nombre y la fecha de inicio son obligatorios');
            return;
        }

        try {
            setIsLoading(true);
            setError('');

            if (!token || !id) throw new Error('No hay sesión activa');

            await eventService.updateEvent(token, id as string, editableEvent);
            await handleRefresh();
            setIsEditing(false);
            Alert.alert('¡Listo!', 'Evento actualizado correctamente');
        } catch (error: any) {
            setError(error.message || 'Error al actualizar el evento');
        } finally {
            setIsLoading(false);
        }
    };

    const handleEventChange = (field: keyof EventToUpdate, value: any) => {
        seteditableEvent((prev: any) => ({ ...prev, [field]: value }));
    };

    const handleRequirementChange = (field: string, value: string) => {
        seteditableEvent((prev: any) => ({
            ...prev,
            requerimientos: {
                ...prev.requerimientos,
                [field]: value
            }
        }));
    };

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (status !== 'granted') {
            Alert.alert('Permiso denegado', 'Se necesita acceso a la galería para seleccionar una imagen');
            return;
        }

        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [16, 9],
                quality: 0.8,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                handleEventChange('imagen', result.assets[0].uri);
                setShowImagePickerModal(false);
            }
        } catch (error) {
            Alert.alert('Error', 'No se pudo seleccionar la imagen');
        }
    };

    const takePhoto = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();

        if (status !== 'granted') {
            Alert.alert('Permiso denegado', 'Se necesita acceso a la cámara para tomar una foto');
            return;
        }

        try {
            const result = await ImagePicker.launchCameraAsync({
                allowsEditing: true,
                aspect: [16, 9],
                quality: 0.8,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                handleEventChange('imagen', result.assets[0].uri);
                setShowImagePickerModal(false);
            }
        } catch (error) {
            Alert.alert('Error', 'No se pudo tomar la foto');
        }
    };

    const handleDeleteEvent = () => {
        Alert.alert(
            'Eliminar Evento',
            '¿Estás seguro de que deseas eliminar este evento? Esta acción no se puede deshacer.',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Eliminar',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            setIsLoading(true);

                            if (!token || !id) throw new Error('No hay sesión activa');

                            await eventService.deleteEvent(token, id as string);

                            Alert.alert(
                                'Evento Eliminado',
                                'El evento ha sido eliminado exitosamente.',
                                [{ text: 'OK', onPress: () => router.back() }]
                            );
                        } catch (error: any) {
                            Alert.alert('Error', error.message || 'No se pudo eliminar el evento');
                        } finally {
                            setIsLoading(false);
                        }
                    }
                }
            ]
        );
    };

    if (!event) {
        return (
            <View style={styles.loadingContainer}>
                <LinearGradient
                    colors={['#8B5CF6', '#7C3AED']}
                    style={styles.loadingIconContainer}
                >
                    <ActivityIndicator size="large" color="#FFFFFF" />
                </LinearGradient>
                <Text style={styles.loadingText}>Cargando evento...</Text>
            </View>
        );
    }

    const formatDate = (date: Date) => {
        const d = new Date(date);
        return `${d.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        })} a las ${d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`;
    };

    const getStatusConfig = (status: string) => {
        switch (status) {
            case 'active':
                return { colors: ['#22C55E', '#16A34A'], label: 'Activo' };
            case 'completed':
                return { colors: ['#6B7280', '#4B5563'], label: 'Finalizado' };
            case 'cancelled':
                return { colors: ['#EF4444', '#DC2626'], label: 'Cancelado' };
            default:
                return { colors: ['#F59E0B', '#D97706'], label: 'Borrador' };
        }
    };

    const statusConfig = getStatusConfig(editableEvent.status || '');

    const headerOpacity = scrollY.interpolate({
        inputRange: [0, 100],
        outputRange: [1, 0.8],
        extrapolate: 'clamp'
    });

    const renderViewMode = () => (
        <Animated.ScrollView
            style={{ opacity: fadeAnim }}
            refreshControl={
                <RefreshControl
                    refreshing={refreshing}
                    onRefresh={handleRefresh}
                    colors={['#8B5CF6']}
                    tintColor="#8B5CF6"
                />
            }
            onScroll={Animated.event(
                [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                { useNativeDriver: false }
            )}
            scrollEventThrottle={16}
        >
            <StatusBar barStyle="light-content" backgroundColor="#7C3AED" />

            {/* Hero section */}
            <Animated.View style={[styles.heroSection, { opacity: headerOpacity }]}>
                <View style={styles.imageContainer}>
                    {editableEvent.imagen ? (
                        <Image
                            source={{ uri: editableEvent.imagen }}
                            style={styles.heroImage}
                            resizeMode="cover"
                        />
                    ) : (
                        <LinearGradient
                            colors={['#8B5CF6', '#7C3AED']}
                            style={styles.heroImagePlaceholder}
                        >
                            <Ionicons name="calendar-outline" size={64} color="rgba(255,255,255,0.8)" />
                        </LinearGradient>
                    )}

                    {/* Overlay gradient */}
                    <LinearGradient
                        colors={['transparent', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.7)']}
                        style={styles.imageOverlay}
                    />

                    {/* Status badge */}
                    <View style={styles.statusBadgeContainer}>
                        <LinearGradient
                            colors={['#8B5CF6', '#7C3AED']}
                            style={styles.statusBadge}
                        >
                            <Text style={styles.statusText}>
                                {statusConfig.label}
                            </Text>
                        </LinearGradient>
                    </View>

                    {/* Edit button */}
                    <TouchableOpacity
                        style={styles.editButton}
                        onPress={handleStartEditing}
                        activeOpacity={0.8}
                    >
                        <BlurView intensity={80} style={styles.editButtonBlur}>
                            <Ionicons name="create-outline" size={18} color="#8B5CF6" />
                        </BlurView>
                    </TouchableOpacity>

                    {/* Hero content */}
                    <View style={styles.heroContent}>
                        <Text style={styles.eventTitle}>{editableEvent.nombre}</Text>
                        {editableEvent.descripcion ? (
                            <Text style={styles.eventDescription}>{editableEvent.descripcion}</Text>
                        ) : null}
                    </View>
                </View>
            </Animated.View>

            {/* Error */}
            {error ? (
                <View style={styles.errorContainer}>
                    <View style={styles.errorContent}>
                        <Ionicons name="alert-circle-outline" size={20} color="#EF4444" />
                        <Text style={styles.errorText}>{error}</Text>
                    </View>
                </View>
            ) : null}

            {/* Main content */}
            <View style={styles.contentContainer}>
                {/* Event details card */}
                <View style={styles.detailsCard}>
                    <Text style={styles.cardTitle}>Detalles del Evento</Text>

                    <View style={styles.detailsList}>
                        <View style={styles.detailItem}>
                            <View style={styles.detailIconContainer}>
                                <Ionicons name="calendar-outline" size={20} color="#8B5CF6" />
                            </View>
                            <View style={styles.detailContent}>
                                <Text style={styles.detailLabel}>Fecha de inicio</Text>
                                <Text style={styles.detailText}>
                                    {editableEvent.fechaInicio ? formatDate(editableEvent.fechaInicio) : 'Sin definir'}
                                </Text>
                            </View>
                        </View>

                        {editableEvent.fechaFin && (
                            <View style={styles.detailItem}>
                                <View style={styles.detailIconContainer}>
                                    <Ionicons name="time-outline" size={20} color="#06B6D4" />
                                </View>
                                <View style={styles.detailContent}>
                                    <Text style={styles.detailLabel}>Fecha de fin</Text>
                                    <Text style={styles.detailText}>
                                        {formatDate(editableEvent.fechaFin)}
                                    </Text>
                                </View>
                            </View>
                        )}

                        <View style={styles.detailItem}>
                            <View style={styles.detailIconContainer}>
                                <Ionicons name="location-outline" size={20} color="#F59E0B" />
                            </View>
                            <View style={styles.detailContent}>
                                <Text style={styles.detailLabel}>Ubicación</Text>
                                <Text style={styles.detailText}>
                                    {editableEvent.ubicacion?.address || 'Sin definir'}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.detailItem}>
                            <View style={styles.detailIconContainer}>
                                <Ionicons name="people-outline" size={20} color="#EF4444" />
                            </View>
                            <View style={styles.detailContent}>
                                <Text style={styles.detailLabel}>Invitados</Text>
                                <Text style={styles.detailText}>
                                    {editableEvent.invitados?.length || 0} confirmados de {editableEvent.cantidadInvitados || 0} esperados
                                </Text>
                            </View>
                        </View>

                        {editableEvent.requiresPayment && editableEvent.cuotaAmount && (
                            <View style={styles.detailItem}>
                                <View style={styles.detailIconContainer}>
                                    <Ionicons name="card-outline" size={20} color="#8B5CF6" />
                                </View>
                                <View style={styles.detailContent}>
                                    <Text style={styles.detailLabel}>Cuota por persona</Text>
                                    <Text style={styles.detailText}>
                                        ${editableEvent.cuotaAmount}
                                    </Text>
                                </View>
                            </View>
                        )}
                    </View>
                </View>

                {/* Requirements card */}
                {editableEvent.requerimientos && Object.values(editableEvent.requerimientos).some(req => req) && (
                    <View style={styles.requirementsCard}>
                        <Text style={styles.cardTitle}>Requerimientos</Text>

                        <View style={styles.requirementsList}>
                            {editableEvent.requerimientos.codigoVestimenta && (
                                <View style={styles.requirementItem}>
                                    <View style={styles.requirementIcon}>
                                        <Ionicons name="shirt-outline" size={16} color="#8B5CF6" />
                                    </View>
                                    <View>
                                        <Text style={styles.requirementLabel}>Código de vestimenta</Text>
                                        <Text style={styles.requirementText}>
                                            {editableEvent.requerimientos.codigoVestimenta}
                                        </Text>
                                    </View>
                                </View>
                            )}

                            {editableEvent.requerimientos.alimentacion && (
                                <View style={styles.requirementItem}>
                                    <View style={styles.requirementIcon}>
                                        <Ionicons name="restaurant-outline" size={16} color="#06B6D4" />
                                    </View>
                                    <View>
                                        <Text style={styles.requirementLabel}>Alimentación</Text>
                                        <Text style={styles.requirementText}>
                                            {editableEvent.requerimientos.alimentacion}
                                        </Text>
                                    </View>
                                </View>
                            )}

                            {editableEvent.requerimientos.edadMinima && (
                                <View style={styles.requirementItem}>
                                    <View style={styles.requirementIcon}>
                                        <Ionicons name="person-outline" size={16} color="#F59E0B" />
                                    </View>
                                    <View>
                                        <Text style={styles.requirementLabel}>Edad mínima</Text>
                                        <Text style={styles.requirementText}>
                                            {editableEvent.requerimientos.edadMinima}
                                        </Text>
                                    </View>
                                </View>
                            )}

                            {editableEvent.requerimientos.llevar && (
                                <View style={styles.requirementItem}>
                                    <View style={styles.requirementIcon}>
                                        <Ionicons name="bag-outline" size={16} color="#EF4444" />
                                    </View>
                                    <View>
                                        <Text style={styles.requirementLabel}>Llevar</Text>
                                        <Text style={styles.requirementText}>
                                            {editableEvent.requerimientos.llevar}
                                        </Text>
                                    </View>
                                </View>
                            )}
                        </View>
                    </View>
                )}

                {/* Action buttons */}
                <View style={styles.actionSection}>

                    <View style={styles.secondaryActions}>

                        {editableEvent.requiresPayment && (
                            <TouchableOpacity
                                style={styles.secondaryActionButton}
                                onPress={async () => {
                                    try {
                                        if (!token) throw new Error('Token is null');
                                        const paymentLink = await paymentService.generatePaymentLink(token, event._id.toString());
                                        Alert.alert(
                                            'Enlace de Pago',
                                            'Enlace generado correctamente.',
                                            [
                                                {
                                                    text: 'Copiar Enlace',
                                                    onPress: async () => {
                                                        await Clipboard.setStringAsync(paymentLink);
                                                        Alert.alert('Éxito', 'Enlace copiado al portapapeles');
                                                    },
                                                },
                                                { text: 'Cerrar' }
                                            ]
                                        );
                                    } catch (error) {
                                        Alert.alert('Error', 'No se pudo generar el enlace de pago');
                                    }
                                }}
                                activeOpacity={0.8}
                            >
                                <Ionicons name="card-outline" size={20} color="#FFF" />
                                <Text style={styles.secondaryActionText}>Generar Enlace de Pago</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </View>
        </Animated.ScrollView>
    );

    const renderEditMode = () => (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={{ flex: 1 }}
        >
            <Animated.ScrollView
                style={{ opacity: fadeAnim }}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        colors={['#8B5CF6']}
                        tintColor="#8B5CF6"
                    />
                }
                showsVerticalScrollIndicator={false}
            >
                <StatusBar barStyle="light-content" backgroundColor="#7C3AED" />

                {/* Error */}
                {error ? (
                    <View style={styles.errorContainer}>
                        <View style={styles.errorContent}>
                            <Ionicons name="alert-circle-outline" size={20} color="#EF4444" />
                            <Text style={styles.errorText}>{error}</Text>
                        </View>
                    </View>
                ) : null}

                {/* Image editor */}
                <TouchableOpacity
                    style={styles.imageEditor}
                    onPress={() => setShowImagePickerModal(true)}
                    activeOpacity={0.9}
                >
                    {editableEvent.imagen ? (
                        <Image
                            source={{ uri: editableEvent.imagen }}
                            style={styles.editImage}
                            resizeMode="cover"
                        />
                    ) : (
                        <LinearGradient
                            colors={['#8B5CF6', '#7C3AED']}
                            style={styles.editImagePlaceholder}
                        >
                            <Ionicons name="image-outline" size={48} color="rgba(255,255,255,0.8)" />
                            <Text style={styles.imagePlaceholderText}>Toca para añadir imagen</Text>
                        </LinearGradient>
                    )}
                    <View style={styles.imageEditOverlay}>
                        <View style={styles.editImageIcon}>
                            <Ionicons name="camera-outline" size={20} color="#8B5CF6" />
                        </View>
                    </View>
                </TouchableOpacity>

                {/* Form sections */}
                <View style={styles.formContainer}>
                    {/* Basic info */}
                    <View style={styles.formSection}>
                        <Text style={styles.formSectionTitle}>Información Básica</Text>

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Nombre del evento *</Text>
                            <View style={styles.inputContainer}>
                                <Ionicons name="text-outline" size={20} color="#8B5CF6" />
                                <TextInput
                                    style={styles.textInput}
                                    value={editableEvent.nombre}
                                    onChangeText={(text) => handleEventChange('nombre', text)}
                                    placeholder="Nombre del evento"
                                    placeholderTextColor="#9CA3AF"
                                />
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Descripción</Text>
                            <View style={[styles.inputContainer, styles.textAreaContainer]}>
                                <Ionicons name="document-text-outline" size={20} color="#8B5CF6" style={styles.textAreaIcon} />
                                <TextInput
                                    style={[styles.textInput, styles.textArea]}
                                    value={editableEvent.descripcion}
                                    onChangeText={(text) => handleEventChange('descripcion', text)}
                                    placeholder="Describe tu evento..."
                                    placeholderTextColor="#9CA3AF"
                                    multiline
                                    numberOfLines={4}
                                    textAlignVertical="top"
                                />
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Tipo de evento</Text>
                            <View style={styles.inputContainer}>
                                <Ionicons name="pricetag-outline" size={20} color="#8B5CF6" />
                                <TextInput
                                    style={styles.textInput}
                                    value={editableEvent.tipo}
                                    onChangeText={(text) => handleEventChange('tipo', text)}
                                    placeholder="Ej: Fiesta, Reunión, Cena..."
                                    placeholderTextColor="#9CA3AF"
                                />
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Cantidad de invitados</Text>
                            <View style={styles.inputContainer}>
                                <Ionicons name="people-outline" size={20} color="#8B5CF6" />
                                <TextInput
                                    style={styles.textInput}
                                    value={editableEvent.cantidadInvitados?.toString()}
                                    onChangeText={(text) => handleEventChange('cantidadInvitados', parseInt(text) || 0)}
                                    placeholder="Número de invitados"
                                    placeholderTextColor="#9CA3AF"
                                    keyboardType="number-pad"
                                />
                            </View>
                        </View>
                    </View>

                    {/* Map section placeholder */}
                    <View style={styles.formSection}>
                        <MapSection
                            initialCoordinates={{
                                latitude: editableEvent.ubicacion?.coordinates[0] || 0,
                                longitude: editableEvent.ubicacion?.coordinates[1] || 0,
                            }}
                            onLocationSelect={(lat, lng, address) =>
                                handleEventChange('ubicacion', {
                                    coordinates: [lat, lng],
                                    address: address || 'Dirección pendiente'
                                })
                            }
                        />
                    </View>

                    {/* Product search placeholder */}
                    <View style={styles.formSection}>
                        <ProductSearchSection
                            isEditing={true}
                            form={event}
                            updateForm={handleEventChange}
                            setError={setError}
                        />
                    </View>

                    {/* Requirements */}
                    <View style={styles.formSection}>
                        <Text style={styles.formSectionTitle}>Requerimientos</Text>

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Código de vestimenta</Text>
                            <View style={styles.inputContainer}>
                                <Ionicons name="shirt-outline" size={20} color="#8B5CF6" />
                                <TextInput
                                    style={styles.textInput}
                                    value={editableEvent.requerimientos?.codigoVestimenta}
                                    onChangeText={(text) => handleRequirementChange('llevar', text)}
                                    placeholder="Ej: Cámara, Regalo, Juegos..."
                                    placeholderTextColor="#9CA3AF"
                                />
                            </View>
                        </View>
                    </View>

                    {/* Payment */}
                    <View style={styles.formSection}>
                        <Text style={styles.formSectionTitle}>Información de Pago</Text>

                        <View style={styles.switchContainer}>
                            <View style={styles.switchLabelContainer}>
                                <Ionicons name="card-outline" size={20} color="#8B5CF6" />
                                <Text style={styles.switchLabel}>Requiere pago</Text>
                            </View>
                            <Switch
                                value={editableEvent.requiresPayment}
                                onValueChange={(value) => handleEventChange('requiresPayment', value)}
                                trackColor={{ false: '#E5E7EB', true: '#C4B5FD' }}
                                thumbColor={editableEvent.requiresPayment ? '#8B5CF6' : '#F3F4F6'}
                                ios_backgroundColor="#E5E7EB"
                            />
                        </View>

                        {editableEvent.requiresPayment && (
                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Monto por persona</Text>
                                <View style={styles.inputContainer}>
                                    <Ionicons name="cash-outline" size={20} color="#8B5CF6" />
                                    <TextInput
                                        style={styles.textInput}
                                        value={editableEvent.cuotaAmount?.toString()}
                                        onChangeText={(text) => handleEventChange('cuotaAmount', parseFloat(text) || 0)}
                                        placeholder="0"
                                        placeholderTextColor="#9CA3AF"
                                        keyboardType="numeric"
                                    />
                                    <Text style={styles.currencySymbol}>$</Text>
                                </View>
                            </View>
                        )}
                    </View>
                </View>

                {/* Action buttons */}
                <View style={styles.editActions}>
                    <TouchableOpacity
                        style={styles.cancelButton}
                        onPress={handleCancelEditing}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.cancelButtonText}>Cancelar</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.saveButton}
                        onPress={handleSaveChanges}
                        disabled={isLoading}
                        activeOpacity={0.9}
                    >
                        <LinearGradient
                            colors={['#8B5CF6', '#7C3AED']}
                            style={styles.saveButtonGradient}
                        >
                            {isLoading ? (
                                <ActivityIndicator size="small" color="#FFFFFF" />
                            ) : (
                                <>
                                    <Ionicons name="checkmark-outline" size={20} color="white" />
                                    <Text style={styles.saveButtonText}>Guardar</Text>
                                </>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>
                </View>

                {/* Delete button */}
                <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={handleDeleteEvent}
                    activeOpacity={0.9}
                >
                    <LinearGradient
                        colors={['#EF4444', '#DC2626']}
                        style={styles.deleteButtonGradient}
                    >
                        <Ionicons name="trash-outline" size={20} color="white" />
                        <Text style={styles.deleteButtonText}>Eliminar Evento</Text>
                    </LinearGradient>
                </TouchableOpacity>
            </Animated.ScrollView>

            {/* Image picker modal */}
            <Modal
                visible={showImagePickerModal}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowImagePickerModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <BlurView intensity={90} style={styles.blurOverlay} tint="dark" />
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Cambiar Imagen</Text>
                            <TouchableOpacity
                                onPress={() => setShowImagePickerModal(false)}
                                style={styles.modalCloseButton}
                            >
                                <Ionicons name="close" size={24} color="#6B7280" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.modalOptions}>
                            <TouchableOpacity
                                style={styles.modalOption}
                                onPress={pickImage}
                                activeOpacity={0.8}
                            >
                                <View style={styles.modalOptionIcon}>
                                    <Ionicons name="images-outline" size={24} color="#8B5CF6" />
                                </View>
                                <Text style={styles.modalOptionText}>Galería</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.modalOption}
                                onPress={takePhoto}
                                activeOpacity={0.8}
                            >
                                <View style={styles.modalOptionIcon}>
                                    <Ionicons name="camera-outline" size={24} color="#8B5CF6" />
                                </View>
                                <Text style={styles.modalOptionText}>Cámara</Text>
                            </TouchableOpacity>

                            {editableEvent.imagen && (
                                <TouchableOpacity
                                    style={[styles.modalOption, styles.deleteModalOption]}
                                    onPress={() => {
                                        handleEventChange('imagen', null);
                                        setShowImagePickerModal(false);
                                    }}
                                    activeOpacity={0.8}
                                >
                                    <View style={[styles.modalOptionIcon, styles.deleteModalIcon]}>
                                        <Ionicons name="trash-outline" size={24} color="#EF4444" />
                                    </View>
                                    <Text style={[styles.modalOptionText, styles.deleteModalText]}>Eliminar</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                </View>
            </Modal>
        </KeyboardAvoidingView>
    );

    return (
        <>
            <Stack.Screen
                options={{
                    headerTitle: isEditing ? 'Editar Evento' : editableEvent.nombre,
                    headerShown: true,
                    headerStyle: {
                        backgroundColor: '#8B5CF6',
                    },
                    headerTintColor: '#FFFFFF',
                    headerTitleStyle: {
                        fontWeight: '700',
                    },
                }}
            />

            <View style={styles.container}>
                {isEditing ? renderEditMode() : renderViewMode()}
            </View>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FAFAF9',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FAFAF9',
        gap: 20,
    },
    loadingIconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        fontSize: 16,
        color: '#8B5CF6',
        fontWeight: '600',
    },

    // Hero section (view mode)
    heroSection: {
        position: 'relative',
    },
    imageContainer: {
        position: 'relative',
        height: 300,
    },
    heroImage: {
        width: '100%',
        height: '100%',
    },
    heroImagePlaceholder: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    imageOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 150,
    },
    statusBadgeContainer: {
        position: 'absolute',
        top: 20,
        left: 20,
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    statusText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '700',
    },
    editButton: {
        position: 'absolute',
        top: 20,
        right: 20,
        width: 44,
        height: 44,
        borderRadius: 22,
        overflow: 'hidden',
    },
    editButtonBlur: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    heroContent: {
        position: 'absolute',
        bottom: 20,
        left: 20,
        right: 20,
    },
    eventTitle: {
        fontSize: 28,
        fontWeight: '800',
        color: '#FFFFFF',
        marginBottom: 8,
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
    },
    eventDescription: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.9)',
        lineHeight: 22,
        textShadowColor: 'rgba(0,0,0,0.3)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },

    // Content
    contentContainer: {
        padding: 20,
        gap: 20,
    },
    detailsCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 6,
    },
    cardTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 20,
    },
    detailsList: {
        gap: 16,
    },
    detailItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    detailIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F9FAFB',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    detailContent: {
        flex: 1,
    },
    detailLabel: {
        fontSize: 14,
        color: '#6B7280',
        fontWeight: '500',
        marginBottom: 2,
    },
    detailText: {
        fontSize: 16,
        color: '#111827',
        fontWeight: '600',
        lineHeight: 20,
    },

    // Requirements
    requirementsCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 6,
    },
    requirementsList: {
        gap: 16,
    },
    requirementItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    requirementIcon: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#F9FAFB',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    requirementLabel: {
        fontSize: 13,
        color: '#6B7280',
        fontWeight: '500',
        marginBottom: 2,
    },
    requirementText: {
        fontSize: 15,
        color: '#111827',
        fontWeight: '500',
    },

    // Actions
    actionSection: {
        gap: 16,
    },
    primaryActionButton: {
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#8B5CF6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    primaryActionGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        gap: 8,
    },
    primaryActionText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
    secondaryActions: {
        flexDirection: 'row',
        gap: 12,
    },
    secondaryActionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#8B5CF6',
        borderRadius: 12,
        paddingVertical: 14,
        gap: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
    },
    secondaryActionText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: '600',
    },

    // Edit mode
    imageEditor: {
        position: 'relative',
        margin: 20,
        height: 200,
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 6,
    },
    editImage: {
        width: '100%',
        height: '100%',
    },
    editImagePlaceholder: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    imagePlaceholderText: {
        color: 'rgba(255,255,255,0.9)',
        fontSize: 14,
        fontWeight: '500',
    },
    imageEditOverlay: {
        position: 'absolute',
        bottom: 12,
        right: 12,
    },
    editImageIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.95)',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },

    // Form
    formContainer: {
        padding: 20,
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
    formSectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 20,
    },
    inputGroup: {
        marginBottom: 16,
    },
    inputLabel: {
        fontSize: 14,
        color: '#374151',
        fontWeight: '600',
        marginBottom: 8,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        borderWidth: 2,
        borderColor: '#F3F4F6',
        borderRadius: 12,
        paddingHorizontal: 16,
        height: 52,
    },
    textAreaContainer: {
        alignItems: 'flex-start',
        height: 120,
        paddingVertical: 12,
    },
    textAreaIcon: {
        marginTop: 2,
    },
    textInput: {
        flex: 1,
        fontSize: 16,
        color: '#111827',
        fontWeight: '500',
        marginLeft: 12,
    },
    textArea: {
        height: 96,
        textAlignVertical: 'top',
    },
    currencySymbol: {
        fontSize: 16,
        color: '#6B7280',
        fontWeight: '600',
    },
    switchContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 4,
    },
    switchLabelContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    switchLabel: {
        fontSize: 16,
        color: '#111827',
        fontWeight: '600',
    },

    // Edit actions
    editActions: {
        flexDirection: 'row',
        gap: 12,
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    cancelButton: {
        flex: 1,
        backgroundColor: '#F3F4F6',
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelButtonText: {
        color: '#6B7280',
        fontSize: 16,
        fontWeight: '600',
    },
    saveButton: {
        flex: 2,
        borderRadius: 12,
        overflow: 'hidden',
        shadowColor: '#8B5CF6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    saveButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        gap: 8,
    },
    saveButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
    deleteButton: {
        marginHorizontal: 20,
        marginBottom: 40,
        borderRadius: 12,
        overflow: 'hidden',
    },
    deleteButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        gap: 8,
    },
    deleteButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },

    // Modal
    modalOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    blurOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        paddingBottom: 40,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#111827',
    },
    modalCloseButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalOptions: {
        gap: 4,
    },
    modalOption: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 4,
    },
    modalOptionIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#F9FAFB',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    modalOptionText: {
        fontSize: 16,
        color: '#111827',
        fontWeight: '600',
    },
    deleteModalOption: {
        marginTop: 8,
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
    deleteModalIcon: {
        backgroundColor: '#FEF2F2',
    },
    deleteModalText: {
        color: '#EF4444',
    },

    // Error
    errorContainer: {
        margin: 20,
        marginBottom: 0,
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
        color: '#EF4444',
        fontSize: 14,
        fontWeight: '500',
        flex: 1,
    },
});