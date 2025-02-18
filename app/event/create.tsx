import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    Switch,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    FlatList,
} from 'react-native';
import { router } from 'expo-router';
import CustomDropdown from '@/components/CustomDropdown';
import { eventService } from '@/services/event.service';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Image } from 'expo-image';
import MapComponent from '@/components/MapComponent';
import * as ImagePicker from 'expo-image-picker';
import { API_URL } from '@/constants';

// Types
interface Product {
    externalId: string;
    name: string;
    brand: string;
    imageUrl: string;
    price: number;
}

interface EventForm {
    imagen: string;
    nombre: string;
    descripcion: string;
    fecha: Date;
    duracion: string;
    tipo: string;
    ubicacion: {
        coordinates: [number, number];
        address: string;
    };
    productos: Product[];
    cantidadInvitados: string;
    notasAdicionales: string;
    requerimientos: {
        codigoVestimenta: string;
        alimentacion: string; // restricciones dietéticas, alergias
        edadMinima: string;
        llevar: string; // cosas que deben traer los invitados
    };
    requiresPayment: boolean;
    cuotaAmount: string;
    cuotaCalculada: {
        totalProductos: number;
        cuotaPorPersona: number;
        cantidadPersonas: number;
    };
}

const INITIAL_FORM_STATE: EventForm = {
    imagen: '',
    nombre: '',
    descripcion: '',
    fecha: new Date(),
    duracion: '',
    tipo: '',
    ubicacion: {
        coordinates: [0, 0],
        address: '',
    },
    productos: [],
    cantidadInvitados: '0',
    notasAdicionales: '',
    requerimientos: {
        codigoVestimenta: '',
        alimentacion: '',
        edadMinima: '',
        llevar: ''
    },
    requiresPayment: false,
    cuotaAmount: '0',
    cuotaCalculada: {
        totalProductos: 0,
        cuotaPorPersona: 0,
        cantidadPersonas: 0
    }
};

const EVENT_TYPES = [
    { label: 'Asado', value: 'asado' },
    { label: 'Cumpleaños', value: 'cumpleanos' },
    { label: 'Reunión', value: 'reunion' }
];

const INITIAL_COORDINATES = {
    latitude: -33.441622,
    longitude: -70.654049
};

