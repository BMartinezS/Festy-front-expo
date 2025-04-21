// app/event/[id].tsx - Pantalla de detalle del evento con capacidad de edición
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

// Componente principal de detalle del evento
export default function EventDetailScreen() {
    const { id } = useLocalSearchParams();
    const [event, setEvent] = useState<EventToUpdate | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Estado para modo edición
    const [isEditing, setIsEditing] = useState(false);
    const [editableEvent, seteditableEvent] = useState<Partial<EventToUpdate>>({});
    const [showDatePickerStart, setShowDatePickerStart] = useState(false);
    const [showDatePickerEnd, setShowDatePickerEnd] = useState(false);
    const [showImagePickerModal, setShowImagePickerModal] = useState(false);

    // Función para cargar el token y el evento
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
    }, [id]);

    useEffect(() => {
        if (event) {
            console.log('Evento:', event);
            seteditableEvent(event);
        }
    }, [event]);

    // Función para cargar los datos del evento
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

    // Función para refrescar los datos
    const handleRefresh = async () => {
        if (token) {
            await loadEvent(token);
        }
    };

    // Función para comenzar la edición del evento
    const handleStartEditing = () => {
        if (event) {
            seteditableEvent(event);
            setIsEditing(true);
        }
    };

    // Función para cancelar la edición
    const handleCancelEditing = () => {
        setIsEditing(false);
        setError('');
    };

    // Función para guardar los cambios del evento
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

            console.log('editableEvent:', editableEvent);

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

    // Función para manejar los cambios en los campos del evento
    const handleEventChange = (field: keyof EventToUpdate, value: any) => {
        console.log('En event change: ', field, value);
        seteditableEvent((prev: any) => ({ ...prev, [field]: value }));
    };

    // Función para manejar los cambios en los requerimientos
    const handleRequirementChange = (field: string, value: string) => {
        seteditableEvent((prev: any) => ({
            ...prev,
            requerimientos: {
                ...prev.requerimientos,
                [field]: value
            } as EventToUpdate['requerimientos']
        }));
    };

    // Función para seleccionar una nueva imagen
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
            console.error('Error al seleccionar imagen:', error);
            Alert.alert('Error', 'No se pudo seleccionar la imagen');
        }
    };

    // Función para tomar una foto
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
            console.error('Error al tomar foto:', error);
            Alert.alert('Error', 'No se pudo tomar la foto');
        }
    };

    // Función para manejar selección de fecha
    const handleDateChange = (field: 'fechaInicio' | 'fechaFin', date: Date) => {
        handleEventChange(field, date);
    };

    // Función para eliminar el evento
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
                <ActivityIndicator size="large" color="#6a0dad" />
                <Text style={styles.loadingText}>Cargando evento...</Text>
            </View>
        );
    }


    const formatDate = (date: Date) => {
        const d = new Date(date);
        return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    };

    // Función que determina el color del estado
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return '#28a745';
            case 'completed': return '#6c757d';
            case 'cancelled': return '#dc3545';
            case 'draft': return '#ffc107';
            default: return '#6a0dad';
        }
    };

    // Renderizar modo de visualización o edición
    const renderContent = () => {
        if (isEditing) {
            // MODO EDICIÓN
            return (
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    style={{ flex: 1 }}
                >
                    <StatusBar barStyle="light-content" backgroundColor="#6a0dad" />

                    <Animated.ScrollView
                        refreshControl={
                            <RefreshControl
                                refreshing={refreshing}
                                onRefresh={handleRefresh}
                                colors={['#6a0dad']}
                                tintColor="#6a0dad"
                            />
                        }
                    >
                        {error ? (
                            <View style={styles.errorContainer}>
                                <Ionicons name="alert-circle" size={24} color="#ff4646" />
                                <Text style={styles.errorText}>{error}</Text>
                            </View>
                        ) : null}

                        {/* Editor de imagen */}
                        <TouchableOpacity
                            style={styles.imageEditContainer}
                            onPress={() => setShowImagePickerModal(true)}
                        >
                            {editableEvent.imagen ? (
                                <Image
                                    source={{ uri: editableEvent.imagen }}
                                    style={styles.eventImage}
                                    resizeMode="cover"
                                />
                            ) : (
                                <View style={styles.imagePlaceholder}>
                                    <LinearGradient
                                        colors={['#8e44ad', '#6a0dad']}
                                        style={styles.gradientPlaceholder}
                                    >
                                        <Ionicons name="image" size={40} color="rgba(255,255,255,0.8)" />
                                        <Text style={styles.imagePlaceholderText}>Toca para añadir imagen</Text>
                                    </LinearGradient>
                                </View>
                            )}
                            <View style={styles.imageEditOverlay}>
                                <LinearGradient
                                    colors={['#6a0dad', '#8e44ad']}
                                    style={styles.editIconGradient}
                                >
                                    <Ionicons name="camera" size={20} color="#ffffff" />
                                </LinearGradient>
                            </View>
                        </TouchableOpacity>

                        {/* Datos básicos */}
                        <View style={styles.editSection}>
                            <Text style={styles.editSectionTitle}>Información Básica</Text>

                            <Text style={styles.inputLabel}>Nombre del Evento*</Text>
                            <View style={styles.inputContainer}>
                                <Ionicons name="text" size={20} color="#8e44ad" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.textInput}
                                    value={editableEvent.nombre}
                                    onChangeText={(text) => handleEventChange('nombre', text)}
                                    placeholder="Nombre del evento"
                                    placeholderTextColor="#aaa"
                                />
                            </View>

                            <Text style={styles.inputLabel}>Descripción</Text>
                            <View style={[styles.inputContainer, { alignItems: 'flex-start' }]}>
                                <Ionicons name="document-text" size={20} color="#8e44ad" style={[styles.inputIcon, { marginTop: 10 }]} />
                                <TextInput
                                    style={[styles.textInput, styles.textArea]}
                                    value={editableEvent.descripcion}
                                    onChangeText={(text) => handleEventChange('descripcion', text)}
                                    placeholder="Descripción del evento"
                                    placeholderTextColor="#aaa"
                                    multiline
                                    numberOfLines={4}
                                    textAlignVertical="top"
                                />
                            </View>

                            <Text style={styles.inputLabel}>Tipo de Evento*</Text>
                            <View style={styles.inputContainer}>
                                <Ionicons name="pricetag" size={20} color="#8e44ad" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.textInput}
                                    value={editableEvent.tipo}
                                    onChangeText={(text) => handleEventChange('tipo', text)}
                                    placeholder="Tipo de evento"
                                    placeholderTextColor="#aaa"
                                />
                            </View>

                            <Text style={styles.inputLabel}>Cantidad de Invitados</Text>
                            <View style={styles.inputContainer}>
                                <Ionicons name="people" size={20} color="#8e44ad" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.textInput}
                                    value={editableEvent.cantidadInvitados?.toString()}
                                    onChangeText={(text) => handleEventChange('cantidadInvitados', parseInt(text) || 0)}
                                    placeholder="Cantidad de invitados"
                                    placeholderTextColor="#aaa"
                                    keyboardType="number-pad"
                                />
                            </View>
                        </View>

                        {/* Fechas */}
                        {/* [Omitido el código de DatePicker por brevedad] */}

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

                        <ProductSearchSection isEditing={true} form={event} updateForm={handleEventChange} setError={setError} />

                        {/* Requerimientos */}
                        <View style={styles.editSection}>
                            <Text style={styles.editSectionTitle}>Requerimientos</Text>

                            <Text style={styles.inputLabel}>Código de Vestimenta</Text>
                            <View style={styles.inputContainer}>
                                <Ionicons name="shirt" size={20} color="#8e44ad" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.textInput}
                                    value={editableEvent.requerimientos?.codigoVestimenta}
                                    onChangeText={(text) => handleRequirementChange('codigoVestimenta', text)}
                                    placeholder="Código de vestimenta"
                                    placeholderTextColor="#aaa"
                                />
                            </View>

                            <Text style={styles.inputLabel}>Alimentación</Text>
                            <View style={styles.inputContainer}>
                                <Ionicons name="restaurant" size={20} color="#8e44ad" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.textInput}
                                    value={editableEvent.requerimientos?.alimentacion}
                                    onChangeText={(text) => handleRequirementChange('alimentacion', text)}
                                    placeholder="Información sobre alimentación"
                                    placeholderTextColor="#aaa"
                                />
                            </View>

                            <Text style={styles.inputLabel}>Edad Mínima</Text>
                            <View style={styles.inputContainer}>
                                <Ionicons name="person" size={20} color="#8e44ad" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.textInput}
                                    value={editableEvent.requerimientos?.edadMinima}
                                    onChangeText={(text) => handleRequirementChange('edadMinima', text)}
                                    placeholder="Edad mínima requerida"
                                    placeholderTextColor="#aaa"
                                />
                            </View>

                            <Text style={styles.inputLabel}>Llevar</Text>
                            <View style={styles.inputContainer}>
                                <Ionicons name="bag" size={20} color="#8e44ad" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.textInput}
                                    value={editableEvent.requerimientos?.llevar}
                                    onChangeText={(text) => handleRequirementChange('llevar', text)}
                                    placeholder="Qué deben llevar los invitados"
                                    placeholderTextColor="#aaa"
                                />
                            </View>
                        </View>

                        {/* Pago */}
                        <View style={styles.editSection}>
                            <Text style={styles.editSectionTitle}>Información de Pago</Text>

                            <View style={styles.switchContainer}>
                                <View style={styles.switchLabelContainer}>
                                    <Ionicons name="cash" size={20} color="#8e44ad" />
                                    <Text style={styles.switchLabel}>Requiere Pago</Text>
                                </View>
                                <Switch
                                    value={editableEvent.requiresPayment}
                                    onValueChange={(value) => handleEventChange('requiresPayment', value)}
                                    trackColor={{ false: '#d0d0d0', true: '#9b59b6' }}
                                    thumbColor={editableEvent.requiresPayment ? '#6a0dad' : '#f4f3f4'}
                                    ios_backgroundColor="#d0d0d0"
                                />
                            </View>

                            {editableEvent.requiresPayment && (
                                <>
                                    <Text style={styles.inputLabel}>Monto de Cuota</Text>
                                    <View style={styles.inputContainer}>
                                        <Ionicons name="cash" size={20} color="#8e44ad" style={styles.inputIcon} />
                                        <TextInput
                                            style={styles.textInput}
                                            value={editableEvent.cuotaAmount?.toString()}
                                            onChangeText={(text) => handleEventChange('cuotaAmount', parseFloat(text) || 0)}
                                            placeholder="Monto de la cuota"
                                            placeholderTextColor="#aaa"
                                            keyboardType="numeric"
                                        />
                                    </View>
                                </>
                            )}
                        </View>

                        {/* Botones de acción */}
                        <View style={styles.editActions}>
                            <TouchableOpacity
                                style={[styles.editActionButton, styles.cancelEditButton]}
                                onPress={handleCancelEditing}
                            >
                                <Text style={styles.cancelEditButtonText}>Cancelar</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.editActionButton, styles.saveEditButton]}
                                onPress={handleSaveChanges}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <ActivityIndicator size="small" color="#ffffff" />
                                ) : (
                                    <Text style={styles.saveEditButtonText}>Guardar Cambios</Text>
                                )}
                            </TouchableOpacity>
                        </View>

                        {/* Botón de eliminar evento */}
                        <TouchableOpacity
                            style={styles.deleteEventButton}
                            onPress={handleDeleteEvent}
                        >
                            <LinearGradient
                                colors={['#ff4646', '#d32f2f']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.deleteGradient}
                            >
                                <Ionicons name="trash" size={20} color="#fff" />
                                <Text style={styles.deleteEventText}>Eliminar Evento</Text>
                            </LinearGradient>
                        </TouchableOpacity>

                        <View style={styles.actionButtonsContainer}>
                            <ActionButton
                                icon="stats-chart"
                                title="Dashboard"
                                onPress={() => router.push(`/event/${event._id.toString()}/dashboard`)}
                                color="#6a0dad"
                            />

                            <ActionButton
                                icon="people"
                                title="Gestionar Invitados"
                                onPress={() => router.push(`/event/${event._id.toString()}/guests`)}
                                color="#8e44ad"
                            />

                            {editableEvent.requiresPayment && (
                                <ActionButton
                                    color="#ff4646"
                                    icon="cash"
                                    title="Generar Enlace de Pago"
                                    onPress={async () => {
                                        try {
                                            let paymentLink = '';
                                            if (token) {
                                                paymentLink = await paymentService.generatePaymentLink(token, event._id.toString());
                                            } else {
                                                throw new Error('Token is null');
                                            }
                                            Alert.alert(
                                                'Enlace de Pago',
                                                'Enlace generado correctamente. Puedes compartirlo con tus invitados.',
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
                                />
                            )}
                        </View>
                    </Animated.ScrollView>

                    {/* Modal para seleccionar/tomar imagen */}
                    <Modal
                        visible={showImagePickerModal}
                        transparent={true}
                        animationType="slide"
                        onRequestClose={() => setShowImagePickerModal(false)}
                    >
                        <View style={styles.modalContainer}>
                            <BlurView intensity={90} style={styles.blurView} tint="dark" />
                            <View style={styles.modalContent}>
                                <Text style={styles.modalTitle}>Cambiar Imagen</Text>

                                <TouchableOpacity
                                    style={styles.imagePickerOption}
                                    onPress={pickImage}
                                >
                                    <View style={styles.iconCircle}>
                                        <Ionicons name="images" size={24} color="#6a0dad" />
                                    </View>
                                    <Text style={styles.imagePickerOptionText}>Seleccionar de la galería</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.imagePickerOption}
                                    onPress={takePhoto}
                                >
                                    <View style={styles.iconCircle}>
                                        <Ionicons name="camera" size={24} color="#6a0dad" />
                                    </View>
                                    <Text style={styles.imagePickerOptionText}>Tomar foto</Text>
                                </TouchableOpacity>

                                {editableEvent.imagen && (
                                    <TouchableOpacity
                                        style={[styles.imagePickerOption, styles.removeImageOption]}
                                        onPress={() => {
                                            handleEventChange('imagen', null);
                                            setShowImagePickerModal(false);
                                        }}
                                    >
                                        <View style={[styles.iconCircle, styles.deleteIconCircle]}>
                                            <Ionicons name="trash" size={24} color="#fff" />
                                        </View>
                                        <Text style={styles.removeImageText}>Eliminar imagen</Text>
                                    </TouchableOpacity>
                                )}

                                <TouchableOpacity
                                    style={styles.modalCloseButton}
                                    onPress={() => setShowImagePickerModal(false)}
                                >
                                    <Text style={styles.modalCloseText}>Cancelar</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </Modal>
                </KeyboardAvoidingView>
            );
        } else {
            // MODO VISUALIZACIÓN
            return (
                <Animated.ScrollView
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

                    {/* Cabecera del evento */}
                    <View style={styles.headerSection}>
                        <View style={styles.imageContainer}>
                            {editableEvent.imagen ? (
                                <Image
                                    source={{ uri: editableEvent.imagen }}
                                    style={styles.eventImage}
                                    resizeMode="cover"
                                />
                            ) : (
                                <LinearGradient
                                    colors={['#8e44ad', '#6a0dad']}
                                    style={styles.eventImagePlaceholder}
                                >
                                    <Ionicons name="calendar" size={50} color="rgba(255,255,255,0.8)" />
                                </LinearGradient>
                            )}

                            {/* Badge de estado */}
                            <View style={[
                                styles.statusBadge,
                                { backgroundColor: getStatusColor(editableEvent.status || '') }
                            ]}>
                                <Text style={styles.statusText}>
                                    {editableEvent.status ? editableEvent.status.toUpperCase() : ''}
                                </Text>
                            </View>

                            {/* Botón de editar */}
                            <TouchableOpacity
                                style={styles.editEventButton}
                                onPress={handleStartEditing}
                            >
                                <LinearGradient
                                    colors={['#6a0dad', '#8e44ad']}
                                    style={styles.editButtonGradient}
                                >
                                    <Ionicons name="create" size={16} color="#ffffff" />
                                    <Text style={styles.editEventText}>Editar</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.eventDetailsCard}>
                            <Text style={styles.eventTitle}>{editableEvent.nombre}</Text>
                            <Text style={styles.description}>{editableEvent.descripcion}</Text>
                        </View>
                    </View>

                    {/* Información del evento */}
                    <View style={styles.infoCard}>
                        <Text style={styles.sectionTitle}>Detalles del Evento</Text>

                        <View style={styles.detailsContainer}>
                            <View style={styles.infoRow}>
                                <View style={styles.infoIconContainer}>
                                    <Ionicons name="calendar" size={20} color="#fff" />
                                </View>
                                <View style={styles.infoTextContainer}>
                                    <Text style={styles.infoLabel}>Inicio</Text>
                                    <Text style={styles.infoText}>
                                        {editableEvent.fechaInicio ? formatDate(editableEvent.fechaInicio) : 'Fecha no disponible'}
                                    </Text>
                                </View>
                            </View>

                            {editableEvent.fechaFin && (
                                <View style={styles.infoRow}>
                                    <View style={styles.infoIconContainer}>
                                        <Ionicons name="time" size={20} color="#fff" />
                                    </View>
                                    <View style={styles.infoTextContainer}>
                                        <Text style={styles.infoLabel}>Fin</Text>
                                        <Text style={styles.infoText}>
                                            {formatDate(editableEvent.fechaFin)}
                                        </Text>
                                    </View>
                                </View>
                            )}

                            <View style={styles.infoRow}>
                                <View style={styles.infoIconContainer}>
                                    <Ionicons name="location" size={20} color="#fff" />
                                </View>
                                <View style={styles.infoTextContainer}>
                                    <Text style={styles.infoLabel}>Ubicación</Text>
                                    <Text style={styles.infoText}>
                                        {editableEvent.ubicacion?.address || 'Dirección no disponible'}
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.infoRow}>
                                <View style={styles.infoIconContainer}>
                                    <Ionicons name="people" size={20} color="#fff" />
                                </View>
                                <View style={styles.infoTextContainer}>
                                    <Text style={styles.infoLabel}>Invitados</Text>
                                    <Text style={styles.infoText}>
                                        {editableEvent.cantidadInvitados} esperados, {editableEvent.invitados?.length || 0} registrados
                                    </Text>
                                </View>
                            </View>

                            {editableEvent.requiresPayment && editableEvent.cuotaAmount && (
                                <View style={styles.infoRow}>
                                    <View style={styles.infoIconContainer}>
                                        <Ionicons name="cash" size={20} color="#fff" />
                                    </View>
                                    <View style={styles.infoTextContainer}>
                                        <Text style={styles.infoLabel}>Cuota</Text>
                                        <Text style={styles.infoText}>
                                            ${editableEvent.cuotaAmount} por persona
                                        </Text>
                                    </View>
                                </View>
                            )}
                        </View>

                        {/* Requerimientos */}
                        {editableEvent.requerimientos && (
                            <View style={styles.requirementsSection}>
                                <Text style={styles.requirementsTitle}>Requerimientos:</Text>

                                <View style={styles.requirementsGrid}>
                                    {editableEvent.requerimientos.codigoVestimenta && (
                                        <View style={styles.requirementItem}>
                                            <View style={styles.requirementIconContainer}>
                                                <Ionicons name="shirt" size={18} color="#fff" />
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
                                            <View style={styles.requirementIconContainer}>
                                                <Ionicons name="restaurant" size={18} color="#fff" />
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
                                            <View style={styles.requirementIconContainer}>
                                                <Ionicons name="person" size={18} color="#fff" />
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
                                            <View style={styles.requirementIconContainer}>
                                                <Ionicons name="bag" size={18} color="#fff" />
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
                    </View>

                    {/* Botones de acción */}
                    <View style={styles.viewActionButtonsContainer}>
                        <ActionButton
                            icon="create"
                            title="Editar Evento"
                            onPress={handleStartEditing}
                            color="#6a0dad"
                        />

                        <ActionButton
                            icon="stats-chart"
                            title="Dashboard"
                            onPress={() => router.push(`/event/${event._id.toString()}/dashboard`)}
                            color="#6a0dad"
                        />

                        <ActionButton
                            icon="people"
                            title="Gestionar Invitados"
                            onPress={() => router.push(`/event/${event._id.toString()}/guests`)}
                            color="#8e44ad"
                        />

                        {editableEvent.requiresPayment && (
                            <ActionButton
                                color="#ff4646"
                                icon="cash"
                                title="Generar Enlace de Pago"
                                onPress={async () => {
                                    try {
                                        let paymentLink = '';
                                        if (token) {
                                            paymentLink = await paymentService.generatePaymentLink(token, event._id.toString());
                                        } else {
                                            throw new Error('Token is null');
                                        }
                                        Alert.alert(
                                            'Enlace de Pago',
                                            'Enlace generado correctamente. Puedes compartirlo con tus invitados.',
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
                            />
                        )}
                    </View>
                </Animated.ScrollView>
            );
        }
    }

    return (
        <>
            <Stack.Screen
                options={{
                    headerTitle: isEditing ? 'Editar Evento' : editableEvent.nombre,
                    headerShown: true,
                    headerTintColor: '#6a0dad',
                }}
            />

            <View style={styles.container}>
                {renderContent()}
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
        color: '#6a0dad',
        fontWeight: '500',
    },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ffebee',
        margin: 15,
        marginTop: 20,
        padding: 12,
        borderRadius: 12,
    },
    errorText: {
        color: '#ff4646',
        marginLeft: 10,
        fontSize: 14,
        flex: 1,
    },

    // Vista del evento (no edición)
    headerSection: {
        marginBottom: 20,
    },
    imageContainer: {
        position: 'relative',
        marginBottom: 0,
    },
    eventImage: {
        width: '100%',
        height: 220,
    },
    eventImagePlaceholder: {
        width: '100%',
        height: 220,
        justifyContent: 'center',
        alignItems: 'center',
    },
    eventDetailsCard: {
        backgroundColor: '#fff',
        marginHorizontal: 15,
        marginTop: -30,
        borderRadius: 20,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 4,
    },
    eventTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 10,
    },
    description: {
        fontSize: 15,
        color: '#666',
        lineHeight: 20,
    },
    statusBadge: {
        position: 'absolute',
        top: 15,
        right: 15,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    statusText: {
        color: '#ffffff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    infoCard: {
        backgroundColor: '#ffffff',
        margin: 15,
        marginTop: 5,
        padding: 20,
        borderRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 4,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 20,
    },
    detailsContainer: {
        gap: 15,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    infoIconContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#6a0dad',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    infoTextContainer: {
        flex: 1,
    },
    infoLabel: {
        fontSize: 13,
        color: '#777',
        marginBottom: 3,
    },
    infoText: {
        fontSize: 15,
        color: '#333',
        fontWeight: '500',
    },
    requirementsSection: {
        marginTop: 20,
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
    },
    requirementsTitle: {
        fontSize: 17,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 15,
    },
    requirementsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginHorizontal: -5,
    },
    requirementItem: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '50%',
        paddingHorizontal: 5,
        marginBottom: 15,
    },
    requirementIconContainer: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#8e44ad',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    requirementLabel: {
        fontSize: 12,
        color: '#777',
        marginBottom: 2,
    },
    requirementText: {
        fontSize: 14,
        color: '#333',
    },
    viewActionButtonsContainer: {
        paddingHorizontal: 15,
        paddingBottom: 30,
        gap: 12,
    },
    // Modo edición
    editEventButton: {
        position: 'absolute',
        top: 15,
        right: 70,
        borderRadius: 20,
        overflow: 'hidden',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    editButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    editEventText: {
        color: '#ffffff',
        fontSize: 14,
        fontWeight: 'bold',
        marginLeft: 6,
    },
    editSection: {
        backgroundColor: '#ffffff',
        padding: 20,
        marginHorizontal: 15,
        marginBottom: 15,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    editSectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 20,
    },
    inputLabel: {
        fontSize: 14,
        color: '#666',
        marginBottom: 8,
        fontWeight: '500',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f9f9f9',
        borderWidth: 1,
        borderColor: '#e0e0e0',
        borderRadius: 12,
        marginBottom: 15,
    },
    inputIcon: {
        marginHorizontal: 12,
    },
    textInput: {
        flex: 1,
        height: 50,
        paddingHorizontal: 8,
        paddingVertical: 12,
        fontSize: 16,
        color: '#333',
    },
    textArea: {
        height: 120,
        paddingTop: 12,
        textAlignVertical: 'top',
    },
    switchContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    switchLabelContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    switchLabel: {
        fontSize: 16,
        color: '#333',
        marginLeft: 10,
    },
    editActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginHorizontal: 15,
        marginBottom: 20,
    },
    editActionButton: {
        flex: 1,
        height: 50,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginHorizontal: 5,
    },
    cancelEditButton: {
        backgroundColor: '#f5f5f5',
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    saveEditButton: {
        backgroundColor: '#6a0dad',
    },
    cancelEditButtonText: {
        fontSize: 16,
        color: '#666',
        fontWeight: '600',
    },
    saveEditButtonText: {
        fontSize: 16,
        color: '#ffffff',
        fontWeight: '600',
    },
    deleteEventButton: {
        marginHorizontal: 15,
        marginBottom: 30,
        borderRadius: 12,
        overflow: 'hidden',
    },
    deleteGradient: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 14,
    },
    deleteEventText: {
        fontSize: 16,
        color: '#ffffff',
        fontWeight: '600',
        marginLeft: 10,
    },
    actionButtonsContainer: {
        paddingHorizontal: 15,
        paddingBottom: 30,
        gap: 12,
    },

    // Editor de imagen
    imageEditContainer: {
        position: 'relative',
        margin: 15,
        borderRadius: 20,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 4,
    },
    imagePlaceholder: {
        width: '100%',
        height: 200,
        overflow: 'hidden',
    },
    gradientPlaceholder: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    imagePlaceholderText: {
        color: 'rgba(255,255,255,0.9)',
        marginTop: 10,
        fontWeight: '500',
    },
    imageEditOverlay: {
        position: 'absolute',
        right: 15,
        bottom: 15,
    },
    editIconGradient: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },

    // Modal
    modalContainer: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0,0,0,0.5)',
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
        paddingBottom: 34,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 24,
        textAlign: 'center',
    },
    imagePickerOption: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
    },
    iconCircle: {
        width: 46,
        height: 46,
        borderRadius: 23,
        backgroundColor: '#f0f0f0',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    deleteIconCircle: {
        backgroundColor: '#ff4646',
    },
    imagePickerOptionText: {
        fontSize: 16,
        color: '#333',
    },
    removeImageOption: {
        marginTop: 8,
    },
    removeImageText: {
        fontSize: 16,
        color: '#ff4646',
    },
    modalCloseButton: {
        marginTop: 24,
        paddingVertical: 16,
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
    },
    modalCloseText: {
        fontSize: 16,
        color: '#6a0dad',
        fontWeight: '600',
    }
});