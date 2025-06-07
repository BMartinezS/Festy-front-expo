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
    StatusBar,
} from 'react-native';
import { router } from 'expo-router';
import { authService } from '@/services/auth.service';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';

const RegisterScreen: React.FC = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        phone: '',
    });
    const [error, setError] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);
    const [focusedField, setFocusedField] = useState<string>('');

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

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setError('Formato de correo electrónico inválido');
            return false;
        }

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
                phone: formData.phone,
            });

            if (response && response.token) {
                await AsyncStorage.setItem('userToken', response.token);

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
        <>
            <StatusBar barStyle="light-content" backgroundColor="#7C3AED" />
            <LinearGradient
                colors={['#8B5CF6', '#7C3AED', '#6D28D9']}
                style={styles.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.container}
                >
                    <ScrollView
                        contentContainerStyle={styles.scrollContainer}
                        showsVerticalScrollIndicator={false}
                    >
                        <View style={styles.innerContainer}>
                            {/* Decoraciones */}
                            <View style={styles.headerDecoration}>
                                <View style={styles.decorativeElement1} />
                                <View style={styles.decorativeElement2} />
                                <View style={styles.decorativeElement3} />
                            </View>

                            {/* Card principal */}
                            <View style={styles.card}>
                                <View style={styles.logoContainer}>
                                    <View style={styles.logoIcon}>
                                        <Text style={styles.logoText}>E</Text>
                                    </View>
                                    <Text style={styles.appName}>EventApp</Text>
                                </View>

                                <Text style={styles.title}>Crear tu cuenta</Text>
                                <Text style={styles.subtitle}>Únete y organiza eventos increíbles</Text>

                                {/* Alerta de error */}
                                {error ? (
                                    <View style={styles.alertError}>
                                        <Text style={styles.alertText}>{error}</Text>
                                    </View>
                                ) : null}

                                {/* Formulario */}
                                <View style={styles.form}>
                                    <View style={[
                                        styles.inputContainer,
                                        focusedField === 'name' && styles.inputContainerFocused
                                    ]}>
                                        <TextInput
                                            style={styles.input}
                                            placeholder="Nombre completo"
                                            placeholderTextColor="#9CA3AF"
                                            value={formData.name}
                                            onChangeText={(value) => handleInputChange('name', value)}
                                            autoComplete="name"
                                        />
                                    </View>

                                    <View style={[
                                        styles.inputContainer,
                                        focusedField === 'email' && styles.inputContainerFocused
                                    ]}>
                                        <TextInput
                                            style={styles.input}
                                            placeholder="Correo electrónico"
                                            placeholderTextColor="#9CA3AF"
                                            value={formData.email}
                                            onChangeText={(value) => handleInputChange('email', value)}
                                            keyboardType="email-address"
                                            autoCapitalize="none"
                                            autoComplete="email"
                                        />
                                    </View>

                                    <View style={[
                                        styles.inputContainer,
                                        focusedField === 'phone' && styles.inputContainerFocused
                                    ]}>
                                        <TextInput
                                            style={styles.input}
                                            placeholder="Teléfono (+56912345678)"
                                            placeholderTextColor="#9CA3AF"
                                            value={formData.phone}
                                            onChangeText={(value) => handleInputChange('phone', value)}
                                            keyboardType="phone-pad"
                                        />
                                    </View>

                                    <View style={[
                                        styles.inputContainer,
                                        focusedField === 'password' && styles.inputContainerFocused
                                    ]}>
                                        <TextInput
                                            style={styles.input}
                                            placeholder="Contraseña"
                                            placeholderTextColor="#9CA3AF"
                                            value={formData.password}
                                            onChangeText={(value) => handleInputChange('password', value)}
                                            secureTextEntry
                                            autoComplete="password-new"
                                        />
                                    </View>

                                    <View style={[
                                        styles.inputContainer,
                                        focusedField === 'confirmPassword' && styles.inputContainerFocused
                                    ]}>
                                        <TextInput
                                            style={styles.input}
                                            placeholder="Confirmar contraseña"
                                            placeholderTextColor="#9CA3AF"
                                            value={formData.confirmPassword}
                                            onChangeText={(value) => handleInputChange('confirmPassword', value)}
                                            secureTextEntry
                                            autoComplete="password-new"
                                        />
                                    </View>

                                    <TouchableOpacity
                                        style={[styles.button, isLoading && styles.buttonDisabled]}
                                        onPress={handleRegister}
                                        disabled={isLoading}
                                        activeOpacity={0.8}
                                    >
                                        <LinearGradient
                                            colors={['#8B5CF6', '#7C3AED']}
                                            style={styles.buttonGradient}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 0 }}
                                        >
                                            {isLoading ? (
                                                <ActivityIndicator size="small" color="#ffffff" />
                                            ) : (
                                                <Text style={styles.buttonText}>Crear Cuenta</Text>
                                            )}
                                        </LinearGradient>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={styles.linkButton}
                                        onPress={() => router.push('/auth/login')}
                                        disabled={isLoading}
                                        activeOpacity={0.7}
                                    >
                                        <Text style={styles.linkText}>
                                            ¿Ya tienes cuenta? <Text style={styles.linkTextBold}>Inicia sesión aquí</Text>
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </LinearGradient>
        </>
    );
};

