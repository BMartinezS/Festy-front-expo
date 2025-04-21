// app/(tabs)/profile.tsx
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
} from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '@/services/auth.service';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';

interface UserProfile {
    id: string;
    name: string;
    email: string;
    phone: string;
    avatar?: string;
}

export default function ProfileScreen() {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [updatedProfile, setUpdatedProfile] = useState<Partial<UserProfile>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');

    // Cargar el perfil de usuario al montar el componente
    useEffect(() => {
        loadProfile();
    }, []);

    // Función para cargar el perfil del usuario
    const loadProfile = async () => {
        try {
            setIsLoading(true);
            setError('');

            const token = await AsyncStorage.getItem('userToken');
            if (!token) {
                router.replace('/auth/login');
                return;
            }

            const userData = await authService.getUserProfile(token);
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

    // Función para cambiar a modo de edición
    const handleEdit = () => {
        if (profile) {
            setUpdatedProfile({
                name: profile.name,
                email: profile.email,
                phone: profile.phone,
                avatar: profile.avatar,
            });
            setIsEditing(true);
        }
    };

    // Función para cancelar la edición
    const handleCancel = () => {
        setIsEditing(false);
        setError('');
    };

    // Función para guardar los cambios del perfil
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

            await authService.updateUserProfile(token, updatedProfile);
            await loadProfile(); // Recargar el perfil con los datos actualizados
            setIsEditing(false);

            Alert.alert('Perfil actualizado', 'Tus datos han sido actualizados correctamente');
        } catch (error: any) {
            setError(error.message || 'Error al actualizar perfil');
            console.error('Error al actualizar perfil:', error);
        } finally {
            setIsSaving(false);
        }
    };

    // Función para seleccionar una imagen de perfil
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
                    ...updatedProfile,
                    avatar: result.assets[0].uri,
                });
            }
        } catch (error) {
            console.error('Error al seleccionar imagen:', error);
            Alert.alert('Error', 'No se pudo seleccionar la imagen');
        }
    };

    // Función para cerrar sesión
    const handleLogout = async () => {
        Alert.alert(
            'Cerrar Sesión',
            '¿Estás seguro que deseas salir de tu cuenta?',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Cerrar Sesión',
                    style: 'destructive',
                    onPress: async () => {
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
                    }
                }
            ]
        );
    };

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#8e44ad" />
                <Text style={styles.loadingText}>Cargando perfil...</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="light-content" backgroundColor="#6a0dad" />
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={{ flex: 1 }}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
            >
                <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
                    {/* Header con gradiente */}
                    <LinearGradient
                        colors={['#8e44ad', '#6a0dad']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.header}
                    >
                        <View style={styles.avatarContainer}>
                            {isEditing ? (
                                <TouchableOpacity style={styles.avatarEditButton} onPress={pickImage}>
                                    {updatedProfile.avatar ? (
                                        <Image source={{ uri: updatedProfile.avatar }} style={styles.avatar} />
                                    ) : profile?.avatar ? (
                                        <Image source={{ uri: profile.avatar }} style={styles.avatar} />
                                    ) : (
                                        <View style={styles.avatarPlaceholder}>
                                            <Ionicons name="person" size={40} color="#ffffff" />
                                        </View>
                                    )}
                                    <View style={styles.editIconContainer}>
                                        <Ionicons name="camera" size={18} color="#ffffff" />
                                    </View>
                                </TouchableOpacity>
                            ) : (
                                profile?.avatar ? (
                                    <Image source={{ uri: profile.avatar }} style={styles.avatar} />
                                ) : (
                                    <View style={styles.avatarPlaceholder}>
                                        <Ionicons name="person" size={40} color="#ffffff" />
                                    </View>
                                )
                            )}
                        </View>

                        <Text style={styles.headerName}>
                            {profile?.name || 'Usuario'}
                        </Text>

                        {!isEditing && (
                            <TouchableOpacity style={styles.editButton} onPress={handleEdit}>
                                <Ionicons name="create-outline" size={18} color="#ffffff" />
                                <Text style={styles.editButtonText}>Editar Perfil</Text>
                            </TouchableOpacity>
                        )}
                    </LinearGradient>

                    {error ? (
                        <View style={styles.errorContainer}>
                            <Ionicons name="alert-circle" size={20} color="#FF3B30" />
                            <Text style={styles.errorText}>{error}</Text>
                        </View>
                    ) : null}

                    <View style={styles.infoContainer}>
                        {isEditing ? (
                            // Modo de edición
                            <>
                                <View style={styles.formContainer}>
                                    <View style={styles.inputGroup}>
                                        <Text style={styles.label}>Nombre completo</Text>
                                        <View style={styles.inputWrapper}>
                                            <Ionicons name="person-outline" size={20} color="#8e44ad" style={styles.inputIcon} />
                                            <TextInput
                                                style={styles.input}
                                                value={updatedProfile.name}
                                                onChangeText={(text) => setUpdatedProfile({ ...updatedProfile, name: text })}
                                                placeholder="Tu nombre completo"
                                                placeholderTextColor="#aaa"
                                            />
                                        </View>
                                    </View>

                                    <View style={styles.inputGroup}>
                                        <Text style={styles.label}>Correo electrónico</Text>
                                        <View style={styles.inputWrapper}>
                                            <Ionicons name="mail-outline" size={20} color="#8e44ad" style={styles.inputIcon} />
                                            <TextInput
                                                style={styles.input}
                                                value={updatedProfile.email}
                                                onChangeText={(text) => setUpdatedProfile({ ...updatedProfile, email: text })}
                                                placeholder="Tu correo electrónico"
                                                placeholderTextColor="#aaa"
                                                keyboardType="email-address"
                                                autoCapitalize="none"
                                            />
                                        </View>
                                    </View>

                                    <View style={styles.inputGroup}>
                                        <Text style={styles.label}>Número de teléfono</Text>
                                        <View style={styles.inputWrapper}>
                                            <Ionicons name="call-outline" size={20} color="#8e44ad" style={styles.inputIcon} />
                                            <TextInput
                                                style={styles.input}
                                                value={updatedProfile.phone}
                                                onChangeText={(text) => setUpdatedProfile({ ...updatedProfile, phone: text })}
                                                placeholder="Tu número de teléfono"
                                                placeholderTextColor="#aaa"
                                                keyboardType="phone-pad"
                                            />
                                        </View>
                                    </View>

                                    <View style={styles.buttonGroup}>
                                        <TouchableOpacity
                                            style={[styles.button, styles.cancelButton]}
                                            onPress={handleCancel}
                                            disabled={isSaving}
                                        >
                                            <Text style={styles.cancelButtonText}>Cancelar</Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            style={[styles.button, styles.saveButton]}
                                            onPress={handleSave}
                                            disabled={isSaving}
                                        >
                                            {isSaving ? (
                                                <ActivityIndicator size="small" color="#ffffff" />
                                            ) : (
                                                <Text style={styles.saveButtonText}>Guardar</Text>
                                            )}
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </>
                        ) : (
                            // Modo de visualización
                            <>
                                <View style={styles.infoSection}>
                                    <View style={styles.infoItem}>
                                        <View style={styles.infoIconContainer}>
                                            <Ionicons name="person-outline" size={20} color="#ffffff" />
                                        </View>
                                        <View style={styles.infoTextContainer}>
                                            <Text style={styles.infoLabel}>Nombre</Text>
                                            <Text style={styles.infoValue}>{profile?.name}</Text>
                                        </View>
                                    </View>

                                    <View style={styles.infoItem}>
                                        <View style={styles.infoIconContainer}>
                                            <Ionicons name="mail-outline" size={20} color="#ffffff" />
                                        </View>
                                        <View style={styles.infoTextContainer}>
                                            <Text style={styles.infoLabel}>Correo electrónico</Text>
                                            <Text style={styles.infoValue}>{profile?.email}</Text>
                                        </View>
                                    </View>

                                    <View style={styles.infoItem}>
                                        <View style={styles.infoIconContainer}>
                                            <Ionicons name="call-outline" size={20} color="#ffffff" />
                                        </View>
                                        <View style={styles.infoTextContainer}>
                                            <Text style={styles.infoLabel}>Teléfono</Text>
                                            <Text style={styles.infoValue}>{profile?.phone || 'No especificado'}</Text>
                                        </View>
                                    </View>
                                </View>

                                <View style={styles.actionsSection}>
                                    <TouchableOpacity
                                        style={styles.actionButton}
                                    >
                                        <View style={styles.actionIconContainer}>
                                            <Ionicons name="lock-closed-outline" size={20} color="#ffffff" />
                                        </View>
                                        <Text style={styles.actionText}>Cambiar contraseña</Text>
                                        <Ionicons name="chevron-forward" size={20} color="#999" />
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={styles.actionButton}
                                    >
                                        <View style={styles.actionIconContainer}>
                                            <Ionicons name="notifications-outline" size={20} color="#ffffff" />
                                        </View>
                                        <Text style={styles.actionText}>Notificaciones</Text>
                                        <Ionicons name="chevron-forward" size={20} color="#999" />
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={styles.actionButton}
                                    >
                                        <View style={styles.actionIconContainer}>
                                            <Ionicons name="help-circle-outline" size={20} color="#ffffff" />
                                        </View>
                                        <Text style={styles.actionText}>Ayuda y soporte</Text>
                                        <Ionicons name="chevron-forward" size={20} color="#999" />
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={[styles.actionButton, styles.logoutButton]}
                                        onPress={handleLogout}
                                    >
                                        <View style={[styles.actionIconContainer, styles.logoutIconContainer]}>
                                            <Ionicons name="log-out-outline" size={20} color="#ffffff" />
                                        </View>
                                        <Text style={styles.logoutText}>Cerrar sesión</Text>
                                        <View style={{ width: 20 }} />
                                    </TouchableOpacity>
                                </View>
                            </>
                        )}
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#6a0dad',
    },
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    contentContainer: {
        flexGrow: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#8e44ad',
    },
    header: {
        padding: 24,
        alignItems: 'center',
        paddingTop: Platform.OS === 'ios' ? 10 : 40,
        paddingBottom: 30,
    },
    avatarContainer: {
        marginBottom: 16,
    },
    avatar: {
        width: 110,
        height: 110,
        borderRadius: 55,
        borderWidth: 4,
        borderColor: '#ffffff',
    },
    avatarPlaceholder: {
        width: 110,
        height: 110,
        borderRadius: 55,
        backgroundColor: 'rgba(255,255,255,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 4,
        borderColor: '#ffffff',
    },
    avatarEditButton: {
        position: 'relative',
    },
    editIconContainer: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#8e44ad',
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#ffffff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    headerName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#ffffff',
        marginBottom: 4,
    },
    editButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.3)',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        marginTop: 8,
    },
    editButtonText: {
        color: '#ffffff',
        marginLeft: 6,
        fontSize: 14,
        fontWeight: '600',
    },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFEEEE',
        margin: 16,
        marginTop: 0,
        padding: 12,
        borderRadius: 8,
    },
    errorText: {
        color: '#FF3B30',
        marginLeft: 8,
        fontSize: 14,
        flex: 1,
    },
    infoContainer: {
        flex: 1,
        padding: 16,
    },
    formContainer: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    infoSection: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    infoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    infoIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#8e44ad',
        justifyContent: 'center',
        alignItems: 'center',
    },
    infoTextContainer: {
        marginLeft: 16,
        flex: 1,
    },
    infoLabel: {
        fontSize: 13,
        color: '#999',
        marginBottom: 2,
    },
    infoValue: {
        fontSize: 16,
        color: '#333',
        fontWeight: '500',
    },
    actionsSection: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    actionIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#8e44ad',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    actionText: {
        fontSize: 16,
        color: '#333',
        flex: 1,
        fontWeight: '500',
    },
    logoutButton: {
        borderBottomWidth: 0,
    },
    logoutIconContainer: {
        backgroundColor: '#FF3B30',
    },
    logoutText: {
        fontSize: 16,
        color: '#FF3B30',
        flex: 1,
        fontWeight: '500',
    },
    inputGroup: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        color: '#666',
        marginBottom: 8,
        fontWeight: '500',
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f9f9f9',
        borderWidth: 1,
        borderColor: '#e0e0e0',
        borderRadius: 12,
        height: 50,
    },
    inputIcon: {
        marginHorizontal: 12,
    },
    input: {
        flex: 1,
        height: 50,
        fontSize: 16,
        color: '#333',
    },
    buttonGroup: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 24,
    },
    button: {
        flex: 1,
        height: 50,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginHorizontal: 5,
    },
    cancelButton: {
        backgroundColor: '#f0f0f0',
        borderWidth: 1,
        borderColor: '#ddd',
    },
    saveButton: {
        backgroundColor: '#8e44ad',
    },
    cancelButtonText: {
        color: '#666',
        fontSize: 16,
        fontWeight: '600',
    },
    saveButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '600',
    },
});