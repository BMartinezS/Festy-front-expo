import React from 'react';
import { View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

interface MobileMapProps {
    latitude: number;
    longitude: number;
    onLocationSelect: (lat: number, lng: number) => void;
}

const MobileMap: React.FC<MobileMapProps> = ({ latitude, longitude, onLocationSelect }) => {
    return (
        <View style={{ height: 300, borderRadius: 10, overflow: 'hidden' }}>
            <MapView
                style={{ flex: 1 }}
                region={{
                    latitude,
                    longitude,
                    latitudeDelta: 0.0922,
                    longitudeDelta: 0.0421,
                }}
                onPress={(e) => {
                    const { latitude, longitude } = e.nativeEvent.coordinate;
                    onLocationSelect(latitude, longitude);
                }}
            >
                <Marker coordinate={{ latitude, longitude }} />
            </MapView>
        </View>
    );
};

export default MobileMap;