import React, { useState, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, ScrollView } from 'react-native';
import { Map, Marker } from 'pigeon-maps';
import { TextInput } from 'react-native-gesture-handler';
import debounce from 'lodash/debounce';
import { API_URL } from '@/constants';
import { commonStyles } from '@/styles/eventForm';

interface WebMapProps {
    latitude: number;
    longitude: number;
    onLocationSelect: (lat: number, lng: number, address?: string) => void;
}

interface Prediction {
    place_id: string;
    description: string;
    structured_formatting: {
        main_text: string;
        secondary_text: string;
    };
}

const WebMap: React.FC<WebMapProps> = ({ latitude, longitude, onLocationSelect }) => {
    const [markerPosition, setMarkerPosition] = useState<[number, number]>([latitude, longitude]);
    const [address, setAddress] = useState('');
    const [suggestions, setSuggestions] = useState<Prediction[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [isAdjustingPin, setIsAdjustingPin] = useState(false);

    // Función para obtener sugerencias
    const getSuggestions = async (input: string) => {
        try {
            // Reemplazar espacios por %20
            const encodedInput = input.replace(/ /g, '%20');
            const response = await fetch(`${API_URL}/maps/places/autocomplete?input=${encodedInput}`);
            const data = await response.json();

            if (data.status === 'OK') {
                return data.predictions;
            } else {
                console.error('Error en sugerencias:', data.status);
                return [];
            }
        } catch (error) {
            console.error('Error al obtener sugerencias:', error);
            return [];
        }
    };

    // Función para obtener coordenadas
    const getCoordinates = async (searchAddress: string) => {
        try {
            // Reemplazar espacios por %20
            const encodedAddress = searchAddress.replace(/ /g, '%20');
            const response = await fetch(`${API_URL}/maps/geocode?address=${encodedAddress}`);
            const data = await response.json();

            if (data.status === 'OK' && data.results?.length > 0) {
                const location = data.results[0].geometry.location;
                return {
                    coordinates: [location.lat, location.lng] as [number, number],
                    formattedAddress: data.results[0].formatted_address
                };
            }
            return null;
        } catch (error) {
            console.error('Error al obtener coordenadas:', error);
            return null;
        }
    };

    // Debounce para las sugerencias
    const debouncedGetSuggestions = useRef(
        debounce(async (input: string) => {
            if (input.length >= 3) {
                const newSuggestions = await getSuggestions(input);
                setSuggestions(newSuggestions);
                setShowSuggestions(true);
            } else {
                setSuggestions([]);
                setShowSuggestions(false);
            }
        }, 300)
    ).current;

    const handleAddressChange = (text: string) => {
        setAddress(text);
        setError(null);
        debouncedGetSuggestions(text);
    };

    const handleSuggestionSelect = async (suggestion: Prediction) => {
        setAddress(suggestion.description);
        setSuggestions([]);
        setShowSuggestions(false);
        await handleSearch(suggestion.description);
    };

    const handleClick = async ({ latLng }: { latLng: [number, number] }) => {
        if (!isAdjustingPin) return;

        setMarkerPosition(latLng);
        onLocationSelect(latLng[0], latLng[1]);
    };

    const handleSearch = async (searchAddress: string = address) => {
        if (!searchAddress.trim()) {
            setError('Por favor, ingresa una dirección.');
            return;
        }

        setIsSearching(true);
        setError(null);

        try {
            const result = await getCoordinates(searchAddress);

            if (result) {
                setMarkerPosition(result.coordinates);
                setAddress(result.formattedAddress);
                onLocationSelect(result.coordinates[0], result.coordinates[1], result.formattedAddress);
            } else {
                setError('No se pudo encontrar la ubicación. Intenta con otra dirección.');
            }
        } catch (err) {
            setError('Error al buscar la dirección. Intenta nuevamente.');
            console.error(err);
        } finally {
            setIsSearching(false);
        }
    };

    return (
        <View style={{ height: 350, borderRadius: 10, overflow: 'hidden' }}>
            <View style={styles.searchContainer}>
                <View style={styles.inputContainer}>
                    <TextInput
                        style={commonStyles.input}
                        placeholder="Ingresa la dirección del evento"
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
                    <Text style={styles.searchButtonText}>
                        {isSearching ? 'Buscando...' : 'Buscar'}
                    </Text>
                </TouchableOpacity>
            </View>

            {error && <Text style={styles.errorText}>{error}</Text>}

            <View style={styles.mapContainer}>
                <Map
                    height={300}
                    center={markerPosition}
                    zoom={13}
                    onClick={handleClick}
                >
                    <Marker
                        width={50}
                        anchor={markerPosition}
                    />
                </Map>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginLeft: 20,
        marginRight: 20,
        zIndex: 1,
    },
    inputContainer: {
        flex: 1,
        marginRight: 10,
    },
    input: {
        height: 50,
        backgroundColor: '#ffffff',
        borderRadius: 10,
        paddingHorizontal: 15,
        borderWidth: 1,
        borderColor: 'rgb(71, 25, 82)',
    },
    suggestionsContainer: {
        position: 'absolute',
        top: 55,
        left: 0,
        right: 0,
        maxHeight: 200,
        backgroundColor: '#ffffff',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: 'rgb(71, 25, 82)',
        zIndex: 2,
    },
    suggestionItem: {
        padding: 15,
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
        height: 50,
        paddingHorizontal: 20,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    searchButtonDisabled: {
        opacity: 0.7,
    },
    searchButtonText: {
        color: '#ffffff',
        fontWeight: 'bold'
    },
    errorText: {
        color: 'red',
        marginBottom: 10,
        textAlign: 'center',
    },
    mapContainer: {
        flex: 1,
        position: 'relative',
    },
    adjustPinButton: {
        position: 'absolute',
        bottom: 10,
        right: 10,
        backgroundColor: 'rgba(51, 18, 59, 0.9)',
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 20,
    },
    adjustPinButtonText: {
        color: '#ffffff',
        fontSize: 12,
        fontWeight: 'bold',
    }
});

export default WebMap;