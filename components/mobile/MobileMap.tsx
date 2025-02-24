import React, { useState, useRef } from 'react';
import { View, StyleSheet, TextInput, TouchableOpacity, Text, ActivityIndicator, ScrollView } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import debounce from 'lodash/debounce';
import { API_URL } from '@/constants';
import { commonStyles } from '@/styles/eventForm';

interface MobileMapProps {
    latitude: number;
    longitude: number;
    onLocationSelect: (lat: number, lng: number, address?: string) => void;
}

interface Suggestion {
    place_id: string;
    description: string;
    structured_formatting: {
        main_text: string;
        secondary_text: string;
    };
}

const MobileMap: React.FC<MobileMapProps> = ({ latitude, longitude, onLocationSelect }) => {
    const [markerPosition, setMarkerPosition] = useState({
        latitude,
        longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
    });
    const [address, setAddress] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const mapRef = useRef<MapView>(null);

    const fetchSuggestions = async (text: string) => {
        if (text.length < 3) {
            setSuggestions([]);
            return;
        }

        try {
            const encodedInput = text.replace(/ /g, '%20');
            const response = await fetch(`${API_URL}/maps/places/autocomplete?input=${encodedInput}`);
            const data = await response.json();

            if (data.status === 'OK' && data.predictions) {
                setSuggestions(data.predictions);
                setShowSuggestions(true);
            } else {
                setSuggestions([]);
            }
        } catch (error) {
            console.error('Error al obtener sugerencias:', error);
            setSuggestions([]);
        }
    };

    // Crear versión debounced de fetchSuggestions
    const debouncedFetchSuggestions = useRef(
        debounce((text: string) => fetchSuggestions(text), 300)
    ).current;

    const handleMapPress = (e: any) => {
        const { latitude, longitude } = e.nativeEvent.coordinate;
        setMarkerPosition(prev => ({
            ...prev,
            latitude,
            longitude
        }));
        onLocationSelect(latitude, longitude);
        setShowSuggestions(false);
    };

    const handleSearch = async (searchAddress: string = address) => {
        if (!searchAddress.trim()) {
            setError('Por favor, ingresa una dirección.');
            return;
        }

        setIsSearching(true);
        setError(null);

        try {
            // Limpiar y formatear la dirección
            const cleanAddress = searchAddress
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "") // Remover acentos
                .replace(/[^\w\s,-]/g, '') // Remover caracteres especiales excepto comas y guiones
                .trim();

            console.log('Buscando dirección limpia:', cleanAddress);

            const encodedAddress = cleanAddress.replace(/ /g, '%20');
            const response = await fetch(`${API_URL}/maps/geocode?address=${encodedAddress}`);
            const data = await response.json();

            if (data.status === 'OK' && data.results?.[0]) {
                const location = data.results[0].geometry.location;
                const newRegion = {
                    ...markerPosition,
                    latitude: location.lat,
                    longitude: location.lng,
                };

                setMarkerPosition(newRegion);
                mapRef.current?.animateToRegion(newRegion, 500);
                setAddress(data.results[0].formatted_address);
                onLocationSelect(location.lat, location.lng, data.results[0].formatted_address);
            } else {
                console.log('No se encontraron resultados para:', cleanAddress);
                console.log('Respuesta de la API:', data);

                // Mensaje de error más específico
                if (data.status === 'ZERO_RESULTS') {
                    setError('No se encontró la dirección. Intenta escribirla de otra forma, por ejemplo: "Calle Número, Comuna"');
                } else {
                    setError('Error al buscar la dirección. Por favor, verifica que esté bien escrita.');
                }
            }
        } catch (err) {
            console.error('Error en la búsqueda:', err);
            setError('Error al buscar la dirección. Intenta nuevamente.');
        } finally {
            setIsSearching(false);
        }
    };

    const handleAddressChange = (text: string) => {
        setAddress(text);
        setError(null);
        debouncedFetchSuggestions(text);
    };

    const handleSuggestionSelect = (suggestion: Suggestion) => {
        setAddress(suggestion.description);
        setSuggestions([]);
        setShowSuggestions(false);
        handleSearch(suggestion.description);
    };

    return (
        <View style={styles.container}>
            <View style={styles.searchContainer}>
                <View style={styles.inputWrapper}>
                    <TextInput
                        style={commonStyles.input}
                        placeholder="Buscar dirección"
                        placeholderTextColor="#999"  // Añadido
                        value={address}
                        onChangeText={handleAddressChange}
                        onFocus={() => setShowSuggestions(true)}
                    />
                    {showSuggestions && suggestions.length > 0 && (
                        <ScrollView style={styles.suggestionsContainer}>
                            {suggestions.map((suggestion) => (
                                <TouchableOpacity
                                    key={suggestion.place_id}
                                    style={styles.suggestionItem}
                                    onPress={() => handleSuggestionSelect(suggestion)}
                                >
                                    <Text style={styles.suggestionMainText}>
                                        {suggestion.structured_formatting.main_text}
                                    </Text>
                                    <Text style={styles.suggestionSecondaryText}>
                                        {suggestion.structured_formatting.secondary_text}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    )}
                </View>
                <TouchableOpacity
                    style={[commonStyles.button, isSearching && commonStyles.buttonDisabled]}
                    onPress={() => handleSearch()}
                    disabled={isSearching}
                >
                    {isSearching ? (
                        <ActivityIndicator size="small" color="#fff" />
                    ) : (
                        <Text style={styles.searchButtonText}>Buscar</Text>
                    )}
                </TouchableOpacity>
            </View>

            {error && (
                <Text style={styles.errorText}>{error}</Text>
            )}

            <MapView
                ref={mapRef}
                style={styles.map}
                region={markerPosition}
                onPress={handleMapPress}
            >
                <Marker coordinate={{
                    latitude: markerPosition.latitude,
                    longitude: markerPosition.longitude
                }} />
            </MapView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        height: 300,
        borderRadius: 10,
        overflow: 'hidden',
    },
    searchContainer: {
        flexDirection: 'row',
        padding: 10,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        zIndex: 1,
    },
    inputWrapper: {
        flex: 1,
        marginRight: 8,
    },
    input: {
        height: 40,
        backgroundColor: '#ffffff',
        borderRadius: 8,
        paddingHorizontal: 12,
        borderWidth: 1,
        borderColor: 'rgb(71, 25, 82)',
        color: '#000',  // Añadido para asegurar que el texto sea visible
    },
    suggestionsContainer: {
        position: 'absolute',
        top: 45,
        left: 0,
        right: 0,
        maxHeight: 200,
        backgroundColor: '#ffffff',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgb(71, 25, 82)',
        zIndex: 2,
    },
    suggestionItem: {
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    suggestionMainText: {
        fontSize: 14,
        fontWeight: '500',
    },
    suggestionSecondaryText: {
        fontSize: 12,
        color: '#666',
        marginTop: 2,
    },
    searchButton: {
        backgroundColor: 'rgb(51, 18, 59)',
        height: 40,
        paddingHorizontal: 16,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    searchButtonDisabled: {
        opacity: 0.7,
    },
    searchButtonText: {
        color: '#ffffff',
        fontWeight: 'bold',
    },
    errorText: {
        color: 'red',
        padding: 8,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        textAlign: 'center',
    },
    map: {
        flex: 1,
    },
});

export default MobileMap;