const styles = StyleSheet.create({
    gradient: {
        flex: 1,
    },
    container: {
        flex: 1,
    },
    scrollContainer: {
        flexGrow: 1,
        paddingVertical: 20,
    },
    innerContainer: {
        flex: 1,
        padding: 20,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
        minHeight: '100%',
    },
    headerDecoration: {
        position: 'absolute',
        top: 20,
        right: -40,
        opacity: 0.08,
    },
    decorativeElement1: {
        width: 120,
        height: 120,
        borderRadius: 20,
        backgroundColor: '#FFFFFF',
        transform: [{ rotate: '15deg' }],
    },
    decorativeElement2: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#FFFFFF',
        position: 'absolute',
        top: 60,
        left: 80,
        transform: [{ rotate: '-10deg' }],
    },
    decorativeElement3: {
        width: 40,
        height: 40,
        backgroundColor: '#FFFFFF',
        position: 'absolute',
        top: 100,
        left: 20,
        transform: [{ rotate: '45deg' }],
    },
    card: {
        width: '100%',
        maxWidth: 400,
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 28,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 15,
        },
        shadowOpacity: 0.25,
        shadowRadius: 25,
        elevation: 20,
        marginVertical: 20,
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 24,
    },
    logoIcon: {
        width: 56,
        height: 56,
        borderRadius: 16,
        backgroundColor: '#8B5CF6',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    logoText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    appName: {
        fontSize: 18,
        fontWeight: '600',
        color: '#374151',
        letterSpacing: 0.5,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#111827',
        textAlign: 'center',
        marginBottom: 6,
    },
    subtitle: {
        fontSize: 15,
        color: '#6B7280',
        textAlign: 'center',
        marginBottom: 24,
    },
    form: {
        width: '100%',
    },
    inputContainer: {
        backgroundColor: '#F9FAFB',
        borderRadius: 14,
        marginBottom: 12,
        borderWidth: 2,
        borderColor: '#F3F4F6',
    },
    inputContainerFocused: {
        borderColor: '#8B5CF6',
        backgroundColor: '#FFFFFF',
        shadowColor: '#8B5CF6',
        shadowOffset: {
            width: 0,
            height: 3,
        },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 3,
    },
    input: {
        height: 52,
        paddingHorizontal: 18,
        fontSize: 15,
        color: '#374151',
        fontWeight: '500',
    },
    button: {
        width: '100%',
        height: 52,
        borderRadius: 14,
        marginTop: 8,
        marginBottom: 20,
        overflow: 'hidden',
        shadowColor: '#8B5CF6',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    buttonGradient: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    linkButton: {
        padding: 8,
        alignItems: 'center',
    },
    linkText: {
        color: '#6B7280',
        fontSize: 15,
        textAlign: 'center',
    },
    linkTextBold: {
        color: '#8B5CF6',
        fontWeight: '600',
    },
    alertError: {
        backgroundColor: '#FEE2E2',
        borderColor: '#FECACA',
        borderWidth: 1,
        borderRadius: 12,
        padding: 14,
        marginBottom: 16,
    },
    alertText: {
        color: '#DC2626',
        fontSize: 14,
        textAlign: 'center',
        fontWeight: '500',
    },
    securityFooter: {
        marginTop: 16,
        alignItems: 'center',
    },
    securityIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    securityDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#22C55E',
        marginRight: 6,
    },
    securityText: {
        color: 'rgba(255, 255, 255, 0.9)',
        fontSize: 12,
        fontWeight: '500',
    },
});

export default RegisterScreen;