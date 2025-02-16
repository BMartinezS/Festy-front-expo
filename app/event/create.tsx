import React, { useState } from 'react';
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

interface Product {
    externalId: string;
    name: string;
    brand: string;
    imageUrl: string;
    price: number;
}

export default function CreateEventScreen() {
    const [form, setForm] = useState({
        nombre: '',
        descripcion: '',
        fecha: new Date(),
        tipo: '', // Añade esto
        ubicacion: {
            coordinates: [0, 0],
            address: '',
        },
        requiresPayment: false,
        cuotaAmount: '0',
        productos: [] as Product[],
        cantidadInvitados: '0'
    });
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<Product[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    const searchProducts = async (query: string) => {
        if (!query || query.trim().length < 3) {
            setError('Ingresa al menos 3 caracteres para buscar');
            return;
        }
        setError('');

        try {
            setIsSearching(true);
            const response = await fetch(`/api/products/${query}`);
            const data = await response.json();

            if (data.success) {
                setSearchResults(data.data);
            }
        } catch (error) {
            console.error('Error searching products:', error);
        } finally {
            setIsSearching(false);
        }
    };

    const handleAddProduct = (product: Product) => {
        setForm(prev => ({
            ...prev,
            productos: [...prev.productos, product]
        }));
        setSearchQuery('');
        setSearchResults([]);
    };

    const handleRemoveProduct = (externalId: string) => {
        setForm(prev => ({
            ...prev,
            productos: prev.productos.filter(p => p.externalId !== externalId)
        }));
    };

    const handleDateChange = (event: any, selectedDate?: Date) => {
        setShowDatePicker(false);
        if (selectedDate) {
            setForm(prev => ({ ...prev, fecha: selectedDate }));
        }
    };

    const handleSubmit = async () => {
        if (!form.nombre || !form.ubicacion.address) {
            setError('Por favor completa los campos requeridos');
            return;
        }

        try {
            setIsLoading(true);
            setError('');
            const token = await AsyncStorage.getItem('userToken');
            if (!token) throw new Error('No token found');

            await eventService.createEvent(token, {
                ...form,
                cuotaAmount: form.requiresPayment ? parseFloat(form.cuotaAmount) : 0,
            });
            router.back();
        } catch (error: any) {
            setError(error.message || 'Error al crear el evento');
        } finally {
            setIsLoading(false);
        }
    };

    const eventTypeOptions = [
        { label: 'Asado', value: 'asado' }
    ];

    const renderListHeader = () => (
        <View style={styles.innerContainer}>
            <Text style={styles.title}>Crear Evento</Text>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <TextInput
                style={styles.input}
                placeholder="Nombre del evento"
                placeholderTextColor="#666"
                value={form.nombre}
                onChangeText={(text) =>
                    setForm(prev => ({ ...prev, nombre: text }))
                }
            />

            <CustomDropdown
                label="Tipo de evento"
                value={form.tipo}
                options={eventTypeOptions}
                onValueChange={(value) => setForm(prev => ({ ...prev, tipo: value }))}
                placeholder="Selecciona el tipo de evento"
            />

            <TextInput
                style={styles.input}
                keyboardType={Platform.OS !== 'web' ? "numeric" : "number-pad"}
                placeholder="Cantidad de personas"
                placeholderTextColor="#666"
                value={form.cantidadInvitados}
                onChangeText={(text) =>
                    setForm(prev => ({ ...prev, nombre: text }))
                }
            />
            <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Descripción"
                placeholderTextColor="#666"
                value={form.descripcion}
                onChangeText={(text) =>
                    setForm(prev => ({ ...prev, descripcion: text }))
                }
                multiline
                numberOfLines={3}
            />

            <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowDatePicker(true)}
            >
                <Text style={styles.dateButtonLabel}>Fecha del evento</Text>
                <Text style={styles.dateButtonText}>
                    {form.fecha.toLocaleDateString()} {form.fecha.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
            </TouchableOpacity>

            {Platform.OS === 'web' ? (
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
                                setForm(prev => ({ ...prev, fecha: newDate }));
                            }}
                        />
                    </View>
                    <View style={styles.dateInputContainer}>
                        <Text style={styles.dateButtonLabel}>Hora</Text>
                        <TouchableOpacity
                            style={styles.dateInput}
                            onPress={() => {
                                const newDate = new Date(form.fecha);
                                const timeString = prompt("Enter time (HH:MM)", form.fecha.toTimeString().slice(0, 5));
                                if (timeString) {
                                    const [hours, minutes] = timeString.split(':');
                                    newDate.setHours(parseInt(hours));
                                    newDate.setMinutes(parseInt(minutes));
                                    setForm(prev => ({ ...prev, fecha: newDate }));
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
            )}

            <MapComponent
                latitude={-33.441622}
                longitude={-70.654049}
                onLocationSelect={(lat, lng) => {
                    console.log(`Selected location: ${lat}, ${lng}`);
                }}
            />

            <View style={styles.switchContainer}>
                <Text style={styles.switchLabel}>Requiere pago</Text>
                <Switch
                    value={form.requiresPayment}
                    onValueChange={(value) =>
                        setForm(prev => ({ ...prev, requiresPayment: value }))
                    }
                    trackColor={{ false: '#767577', true: 'rgb(71, 25, 82)' }}
                    thumbColor={form.requiresPayment ? 'rgb(51, 18, 59)' : '#f4f3f4'}
                />
            </View>

            {form.requiresPayment && (
                <TextInput
                    style={styles.input}
                    placeholder="Monto de cuota"
                    placeholderTextColor="#666"
                    value={form.cuotaAmount}
                    onChangeText={(text) =>
                        setForm(prev => ({ ...prev, cuotaAmount: text }))
                    }
                    keyboardType="numeric"
                />
            )}

            <Text style={styles.sectionTitle}>Productos</Text>

            <View style={styles.searchContainer}>
                <TextInput
                    style={styles.searchInput}
                    placeholder="Buscar productos..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
                <TouchableOpacity
                    style={styles.searchButton}
                    onPress={() => searchProducts(searchQuery)}
                    disabled={isSearching}
                >
                    <Text style={styles.searchButtonText}>
                        {isSearching ? 'Buscando...' : 'Buscar'}
                    </Text>
                </TouchableOpacity>
            </View>

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

            {form.productos.length > 0 && (
                <Text style={styles.subtitle}>Productos seleccionados:</Text>
            )}
        </View>
    );

    const renderListFooter = () => (
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
    );

    const renderProduct = ({ item }: { item: Product }) => (
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
    );

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <FlatList
                data={form.productos}
                renderItem={renderProduct}
                keyExtractor={(item) => item.externalId}
                ListHeaderComponent={renderListHeader}
                ListFooterComponent={renderListFooter}
                contentContainerStyle={styles.flatListContent}
            />
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
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
});