import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    TextInput,
    Image,
    ScrollView,
    Alert,
    ActivityIndicator,
    Platform,
    SafeAreaView,
    StatusBar,
    KeyboardAvoidingView,
    Animated,
    Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '@/services/auth.service';
import userService from '@/services/user.service';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

const { width, height } = Dimensions.get('window');

interface UserProfile {
    name: string;
    email: string;
    phone: string;
}

export default function ProfileScreen() {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [updatedProfile, setUpdatedProfile] = useState<Partial<UserProfile>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');

    // Animaciones
    const [fadeAnim] = useState(new Animated.Value(0));
    const [slideAnim] = useState(new Animated.Value(30));
    const [scaleAnim] = useState(new Animated.Value(0.95));

    useEffect(() => {
        loadProfile();

        // Iniciar animaciones
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
            setUpdatedProfile({
                name: userData.name,
                email: userData.email,
                phone: userData.phone,
            });
        } catch (error: any) {
            setError(error.message || 'Error al cargar perfil');
            console.error('Error al cargar perfil:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleEdit = () => {
        if (profile) {
            setUpdatedProfile({
                name: profile.name,
                email: profile.email,
                phone: profile.phone,
            });
            setIsEditing(true);
        }
    };

    const handleCancel = () => {
        setIsEditing(false);
        setError('');
    };

    const handleSave = async () => {
        if (!updatedProfile.name || !updatedProfile.email) {
            setError('Nombre y correo son obligatorios');
            return;
        }

        try {
            setIsSaving(true);
            setError('');

            const token = await AsyncStorage.getItem('userToken');
            if (!token) {
                router.replace('/auth/login');
                return;
            }

            await userService.updateUserProfile(token, updatedProfile);
            await loadProfile();
            setIsEditing(false);

            Alert.alert('Perfil actualizado', 'Tus datos han sido actualizados correctamente');
        } catch (error: any) {
            setError(error.message || 'Error al actualizar perfil');
            console.error('Error al actualizar perfil:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (status !== 'granted') {
            Alert.alert('Permiso denegado', 'Se necesita acceso a la galería para seleccionar una imagen');
            return;
        }

        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.7,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                setUpdatedProfile({
                    ...updatedProfile
                });
            }
        } catch (error) {
            console.error('Error al seleccionar imagen:', error);
            Alert.alert('Error', 'No se pudo seleccionar la imagen');
        }
    };

    const handleLogout = async () => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            if (token) {
                try {
                    await authService.logout(token);
                } catch (error) {
                    console.error('Error en logout:', error);
                }
            }
            await AsyncStorage.removeItem('userToken');
            router.replace('/auth/login');
        } catch (error) {
            console.error('Error al cerrar sesión:', error);
            Alert.alert('Error', 'No se pudo cerrar sesión');
        }
    };

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <LinearGradient
                    colors={['#8B5CF6', '#7C3AED']}
                    style={styles.loadingGradient}
                >
                    <ActivityIndicator size="large" color="#FFFFFF" />
                    <Text style={styles.loadingText}>Cargando perfil...</Text>
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
                <ScrollView
                    style={styles.container}
                    contentContainerStyle={styles.contentContainer}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Header con gradiente mejorado */}
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
                            {/* Elementos decorativos */}
                            <View style={styles.decorativeElements}>
                                <View style={styles.circle1} />
                                <View style={styles.circle2} />
                                <View style={styles.circle3} />
                            </View>
                        </LinearGradient>
                    </Animated.View>

                    {error ? (
                        <Animated.View
                            style={[
                                styles.errorContainer,
                                { opacity: fadeAnim }
                            ]}
                        >
                            <View style={styles.errorContent}>
                                <Ionicons name="alert-circle" size={20} color="#EF4444" />
                                <Text style={styles.errorText}>{error}</Text>
                            </View>
                        </Animated.View>
                    ) : null}

                    <Animated.View
                        style={[
                            styles.contentArea,
                            {
                                opacity: fadeAnim,
                                transform: [{ translateY: slideAnim }]
                            }
                        ]}
                    >
                        {isEditing ? (
                            // Modo de edición
                            <View style={styles.editContainer}>
                                <View style={styles.editHeader}>
                                    <Ionicons name="create" size={24} color="#8B5CF6" />
                                    <Text style={styles.editTitle}>Editar Perfil</Text>
                                </View>

                                <View style={styles.formContainer}>
                                    <View style={styles.inputGroup}>
                                        <Text style={styles.label}>Nombre completo</Text>
                                        <View style={styles.inputWrapper}>
                                            <View style={styles.inputIconContainer}>
                                                <Ionicons name="person-outline" size={20} color="#8B5CF6" />
                                            </View>
                                            <TextInput
                                                style={styles.input}
                                                value={updatedProfile.name}
                                                onChangeText={(text) => setUpdatedProfile({ ...updatedProfile, name: text })}
                                                placeholder="Tu nombre completo"
                                                placeholderTextColor="#9CA3AF"
                                            />
                                        </View>
                                    </View>

                                    <View style={styles.inputGroup}>
                                        <Text style={styles.label}>Correo electrónico</Text>
                                        <View style={styles.inputWrapper}>
                                            <View style={styles.inputIconContainer}>
                                                <Ionicons name="mail-outline" size={20} color="#8B5CF6" />
                                            </View>
                                            <TextInput
                                                style={styles.input}
                                                value={updatedProfile.email}
                                                onChangeText={(text) => setUpdatedProfile({ ...updatedProfile, email: text })}
                                                placeholder="Tu correo electrónico"
                                                placeholderTextColor="#9CA3AF"
                                                keyboardType="email-address"
                                                autoCapitalize="none"
                                            />
                                        </View>
                                    </View>

                                    <View style={styles.inputGroup}>
                                        <Text style={styles.label}>Número de teléfono</Text>
                                        <View style={styles.inputWrapper}>
                                            <View style={styles.inputIconContainer}>
                                                <Ionicons name="call-outline" size={20} color="#8B5CF6" />
                                            </View>
                                            <TextInput
                                                style={styles.input}
                                                value={updatedProfile.phone}
                                                onChangeText={(text) => setUpdatedProfile({ ...updatedProfile, phone: text })}
                                                placeholder="Tu número de teléfono"
                                                placeholderTextColor="#9CA3AF"
                                                keyboardType="phone-pad"
                                            />
                                        </View>
                                    </View>
                                </View>

                                <View style={styles.buttonGroup}>
                                    <TouchableOpacity
                                        style={styles.cancelButton}
                                        onPress={handleCancel}
                                        disabled={isSaving}
                                        activeOpacity={0.8}
                                    >
                                        <Text style={styles.cancelButtonText}>Cancelar</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
                                        onPress={handleSave}
                                        disabled={isSaving}
                                        activeOpacity={0.8}
                                    >
                                        <LinearGradient
                                            colors={isSaving ? ['#9CA3AF', '#6B7280'] : ['#8B5CF6', '#7C3AED']}
                                            style={styles.saveButtonGradient}
                                        >
                                            {isSaving ? (
                                                <ActivityIndicator size="small" color="#FFFFFF" />
                                            ) : (
                                                <>
                                                    <Ionicons name="checkmark" size={18} color="#FFFFFF" />
                                                    <Text style={styles.saveButtonText}>Guardar</Text>
                                                </>
                                            )}
                                        </LinearGradient>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ) : (
                            // Modo de visualización
                            <>
                                {/* Información del perfil */}
                                <View style={styles.infoCard}>
                                    <View style={styles.cardHeader}>
                                        <Ionicons name="person-circle" size={24} color="#8B5CF6" />
                                        <Text style={styles.cardTitle}>Información Personal</Text>
                                    </View>

                                    <View style={styles.infoList}>
                                        <View style={styles.infoItem}>
                                            <View style={styles.infoIconContainer}>
                                                <LinearGradient
                                                    colors={['#8B5CF6', '#7C3AED']}
                                                    style={styles.infoIconGradient}
                                                >
                                                    <Ionicons name="person-outline" size={18} color="#FFFFFF" />
                                                </LinearGradient>
                                            </View>
                                            <View style={styles.infoTextContainer}>
                                                <Text style={styles.infoLabel}>Nombre</Text>
                                                <Text style={styles.infoValue}>{profile?.name}</Text>
                                            </View>
                                        </View>

                                        <View style={styles.infoItem}>
                                            <View style={styles.infoIconContainer}>
                                                <LinearGradient
                                                    colors={['#06B6D4', '#0891B2']}
                                                    style={styles.infoIconGradient}
                                                >
                                                    <Ionicons name="mail-outline" size={18} color="#FFFFFF" />
                                                </LinearGradient>
                                            </View>
                                            <View style={styles.infoTextContainer}>
                                                <Text style={styles.infoLabel}>Correo electrónico</Text>
                                                <Text style={styles.infoValue}>{profile?.email}</Text>
                                            </View>
                                        </View>

                                        <View style={styles.infoItem}>
                                            <View style={styles.infoIconContainer}>
                                                <LinearGradient
                                                    colors={['#10B981', '#059669']}
                                                    style={styles.infoIconGradient}
                                                >
                                                    <Ionicons name="call-outline" size={18} color="#FFFFFF" />
                                                </LinearGradient>
                                            </View>
                                            <View style={styles.infoTextContainer}>
                                                <Text style={styles.infoLabel}>Teléfono</Text>
                                                <Text style={styles.infoValue}>{profile?.phone || 'No especificado'}</Text>
                                            </View>
                                        </View>
                                    </View>
                                </View>

                                {/* Acciones */}
                                <View style={styles.actionsCard}>
                                    <View style={styles.cardHeader}>
                                        <Ionicons name="settings" size={24} color="#8B5CF6" />
                                        <Text style={styles.cardTitle}>Configuración</Text>
                                    </View>

                                    <View style={styles.actionsList}>
                                        <TouchableOpacity onPress={() => router.push('/profile/settings')} style={styles.actionItem} activeOpacity={0.7}>
                                            <View style={styles.actionIconContainer}>
                                                <LinearGradient
                                                    colors={['#F59E0B', '#D97706']}
                                                    style={styles.actionIconGradient}
                                                >
                                                    <Ionicons name="lock-closed-outline" size={18} color="#FFFFFF" />
                                                </LinearGradient>
                                            </View>
                                            <Text style={styles.actionText}>Editar mis datos</Text>
                                            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                                        </TouchableOpacity>

                                        <TouchableOpacity style={styles.actionItem} activeOpacity={0.7}>
                                            <View style={styles.actionIconContainer}>
                                                <LinearGradient
                                                    colors={['#8B5CF6', '#7C3AED']}
                                                    style={styles.actionIconGradient}
                                                >
                                                    <Ionicons name="notifications-outline" size={18} color="#FFFFFF" />
                                                </LinearGradient>
                                            </View>
                                            <Text style={styles.actionText}>Notificaciones</Text>
                                            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                                        </TouchableOpacity>

                                        <TouchableOpacity style={styles.actionItem} activeOpacity={0.7}>
                                            <View style={styles.actionIconContainer}>
                                                <LinearGradient
                                                    colors={['#06B6D4', '#0891B2']}
                                                    style={styles.actionIconGradient}
                                                >
                                                    <Ionicons name="help-circle-outline" size={18} color="#FFFFFF" />
                                                </LinearGradient>
                                            </View>
                                            <Text style={styles.actionText}>Ayuda y soporte</Text>
                                            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            style={[styles.actionItem, styles.logoutItem]}
                                            onPress={handleLogout}
                                            activeOpacity={0.7}
                                        >
                                            <View style={styles.actionIconContainer}>
                                                <LinearGradient
                                                    colors={['#EF4444', '#DC2626']}
                                                    style={styles.actionIconGradient}
                                                >
                                                    <Ionicons name="log-out-outline" size={18} color="#FFFFFF" />
                                                </LinearGradient>
                                            </View>
                                            <Text style={styles.logoutText}>Cerrar sesión</Text>
                                            <View style={{ width: 20 }} />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </>
                        )}
                    </Animated.View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView >
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#8B5CF6',
    },
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    contentContainer: {
        flexGrow: 1,
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
        marginTop: 16,
        fontSize: 16,
        color: '#FFFFFF',
        fontWeight: '500',
    },
    headerContainer: {
        marginBottom: -30,
        zIndex: 1,
    },
    header: {
        paddingTop: Platform.OS === 'ios' ? 10 : 40,
        paddingBottom: 50,
        position: 'relative',
        overflow: 'hidden',
    },
    decorativeElements: {
        position: 'absolute',
        width: '100%',
        height: '100%',
    },
    circle1: {
        position: 'absolute',
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: 'rgba(255,255,255,0.1)',
        top: -20,
        right: -30,
    },
    circle2: {
        position: 'absolute',
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(255,255,255,0.08)',
        bottom: 20,
        left: -20,
    },
    circle3: {
        position: 'absolute',
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'rgba(255,255,255,0.05)',
        top: 60,
        left: width - 80,
    },

    editIconContainer: {
        position: 'absolute',
        bottom: 5,
        right: 5,
        backgroundColor: '#8B5CF6',
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    userInfo: {
        alignItems: 'center',
        marginBottom: 20,
    },
    headerName: {
        fontSize: 28,
        fontWeight: '700',
        color: '#FFFFFF',
        marginBottom: 4,
        textAlign: 'center',
    },
    headerEmail: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.8)',
        fontWeight: '500',
    },
    editButton: {
        borderRadius: 20,
        overflow: 'hidden',
    },
    editButtonBlur: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 10,
        gap: 6,
    },
    editButtonText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
    },
    errorContainer: {
        marginHorizontal: 20,
        marginTop: 40,
        marginBottom: 10,
        borderRadius: 12,
        overflow: 'hidden',
    },
    errorContent: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FEF2F2',
        padding: 16,
        borderLeftWidth: 4,
        borderLeftColor: '#EF4444',
    },
    errorText: {
        color: '#EF4444',
        marginLeft: 12,
        fontSize: 14,
        flex: 1,
        fontWeight: '500',
    },
    contentArea: {
        flex: 1,
        paddingTop: 40,
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    editContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 6,
    },
    editHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
        gap: 12,
    },
    editTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#111827',
    },
    formContainer: {
        gap: 20,
        marginBottom: 32,
    },
    inputGroup: {
        gap: 8,
    },
    label: {
        fontSize: 14,
        color: '#374151',
        fontWeight: '600',
        marginLeft: 4,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        borderWidth: 2,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        height: 52,
    },
    inputIconContainer: {
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 4,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: '#111827',
        paddingRight: 16,
    },
    buttonGroup: {
        flexDirection: 'row',
        gap: 12,
    },
    cancelButton: {
        flex: 1,
        height: 52,
        backgroundColor: '#F3F4F6',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    cancelButtonText: {
        color: '#6B7280',
        fontSize: 16,
        fontWeight: '600',
    },
    saveButton: {
        flex: 1,
        height: 52,
        borderRadius: 12,
        overflow: 'hidden',
    },
    saveButtonDisabled: {
        opacity: 0.7,
    },
    saveButtonGradient: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    saveButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
    infoCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 24,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
    },
    actionsCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        gap: 12,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
    },
    infoList: {
        gap: 16,
    },
    infoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 4,
    },
    infoIconContainer: {
        marginRight: 16,
    },
    infoIconGradient: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 3,
    },
    infoTextContainer: {
        flex: 1,
    },
    infoLabel: {
        fontSize: 13,
        color: '#6B7280',
        marginBottom: 2,
        fontWeight: '500',
    },
    infoValue: {
        fontSize: 16,
        color: '#111827',
        fontWeight: '600',
    },
    actionsList: {
        gap: 2,
    },
    actionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 4,
        borderRadius: 12,
        marginVertical: 2,
    },
    actionIconContainer: {
        marginRight: 16,
    },
    actionIconGradient: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 3,
    },
    actionText: {
        fontSize: 16,
        color: '#111827',
        flex: 1,
        fontWeight: '600',
    },
    logoutItem: {
        marginTop: 8,
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
    logoutText: {
        fontSize: 16,
        color: '#EF4444',
        flex: 1,
        fontWeight: '600',
    },
});