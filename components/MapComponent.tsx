import React, { Suspense } from 'react';
import { Platform, Text, View } from 'react-native';

interface MapProps {
    latitude: number;
    longitude: number;
    onLocationSelect: (lat: number, lng: number) => void;
}

// Importaciones condicionales mejoradas
const WebMap = Platform.select({
    web: React.lazy(() => import('./web/WebMap')),
    default: null,
});

// const MobileMap = Platform.select({
//     ios: React.lazy(() => import('./mobile/MobileMap')),
//     android: React.lazy(() => import('./mobile/MobileMap')),
//     default: null,
// });

const MapComponent: React.FC<MapProps> = (props) => {
    const MapImplementation = Platform.OS === 'web' ? WebMap : WebMap;
    // const MapImplementation = Platform.OS !== 'web' ? MobileMap : MobileMap;

    if (!MapImplementation) {
        return <View style={{ height: 300 }}><Text>Mapa no disponible en esta plataforma</Text></View>;
    }

    return (
        <Suspense fallback={<View style={{ height: 300 }}><Text>Cargando mapa...</Text></View>}>
            <MapImplementation {...props} />
        </Suspense>
    );
};

export default MapComponent;