import React, { useState } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    Alert,
    ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { authService } from '@/services/auth.service';
import AsyncStorage from '@react-native-async-storage/async-storage';

const RegisterScreen: React.FC = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        phone: '', // Nuevo campo para el teléfono
    });
    const [error, setError] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);

    const handleInputChange = (field: keyof typeof formData, value: string): void => {
        setFormData(prev => ({
            ...prev,
            [field]: value,
        }));
    };

    const validateForm = (): boolean => {
        const { name, email, password, confirmPassword, phone } = formData;

        if (!name || !email || !password || !confirmPassword || !phone) {
            setError('Por favor completa todos los campos');
            return false;
        }

        if (password !== confirmPassword) {
            setError('Las contraseñas no coinciden');
            return false;
        }

        // Validación de formato de correo electrónico
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setError('Formato de correo electrónico inválido');
            return false;
        }

        // Validación de formato de teléfono (simple)
        const phoneRegex = /^\+?[0-9]{8,15}$/;
        if (!phoneRegex.test(phone)) {
            setError('Formato de teléfono inválido (8-15 dígitos)');
            return false;
        }

        return true;
    };

    const handleRegister = async (): Promise<void> => {
        if (!validateForm()) return;

        try {
            setIsLoading(true);
            setError('');

            const response = await authService.register({
                name: formData.name,
                email: formData.email,
                password: formData.password,
                phone: formData.phone, // Incluir el teléfono en la petición
            });

            // Si el registro es exitoso, iniciamos sesión automáticamente
            if (response && response.token) {
                await AsyncStorage.setItem('userToken', response.token);

                // Mostramos alerta de éxito y redirigimos
                Alert.alert(
                    "Registro Exitoso",
                    "¡Tu cuenta ha sido creada correctamente!",
                    [{ text: "OK", onPress: () => router.replace('/(tabs)') }]
                );
            } else {
                setError('Respuesta inválida del servidor');
            }
        } catch (error: any) {
            console.error('Error en registro:', error);
            setError(error.message || 'Error al intentar registrarse');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <ScrollView contentContainerStyle={styles.scrollContainer}>
                <View style={styles.innerContainer}>
                    <Text style={styles.title}>Crear Cuenta</Text>

                    {error ? <Text style={styles.errorText}>{error}</Text> : null}

                    <TextInput
                        style={styles.input}
                        placeholder="Nombre completo"
                        placeholderTextColor="#666"
                        value={formData.name}
                        onChangeText={(value) => handleInputChange('name', value)}
                        autoComplete="name"
                    />

                    <TextInput
                        style={styles.input}
                        placeholder="Correo electrónico"
                        placeholderTextColor="#666"
                        value={formData.email}
                        onChangeText={(value) => handleInputChange('email', value)}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoComplete="email"
                    />

                    <TextInput
                        style={styles.input}
                        placeholder="Número de teléfono (con código de país)"
                        placeholderTextColor="#666"
                        value={formData.phone}
                        onChangeText={(value) => handleInputChange('phone', value)}
                        keyboardType="phone-pad"
                    />

                    <TextInput
                        style={styles.input}
                        placeholder="Contraseña"
                        placeholderTextColor="#666"
                        value={formData.password}
                        onChangeText={(value) => handleInputChange('password', value)}
                        secureTextEntry
                        autoComplete="password-new"
                    />

                    <TextInput
                        style={styles.input}
                        placeholder="Confirmar contraseña"
                        placeholderTextColor="#666"
                        value={formData.confirmPassword}
                        onChangeText={(value) => handleInputChange('confirmPassword', value)}
                        secureTextEntry
                        autoComplete="password-new"
                    />

                    <TouchableOpacity
                        style={styles.button}
                        onPress={handleRegister}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <ActivityIndicator size="small" color="#ffffff" />
                        ) : (
                            <Text style={styles.buttonText}>Registrarse</Text>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.linkButton}
                        onPress={() => router.push('/auth/login')}
                        disabled={isLoading}
                    >
                        <Text style={styles.linkText}>
                            ¿Ya tienes cuenta? Inicia sesión aquí
                        </Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    scrollContainer: {
        flexGrow: 1,
    },
    innerContainer: {
        flex: 1,
        padding: 20,
        justifyContent: 'center',
        alignItems: 'center',
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
});

export default RegisterScreen;