import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    Alert,
    ActivityIndicator,
    Platform,
    SafeAreaView,
    StatusBar,
    KeyboardAvoidingView,
    Animated,
    Dimensions,
    Switch,
    TextInput,
} from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import userService from '@/services/user.service';
import { UserGetDtoResponse } from '@/types/profile';

const { width } = Dimensions.get('window');

interface UserForm {
    name: string;
    email: string;
    phone: string;
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
}

interface PasswordValidation {
    minLength: boolean;
    hasUpperCase: boolean;
    hasLowerCase: boolean;
    hasNumber: boolean;
    hasSpecialChar: boolean;
}

export default function SettingsScreen() {
    const [profile, setProfile] = useState<UserGetDtoResponse | null>(null);
    const [form, setForm] = useState<UserForm>({
        name: '',
        email: '',
        phone: '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });

    const [activeSection, setActiveSection] = useState<'profile' | 'password' | 'notifications'>('profile');
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [showPasswords, setShowPasswords] = useState({
        current: false,
        new: false,
        confirm: false,
    });

    const [passwordValidation, setPasswordValidation] = useState<PasswordValidation>({
        minLength: false,
        hasUpperCase: false,
        hasLowerCase: false,
        hasNumber: false,
        hasSpecialChar: false,
    });

    const [notifications, setNotifications] = useState({
        pushEnabled: true,
        emailEnabled: true,
        smsEnabled: false,
        eventReminders: true,
        weeklyDigest: true,
    });

    const [fadeAnim] = useState(new Animated.Value(0));
    const [slideAnim] = useState(new Animated.Value(30));
    const [scaleAnim] = useState(new Animated.Value(0.95));

    useEffect(() => {
        loadProfile();
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 600,
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                tension: 100,
                friction: 8,
                useNativeDriver: true,
            })
        ]).start();
    }, []);

    useEffect(() => {
        if (form.newPassword) {
            validatePassword(form.newPassword);
        }
    }, [form.newPassword]);

    const loadProfile = async () => {
        try {
            setIsLoading(true);
            setError('');

            const token = await AsyncStorage.getItem('userToken');
            if (!token) {
                router.replace('/auth/login');
                return;
            }

            const userData = await userService.getUserProfile();
            setProfile(userData);
            setForm(prev => ({
                ...prev,
                name: userData.name,
                email: userData.email,
                phone: userData.phone || '',
            }));
        } catch (error: any) {
            setError(error.message || 'Error al cargar perfil');
            console.error('Error al cargar perfil:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const validatePassword = (password: string) => {
        setPasswordValidation({
            minLength: password.length >= 8,
            hasUpperCase: /[A-Z]/.test(password),
            hasLowerCase: /[a-z]/.test(password),
            hasNumber: /\d/.test(password),
            hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
        });
    };

    const isPasswordValid = () => {
        return Object.values(passwordValidation).every(valid => valid);
    };

    const handleInputChange = (field: keyof UserForm, value: string) => {
        setForm(prev => ({ ...prev, [field]: value }));
        setError('');
        setSuccess('');
    };

    const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
        setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
    };

    const handleUpdateProfile = async () => {
        setError('');
        setSuccess('');

        if (!form.name.trim()) {
            setError('El nombre es obligatorio');
            return;
        }

        if (!form.email.trim()) {
            setError('El correo electrónico es obligatorio');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(form.email)) {
            setError('El formato del correo electrónico no es válido');
            return;
        }

        try {
            setIsSaving(true);
            const token = await AsyncStorage.getItem('userToken');
            if (!token) {
                router.replace('/auth/login');
                return;
            }

            await userService.updateUserProfile(token, {
                name: form.name,
                email: form.email,
                phone: form.phone,
            });

            await loadProfile();
            setSuccess('Perfil actualizado correctamente');
            setTimeout(() => setSuccess(''), 3000);

        } catch (error: any) {
            setError(error.message || 'Error al actualizar perfil');
            console.error('Error al actualizar perfil:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleChangePassword = async () => {
        setError('');
        setSuccess('');

        if (!form.currentPassword.trim()) {
            setError('Debes ingresar tu contraseña actual');
            return;
        }

        if (!form.newPassword.trim()) {
            setError('Debes ingresar una nueva contraseña');
            return;
        }

        if (!isPasswordValid()) {
            setError('La nueva contraseña no cumple con los requisitos de seguridad');
            return;
        }

        if (form.newPassword !== form.confirmPassword) {
            setError('Las contraseñas no coinciden');
            return;
        }

        if (form.currentPassword === form.newPassword) {
            setError('La nueva contraseña debe ser diferente a la actual');
            return;
        }

        try {
            setIsSaving(true);
            const token = await AsyncStorage.getItem('userToken');
            if (!token) {
                router.replace('/auth/login');
                return;
            }

            await userService.updateUserProfile(token, {
                email: profile?.email,
                name: profile?.name,
                phone: profile?.phone,
                password: form.currentPassword,
                newPassword: form.newPassword,
                repeatNewPassword: form.confirmPassword,
            });

            setForm(prev => ({
                ...prev,
                currentPassword: '',
                newPassword: '',
                confirmPassword: '',
            }));

            setSuccess('Contraseña actualizada correctamente');

            setTimeout(() => {
                Alert.alert(
                    'Contraseña Actualizada',
                    'Tu contraseña ha sido cambiada exitosamente. Por seguridad, deberás iniciar sesión nuevamente.',
                    [
                        {
                            text: 'Entendido',
                            onPress: async () => {
                                await AsyncStorage.removeItem('userToken');
                                router.replace('/auth/login');
                            }
                        }
                    ]
                );
            }, 1500);

        } catch (error: any) {
            setError(error.message || 'Error al cambiar la contraseña');
            console.error('Error al cambiar contraseña:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const ValidationItem = ({ isValid, text }: { isValid: boolean; text: string }) => (
        <View style={styles.validationItem}>
            <Ionicons
                name={isValid ? "checkmark-circle" : "close-circle"}
                size={16}
                color={isValid ? "#10B981" : "#EF4444"}
            />
            <Text style={[styles.validationText, { color: isValid ? "#10B981" : "#6B7280" }]}>
                {text}
            </Text>
        </View>
    );

    const SectionTab = ({
        section,
        title,
        icon,
        isActive
    }: {
        section: 'profile' | 'password' | 'notifications';
        title: string;
        icon: string;
        isActive: boolean
    }) => (
        <TouchableOpacity
            style={[styles.sectionTab, isActive && styles.sectionTabActive]}
            onPress={() => setActiveSection(section)}
            activeOpacity={0.8}
        >
            {isActive && (
                <LinearGradient
                    colors={['#8B5CF6', '#7C3AED']}
                    style={styles.sectionTabGradient}
                />
            )}
            <Ionicons
                name={icon as any}
                size={18}
                color={isActive ? "#FFFFFF" : "#6B7280"}
            />
            <Text style={[styles.sectionTabText, isActive && styles.sectionTabTextActive]}>
                {title}
            </Text>
        </TouchableOpacity>
    );

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <LinearGradient
                    colors={['#8B5CF6', '#7C3AED']}
                    style={styles.loadingGradient}
                >
                    <ActivityIndicator size="large" color="#FFFFFF" />
                    <Text style={styles.loadingText}>Cargando configuración...</Text>
                </LinearGradient>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="light-content" backgroundColor="#8B5CF6" />
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={{ flex: 1 }}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
            >
                {/* Header */}
                <Animated.View
                    style={[
                        styles.headerContainer,
                        {
                            opacity: fadeAnim,
                            transform: [{ translateY: slideAnim }]
                        }
                    ]}
                >
                    <LinearGradient
                        colors={['#8B5CF6', '#7C3AED', '#6D28D9']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.header}
                    >
                        <View style={styles.decorativeElements}>
                            <View style={styles.circle1} />
                            <View style={styles.circle2} />
                            <View style={styles.circle3} />
                        </View>

                        <View style={styles.headerContent}>
                            <TouchableOpacity
                                style={styles.backButton}
                                onPress={() => router.back()}
                                activeOpacity={0.8}
                            >
                                <BlurView intensity={20} style={styles.backButtonBlur}>
                                    <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
                                </BlurView>
                            </TouchableOpacity>

                            <View style={styles.headerTextContainer}>
                                <View style={styles.iconContainer}>
                                    <LinearGradient
                                        colors={['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.1)']}
                                        style={styles.headerIcon}
                                    >
                                        <Ionicons name="settings" size={32} color="#FFFFFF" />
                                    </LinearGradient>
                                </View>
                                <Text style={styles.headerTitle}>Configuración</Text>
                                <Text style={styles.headerSubtitle}>
                                    Administra tu perfil, contraseña y preferencias
                                </Text>
                            </View>
                        </View>
                    </LinearGradient>
                </Animated.View>

                {/* Tabs */}
                <Animated.View
                    style={[
                        styles.sectionTabs,
                        {
                            opacity: fadeAnim,
                            transform: [{ translateY: slideAnim }]
                        }
                    ]}
                >
                    <SectionTab
                        section="profile"
                        title="Perfil"
                        icon="person-outline"
                        isActive={activeSection === 'profile'}
                    />
                    <SectionTab
                        section="password"
                        title="Contraseña"
                        icon="lock-closed-outline"
                        isActive={activeSection === 'password'}
                    />
                    <SectionTab
                        section="notifications"
                        title="Notificaciones"
                        icon="notifications-outline"
                        isActive={activeSection === 'notifications'}
                    />
                </Animated.View>

                <ScrollView
                    style={styles.container}
                    contentContainerStyle={styles.contentContainer}
                    showsVerticalScrollIndicator={false}
                >
                    <Animated.View
                        style={[
                            styles.formContainer,
                            {
                                opacity: fadeAnim,
                                transform: [
                                    { translateY: slideAnim },
                                    { scale: scaleAnim }
                                ]
                            }
                        ]}
                    >
                        {/* Messages */}
                        {error ? (
                            <View style={styles.messageContainer}>
                                <View style={styles.errorMessage}>
                                    <Ionicons name="alert-circle" size={20} color="#EF4444" />
                                    <Text style={styles.errorText}>{error}</Text>
                                </View>
                            </View>
                        ) : null}

                        {success ? (
                            <View style={styles.messageContainer}>
                                <View style={styles.successMessage}>
                                    <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                                    <Text style={styles.successText}>{success}</Text>
                                </View>
                            </View>
                        ) : null}

                        {/* Profile Section */}
                        {activeSection === 'profile' && (
                            <View style={styles.formCard}>
                                <View style={styles.sectionHeader}>
                                    <Ionicons name="person-circle" size={24} color="#8B5CF6" />
                                    <Text style={styles.sectionTitle}>Información Personal</Text>
                                </View>

                                <View style={styles.inputGroup}>
                                    <Text style={styles.label}>Nombre completo</Text>
                                    <View style={styles.inputContainer}>
                                        <Ionicons name="person" size={20} color="#9CA3AF" />
                                        <TextInput
                                            style={styles.input}
                                            value={form.name}
                                            onChangeText={(value) => handleInputChange('name', value)}
                                            placeholder="Ingresa tu nombre completo"
                                            placeholderTextColor="#9CA3AF"
                                        />
                                    </View>
                                </View>

                                <View style={styles.inputGroup}>
                                    <Text style={styles.label}>Correo electrónico</Text>
                                    <View style={styles.inputContainer}>
                                        <Ionicons name="mail" size={20} color="#9CA3AF" />
                                        <TextInput
                                            style={styles.input}
                                            value={form.email}
                                            onChangeText={(value) => handleInputChange('email', value)}
                                            placeholder="correo@ejemplo.com"
                                            placeholderTextColor="#9CA3AF"
                                            keyboardType="email-address"
                                            autoCapitalize="none"
                                        />
                                    </View>
                                </View>

                                <View style={styles.inputGroup}>
                                    <Text style={styles.label}>Teléfono (opcional)</Text>
                                    <View style={styles.inputContainer}>
                                        <Ionicons name="call" size={20} color="#9CA3AF" />
                                        <TextInput
                                            style={styles.input}
                                            value={form.phone}
                                            onChangeText={(value) => handleInputChange('phone', value)}
                                            placeholder="+1 234 567 8900"
                                            placeholderTextColor="#9CA3AF"
                                            keyboardType="phone-pad"
                                        />
                                    </View>
                                </View>

                                <TouchableOpacity
                                    style={[styles.button, isSaving && styles.buttonDisabled]}
                                    onPress={handleUpdateProfile}
                                    disabled={isSaving}
                                    activeOpacity={0.8}
                                >
                                    <LinearGradient
                                        colors={['#8B5CF6', '#7C3AED']}
                                        style={styles.buttonGradient}
                                    >
                                        {isSaving ? (
                                            <ActivityIndicator size="small" color="#FFFFFF" />
                                        ) : (
                                            <>
                                                <Ionicons name="save" size={20} color="#FFFFFF" />
                                                <Text style={styles.buttonText}>Guardar Cambios</Text>
                                            </>
                                        )}
                                    </LinearGradient>
                                </TouchableOpacity>
                            </View>
                        )}

                        {/* Password Section */}
                        {activeSection === 'password' && (
                            <View style={styles.formCard}>
                                <View style={styles.sectionHeader}>
                                    <Ionicons name="lock-closed" size={24} color="#8B5CF6" />
                                    <Text style={styles.sectionTitle}>Cambiar Contraseña</Text>
                                </View>

                                <View style={styles.inputGroup}>
                                    <Text style={styles.label}>Contraseña actual</Text>
                                    <View style={styles.inputContainer}>
                                        <Ionicons name="lock-closed" size={20} color="#9CA3AF" />
                                        <TextInput
                                            style={styles.input}
                                            value={form.currentPassword}
                                            onChangeText={(value) => handleInputChange('currentPassword', value)}
                                            placeholder="Ingresa tu contraseña actual"
                                            placeholderTextColor="#9CA3AF"
                                            secureTextEntry={!showPasswords.current}
                                        />
                                        <TouchableOpacity
                                            onPress={() => togglePasswordVisibility('current')}
                                            style={styles.eyeButton}
                                        >
                                            <Ionicons
                                                name={showPasswords.current ? "eye" : "eye-off"}
                                                size={20}
                                                color="#9CA3AF"
                                            />
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                <View style={styles.inputGroup}>
                                    <Text style={styles.label}>Nueva contraseña</Text>
                                    <View style={styles.inputContainer}>
                                        <Ionicons name="lock-open" size={20} color="#9CA3AF" />
                                        <TextInput
                                            style={styles.input}
                                            value={form.newPassword}
                                            onChangeText={(value) => handleInputChange('newPassword', value)}
                                            placeholder="Ingresa tu nueva contraseña"
                                            placeholderTextColor="#9CA3AF"
                                            secureTextEntry={!showPasswords.new}
                                        />
                                        <TouchableOpacity
                                            onPress={() => togglePasswordVisibility('new')}
                                            style={styles.eyeButton}
                                        >
                                            <Ionicons
                                                name={showPasswords.new ? "eye" : "eye-off"}
                                                size={20}
                                                color="#9CA3AF"
                                            />
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                {form.newPassword ? (
                                    <View style={styles.validationContainer}>
                                        <Text style={styles.validationTitle}>Requisitos de contraseña:</Text>
                                        <ValidationItem
                                            isValid={passwordValidation.minLength}
                                            text="Mínimo 8 caracteres"
                                        />
                                        <ValidationItem
                                            isValid={passwordValidation.hasUpperCase}
                                            text="Una letra mayúscula"
                                        />
                                        <ValidationItem
                                            isValid={passwordValidation.hasLowerCase}
                                            text="Una letra minúscula"
                                        />
                                        <ValidationItem
                                            isValid={passwordValidation.hasNumber}
                                            text="Un número"
                                        />
                                        <ValidationItem
                                            isValid={passwordValidation.hasSpecialChar}
                                            text="Un carácter especial"
                                        />
                                    </View>
                                ) : null}

                                <View style={styles.inputGroup}>
                                    <Text style={styles.label}>Confirmar nueva contraseña</Text>
                                    <View style={styles.inputContainer}>
                                        <Ionicons name="lock-closed" size={20} color="#9CA3AF" />
                                        <TextInput
                                            style={styles.input}
                                            value={form.confirmPassword}
                                            onChangeText={(value) => handleInputChange('confirmPassword', value)}
                                            placeholder="Confirma tu nueva contraseña"
                                            placeholderTextColor="#9CA3AF"
                                            secureTextEntry={!showPasswords.confirm}
                                        />
                                        <TouchableOpacity
                                            onPress={() => togglePasswordVisibility('confirm')}
                                            style={styles.eyeButton}
                                        >
                                            <Ionicons
                                                name={showPasswords.confirm ? "eye" : "eye-off"}
                                                size={20}
                                                color="#9CA3AF"
                                            />
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                <TouchableOpacity
                                    style={[styles.button, isSaving && styles.buttonDisabled]}
                                    onPress={handleChangePassword}
                                    disabled={isSaving}
                                    activeOpacity={0.8}
                                >
                                    <LinearGradient
                                        colors={['#8B5CF6', '#7C3AED']}
                                        style={styles.buttonGradient}
                                    >
                                        {isSaving ? (
                                            <ActivityIndicator size="small" color="#FFFFFF" />
                                        ) : (
                                            <>
                                                <Ionicons name="shield-checkmark" size={20} color="#FFFFFF" />
                                                <Text style={styles.buttonText}>Cambiar Contraseña</Text>
                                            </>
                                        )}
                                    </LinearGradient>
                                </TouchableOpacity>

                                <View style={styles.securityTips}>
                                    <View style={styles.tipsHeader}>
                                        <Ionicons name="information-circle" size={20} color="#8B5CF6" />
                                        <Text style={styles.tipsTitle}>Consejos de seguridad</Text>
                                    </View>
                                    <View style={styles.tipsList}>
                                        <View style={styles.tipItem}>
                                            <Ionicons name="checkmark" size={14} color="#10B981" />
                                            <Text style={styles.tipText}>
                                                Usa una combinación única de letras, números y símbolos
                                            </Text>
                                        </View>
                                        <View style={styles.tipItem}>
                                            <Ionicons name="checkmark" size={14} color="#10B981" />
                                            <Text style={styles.tipText}>
                                                Evita usar información personal como fechas o nombres
                                            </Text>
                                        </View>
                                        <View style={styles.tipItem}>
                                            <Ionicons name="checkmark" size={14} color="#10B981" />
                                            <Text style={styles.tipText}>
                                                No reutilices contraseñas de otras cuentas
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                            </View>
                        )}

                        {/* Notifications Section */}
                        {activeSection === 'notifications' && (
                            <View style={styles.formCard}>
                                <View style={styles.sectionHeader}>
                                    <Ionicons name="notifications" size={24} color="#8B5CF6" />
                                    <Text style={styles.sectionTitle}>Preferencias de Notificaciones</Text>
                                </View>

                                <View style={styles.notificationsList}>
                                    <View style={styles.notificationItem}>
                                        <View style={styles.notificationInfo}>
                                            <Ionicons name="phone-portrait" size={20} color="#8B5CF6" />
                                            <View style={styles.notificationText}>
                                                <Text style={styles.notificationTitle}>Notificaciones Push</Text>
                                                <Text style={styles.notificationSubtitle}>
                                                    Recibe notificaciones en tu dispositivo
                                                </Text>
                                            </View>
                                        </View>
                                        <Switch
                                            value={notifications.pushEnabled}
                                            onValueChange={(value) =>
                                                setNotifications(prev => ({ ...prev, pushEnabled: value }))
                                            }
                                            trackColor={{ false: '#E5E7EB', true: '#8B5CF6' }}
                                            thumbColor={notifications.pushEnabled ? '#FFFFFF' : '#9CA3AF'}
                                        />
                                    </View>

                                    <View style={styles.notificationItem}>
                                        <View style={styles.notificationInfo}>
                                            <Ionicons name="mail" size={20} color="#10B981" />
                                            <View style={styles.notificationText}>
                                                <Text style={styles.notificationTitle}>Notificaciones por Email</Text>
                                                <Text style={styles.notificationSubtitle}>
                                                    Recibe actualizaciones importantes por correo
                                                </Text>
                                            </View>
                                        </View>
                                        <Switch
                                            value={notifications.emailEnabled}
                                            onValueChange={(value) =>
                                                setNotifications(prev => ({ ...prev, emailEnabled: value }))
                                            }
                                            trackColor={{ false: '#E5E7EB', true: '#10B981' }}
                                            thumbColor={notifications.emailEnabled ? '#FFFFFF' : '#9CA3AF'}
                                        />
                                    </View>

                                    <View style={styles.notificationItem}>
                                        <View style={styles.notificationInfo}>
                                            <Ionicons name="chatbubbles" size={20} color="#06B6D4" />
                                            <View style={styles.notificationText}>
                                                <Text style={styles.notificationTitle}>Notificaciones SMS</Text>
                                                <Text style={styles.notificationSubtitle}>
                                                    Recibe mensajes de texto importantes
                                                </Text>
                                            </View>
                                        </View>
                                        <Switch
                                            value={notifications.smsEnabled}
                                            onValueChange={(value) =>
                                                setNotifications(prev => ({ ...prev, smsEnabled: value }))
                                            }
                                            trackColor={{ false: '#E5E7EB', true: '#06B6D4' }}
                                            thumbColor={notifications.smsEnabled ? '#FFFFFF' : '#9CA3AF'}
                                        />
                                    </View>

                                    <View style={styles.notificationItem}>
                                        <View style={styles.notificationInfo}>
                                            <Ionicons name="calendar" size={20} color="#F59E0B" />
                                            <View style={styles.notificationText}>
                                                <Text style={styles.notificationTitle}>Recordatorios de Eventos</Text>
                                                <Text style={styles.notificationSubtitle}>
                                                    Te avisamos antes de tus eventos programados
                                                </Text>
                                            </View>
                                        </View>
                                        <Switch
                                            value={notifications.eventReminders}
                                            onValueChange={(value) =>
                                                setNotifications(prev => ({ ...prev, eventReminders: value }))
                                            }
                                            trackColor={{ false: '#E5E7EB', true: '#F59E0B' }}
                                            thumbColor={notifications.eventReminders ? '#FFFFFF' : '#9CA3AF'}
                                        />
                                    </View>

                                    <View style={styles.notificationItem}>
                                        <View style={styles.notificationInfo}>
                                            <Ionicons name="newspaper" size={20} color="#EF4444" />
                                            <View style={styles.notificationText}>
                                                <Text style={styles.notificationTitle}>Resumen Semanal</Text>
                                                <Text style={styles.notificationSubtitle}>
                                                    Recibe un resumen de tu actividad cada semana
                                                </Text>
                                            </View>
                                        </View>
                                        <Switch
                                            value={notifications.weeklyDigest}
                                            onValueChange={(value) =>
                                                setNotifications(prev => ({ ...prev, weeklyDigest: value }))
                                            }
                                            trackColor={{ false: '#E5E7EB', true: '#EF4444' }}
                                            thumbColor={notifications.weeklyDigest ? '#FFFFFF' : '#9CA3AF'}
                                        />
                                    </View>
                                </View>
                            </View>
                        )}
                    </Animated.View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingGradient: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
    },
    loadingText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
        marginTop: 16,
    },
    headerContainer: {
        position: 'relative',
        overflow: 'hidden',
    },
    header: {
        paddingTop: Platform.OS === 'ios' ? 10 : 20,
        paddingBottom: 20,
        paddingHorizontal: 20,
        position: 'relative',
    },
    decorativeElements: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    circle1: {
        position: 'absolute',
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        top: -40,
        right: -30,
    },
    circle2: {
        position: 'absolute',
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        top: 60,
        right: 50,
    },
    circle3: {
        position: 'absolute',
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'rgba(255, 255, 255, 0.06)',
        bottom: -20,
        left: -20,
    },
    headerContent: {
        position: 'relative',
        zIndex: 1,
    },
    backButton: {
        marginBottom: 20,
        alignSelf: 'flex-start',
    },
    backButtonBlur: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    headerTextContainer: {
        alignItems: 'center',
    },
    iconContainer: {
        marginBottom: 12,
    },
    headerIcon: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 4,
        textAlign: 'center',
    },
    headerSubtitle: {
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.8)',
        textAlign: 'center',
        lineHeight: 20,
    },
    sectionTabs: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        marginHorizontal: 16,
        marginTop: -10,
        borderRadius: 16,
        padding: 4,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
    sectionTab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 8,
        borderRadius: 12,
        position: 'relative',
    },
    sectionTabActive: {
        // Styles applied via gradient
    },
    sectionTabGradient: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        borderRadius: 12,
    },
    sectionTabText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6B7280',
        marginLeft: 6,
    },
    sectionTabTextActive: {
        color: '#FFFFFF',
    },
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    contentContainer: {
        padding: 16,
        paddingTop: 24,
    },
    formContainer: {
        flex: 1,
    },
    messageContainer: {
        marginBottom: 16,
    },
    errorMessage: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FEF2F2',
        padding: 12,
        borderRadius: 12,
        borderLeftWidth: 4,
        borderLeftColor: '#EF4444',
    },
    errorText: {
        color: '#DC2626',
        fontSize: 14,
        fontWeight: '500',
        marginLeft: 8,
        flex: 1,
    },
    successMessage: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F0FDF4',
        padding: 12,
        borderRadius: 12,
        borderLeftWidth: 4,
        borderLeftColor: '#10B981',
    },
    successText: {
        color: '#059669',
        fontSize: 14,
        fontWeight: '500',
        marginLeft: 8,
        flex: 1,
    },
    formCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1F2937',
        marginLeft: 12,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: '#1F2937',
        marginLeft: 12,
        paddingVertical: 0,
    },
    eyeButton: {
        padding: 4,
    },
    validationContainer: {
        backgroundColor: '#F9FAFB',
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
    },
    validationTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 12,
    },
    validationItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    validationText: {
        fontSize: 14,
        marginLeft: 8,
    },
    button: {
        borderRadius: 12,
        overflow: 'hidden',
        marginTop: 8,
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    buttonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        paddingHorizontal: 24,
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
    securityTips: {
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        padding: 16,
        marginTop: 20,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    tipsHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    tipsTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#475569',
        marginLeft: 8,
    },
    tipsList: {
        marginLeft: 8,
    },
    tipItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    tipText: {
        fontSize: 13,
        color: '#64748B',
        marginLeft: 8,
        flex: 1,
        lineHeight: 18,
    },
    notificationsList: {
        marginTop: 8,
    },
    notificationItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    notificationInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    notificationText: {
        marginLeft: 12,
        flex: 1,
    },
    notificationTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 2,
    },
    notificationSubtitle: {
        fontSize: 14,
        color: '#6B7280',
        lineHeight: 18,
    },
});