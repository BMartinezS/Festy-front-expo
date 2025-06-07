import React, { useState } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    StatusBar,
    Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import { authService } from '@/services/auth.service';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';

interface LoginScreenProps { }

const { width, height } = Dimensions.get('window');

const LoginScreen: React.FC<LoginScreenProps> = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isEmailFocused, setIsEmailFocused] = useState(false);
    const [isPasswordFocused, setIsPasswordFocused] = useState(false);

    const handleLogin = async (): Promise<void> => {
        if (!email || !password) {
            setError('Por favor completa todos los campos');
            return;
        }

        try {
            setIsLoading(true);
            setError('');
            setSuccessMessage('');

            console.log('Iniciando login...');
            const response: any = await authService.login({ email, password });

            if ('error' in response || !response.data) {
                setError(`Error en la petición: ${response.error}`);
                return;
            }

            if (response.data?.token) {
                console.log('Login exitoso:', response.data.token);
                await AsyncStorage.setItem('userToken', response.data.token);
                setSuccessMessage('¡Bienvenido!');
                setTimeout(() => {
                    router.replace('/(tabs)');
                }, 1000);
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
                    <View style={styles.innerContainer}>
                        {/* Header decorativo */}
                        <View style={styles.headerDecoration}>
                            <View style={styles.decorativeCircle1} />
                            <View style={styles.decorativeCircle2} />
                            <View style={styles.decorativeCircle3} />
                        </View>

                        {/* Card principal */}
                        <View style={styles.card}>
                            <View style={styles.logoContainer}>
                                <View style={styles.logoIcon}>
                                    <Text style={styles.logoText}>E</Text>
                                </View>
                                <Text style={styles.appName}>EventApp</Text>
                            </View>

                            <Text style={styles.title}>Bienvenido de vuelta</Text>
                            <Text style={styles.subtitle}>Inicia sesión para continuar</Text>

                            {/* Mensajes de estado */}
                            {error ? (
                                <View style={styles.alertError}>
                                    <Text style={styles.alertText}>{error}</Text>
                                </View>
                            ) : null}

                            {successMessage ? (
                                <View style={styles.alertSuccess}>
                                    <Text style={styles.alertSuccessText}>{successMessage}</Text>
                                </View>
                            ) : null}

                            {/* Formulario */}
                            <View style={styles.form}>
                                <View style={[
                                    styles.inputContainer,
                                    isEmailFocused && styles.inputContainerFocused
                                ]}>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Correo electrónico"
                                        placeholderTextColor="#9CA3AF"
                                        value={email}
                                        onChangeText={setEmail}
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                        autoComplete="email"
                                    />
                                </View>

                                <View style={[
                                    styles.inputContainer,
                                    isPasswordFocused && styles.inputContainerFocused
                                ]}>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Contraseña"
                                        placeholderTextColor="#9CA3AF"
                                        value={password}
                                        onChangeText={setPassword}
                                        secureTextEntry
                                        autoComplete="password"
                                    />
                                </View>

                                <TouchableOpacity
                                    style={[styles.button, isLoading && styles.buttonDisabled]}
                                    onPress={handleLogin}
                                    disabled={isLoading}
                                    activeOpacity={0.8}
                                >
                                    <LinearGradient
                                        colors={['#8B5CF6', '#7C3AED']}
                                        style={styles.buttonGradient}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                    >
                                        <Text style={styles.buttonText}>
                                            {isLoading ? 'Iniciando...' : 'Iniciar Sesión'}
                                        </Text>
                                    </LinearGradient>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.linkButton}
                                    onPress={handleRegister}
                                    activeOpacity={0.7}
                                >
                                    <Text style={styles.linkText}>
                                        ¿No tienes cuenta? <Text style={styles.linkTextBold}>Regístrate aquí</Text>
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Footer decorativo */}
                        <View style={styles.footerDecoration}>
                            <View style={styles.decorativeShape1} />
                            <View style={styles.decorativeShape2} />
                        </View>
                    </View>
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
    innerContainer: {
        flex: 1,
        padding: 20,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    headerDecoration: {
        position: 'absolute',
        top: 50,
        right: -30,
        opacity: 0.1,
    },
    decorativeCircle1: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#FFFFFF',
        position: 'absolute',
    },
    decorativeCircle2: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#FFFFFF',
        position: 'absolute',
        top: 20,
        left: 70,
    },
    decorativeCircle3: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: '#FFFFFF',
        position: 'absolute',
        top: 80,
        left: 30,
    },
    footerDecoration: {
        position: 'absolute',
        bottom: 30,
        left: -20,
        opacity: 0.1,
    },
    decorativeShape1: {
        width: 80,
        height: 80,
        backgroundColor: '#FFFFFF',
        transform: [{ rotate: '45deg' }],
    },
    decorativeShape2: {
        width: 40,
        height: 40,
        backgroundColor: '#FFFFFF',
        transform: [{ rotate: '45deg' }],
        position: 'absolute',
        top: 60,
        left: 60,
    },
    card: {
        width: '100%',
        maxWidth: 400,
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 32,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 10,
        },
        shadowOpacity: 0.25,
        shadowRadius: 24,
        elevation: 16,
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 32,
    },
    logoIcon: {
        width: 64,
        height: 64,
        borderRadius: 20,
        backgroundColor: '#8B5CF6',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    logoText: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    appName: {
        fontSize: 20,
        fontWeight: '600',
        color: '#374151',
        letterSpacing: 0.5,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#111827',
        textAlign: 'center',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#6B7280',
        textAlign: 'center',
        marginBottom: 32,
    },
    form: {
        width: '100%',
    },
    inputContainer: {
        backgroundColor: '#F9FAFB',
        borderRadius: 16,
        marginBottom: 16,
        borderWidth: 2,
        borderColor: '#F3F4F6',
    },
    inputContainerFocused: {
        borderColor: '#8B5CF6',
        backgroundColor: '#FFFFFF',
        shadowColor: '#8B5CF6',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    input: {
        height: 56,
        paddingHorizontal: 20,
        fontSize: 16,
        color: '#374151',
        fontWeight: '500',
    },
    button: {
        width: '100%',
        height: 56,
        borderRadius: 16,
        marginTop: 8,
        marginBottom: 24,
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
        fontSize: 18,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    linkButton: {
        padding: 8,
        alignItems: 'center',
    },
    linkText: {
        color: '#6B7280',
        fontSize: 16,
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
        padding: 16,
        marginBottom: 16,
    },
    alertText: {
        color: '#DC2626',
        fontSize: 14,
        textAlign: 'center',
        fontWeight: '500',
    },
    alertSuccess: {
        backgroundColor: '#D1FAE5',
        borderColor: '#A7F3D0',
        borderWidth: 1,
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
    },
    alertSuccessText: {
        color: '#059669',
        fontSize: 14,
        textAlign: 'center',
        fontWeight: '500',
    },
});

export default LoginScreen;