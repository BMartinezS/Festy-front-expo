// app/event/_layout.tsx
import { Stack } from 'expo-router';

export default function EventLayout() {
    return (
        <Stack>
            <Stack.Screen
                name="index"
                options={{
                    headerShown: false,
                }}
            />
            <Stack.Screen
                name="create"
                options={{
                    headerTitle: 'Crear Evento',
                    headerShown: true,
                    headerTintColor: 'rgb(51, 18, 59)',
                }}
            />
            <Stack.Screen
                name="[id]"
                options={{
                    headerTitle: 'Detalles del Evento',
                    headerShown: true,
                    headerTintColor: 'rgb(51, 18, 59)',
                }}
            />
            <Stack.Screen
                name="[id]/guests"
                options={{
                    headerTitle: 'Gestión de Invitados',
                    headerShown: true,
                    headerTintColor: 'rgb(51, 18, 59)',
                }}
            />
            <Stack.Screen
                name="[id]/dashboard"
                options={{
                    headerTitle: 'Dashboard',
                    headerShown: true,
                    headerTintColor: 'rgb(51, 18, 59)',
                }}
            />
            <Stack.Screen
                name="payment/[id]"
                options={{
                    headerTitle: 'Pago de Cuota',
                    headerShown: true,
                    headerTintColor: 'rgb(51, 18, 59)',
                }}
            />
        </Stack>
    );
}