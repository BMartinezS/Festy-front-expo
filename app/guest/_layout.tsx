// app/auth/_layout.tsx
import { Stack } from 'expo-router';

export default function GuestLayout() {
    return (
        <Stack>
            <Stack.Screen
                name="index"
                options={{
                    headerShown: false,
                }}
            />
        </Stack>
    );
}