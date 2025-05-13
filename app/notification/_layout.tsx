// app/auth/_layout.tsx
import { Stack } from 'expo-router';
import { NotificationProvider } from '../../context/NotificationContext';

export default function NotificationLayout() {
    return (
        <NotificationProvider>
            <Stack
                screenOptions={{
                    headerShown: false,
                }}
            >
                <Stack.Screen name="index" />
            </Stack>
        </NotificationProvider>
    );
}