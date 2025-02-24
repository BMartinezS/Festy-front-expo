// components/MapSection.tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import MapComponent from '@/components/MapComponent';

interface MapSectionProps {
    initialCoordinates: { latitude: number; longitude: number };
    onLocationSelect: (lat: number, lng: number, address?: string) => void;
}

const MapSection: React.FC<MapSectionProps> = ({ initialCoordinates, onLocationSelect }) => {
    return (
        <View style={styles.container}>
            <MapComponent
                latitude={initialCoordinates.latitude}
                longitude={initialCoordinates.longitude}
                onLocationSelect={onLocationSelect}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { marginVertical: 20 },
});

export default MapSection;