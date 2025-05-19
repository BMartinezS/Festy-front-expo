// src/context/NotificationContext.tsx
import React, { createContext, useState, useEffect, useContext, useRef, useCallback } from 'react';
import { Alert, AppState, AppStateStatus, Platform } from 'react-native';
import io, { Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import * as Notifications from 'expo-notifications';
import { Subscription } from 'expo-notifications';
import NotificationService from '../services/notification.service';
import { API_URL, SOCKET_URL } from '../constants';
import userService from '../services/user.service';

// Definir el tipo de notificación
export interface Notification {
    _id: string;
    userId: string;
    message: string;
    type: 'info' | 'warning' | 'error' | 'success';
    read: boolean;
    createdAt: string;
}

// Definir el contexto
interface NotificationContextType {
    notifications: Notification[];
    unreadCount: number;
    fetchNotifications: () => Promise<void>;
    markAsRead: (notificationId: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    loading: boolean;
    error: string | null;
}

const NotificationContext = createContext<NotificationContextType>({
    notifications: [],
    unreadCount: 0,
    fetchNotifications: async () => { },
    markAsRead: async () => { },
    markAllAsRead: async () => { },
    loading: false,
    error: null,
});

interface NotificationProviderProps {
    children: React.ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState<number>(0);
    const [socket, setSocket] = useState<any | null>(null);
    const [userId, setUserId] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [appState, setAppState] = useState<AppStateStatus>(AppState.currentState);
    const [isWebReady, setIsWebReady] = useState<boolean>(false);

    const notificationReceivedListener = useRef<Subscription>();
    const notificationResponseListener = useRef<Subscription>();

    // Check if web is ready for badge updates
    useEffect(() => {
        if (Platform.OS === 'web') {
            if (document.readyState === 'complete') {
                setIsWebReady(true);
            } else {
                const handleDocumentLoad = () => {
                    setIsWebReady(true);
                };
                window.addEventListener('load', handleDocumentLoad);
                return () => {
                    window.removeEventListener('load', handleDocumentLoad);
                };
            }
        } else {
            setIsWebReady(true); // On mobile platforms, we're always "ready"
        }
    }, []);

    // Función para actualizar el contador de notificaciones no leídas y el badge
    const updateUnreadCount = useCallback((count: number) => {
        setUnreadCount(count);
        console.log('Contador de no leídas actualizado:', count);

        // Only attempt badge updates if we're on a mobile platform or web is ready
        if (isWebReady) {
            NotificationService.setBadgeCount(count).catch(err => {
                console.warn('Failed to update badge count:', err);
                // Non-fatal error, continue execution
            });
        }
    }, [isWebReady]);

    // Cargar ID de usuario y token al inicio
    useEffect(() => {
        const loadUserData = async () => {
            try {
                const id = await userService.getUserId();
                const userToken = await AsyncStorage.getItem('userToken');

                if (id) setUserId(id);
                if (userToken) setToken(userToken);
            } catch (error) {
                console.error('Error loading user data:', error);
                setError('Error al cargar datos del usuario');
            }
        };

        loadUserData();
    }, []);

    // Configurar listeners de notificaciones de Expo
    useEffect(() => {
        // Solicitar permisos para notificaciones locales
        NotificationService.requestPermissions();

        // Cuando la app está en primer plano y se recibe una notificación
        notificationReceivedListener.current = NotificationService.addNotificationReceivedListener(
            notification => {
                console.log('Notificación recibida en primer plano:', notification);
                // Aquí puedes manejar la notificación recibida en primer plano
            }
        );

        // Cuando el usuario interactúa con una notificación
        notificationResponseListener.current = NotificationService.addNotificationResponseListener(
            response => {
                const { notification } = response;
                console.log('Respuesta a notificación:', response);

                // Extraer datos de la notificación
                const notificationData = notification.request.content.data;

                // Si hay un ID de notificación, marcarla como leída
                if (notificationData && notificationData.notificationId) {
                    markAsRead(notificationData.notificationId as string);
                }
            }
        );

        // Limpiar los listeners cuando el componente se desmonte
        return () => {
            if (notificationReceivedListener.current) {
                Notifications.removeNotificationSubscription(notificationReceivedListener.current);
            }
            if (notificationResponseListener.current) {
                Notifications.removeNotificationSubscription(notificationResponseListener.current);
            }
        };
    }, []);

    // Función para cargar notificaciones desde la API
    const fetchNotifications = useCallback(async () => {
        if (!userId || !token) {
            console.log('No hay userId o token disponible');
            return;
        }

        try {
            setLoading(true);
            setError(null);
            const response = await axios.get(`${API_URL}/notifications/${userId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.data) {
                setNotifications(response.data);
                const unread = response.data.filter((n: Notification) => !n.read).length;
                updateUnreadCount(unread);
            }
        } catch (error: any) {
            console.error('Error fetching notifications:', error);
            setError(error.response?.data?.message || 'Error al cargar notificaciones');
        } finally {
            setLoading(false);
        }
    }, [userId, token, updateUnreadCount]);

    // Monitorear cambios de estado de la app
    useEffect(() => {
        const subscription = AppState.addEventListener('change', nextAppState => {
            setAppState(nextAppState);

            // Si la app vuelve a primer plano, actualizar notificaciones
            if (appState.match(/inactive|background/) && nextAppState === 'active') {
                console.log('App ha vuelto a primer plano');
                fetchNotifications();

                // Solo intentar resetear el badge si la web está lista
                if (isWebReady) {
                    NotificationService.setBadgeCount(0).catch(err => {
                        console.warn('Failed to reset badge count:', err);
                        // Non-fatal error, continue execution
                    });
                }
            }
        });

        return () => {
            subscription.remove();
        };
    }, [appState, fetchNotifications, isWebReady]);

    // Configurar Socket.io cuando el ID de usuario esté disponible
    useEffect(() => {
        if (!userId) return;

        // Conectar a Socket.io
        const newSocket = io(SOCKET_URL, {
            query: { userId },
            transports: ['websocket']
        });

        newSocket.on('connect', () => {
            console.log('Socket connected');
        });

        newSocket.on('new-notification', (notification: Notification) => {
            // Actualizar el estado interno de notificaciones
            setNotifications(prev => [notification, ...prev]);

            // Actualizar contador de no leídas
            updateUnreadCount(unreadCount + 1);

            // Mostrar una notificación según el estado de la app
            if (appState !== 'active') {
                // App en segundo plano - mostrar notificación local
                NotificationService.showLocalNotification({
                    title: `Nueva notificación - ${notification.type}`,
                    body: notification.message,
                    data: { notificationId: notification._id }
                });
            } else {
                // App en primer plano - mostrar alerta
                Alert.alert('Nueva notificación', notification.message);
            }
        });

        newSocket.on('connect_error', (error: any) => {
            console.error('Socket connection error:', error);
            setError('Error de conexión con el servidor de notificaciones');
        });

        setSocket(newSocket);

        // Cargar notificaciones existentes
        fetchNotifications();

        return () => {
            if (newSocket) newSocket.disconnect();
        };
    }, [userId, fetchNotifications, updateUnreadCount, unreadCount, appState]);

    // Marcar notificación como leída
    const markAsRead = useCallback(async (notificationId: string) => {
        if (!token) return;

        try {
            setError(null);
            await axios.patch(`${API_URL}/notifications/${notificationId}`, {}, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            setNotifications(prev => prev.map(notification =>
                notification._id === notificationId
                    ? { ...notification, read: true }
                    : notification
            ));

            // Calcular nuevo contador de no leídas basado en el estado actual
            setNotifications(prev => {
                const newUnreadCount = prev.filter(n => !n.read).length;
                updateUnreadCount(newUnreadCount);
                return prev;
            });
        } catch (error: any) {
            console.error('Error marking notification as read:', error);
            setError(error.response?.data?.message || 'Error al marcar notificación como leída');
        }
    }, [token, updateUnreadCount]);

    // Marcar todas como leídas
    const markAllAsRead = useCallback(async () => {
        if (!userId || !token) return;

        try {
            setError(null);
            await axios.patch(`${API_URL}/notifications/${userId}/mark-all`, {}, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            setNotifications(prev => prev.map(notification => ({ ...notification, read: true })));
            updateUnreadCount(0);
        } catch (error: any) {
            console.error('Error marking all as read:', error);
            setError(error.response?.data?.message || 'Error al marcar todas las notificaciones como leídas');
        }
    }, [userId, token, updateUnreadCount]);

    // Valor del contexto
    const value = {
        notifications,
        unreadCount,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        loading,
        error
    };

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotifications = () => useContext(NotificationContext);