export default function CreateEventScreen() {
    const [form, setForm] = useState<EventForm>(INITIAL_FORM_STATE);
    const searchInputRef = useRef<TextInput>(null);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<Product[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    useEffect(() => {
        if (form.requiresPayment) {
            const calculoCuota = calcularCuota(form.productos, form.cantidadInvitados);
            updateForm('cuotaCalculada', calculoCuota);
            updateForm('cuotaAmount', calculoCuota.cuotaPorPersona.toString());
        }
    }, [form.productos, form.cantidadInvitados, form.requiresPayment]);

    const calcularCuota = (productos: Product[], cantidadInvitados: string) => {
        const totalProductos = productos.reduce((sum, product) => sum + product.price, 0);
        const cantidadPersonas = parseInt(cantidadInvitados) || 0;
        const cuotaPorPersona = cantidadPersonas > 0 ? totalProductos / cantidadPersonas : 0;

        return {
            totalProductos,
            cuotaPorPersona,
            cantidadPersonas
        };
    };

    // Handlers
    const updateForm = useCallback((field: keyof EventForm, value: any) => {
        setForm(prev => ({ ...prev, [field]: value }));
    }, []);

    // Simplificamos el manejo del cambio de texto
    const handleSearchChange = useCallback((text: string) => {
        setSearchQuery(text);
    }, []);

    // Handler de búsqueda al presionar el botón
    const handleSearch = useCallback(async () => {
        if (!searchQuery.trim() || searchQuery.length < 3) {
            setError('Ingresa al menos 3 caracteres para buscar');
            setSearchResults([]);
            return;
        }

        setError('');
        setIsSearching(true);

        try {
            const response = await fetch(`${API_URL}/products/${searchQuery}`);
            const data = await response.json();

            if (data.success) {
                setSearchResults(data.data);
            }
        } catch (error) {
            console.error('Error searching products:', error);
            setError('Error al buscar productos');
        } finally {
            setIsSearching(false);
        }
    }, [searchQuery]);

    const handleLocationSelect = useCallback((lat: number, lng: number) => {
        updateForm('ubicacion', {
            coordinates: [lat, lng],
            address: 'Dirección pendiente' // Ideally use a geocoding service here
        });
    }, [updateForm]);

    const handleAddProduct = useCallback((product: Product) => {
        updateForm('productos', [...form.productos, product]);
    }, [form.productos, updateForm]);

    const handleRemoveProduct = useCallback((externalId: string) => {
        updateForm('productos', form.productos.filter(p => p.externalId !== externalId));
    }, [form.productos, updateForm]);

    const handleDateChange = useCallback((event: any, selectedDate?: Date) => {
        setShowDatePicker(false);
        if (selectedDate) {
            updateForm('fecha', selectedDate);
        }
    }, [updateForm]);

    const validateForm = useCallback(() => {
        if (!form.nombre.trim()) {
            setError('El nombre del evento es requerido');
            return false;
        }
        if (!form.ubicacion.address) {
            setError('La ubicación es requerida');
            return false;
        }
        if (!form.tipo) {
            setError('El tipo de evento es requerido');
            return false;
        }
        if (form.requiresPayment && (!form.cuotaAmount || parseFloat(form.cuotaAmount) <= 0)) {
            setError('Ingresa un monto válido para la cuota');
            return false;
        }
        return true;
    }, [form]);

    const handleSubmit = async () => {
        if (!validateForm()) return;

        try {
            setIsLoading(true);
            setError('');
            const token = await AsyncStorage.getItem('userToken');
            if (!token) throw new Error('No hay sesión activa');

            await eventService.createEvent(token, {
                ...form,
                cuotaAmount: form.requiresPayment ? parseFloat(form.cuotaAmount) : 0,
                cantidadInvitados: parseInt(form.cantidadInvitados) || 0
            });
            router.back();
        } catch (error: any) {
            setError(error.message || 'Error al crear el evento');
        } finally {
            setIsLoading(false);
        }
    };

    // Render Components
    const renderProductItem = useCallback(({ item }: { item: Product }) => (
        <View style={styles.selectedProduct}>
            <Image
                source={{ uri: item.imageUrl }}
                style={styles.selectedProductImage}
                contentFit="cover"
            />
            <View style={styles.selectedProductInfo}>
                <Text style={styles.selectedProductName}>{item.name}</Text>
                <Text style={styles.selectedProductPrice}>
                    ${item.price.toLocaleString()}
                </Text>
            </View>
            <TouchableOpacity
                onPress={() => handleRemoveProduct(item.externalId)}
                style={styles.removeButton}
            >
                <Text style={styles.removeButtonText}>×</Text>
            </TouchableOpacity>
        </View>
    ), [handleRemoveProduct]);

    const renderSearchResults = useCallback(() => (
        <>
            {isSearching && (
                <ActivityIndicator color="rgb(51, 18, 59)" style={styles.loader} />
            )}

            {searchResults.length > 0 && (
                <View style={styles.searchResults}>
                    {searchResults.map((item) => (
                        <TouchableOpacity
                            key={item.externalId}
                            style={styles.searchResultItem}
                            onPress={() => handleAddProduct(item)}
                        >
                            <Image
                                source={{ uri: item.imageUrl }}
                                style={styles.productImage}
                                contentFit="cover"
                            />
                            <View style={styles.productInfo}>
                                <Text style={styles.productName}>{item.name}</Text>
                                <Text style={styles.productBrand}>{item.brand}</Text>
                                <Text style={styles.productPrice}>
                                    ${item.price.toLocaleString()}
                                </Text>
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>
            )}
        </>
    ), [searchResults, isSearching, handleAddProduct]);

    const renderDatePicker = useCallback(() => (
        Platform.OS === 'web' ? (
            <View style={styles.dateTimeContainer}>
                <View style={styles.dateInputContainer}>
                    <Text style={styles.dateButtonLabel}>Fecha</Text>
                    <input
                        style={styles.dateInput}
                        type="date"
                        value={form.fecha.toISOString().split('T')[0]}
                        onChange={(e) => {
                            const newDate = new Date(form.fecha);
                            const [year, month, day] = e.target.value.split('-');
                            newDate.setFullYear(parseInt(year));
                            newDate.setMonth(parseInt(month) - 1);
                            newDate.setDate(parseInt(day));
                            updateForm('fecha', newDate);
                        }}
                    />
                </View>
                <View style={styles.dateInputContainer}>
                    <Text style={styles.dateButtonLabel}>Hora</Text>
                    <TouchableOpacity
                        style={styles.dateInput}
                        onPress={() => {
                            const timeString = prompt("Ingresa la hora (HH:MM)",
                                form.fecha.toTimeString().slice(0, 5));
                            if (timeString) {
                                const [hours, minutes] = timeString.split(':');
                                const newDate = new Date(form.fecha);
                                newDate.setHours(parseInt(hours));
                                newDate.setMinutes(parseInt(minutes));
                                updateForm('fecha', newDate);
                            }
                        }}
                    >
                        <Text>{form.fecha.toTimeString().slice(0, 5)}</Text>
                    </TouchableOpacity>
                </View>
            </View>
        ) : (
            <>
                <TouchableOpacity
                    style={styles.dateButton}
                    onPress={() => setShowDatePicker(true)}
                >
                    <Text style={styles.dateButtonLabel}>Fecha del evento</Text>
                    <Text style={styles.dateButtonText}>
                        {form.fecha.toLocaleDateString()} {form.fecha.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                </TouchableOpacity>

                {showDatePicker && (
                    <DateTimePicker
                        value={form.fecha}
                        mode="datetime"
                        display="default"
                        onChange={handleDateChange}
                        minimumDate={new Date()}
                    />
                )}
            </>
        )
    ), [form.fecha, showDatePicker, handleDateChange, updateForm]);

    const renderHeader = useMemo(() => (
        <View style={styles.innerContainer}>
            <Text style={styles.title}>Crear Evento</Text>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <View style={styles.imageContainer}>
                <TouchableOpacity
                    style={styles.imageSelector}
                    onPress={async () => {
                        // Solicitar permisos
                        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
                        if (status !== 'granted') {
                            setError('Se necesitan permisos para acceder a la galería');
                            return;
                        }

                        // Abrir selector de imagen
                        const result = await ImagePicker.launchImageLibraryAsync({
                            mediaTypes: ImagePicker.MediaTypeOptions.Images,
                            allowsEditing: true,
                            aspect: [16, 9],
                            quality: 0.8,
                        });

                        if (!result.canceled) {
                            updateForm('imagen', result.assets[0].uri);
                        }
                    }}
                >
                    {form.imagen ? (
                        <Image
                            source={{ uri: form.imagen }}
                            style={styles.eventImage}
                            contentFit="cover"
                        />
                    ) : (
                        <View style={styles.imagePlaceholder}>
                            <Text style={styles.imagePlaceholderText}>
                                Toca para agregar una imagen del evento
                            </Text>
                        </View>
                    )}
                </TouchableOpacity>
            </View>

            <TextInput
                style={styles.input}
                placeholder="Nombre del evento"
                placeholderTextColor="#666"
                value={form.nombre}
                onChangeText={(text) => updateForm('nombre', text)}
            />

            <CustomDropdown
                label="Tipo de evento"
                value={form.tipo}
                options={EVENT_TYPES}
                onValueChange={(value) => updateForm('tipo', value)}
                placeholder="Selecciona el tipo de evento"
            />

            <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Duración del evento</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Ej: 2 horas, 4 horas, Todo el día"
                    placeholderTextColor="#666"
                    value={form.duracion}
                    onChangeText={(text) => updateForm('duracion', text)}
                />
            </View>

            <Text style={styles.sectionTitle}>Requerimientos Especiales</Text>
            <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Código de vestimenta</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Ej: Formal, Casual elegante, etc."
                    placeholderTextColor="#666"
                    value={form.requerimientos.codigoVestimenta}
                    onChangeText={(text) => updateForm('requerimientos', { ...form.requerimientos, codigoVestimenta: text })}
                />
            </View>
            <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Restricciones alimenticias</Text>
                <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Especifica si habrá opciones vegetarianas, veganas, etc."
                    placeholderTextColor="#666"
                    multiline
                    numberOfLines={3}
                    value={form.requerimientos.alimentacion}
                    onChangeText={(text) => updateForm('requerimientos', { ...form.requerimientos, alimentacion: text })}
                />
            </View>
            <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Edad mínima</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Ej: +18, Todas las edades, etc."
                    placeholderTextColor="#666"
                    value={form.requerimientos.edadMinima}
                    onChangeText={(text) => updateForm('requerimientos', { ...form.requerimientos, edadMinima: text })}
                />
            </View>
            <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Qué deben traer los invitados</Text>
                <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Ej: Traje de baño, Bebidas, etc."
                    placeholderTextColor="#666"
                    multiline
                    numberOfLines={3}
                    value={form.requerimientos.llevar}
                    onChangeText={(text) => updateForm('requerimientos', { ...form.requerimientos, llevar: text })}
                />
            </View>

            <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Notas adicionales</Text>
                <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Cualquier otra información importante"
                    placeholderTextColor="#666"
                    multiline
                    numberOfLines={3}
                    value={form.notasAdicionales}
                    onChangeText={(text) => updateForm('notasAdicionales', text)}
                />
            </View>

            <Text style={styles.label}>Número de invitados</Text>
            <TextInput
                style={styles.input}
                placeholder="Cantidad de personas invitadas"
                keyboardType="numeric"
                value={form.cantidadInvitados}
                onChangeText={text => updateForm('cantidadInvitados', text)}
            />

            <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Descripción"
                placeholderTextColor="#666"
                value={form.descripcion}
                onChangeText={(text) => updateForm('descripcion', text)}
                multiline
                numberOfLines={3}
            />

            {renderDatePicker()}

            <MapComponent
                latitude={INITIAL_COORDINATES.latitude}
                longitude={INITIAL_COORDINATES.longitude}
                onLocationSelect={handleLocationSelect}
            />

            <View style={styles.switchContainer}>
                <Text style={styles.switchLabel}>Requiere pago de cuota para los invitados?</Text>
                <Switch
                    value={form.requiresPayment}
                    onValueChange={(value) => updateForm('requiresPayment', value)}
                    trackColor={{ false: '#767577', true: 'rgb(71, 25, 82)' }}
                    thumbColor={form.requiresPayment ? 'rgb(51, 18, 59)' : '#f4f3f4'}
                />
            </View>

            {form.requiresPayment && (
                <View style={styles.cardContainer}>
                    <Text style={styles.cardTitle}>Cálculo de Cuota</Text>

                    <View style={styles.calculoRow}>
                        <Text style={styles.calculoLabel}>Total Productos:</Text>
                        <Text style={styles.calculoValue}>
                            ${form.cuotaCalculada.totalProductos.toLocaleString()}
                        </Text>
                    </View>

                    <View style={styles.calculoRow}>
                        <Text style={styles.calculoLabel}>Cantidad de Invitados:</Text>
                        <Text style={styles.calculoValue}>
                            {form.cuotaCalculada.cantidadPersonas}
                        </Text>
                    </View>

                    <View style={[styles.calculoRow, styles.totalRow]}>
                        <Text style={styles.calculoLabelTotal}>Cuota por Persona:</Text>
                        <Text style={styles.calculoValueTotal}>
                            ${Math.ceil(form.cuotaCalculada.cuotaPorPersona).toLocaleString()}
                        </Text>
                    </View>

                    <TextInput
                        style={styles.input}
                        placeholder="Ajustar cuota por persona"
                        placeholderTextColor="#666"
                        value={form.cuotaAmount}
                        onChangeText={(text) => updateForm('cuotaAmount', text)}
                        keyboardType="numeric"
                    />
                    <Text style={styles.helperText}>
                        Puedes ajustar la cuota manualmente si lo deseas
                    </Text>
                </View>
            )}

            <Text style={styles.sectionTitle}>Productos</Text>

            <View style={styles.searchContainer}>
                <TextInput
                    ref={searchInputRef}
                    style={styles.searchInput}
                    placeholder="Buscar productos..."
                    value={searchQuery}
                    onChangeText={handleSearchChange}
                />

                <TouchableOpacity
                    style={styles.searchButton}
                    onPress={handleSearch}
                >
                    <Text style={styles.searchButtonText}>Buscar</Text>
                </TouchableOpacity>
            </View>

            {renderSearchResults()}

            {form.productos.length > 0 && (
                <Text style={styles.subtitle}>Productos seleccionados:</Text>
            )}
        </View>
    ), [
        error,
        form,
        searchQuery,
        isSearching,
        renderDatePicker,
        renderSearchResults,
        handleSearch,
        handleLocationSelect,
        updateForm
    ]);

    const renderFooter = useCallback(() => (
        <View style={styles.innerContainer}>
            <TouchableOpacity
                style={[styles.button, isLoading && styles.buttonDisabled]}
                onPress={handleSubmit}
                disabled={isLoading}
            >
                <Text style={styles.buttonText}>
                    {isLoading ? 'Creando...' : 'Crear Evento'}
                </Text>
            </TouchableOpacity>
        </View>
    ), [isLoading, handleSubmit]);

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <FlatList
                data={form.productos}
                renderItem={renderProductItem}
                keyExtractor={(item) => item.externalId}
                ListHeaderComponent={renderHeader}
                ListFooterComponent={renderFooter}
                contentContainerStyle={styles.flatListContent}
            />
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    label: { fontSize: 16, fontWeight: '600', marginBottom: 5, color: '#512B58' },
    cardTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: 'rgb(51, 18, 59)',
        marginBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(71, 25, 82, 0.1)',
        paddingBottom: 8,
    },
    calculoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
    },
    calculoLabel: {
        fontSize: 14,
        color: '#666',
    },
    calculoValue: {
        fontSize: 14,
        color: 'rgb(51, 18, 59)',
        fontWeight: '500',
    },
    totalRow: {
        borderTopWidth: 1,
        borderTopColor: 'rgba(71, 25, 82, 0.1)',
        marginTop: 8,
        paddingTop: 12,
        marginBottom: 15,
    },
    calculoLabelTotal: {
        fontSize: 16,
        fontWeight: '600',
        color: 'rgb(51, 18, 59)',
    },
    calculoValueTotal: {
        fontSize: 16,
        fontWeight: '600',
        color: 'rgb(51, 18, 59)',
    },
    helperText: {
        fontSize: 12,
        color: '#666',
        fontStyle: 'italic',
        marginTop: 5,
    },
    mobileMapPlaceholder: {
        textAlign: 'center',
        padding: 20,
        color: '#666',
    },
    locationButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgb(51, 18, 59)',
        padding: 12,
        borderRadius: 10,
        marginBottom: 10,
        gap: 8,
    },
    locationButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '500',
    },
    dateTimeContainer: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 15,
    },
    dateInputContainer: {
        flex: 1,
    },
    dateInput: {
        height: 50,
        backgroundColor: '#ffffff',
        borderRadius: 10,
        paddingHorizontal: 15,
        borderWidth: 1,
        borderColor: 'rgb(71, 25, 82)',
        color: '#333',
    },
    mapContainer: {
        height: 300,
        marginBottom: 15,
        borderRadius: 10,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgb(71, 25, 82)',
    },
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    flatListContent: {
        flexGrow: 1,
    },
    innerContainer: {
        padding: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: 'rgb(51, 18, 59)',
        marginBottom: 30,
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
    textArea: {
        height: 100,
        textAlignVertical: 'top',
        paddingTop: 15,
    },
    dateButton: {
        width: '100%',
        height: 50,
        backgroundColor: '#ffffff',
        borderRadius: 10,
        paddingHorizontal: 15,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: 'rgb(71, 25, 82)',
        justifyContent: 'center',
    },
    dateButtonLabel: {
        fontSize: 12,
        color: '#666',
        marginBottom: 2,
    },
    dateButtonText: {
        fontSize: 16,
        color: '#333',
    },
    switchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 15,
    },
    switchLabel: {
        fontSize: 16,
        color: 'rgb(51, 18, 59)',
    },
    searchContainer: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 15,
    },
    searchInput: {
        flex: 1,
        height: 50,
        backgroundColor: '#ffffff',
        borderRadius: 10,
        paddingHorizontal: 15,
        borderWidth: 1,
        borderColor: 'rgb(71, 25, 82)',
    },
    searchButton: {
        backgroundColor: 'rgb(51, 18, 59)',
        height: 50,
        paddingHorizontal: 20,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    searchButtonText: {
        color: '#ffffff',
        fontWeight: 'bold',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: 'rgb(51, 18, 59)',
        marginTop: 20,
        marginBottom: 10,
    },
    searchResults: {
        marginBottom: 15,
    },
    searchResultItem: {
        flexDirection: 'row',
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        backgroundColor: '#fff',
        alignItems: 'center',
        marginBottom: 5,
        borderRadius: 10,
    },
    productImage: {
        width: 60,
        height: 60,
        borderRadius: 5,
    },
    productInfo: {
        flex: 1,
        marginLeft: 10,
    },
    productName: {
        fontSize: 16,
        fontWeight: '500',
    },
    productBrand: {
        fontSize: 14,
        color: '#666',
    },
    productPrice: {
        fontSize: 16,
        fontWeight: '600',
        color: 'rgb(51, 18, 59)',
    },
    subtitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 10,
        color: 'rgb(51, 18, 59)',
    },
    selectedProduct: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        padding: 10,
        borderRadius: 10,
        marginHorizontal: 20,
        marginBottom: 10,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgb(71, 25, 82)',
    },
    selectedProductImage: {
        width: 50,
        height: 50,
        borderRadius: 5,
    },
    selectedProductInfo: {
        flex: 1,
        marginLeft: 10,
    },
    selectedProductName: {
        fontSize: 14,
        fontWeight: '500',
    },
    selectedProductPrice: {
        fontSize: 14,
        color: 'rgb(51, 18, 59)',
        fontWeight: '600',
    },
    removeButton: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: '#ff4646',
        justifyContent: 'center',
        alignItems: 'center',
    },
    removeButtonText: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
    },
    loader: {
        marginVertical: 10,
    },
    button: {
        width: '100%',
        height: 50,
        backgroundColor: 'rgb(51, 18, 59)',
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    buttonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    errorText: {
        color: '#ff4646',
        marginBottom: 15,
        textAlign: 'center',
    },

    // Contenedores de inputs
    inputContainer: {
        marginBottom: 15,
    },
    inputLabel: {
        fontSize: 14,
        color: 'rgb(51, 18, 59)',
        marginBottom: 5,
        fontWeight: '500',
    },

    // Selector de imagen
    imageContainer: {
        marginVertical: 20,
    },
    imageSelector: {
        width: '100%',
        height: 200,
        borderRadius: 10,
        overflow: 'hidden',
        backgroundColor: '#f0f0f0',
        borderWidth: 1,
        borderColor: 'rgb(71, 25, 82)',
    },
    eventImage: {
        width: '100%',
        height: '100%',
    },
    imagePlaceholder: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: 'rgba(71, 25, 82, 0.05)',
    },
    imagePlaceholderText: {
        color: 'rgb(71, 25, 82)',
        textAlign: 'center',
        fontSize: 16,
    },

    // Elementos auxiliares
    separator: {
        height: 1,
        backgroundColor: 'rgba(71, 25, 82, 0.1)',
        marginVertical: 20,
    },
    // Tarjetas
    cardContainer: {
        backgroundColor: '#ffffff',
        borderRadius: 10,
        padding: 15,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: 'rgb(71, 25, 82)',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 5,
    },
});