// app/event/[id].tsx - Pantalla de detalle del evento con capacidad de edición
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
    Alert,
    Image,
    Linking,
    ActivityIndicator,
    Platform,
    KeyboardAvoidingView,
    Switch,
} from 'react-native';
import { useLocalSearchParams, Stack, router } from 'expo-router';
import { Event, eventService } from '@/services/event.service';
import { whatsappService } from '@/services/whatsapp.service';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

// Componente para las encuestas
const PollSection = ({
    event,
    token,
    onRefresh
}: {
    event: Event,
    token: string,
    onRefresh: () => Promise<void>
}) => {
    const [showModal, setShowModal] = useState(false);
    const [question, setQuestion] = useState('');
    const [options, setOptions] = useState<string[]>(['', '']);
    const [isLoading, setIsLoading] = useState(false);

    const addOption = () => {
        setOptions([...options, '']);
    };

    const removeOption = (index: number) => {
        if (options.length > 2) {
            const newOptions = [...options];
            newOptions.splice(index, 1);
            setOptions(newOptions);
        }
    };

    const updateOption = (index: number, value: string) => {
        const newOptions = [...options];
        newOptions[index] = value;
        setOptions(newOptions);
    };

    const createPoll = async () => {
        if (!question.trim()) {
            Alert.alert('Error', 'La pregunta es obligatoria');
            return;
        }

        const validOptions = options.filter(opt => opt.trim() !== '');
        if (validOptions.length < 2) {
            Alert.alert('Error', 'Debes incluir al menos 2 opciones');
            return;
        }

        try {
            setIsLoading(true);
            await eventService.createPoll(token, event._id, question, validOptions);

            // Si hay grupo de WhatsApp, enviamos la encuesta al grupo
            if (event.whatsappGroupId) {
                try {
                    await whatsappService.sendPoll(token, event.whatsappGroupId, question, validOptions);
                } catch (error) {
                    console.error('Error al enviar encuesta a WhatsApp:', error);
                    // Continuamos aunque falle el envío a WhatsApp
                }
            }

            setShowModal(false);
            setQuestion('');
            setOptions(['', '']);
            onRefresh();
        } catch (error: any) {
            Alert.alert('Error', error.message || 'No se pudo crear la encuesta');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Encuestas</Text>
                <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => setShowModal(true)}
                >
                    <Text style={styles.addButtonText}>+ Nueva Encuesta</Text>
                </TouchableOpacity>
            </View>

            {event.encuestas && event.encuestas.length > 0 ? (
                event.encuestas.map((poll, index) => (
                    <View key={poll._id || index} style={styles.pollCard}>
                        <Text style={styles.pollQuestion}>{poll.pregunta}</Text>
                        {poll.opciones.map((option, optIndex) => (
                            <View key={optIndex} style={styles.pollOption}>
                                <Text style={styles.pollOptionText}>{option}</Text>
                                <View style={styles.pollBar}>
                                    <View
                                        style={[
                                            styles.pollBarFill,
                                            {
                                                width: `${poll.votos && poll.votos.length > 0
                                                    ? (poll.votos.find(v => v.opcion === option)?.cantidad || 0) * 100 /
                                                    poll.votos.reduce((sum, v) => sum + v.cantidad, 0)
                                                    : 0}%`
                                            }
                                        ]}
                                    />
                                </View>
                                <Text style={styles.pollCount}>
                                    {poll.votos && poll.votos.find(v => v.opcion === option)?.cantidad || 0} votos
                                </Text>
                            </View>
                        ))}
                    </View>
                ))
            ) : (
                <Text style={styles.emptyText}>No hay encuestas creadas</Text>
            )}

            <Modal
                visible={showModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowModal(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Nueva Encuesta</Text>

                        <TextInput
                            style={styles.input}
                            placeholder="Pregunta"
                            value={question}
                            onChangeText={setQuestion}
                        />

                        <Text style={styles.modalSubtitle}>Opciones:</Text>
                        {options.map((option, index) => (
                            <View key={index} style={styles.optionContainer}>
                                <TextInput
                                    style={styles.optionInput}
                                    placeholder={`Opción ${index + 1}`}
                                    value={option}
                                    onChangeText={(text) => updateOption(index, text)}
                                />
                                {options.length > 2 && (
                                    <TouchableOpacity
                                        style={styles.removeButton}
                                        onPress={() => removeOption(index)}
                                    >
                                        <Ionicons name="close-circle" size={24} color="#ff4646" />
                                    </TouchableOpacity>
                                )}
                            </View>
                        ))}

                        <TouchableOpacity style={styles.addOptionButton} onPress={addOption}>
                            <Text style={styles.addOptionText}>+ Agregar Opción</Text>
                        </TouchableOpacity>

                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.cancelButton]}
                                onPress={() => setShowModal(false)}
                            >
                                <Text style={styles.cancelButtonText}>Cancelar</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.modalButton, styles.createButton]}
                                onPress={createPoll}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <ActivityIndicator size="small" color="#ffffff" />
                                ) : (
                                    <Text style={styles.createButtonText}>Crear Encuesta</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

// Componente principal de detalle del evento
export default function EventDetailScreen() {
    const { id } = useLocalSearchParams();
    const [event, setEvent] = useState<Event | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState('');
    const [inviteModalVisible, setInviteModalVisible] = useState(false);
    const [whatsappModalVisible, setWhatsappModalVisible] = useState(false);
    const [newPhone, setNewPhone] = useState('');
    const [groupName, setGroupName] = useState('');
    const [inviteError, setInviteError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedPhone, setSelectedPhone] = useState('');
    const [paymentConcept, setPaymentConcept] = useState('');

    // Estado para modo edición
    const [isEditing, setIsEditing] = useState(false);
    const [editableEvent, setEditableEvent] = useState<Partial<Event>>({});
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

            console.log('datA: ', data)
            setEvent(data.data);

            // Si hay evento y no tiene nombre de grupo aún, sugerimos uno
            if (data && !groupName) {
                setGroupName(`${data.nombre} - ${new Date(data.fechaInicio).toLocaleDateString()}`);
            }
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
            setEditableEvent({
                nombre: event.nombre,
                descripcion: event.descripcion,
                fechaInicio: new Date(event.fechaInicio),
                fechaFin: event.fechaFin ? new Date(event.fechaFin) : undefined,
                ubicacion: { ...event.ubicacion },
                tipo: event.tipo,
                cantidadInvitados: event.cantidadInvitados,
                requiresPayment: event.requiresPayment,
                cuotaAmount: event.cuotaAmount,
                requerimientos: event.requerimientos ? { ...event.requerimientos } : undefined,
                imagen: event.imagen,
            });
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
        if (!editableEvent.nombre || !editableEvent.fechaInicio) {
            Alert.alert('Error', 'El nombre y la fecha de inicio son obligatorios');
            return;
        }

        try {
            setIsLoading(true);
            setError('');

            if (!token || !id) throw new Error('No hay sesión activa');

            await eventService.updateEvent(token, id as string, editableEvent);
            await handleRefresh();
            setIsEditing(false);

            Alert.alert('Éxito', 'Evento actualizado correctamente');
        } catch (error: any) {
            setError(error.message || 'Error al actualizar el evento');
        } finally {
            setIsLoading(false);
        }
    };

    // Función para manejar los cambios en los campos del evento
    const handleEventChange = (field: keyof Event, value: any) => {
        setEditableEvent(prev => ({ ...prev, [field]: value }));
    };

    // Función para manejar los cambios en los requerimientos
    const handleRequirementChange = (field: string, value: string) => {
        setEditableEvent(prev => ({
            ...prev,
            requerimientos: {
                ...prev.requerimientos,
                [field]: value
            }
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

    // Función para invitar a un nuevo participante
    const handleInvite = async () => {
        if (!newPhone) {
            setInviteError('Por favor ingresa un número de teléfono');
            return;
        }

        try {
            setIsLoading(true);
            setInviteError('');

            if (!token || !id) throw new Error('No hay sesión activa');

            await eventService.inviteGuests(token, id as string, [newPhone]);

            await handleRefresh();
            setInviteModalVisible(false);
            setNewPhone('');
        } catch (error: any) {
            setInviteError(error.message || 'Error al invitar');
        } finally {
            setIsLoading(false);
        }
    };

    // Función para crear un grupo de WhatsApp
    const handleCreateWhatsappGroup = async () => {
        if (!groupName.trim()) {
            Alert.alert('Error', 'El nombre del grupo es obligatorio');
            return;
        }

        try {
            setIsLoading(true);

            if (!token || !id || !event) throw new Error('No hay sesión activa o evento cargado');

            // Crear el grupo de WhatsApp
            const groupResponse = await whatsappService.createGroup(token, id as string, groupName);

            // Actualizar el evento con el ID del grupo
            const updatedEvent = await eventService.getEventById(token, id as string);
            setEvent(updatedEvent);

            setWhatsappModalVisible(false);

            // Mostrar confirmación
            Alert.alert(
                'Grupo Creado',
                'El grupo de WhatsApp ha sido creado exitosamente. Los invitados recibirán una invitación.',
                [{ text: 'OK' }]
            );
        } catch (error: any) {
            Alert.alert('Error', error.message || 'No se pudo crear el grupo de WhatsApp');
        } finally {
            setIsLoading(false);
        }
    };

    // Función para solicitar pago a un invitado
    const handleRequestPayment = async () => {
        if (!event?.requiresPayment || !event.cuotaAmount) {
            Alert.alert('Error', 'Este evento no requiere pagos');
            return;
        }

        try {
            setIsLoading(true);

            if (!token || !id) throw new Error('No hay sesión activa');

            await whatsappService.sendPaymentRequest(
                token,
                id as string,
                selectedPhone,
                event.cuotaAmount,
                paymentConcept || `Cuota para ${event.nombre}`
            );

            setShowPaymentModal(false);
            setSelectedPhone('');
            setPaymentConcept('');

            Alert.alert(
                'Solicitud Enviada',
                'La solicitud de pago ha sido enviada al invitado vía WhatsApp.',
                [{ text: 'OK' }]
            );
        } catch (error: any) {
            Alert.alert('Error', error.message || 'No se pudo enviar la solicitud de pago');
        } finally {
            setIsLoading(false);
        }
    };

    // Función para marcar a un invitado como pagado
    const handleMarkAsPaid = async (phone: string) => {
        try {
            if (!token || !id) throw new Error('No hay sesión activa');

            await eventService.markGuestAsPaid(token, id as string, phone);
            await handleRefresh();

            Alert.alert(
                'Pago Registrado',
                'El pago ha sido registrado exitosamente.',
                [{ text: 'OK' }]
            );
        } catch (error: any) {
            Alert.alert('Error', error.message || 'No se pudo registrar el pago');
        }
    };

    // Función para eliminar un invitado
    const handleRemoveGuest = (phone: string) => {
        Alert.alert(
            'Eliminar Invitado',
            '¿Estás seguro de que deseas eliminar a este invitado?',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Eliminar',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            if (!token || !id) throw new Error('No hay sesión activa');

                            await eventService.removeGuest(token, id as string, phone);
                            await handleRefresh();
                        } catch (error: any) {
                            Alert.alert('Error', error.message || 'No se pudo eliminar al invitado');
                        }
                    }
                }
            ]
        );
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
                <ActivityIndicator size="large" color="rgb(51, 18, 59)" />
                <Text style={styles.loadingText}>Cargando evento...</Text>
            </View>
        );
    }

    const formatDate = (date: Date) => {
        const d = new Date(date);
        return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
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
                    <ScrollView
                        refreshControl={
                            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
                        }
                    >
                        {error ? <Text style={styles.errorText}>{error}</Text> : null}

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
                                    <Ionicons name="image" size={40} color="#aaa" />
                                    <Text style={styles.imagePlaceholderText}>Toca para añadir imagen</Text>
                                </View>
                            )}
                            <View style={styles.imageEditOverlay}>
                                <Ionicons name="camera" size={24} color="#ffffff" />
                            </View>
                        </TouchableOpacity>

                        {/* Datos básicos */}
                        <View style={styles.editSection}>
                            <Text style={styles.editSectionTitle}>Información Básica</Text>

                            <Text style={styles.inputLabel}>Nombre del Evento*</Text>
                            <TextInput
                                style={styles.textInput}
                                value={editableEvent.nombre}
                                onChangeText={(text) => handleEventChange('nombre', text)}
                                placeholder="Nombre del evento"
                            />

                            <Text style={styles.inputLabel}>Descripción</Text>
                            <TextInput
                                style={[styles.textInput, styles.textArea]}
                                value={editableEvent.descripcion}
                                onChangeText={(text) => handleEventChange('descripcion', text)}
                                placeholder="Descripción del evento"
                                multiline
                                numberOfLines={4}
                                textAlignVertical="top"
                            />

                            <Text style={styles.inputLabel}>Tipo de Evento*</Text>
                            <TextInput
                                style={styles.textInput}
                                value={editableEvent.tipo}
                                onChangeText={(text) => handleEventChange('tipo', text)}
                                placeholder="Tipo de evento"
                            />

                            <Text style={styles.inputLabel}>Cantidad de Invitados</Text>
                            <TextInput
                                style={styles.textInput}
                                value={editableEvent.cantidadInvitados?.toString()}
                                onChangeText={(text) => handleEventChange('cantidadInvitados', parseInt(text) || 0)}
                                placeholder="Cantidad de invitados"
                                keyboardType="number-pad"
                            />
                        </View>

                        {/* Fechas */}
                        {/* <View style={styles.editSection}>
                            <Text style={styles.editSectionTitle}>Fechas</Text>

                            <Text style={styles.inputLabel}>Fecha y Hora de Inicio*</Text>
                            <TouchableOpacity
                                style={styles.datePickerButton}
                                onPress={() => {
                                    if (Platform.OS === 'android') {
                                        DateTimePickerAndroid.open({
                                            value: editableEvent.fechaInicio || new Date(),
                                            onChange: (event, date) => {
                                                if (date) handleDateChange('fechaInicio', date);
                                            },
                                            mode: 'datetime'
                                        });
                                    } else {
                                        setShowDatePickerStart(true);
                                    }
                                }}
                            >
                                <Text style={styles.datePickerText}>
                                    {editableEvent.fechaInicio ? formatDate(editableEvent.fechaInicio) : "Seleccionar fecha y hora"}
                                </Text>
                                <Ionicons name="calendar" size={20} color="rgb(71, 25, 82)" />
                            </TouchableOpacity>

                            <Text style={styles.inputLabel}>Fecha y Hora de Fin</Text>
                            <TouchableOpacity
                                style={styles.datePickerButton}
                                onPress={() => {
                                    if (Platform.OS === 'android') {
                                        DateTimePickerAndroid.open({
                                            value: editableEvent.fechaFin || new Date(),
                                            onChange: (event, date) => {
                                                if (date) handleDateChange('fechaFin', date);
                                            },
                                            mode: 'datetime'
                                        });
                                    } else {
                                        setShowDatePickerEnd(true);
                                    }
                                }}
                            >
                                <Text style={styles.datePickerText}>
                                    {editableEvent.fechaFin ? formatDate(editableEvent.fechaFin) : "Seleccionar fecha y hora (opcional)"}
                                </Text>
                                <Ionicons name="calendar" size={20} color="rgb(71, 25, 82)" />
                            </TouchableOpacity>

                            {Platform.OS === 'ios' && showDatePickerStart && (
                                <DateTimePickerIOS
                                    value={editableEvent.fechaInicio || new Date()}
                                    mode="datetime"
                                    display="spinner"
                                    onChange={(event, date) => {
                                        if (date) handleDateChange('fechaInicio', date);
                                    }}
                                    style={styles.iOSDatePicker}
                                />
                            )}

                            {Platform.OS === 'ios' && showDatePickerEnd && (
                                <DateTimePickerIOS
                                    value={editableEvent.fechaFin || new Date()}
                                    mode="datetime"
                                    display="spinner"
                                    onChange={(event, date) => {
                                        if (date) handleDateChange('fechaFin', date);
                                    }}
                                    style={styles.iOSDatePicker}
                                />
                            )}
                        </View> */}

                        {/* Ubicación */}
                        <View style={styles.editSection}>
                            <Text style={styles.editSectionTitle}>Ubicación</Text>

                            <Text style={styles.inputLabel}>Dirección*</Text>
                            <TextInput
                                style={styles.textInput}
                                value={editableEvent.ubicacion?.address}
                                onChangeText={(text) => handleEventChange('ubicacion', {
                                    ...editableEvent.ubicacion,
                                    address: text
                                })}
                                placeholder="Dirección del evento"
                            />

                            {/* Aquí podría ir un mapa para seleccionar ubicación */}
                        </View>

                        {/* Requerimientos */}
                        <View style={styles.editSection}>
                            <Text style={styles.editSectionTitle}>Requerimientos</Text>

                            <Text style={styles.inputLabel}>Código de Vestimenta</Text>
                            <TextInput
                                style={styles.textInput}
                                value={editableEvent.requerimientos?.codigoVestimenta}
                                onChangeText={(text) => handleRequirementChange('codigoVestimenta', text)}
                                placeholder="Código de vestimenta"
                            />

                            <Text style={styles.inputLabel}>Alimentación</Text>
                            <TextInput
                                style={styles.textInput}
                                value={editableEvent.requerimientos?.alimentacion}
                                onChangeText={(text) => handleRequirementChange('alimentacion', text)}
                                placeholder="Información sobre alimentación"
                            />

                            <Text style={styles.inputLabel}>Edad Mínima</Text>
                            <TextInput
                                style={styles.textInput}
                                value={editableEvent.requerimientos?.edadMinima}
                                onChangeText={(text) => handleRequirementChange('edadMinima', text)}
                                placeholder="Edad mínima requerida"
                            />

                            <Text style={styles.inputLabel}>Llevar</Text>
                            <TextInput
                                style={styles.textInput}
                                value={editableEvent.requerimientos?.llevar}
                                onChangeText={(text) => handleRequirementChange('llevar', text)}
                                placeholder="Qué deben llevar los invitados"
                            />
                        </View>

                        {/* Pago */}
                        <View style={styles.editSection}>
                            <Text style={styles.editSectionTitle}>Información de Pago</Text>

                            <View style={styles.switchContainer}>
                                <Text style={styles.switchLabel}>Requiere Pago</Text>
                                <Switch
                                    value={editableEvent.requiresPayment}
                                    onValueChange={(value) => handleEventChange('requiresPayment', value)}
                                    trackColor={{ false: '#d0d0d0', true: 'rgb(71, 25, 82)' }}
                                    thumbColor={editableEvent.requiresPayment ? 'rgb(51, 18, 59)' : '#f4f3f4'}
                                />
                            </View>

                            {editableEvent.requiresPayment && (
                                <>
                                    <Text style={styles.inputLabel}>Monto de Cuota</Text>
                                    <TextInput
                                        style={styles.textInput}
                                        value={editableEvent.cuotaAmount?.toString()}
                                        onChangeText={(text) => handleEventChange('cuotaAmount', parseFloat(text) || 0)}
                                        placeholder="Monto de la cuota"
                                        keyboardType="numeric"
                                    />
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
                            <Ionicons name="trash" size={20} color="#fff" />
                            <Text style={styles.deleteEventText}>Eliminar Evento</Text>
                        </TouchableOpacity>
                    </ScrollView>

                    {/* Modal para seleccionar/tomar imagen */}
                    <Modal
                        visible={showImagePickerModal}
                        transparent={true}
                        animationType="slide"
                        onRequestClose={() => setShowImagePickerModal(false)}
                    >
                        <View style={styles.modalContainer}>
                            <View style={styles.modalContent}>
                                <Text style={styles.modalTitle}>Cambiar Imagen</Text>

                                <TouchableOpacity
                                    style={styles.imagePickerOption}
                                    onPress={pickImage}
                                >
                                    <Ionicons name="images" size={24} color="rgb(71, 25, 82)" />
                                    <Text style={styles.imagePickerOptionText}>Seleccionar de la galería</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.imagePickerOption}
                                    onPress={takePhoto}
                                >
                                    <Ionicons name="camera" size={24} color="rgb(71, 25, 82)" />
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
                                        <Ionicons name="trash" size={24} color="#ff4646" />
                                        <Text style={styles.removeImageText}>Eliminar imagen</Text>
                                    </TouchableOpacity>
                                )}

                                <TouchableOpacity
                                    style={[styles.modalButton, styles.cancelButton, { marginTop: 15 }]}
                                    onPress={() => setShowImagePickerModal(false)}
                                >
                                    <Text style={styles.cancelButtonText}>Cancelar</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </Modal>
                </KeyboardAvoidingView>
            );
        } else {
            // MODO VISUALIZACIÓN
            return (
                <ScrollView
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
                    }
                >
                    {error ? <Text style={styles.errorText}>{error}</Text> : null}

                    {/* Cabecera del evento */}
                    <View style={styles.headerSection}>
                        {event.imagen ? (
                            <Image
                                source={{ uri: event.imagen }}
                                style={styles.eventImage}
                                resizeMode="cover"
                            />
                        ) : (
                            <View style={styles.imagePlaceholder}>
                                <Ionicons name="calendar" size={40} color="#aaa" />
                            </View>
                        )}

                        <Text style={styles.description}>{event.descripcion}</Text>

                        <View style={styles.statusBadge}>
                            <Text style={styles.statusText}>
                                {event.status.toUpperCase()}
                            </Text>
                        </View>

                        {/* Botón de editar */}
                        <TouchableOpacity
                            style={styles.editEventButton}
                            onPress={handleStartEditing}
                        >
                            <Ionicons name="create" size={16} color="#ffffff" />
                            <Text style={styles.editEventText}>Editar</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Información del evento */}
                    <View style={styles.infoCard}>
                        <Text style={styles.sectionTitle}>Detalles del Evento</Text>
                        <View style={styles.infoRow}>
                            <Ionicons name="calendar" size={18} color="rgb(71, 25, 82)" />
                            <Text style={styles.infoText}>
                                Inicio: {formatDate(event.fechaInicio)}
                            </Text>
                        </View>

                        {event.fechaFin && (
                            <View style={styles.infoRow}>
                                <Ionicons name="time" size={18} color="rgb(71, 25, 82)" />
                                <Text style={styles.infoText}>
                                    Fin: {formatDate(event.fechaFin)}
                                </Text>
                            </View>
                        )}

                        <View style={styles.infoRow}>
                            <Ionicons name="location" size={18} color="rgb(71, 25, 82)" />
                            <Text style={styles.infoText}>{event.ubicacion.address}</Text>
                        </View>

                        <View style={styles.infoRow}>
                            <Ionicons name="people" size={18} color="rgb(71, 25, 82)" />
                            <Text style={styles.infoText}>
                                {event.cantidadInvitados} invitados esperados, {event.invitados.length} registrados
                            </Text>
                        </View>

                        {event.requiresPayment && event.cuotaAmount && (
                            <View style={styles.infoRow}>
                                <Ionicons name="cash" size={18} color="rgb(71, 25, 82)" />
                                <Text style={styles.infoText}>
                                    Cuota: ${event.cuotaAmount} por persona
                                </Text>
                            </View>
                        )}

                        {event.requerimientos && (
                            <View style={styles.requirementsSection}>
                                <Text style={styles.requirementsTitle}>Requerimientos:</Text>

                                {event.requerimientos.codigoVestimenta && (
                                    <View style={styles.requirementRow}>
                                        <Ionicons name="shirt" size={16} color="#666" />
                                        <Text style={styles.requirementText}>
                                            Código de vestimenta: {event.requerimientos.codigoVestimenta}
                                        </Text>
                                    </View>
                                )}

                                {event.requerimientos.alimentacion && (
                                    <View style={styles.requirementRow}>
                                        <Ionicons name="restaurant" size={16} color="#666" />
                                        <Text style={styles.requirementText}>
                                            Alimentación: {event.requerimientos.alimentacion}
                                        </Text>
                                    </View>
                                )}

                                {event.requerimientos.edadMinima && (
                                    <View style={styles.requirementRow}>
                                        <Ionicons name="person" size={16} color="#666" />
                                        <Text style={styles.requirementText}>
                                            Edad mínima: {event.requerimientos.edadMinima}
                                        </Text>
                                    </View>
                                )}

                                {event.requerimientos.llevar && (
                                    <View style={styles.requirementRow}>
                                        <Ionicons name="bag" size={16} color="#666" />
                                        <Text style={styles.requirementText}>
                                            Llevar: {event.requerimientos.llevar}
                                        </Text>
                                    </View>
                                )}
                            </View>
                        )}
                    </View>

                    {/* Sección de WhatsApp */}
                    <View style={styles.whatsappSection}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Grupo de WhatsApp</Text>
                            {!event.whatsappGroupId && (
                                <TouchableOpacity
                                    style={styles.addButton}
                                    onPress={() => setWhatsappModalVisible(true)}
                                >
                                    <Text style={styles.addButtonText}>+ Crear Grupo</Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        {event.whatsappGroupId ? (
                            <View style={styles.whatsappCard}>
                                <View style={styles.whatsappInfo}>
                                    <Ionicons name="logo-whatsapp" size={24} color="#25D366" />
                                    <Text style={styles.whatsappText}>
                                        Grupo activo para este evento
                                    </Text>
                                </View>

                                <TouchableOpacity
                                    style={styles.whatsappButton}
                                    onPress={() => Linking.openURL(`https://wa.me/?text=¡Te invito a unirte al grupo para ${event.nombre}!`)}
                                >
                                    <Text style={styles.whatsappButtonText}>Abrir WhatsApp</Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <Text style={styles.emptyText}>
                                No hay grupo de WhatsApp creado para este evento.
                            </Text>
                        )}
                    </View>

                    {/* Sección de Encuestas */}
                    {token && <PollSection event={event} token={token} onRefresh={handleRefresh} />}

                    {/* Sección de Invitados */}
                    <View style={styles.guestsSection}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Invitados</Text>
                            <TouchableOpacity
                                style={styles.addButton}
                                onPress={() => setInviteModalVisible(true)}
                            >
                                <Text style={styles.addButtonText}>+ Invitar</Text>
                            </TouchableOpacity>
                        </View>

                        {event.invitados.length > 0 ? (
                            event.invitados.map((invitado, index) => (
                                <View key={index} style={styles.guestCard}>
                                    <View style={styles.guestInfo}>
                                        <Text style={styles.guestPhone}>{invitado.phone}</Text>
                                        <View style={[
                                            styles.guestStatusBadge,
                                            invitado.status === 'confirmed' ? styles.confirmedStatus :
                                                invitado.status === 'declined' ? styles.declinedStatus :
                                                    styles.pendingStatus
                                        ]}>
                                            <Text style={styles.guestStatusText}>
                                                {invitado.status === 'confirmed' ? 'CONFIRMADO' :
                                                    invitado.status === 'declined' ? 'RECHAZADO' :
                                                        invitado.status === 'registered' ? 'REGISTRADO' : 'PENDIENTE'}
                                            </Text>
                                        </View>
                                    </View>

                                    <View style={styles.guestActions}>
                                        {event.requiresPayment && (
                                            invitado.hasPaid ? (
                                                <View style={styles.paidBadge}>
                                                    <Ionicons name="checkmark-circle" size={18} color="#ffffff" />
                                                    <Text style={styles.paidText}>PAGADO</Text>
                                                </View>
                                            ) : (
                                                <View style={styles.guestActionButtons}>
                                                    <TouchableOpacity
                                                        style={styles.actionButton}
                                                        onPress={() => {
                                                            setSelectedPhone(invitado.phone);
                                                            setPaymentConcept(`Cuota para ${event.nombre}`);
                                                            setShowPaymentModal(true);
                                                        }}
                                                    >
                                                        <Ionicons name="cash-outline" size={18} color="rgb(71, 25, 82)" />
                                                    </TouchableOpacity>

                                                    <TouchableOpacity
                                                        style={styles.actionButton}
                                                        onPress={() => handleMarkAsPaid(invitado.phone)}
                                                    >
                                                        <Ionicons name="checkmark-circle-outline" size={18} color="rgb(71, 25, 82)" />
                                                    </TouchableOpacity>
                                                </View>
                                            )
                                        )}

                                        <TouchableOpacity
                                            style={styles.actionButton}
                                            onPress={() => handleRemoveGuest(invitado.phone)}
                                        >
                                            <Ionicons name="close-circle-outline" size={18} color="#ff4646" />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ))
                        ) : (
                            <Text style={styles.emptyText}>No hay invitados registrados</Text>
                        )}
                    </View>
                </ScrollView>
            );
        }
    };

    return (
        <>
            <Stack.Screen
                options={{
                    headerTitle: isEditing ? 'Editar Evento' : event.nombre,
                    headerShown: true,
                    headerTintColor: 'rgb(51, 18, 59)',
                }}
            />

            <View style={styles.container}>
                {renderContent()}

                {/* Modal para invitar */}
                <Modal
                    animationType="slide"
                    transparent={true}
                    visible={inviteModalVisible}
                    onRequestClose={() => setInviteModalVisible(false)}
                >
                    <View style={styles.modalContainer}>
                        <View style={styles.modalContent}>
                            <Text style={styles.modalTitle}>Invitar Persona</Text>

                            {inviteError ? (
                                <Text style={styles.errorText}>{inviteError}</Text>
                            ) : null}

                            <TextInput
                                style={styles.input}
                                placeholder="Número de teléfono (con código de país)"
                                placeholderTextColor="#666"
                                value={newPhone}
                                onChangeText={setNewPhone}
                                keyboardType="phone-pad"
                            />

                            <View style={styles.modalButtons}>
                                <TouchableOpacity
                                    style={[styles.modalButton, styles.cancelButton]}
                                    onPress={() => setInviteModalVisible(false)}
                                >
                                    <Text style={styles.cancelButtonText}>Cancelar</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.modalButton, styles.inviteButton]}
                                    onPress={handleInvite}
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <ActivityIndicator size="small" color="#ffffff" />
                                    ) : (
                                        <Text style={styles.inviteButtonText}>Invitar</Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>

                {/* Modal para crear grupo de WhatsApp */}
                <Modal
                    animationType="slide"
                    transparent={true}
                    visible={whatsappModalVisible}
                    onRequestClose={() => setWhatsappModalVisible(false)}
                >
                    <View style={styles.modalContainer}>
                        <View style={styles.modalContent}>
                            <Text style={styles.modalTitle}>Crear Grupo de WhatsApp</Text>

                            <TextInput
                                style={styles.input}
                                placeholder="Nombre del grupo"
                                placeholderTextColor="#666"
                                value={groupName}
                                onChangeText={setGroupName}
                            />

                            <View style={styles.modalButtons}>
                                <TouchableOpacity
                                    style={[styles.modalButton, styles.cancelButton]}
                                    onPress={() => setWhatsappModalVisible(false)}
                                >
                                    <Text style={styles.cancelButtonText}>Cancelar</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.modalButton, styles.inviteButton]}
                                    onPress={handleCreateWhatsappGroup}
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <ActivityIndicator size="small" color="#ffffff" />
                                    ) : (
                                        <Text style={styles.inviteButtonText}>Crear Grupo</Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>

                {/* Modal para solicitar pago */}
                <Modal
                    animationType="slide"
                    transparent={true}
                    visible={showPaymentModal}
                    onRequestClose={() => setShowPaymentModal(false)}
                >
                    <View style={styles.modalContainer}>
                        <View style={styles.modalContent}>
                            <Text style={styles.modalTitle}>Solicitar Pago</Text>

                            <Text style={styles.paymentModalSubtitle}>
                                Solicitando pago a: {selectedPhone}
                            </Text>

                            <Text style={styles.paymentModalSubtitle}>
                                Monto: ${event.cuotaAmount}
                            </Text>

                            <TextInput
                                style={styles.input}
                                placeholder="Concepto del pago (opcional)"
                                placeholderTextColor="#666"
                                value={paymentConcept}
                                onChangeText={setPaymentConcept}
                            />

                            <View style={styles.modalButtons}>
                                <TouchableOpacity
                                    style={[styles.modalButton, styles.cancelButton]}
                                    onPress={() => setShowPaymentModal(false)}
                                >
                                    <Text style={styles.cancelButtonText}>Cancelar</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.modalButton, styles.inviteButton]}
                                    onPress={handleRequestPayment}
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <ActivityIndicator size="small" color="#ffffff" />
                                    ) : (
                                        <Text style={styles.inviteButtonText}>Solicitar Pago</Text>
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

// Estilos completos para la pantalla de detalle editable
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
        marginTop: 10,
        fontSize: 16,
        color: 'rgb(71, 25, 82)',
    },
    headerSection: {
        padding: 15,
        position: 'relative',
    },
    eventImage: {
        width: '100%',
        height: 180,
        borderRadius: 10,
        marginBottom: 15,
    },
    imagePlaceholder: {
        width: '100%',
        height: 180,
        borderRadius: 10,
        backgroundColor: '#e0e0e0',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 15,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: 'rgb(51, 18, 59)',
        marginBottom: 10,
    },
    statusBadge: {
        position: 'absolute',
        top: 25,
        right: 25,
        backgroundColor: 'rgb(51, 18, 59)',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 15,
    },
    statusText: {
        color: '#ffffff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    description: {
        fontSize: 16,
        color: '#666',
        marginBottom: 10,
    },
    infoCard: {
        backgroundColor: '#ffffff',
        margin: 15,
        padding: 15,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: 'rgb(71, 25, 82)',
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
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    infoText: {
        fontSize: 15,
        color: '#333',
        marginLeft: 10,
        flex: 1,
    },
    requirementsSection: {
        marginTop: 10,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: '#eee',
    },
    requirementsTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#666',
        marginBottom: 8,
    },
    requirementRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 5,
    },
    requirementText: {
        fontSize: 14,
        color: '#666',
        marginLeft: 8,
    },
    whatsappSection: {
        margin: 15,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    addButton: {
        backgroundColor: 'rgb(51, 18, 59)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    addButtonText: {
        color: '#ffffff',
        fontSize: 13,
        fontWeight: 'bold',
    },
    whatsappCard: {
        backgroundColor: '#ffffff',
        padding: 15,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#25D366',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    whatsappInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    whatsappText: {
        fontSize: 15,
        color: '#333',
        marginLeft: 10,
    },
    whatsappButton: {
        backgroundColor: '#25D366',
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 20,
    },
    whatsappButtonText: {
        color: '#ffffff',
        fontSize: 13,
        fontWeight: 'bold',
    },
    sectionContainer: {
        margin: 15,
    },
    pollCard: {
        backgroundColor: '#ffffff',
        padding: 15,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: 'rgb(71, 25, 82)',
        marginBottom: 10,
    },
    pollQuestion: {
        fontSize: 16,
        fontWeight: 'bold',
        color: 'rgb(51, 18, 59)',
        marginBottom: 10,
    },
    pollOption: {
        marginBottom: 8,
    },
    pollOptionText: {
        fontSize: 14,
        color: '#333',
        marginBottom: 4,
    },
    pollBar: {
        height: 15,
        backgroundColor: '#eee',
        borderRadius: 7.5,
        overflow: 'hidden',
    },
    pollBarFill: {
        height: '100%',
        backgroundColor: 'rgb(71, 25, 82)',
        borderRadius: 7.5,
    },
    pollCount: {
        fontSize: 12,
        color: '#666',
        marginTop: 2,
        textAlign: 'right',
    },
    emptyText: {
        fontSize: 15,
        color: '#999',
        textAlign: 'center',
        marginVertical: 15,
    },
    guestsSection: {
        margin: 15,
    },
    guestCard: {
        backgroundColor: '#ffffff',
        padding: 15,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: 'rgb(71, 25, 82)',
        marginBottom: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    guestInfo: {
        flex: 1,
    },
    guestPhone: {
        fontSize: 15,
        color: '#333',
        marginBottom: 5,
    },
    guestStatusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 10,
        alignSelf: 'flex-start',
    },
    pendingStatus: {
        backgroundColor: '#ffc107',
    },
    confirmedStatus: {
        backgroundColor: '#28a745',
    },
    declinedStatus: {
        backgroundColor: '#dc3545',
    },
    guestStatusText: {
        fontSize: 10,
        color: '#ffffff',
        fontWeight: 'bold',
    },
    guestActions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    paidBadge: {
        backgroundColor: '#28a745',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 10,
        flexDirection: 'row',
        alignItems: 'center',
    },
    paidText: {
        fontSize: 10,
        color: '#ffffff',
        fontWeight: 'bold',
        marginLeft: 3,
    },
    guestActionButtons: {
        flexDirection: 'row',
    },
    actionButton: {
        padding: 8,
        marginLeft: 5,
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
        width: '85%',
        maxWidth: 400,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: 'rgb(51, 18, 59)',
        marginBottom: 20,
        textAlign: 'center',
    },
    modalSubtitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#666',
        marginTop: 10,
        marginBottom: 8,
    },
    paymentModalSubtitle: {
        fontSize: 15,
        color: '#333',
        marginBottom: 8,
    },
    input: {
        width: '100%',
        height: 45,
        backgroundColor: '#ffffff',
        borderRadius: 8,
        paddingHorizontal: 12,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: 'rgb(71, 25, 82)',
    },
    optionContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    optionInput: {
        flex: 1,
        height: 40,
        backgroundColor: '#ffffff',
        borderRadius: 8,
        paddingHorizontal: 12,
        borderWidth: 1,
        borderColor: 'rgb(71, 25, 82)',
    },
    removeButton: {
        padding: 5,
        marginLeft: 8,
    },
    addOptionButton: {
        padding: 10,
        alignItems: 'center',
        marginBottom: 15,
    },
    addOptionText: {
        color: 'rgb(71, 25, 82)',
        fontSize: 14,
        fontWeight: 'bold',
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    modalButton: {
        flex: 1,
        height: 40,
        borderRadius: 8,
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
    createButton: {
        backgroundColor: 'rgb(51, 18, 59)',
    },
    cancelButtonText: {
        color: 'rgb(71, 25, 82)',
        fontSize: 15,
        fontWeight: 'bold',
    },
    inviteButtonText: {
        color: '#ffffff',
        fontSize: 15,
        fontWeight: 'bold',
    },
    createButtonText: {
        color: '#ffffff',
        fontSize: 15,
        fontWeight: 'bold',
    },

    // Estilos adicionales para el modo de edición
    editSection: {
        backgroundColor: '#ffffff',
        padding: 15,
        marginHorizontal: 15,
        marginBottom: 15,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    editSectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: 'rgb(51, 18, 59)',
        marginBottom: 15,
    },
    inputLabel: {
        fontSize: 14,
        color: '#666',
        marginBottom: 5,
    },
    textInput: {
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: '#d0d0d0',
        borderRadius: 8,
        height: 45,
        paddingHorizontal: 12,
        marginBottom: 15,
        fontSize: 16,
        color: '#333',
    },
    textArea: {
        height: 100,
        paddingTop: 12,
        textAlignVertical: 'top',
    },
    switchContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    switchLabel: {
        fontSize: 16,
        color: '#333',
    },
    datePickerButton: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: '#d0d0d0',
        borderRadius: 8,
        height: 45,
        paddingHorizontal: 12,
        marginBottom: 15,
    },
    datePickerText: {
        fontSize: 16,
        color: '#333',
    },
    iOSDatePicker: {
        marginBottom: 15,
    },
    editActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginHorizontal: 15,
        marginBottom: 15,
    },
    editActionButton: {
        flex: 1,
        height: 50,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginHorizontal: 5,
    },
    cancelEditButton: {
        backgroundColor: '#f0f0f0',
        borderWidth: 1,
        borderColor: '#d0d0d0',
    },
    saveEditButton: {
        backgroundColor: 'rgb(51, 18, 59)',
    },
    cancelEditButtonText: {
        fontSize: 16,
        color: '#666',
        fontWeight: '500',
    },
    saveEditButtonText: {
        fontSize: 16,
        color: '#ffffff',
        fontWeight: '500',
    },
    deleteEventButton: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#ff4646',
        paddingVertical: 12,
        marginHorizontal: 15,
        marginBottom: 30,
        borderRadius: 10,
    },
    deleteEventText: {
        fontSize: 16,
        color: '#ffffff',
        fontWeight: '500',
        marginLeft: 8,
    },
    imageEditContainer: {
        position: 'relative',
        margin: 15,
    },
    imageEditOverlay: {
        position: 'absolute',
        right: 10,
        bottom: 10,
        backgroundColor: 'rgba(0,0,0,0.5)',
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    imagePlaceholderText: {
        color: '#aaa',
        marginTop: 10,
    },
    imagePickerOption: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    imagePickerOptionText: {
        fontSize: 16,
        color: '#333',
        marginLeft: 15,
    },
    removeImageOption: {
        borderBottomWidth: 0,
    },
    removeImageText: {
        fontSize: 16,
        color: '#ff4646',
        marginLeft: 15,
    },
    editEventButton: {
        position: 'absolute',
        top: 15,
        right: 15,
        backgroundColor: 'rgb(51, 18, 59)',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    editEventText: {
        color: '#ffffff',
        fontSize: 13,
        fontWeight: 'bold',
        marginLeft: 4,
    }
});