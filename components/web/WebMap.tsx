import React, { useState } from 'react';
import { View } from 'react-native';
import { Map, Marker } from 'pigeon-maps';

interface WebMapProps {
    latitude: number;
    longitude: number;
    onLocationSelect: (lat: number, lng: number) => void;
}

const WebMap: React.FC<WebMapProps> = ({ latitude, longitude, onLocationSelect }) => {
    const [markerPosition, setMarkerPosition] = useState<[number, number]>([latitude, longitude]);

    const handleClick = ({ latLng }: { latLng: [number, number] }) => {
        setMarkerPosition(latLng);
        onLocationSelect(latLng[0], latLng[1]);
    };

    return (
        <View style={{ height: 300, borderRadius: 10, overflow: 'hidden' }}>
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
    );
};

export default WebMap;