import React, { useState } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    Image,
} from 'react-native';
import { router } from 'expo-router';
import { authService } from '@/services/auth.service';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface LoginScreenProps { }

const LoginScreen: React.FC<LoginScreenProps> = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState(''); // Cambiado de message a successMessage
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async (): Promise<void> => {
        if (!email || !password) {
            setError('Por favor completa todos los campos');
            return;
        }

        try {
            setIsLoading(true);
            setError('');
            setSuccessMessage(''); // Limpiar mensaje anterior

            console.log('Iniciando login...');
            const response: any = await authService.login({ email, password });

            if ('error' in response || !response.data) {
                setError(`Error en la petición: ${response.error}`);
                return;
            }

            // Solo guardamos el token y navegamos si todo está bien
            if (response.data?.token) {
                console.log('Login exitoso:', response.data.token);
                await AsyncStorage.setItem('userToken', response.data.token);
                router.replace('/(tabs)');
            } else {
                setError('Respuesta inválida del servidor');
            }
        } catch (error: any) {
            console.error('Error completo:', error);
            setError(error.message || 'Error al intentar iniciar sesión');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRegister = () => {
        router.push('/auth/register');
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <View style={styles.innerContainer}>
                <Text style={styles.title}>Iniciar Sesión</Text>

                {error ? <Text style={styles.errorText}>{error}</Text> : null}
                {successMessage ? (
                    <Text style={styles.messageText}>{successMessage}</Text>
                ) : null}

                <TextInput
                    style={styles.input}
                    placeholder="Correo electrónico"
                    placeholderTextColor="#666"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                />

                <TextInput
                    style={styles.input}
                    placeholder="Contraseña"
                    placeholderTextColor="#666"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    autoComplete="password"
                />

                <TouchableOpacity style={styles.button} onPress={handleLogin}>
                    <Text style={styles.buttonText}>Ingresar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.linkButton}
                    onPress={handleRegister}
                >
                    <Text style={styles.linkText}>
                        ¿No tienes cuenta? Regístrate aquí
                    </Text>
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    innerContainer: {
        flex: 1,
        padding: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    logo: {
        width: 120,
        height: 120,
        marginBottom: 30,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: 'rgb(51, 18, 59)',
        marginBottom: 30,
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
    button: {
        width: '100%',
        height: 50,
        backgroundColor: 'rgb(51, 18, 59)',
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
    },
    buttonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    linkButton: {
        marginTop: 20,
    },
    linkText: {
        color: 'rgb(71, 25, 82)',
        fontSize: 14,
    },
    errorText: {
        color: '#ff4646',
        marginBottom: 15,
        textAlign: 'center',
    },
    messageText: {
        color: '#fa2910',
        marginBottom: 15,
        textAlign: 'center',
    },
});

export default LoginScreen;