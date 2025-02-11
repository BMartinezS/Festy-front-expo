import React, { useState } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { router } from 'expo-router';

const RegisterScreen: React.FC = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
    });
    const [error, setError] = useState<string>('');

    const handleInputChange = (field: keyof typeof formData, value: string): void => {
        setFormData(prev => ({
            ...prev,
            [field]: value,
        }));
    };

    const handleRegister = (): void => {
        const { name, email, password, confirmPassword } = formData;

        if (!name || !email || !password || !confirmPassword) {
            setError('Por favor completa todos los campos');
            return;
        }

        if (password !== confirmPassword) {
            setError('Las contraseñas no coinciden');
            return;
        }
        // Implementar lógica de registro
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
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

                <TouchableOpacity style={styles.button} onPress={handleRegister}>
                    <Text style={styles.buttonText}>Registrarse</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.linkButton}
                    onPress={() => router.push('/auth/login')}
                >
                    <Text style={styles.linkText}>
                        ¿Ya tienes cuenta? Inicia sesión aquí
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
});

export default RegisterScreen;