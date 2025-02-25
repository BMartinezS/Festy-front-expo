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
} from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '@/services/auth.service';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

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
        if (!updatedProfile.name || !updatedProfile.email || !updatedProfile.phone) {
            setError('Todos los campos son obligatorios');
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

            Alert.alert('Éxito', 'Perfil actualizado correctamente');
        } catch (error: any) {
            setError(error.message || 'Error al actualizar perfil');
            console.error('Error al actualizar perfil:', error);
        } finally {
            setIsSaving(false);
        }
    };

    // Función para seleccionar una imagen de perfil
    const pickImage = async () => {
        // Solicitar permisos de galería
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
                quality: 0.5,
            });

            if (!result.canceled) {
                // Actualizar la vista previa de la imagen
                setUpdatedProfile({
                    ...updatedProfile,
                    avatar: result.assets[0].uri,
                });

                // Aquí se podría implementar la subida de la imagen a un servidor
                // utilizando un servicio específico para ello
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
            '¿Estás seguro que deseas cerrar sesión?',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Sí, salir',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const token = await AsyncStorage.getItem('userToken');
                            if (token) {
                                // Intentar hacer logout en el servidor
                                try {
                                    await authService.logout(token);
                                } catch (error) {
                                    console.error('Error en logout:', error);
                                    // Continuamos con el proceso aunque falle el logout en servidor
                                }
                            }

                            // Eliminar el token localmente
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
                <ActivityIndicator size="large" color="rgb(51, 18, 59)" />
                <Text style={styles.loadingText}>Cargando perfil...</Text>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
            <View style={styles.header}>
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
                        <Text style={styles.editButtonText}>Editar</Text>
                    </TouchableOpacity>
                )}
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <View style={styles.infoContainer}>
                {isEditing ? (
                    // Modo de edición
                    <>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Nombre</Text>
                            <TextInput
                                style={styles.input}
                                value={updatedProfile.name}
                                onChangeText={(text) => setUpdatedProfile({ ...updatedProfile, name: text })}
                                placeholder="Nombre completo"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Correo electrónico</Text>
                            <TextInput
                                style={styles.input}
                                value={updatedProfile.email}
                                onChangeText={(text) => setUpdatedProfile({ ...updatedProfile, email: text })}
                                placeholder="Correo electrónico"
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Teléfono</Text>
                            <TextInput
                                style={styles.input}
                                value={updatedProfile.phone}
                                onChangeText={(text) => setUpdatedProfile({ ...updatedProfile, phone: text })}
                                placeholder="Número de teléfono"
                                keyboardType="phone-pad"
                            />
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
                    </>
                ) : (
                    // Modo de visualización
                    <>
                        <View style={styles.infoSection}>
                            <View style={styles.infoItem}>
                                <Ionicons name="person-outline" size={20} color="rgb(71, 25, 82)" />
                                <View style={styles.infoTextContainer}>
                                    <Text style={styles.infoLabel}>Nombre</Text>
                                    <Text style={styles.infoValue}>{profile?.name}</Text>
                                </View>
                            </View>

                            <View style={styles.infoItem}>
                                <Ionicons name="mail-outline" size={20} color="rgb(71, 25, 82)" />
                                <View style={styles.infoTextContainer}>
                                    <Text style={styles.infoLabel}>Correo electrónico</Text>
                                    <Text style={styles.infoValue}>{profile?.email}</Text>
                                </View>
                            </View>

                            <View style={styles.infoItem}>
                                <Ionicons name="call-outline" size={20} color="rgb(71, 25, 82)" />
                                <View style={styles.infoTextContainer}>
                                    <Text style={styles.infoLabel}>Teléfono</Text>
                                    <Text style={styles.infoValue}>{profile?.phone}</Text>
                                </View>
                            </View>
                        </View>

                        <View style={styles.actionsSection}>
                            <TouchableOpacity
                                style={styles.actionButton}
                                // onPress={() => router.push('/user/change-password')}
                            >
                                <Ionicons name="lock-closed-outline" size={20} color="rgb(71, 25, 82)" />
                                <Text style={styles.actionText}>Cambiar contraseña</Text>
                                <Ionicons name="chevron-forward" size={20} color="#999" />
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.actionButton, styles.logoutButton]}
                                onPress={handleLogout}
                            >
                                <Ionicons name="log-out-outline" size={20} color="#FF3B30" />
                                <Text style={styles.logoutText}>Cerrar sesión</Text>
                                <View style={{ width: 20 }} />
                            </TouchableOpacity>
                        </View>
                    </>
                )}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
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
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: 'rgb(71, 25, 82)',
    },
    header: {
        backgroundColor: 'rgb(51, 18, 59)',
        padding: 20,
        alignItems: 'center',
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        paddingBottom: 30,
    },
    avatarContainer: {
        marginBottom: 15,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 3,
        borderColor: '#ffffff',
    },
    avatarPlaceholder: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: 'rgba(255,255,255,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#ffffff',
    },
    avatarEditButton: {
        position: 'relative',
    },
    editIconContainer: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: 'rgb(71, 25, 82)',
        width: 30,
        height: 30,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#ffffff',
    },
    headerName: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#ffffff',
    },
    editButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 20,
        marginTop: 10,
    },
    editButtonText: {
        color: '#ffffff',
        marginLeft: 5,
        fontSize: 14,
    },
    errorText: {
        color: '#FF3B30',
        textAlign: 'center',
        marginVertical: 10,
        paddingHorizontal: 20,
    },
    infoContainer: {
        flex: 1,
        padding: 20,
    },
    infoSection: {
        backgroundColor: '#ffffff',
        borderRadius: 10,
        padding: 15,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    infoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    infoTextContainer: {
        marginLeft: 15,
        flex: 1,
    },
    infoLabel: {
        fontSize: 12,
        color: '#999',
    },
    infoValue: {
        fontSize: 16,
        color: '#333',
        marginTop: 2,
    },
    actionsSection: {
        backgroundColor: '#ffffff',
        borderRadius: 10,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#e0e0e0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    actionText: {
        fontSize: 16,
        color: '#333',
        flex: 1,
        marginLeft: 15,
    },
    logoutButton: {
        borderBottomWidth: 0,
    },
    logoutText: {
        fontSize: 16,
        color: '#FF3B30',
        flex: 1,
        marginLeft: 15,
    },
    inputGroup: {
        marginBottom: 15,
    },
    label: {
        fontSize: 14,
        color: '#666',
        marginBottom: 5,
    },
    input: {
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: '#e0e0e0',
        borderRadius: 8,
        height: 45,
        paddingHorizontal: 12,
        fontSize: 16,
        color: '#333',
    },
    buttonGroup: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 10,
    },
    button: {
        flex: 1,
        height: 45,
        borderRadius: 8,
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
        backgroundColor: 'rgb(51, 18, 59)',
    },
    cancelButtonText: {
        color: '#666',
        fontSize: 16,
        fontWeight: '500',
    },
    saveButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '500',
    },
});