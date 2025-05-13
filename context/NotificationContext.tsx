// src/context/NotificationContext.tsx
import React, { createContext, useState, useEffect, useContext, useRef } from 'react';
import { Alert, AppState, AppStateStatus } from 'react-native';
import io, { Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import * as Notifications from 'expo-notifications';
import { Subscription } from 'expo-notifications';
import NotificationService from '../services/notification.service';
import { API_URL } from '../constants';
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
}

const NotificationContext = createContext<NotificationContextType>({
    notifications: [],
    unreadCount: 0,
    fetchNotifications: async () => { },
    markAsRead: async () => { },
    markAllAsRead: async () => { },
    loading: false,
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
    const [token, setToken] = useState<string | null>(null);
    const [appState, setAppState] = useState<AppStateStatus>(AppState.currentState);

    const notificationReceivedListener = useRef<Subscription>();
    const notificationResponseListener = useRef<Subscription>();

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

    // Monitorear cambios de estado de la app
    useEffect(() => {
        console.log('Estado de la app:', appState);
        const subscription = AppState.addEventListener('change', nextAppState => {
            setAppState(nextAppState);

            // Si la app vuelve a primer plano, actualizar notificaciones
            if (appState.match(/inactive|background/) && nextAppState === 'active') {
                console.log('App ha vuelto a primer plano');
                fetchNotifications();
                // Resetear el contador de badge
                NotificationService.setBadgeCount(0);
            }
        });

        return () => {
            subscription.remove();
        };
    }, [appState]);

    // Cargar ID de usuario y token al inicio
    useEffect(() => {
        const loadUserData = async () => {
            try {
                const id = await userService.getUserId();
                console.log('userId en loaduserdata:', id);
                const authToken = await AsyncStorage.getItem('userToken');
                console.log('token en loaduserdata:', authToken);

                if (id) setUserId(id);
                if (authToken) setToken(authToken);
            } catch (error) {
                console.error('Error loading user data:', error);
            }
        };

        loadUserData();
    }, []);

    // Configurar Socket.io cuando el ID de usuario esté disponible
    useEffect(() => {
        if (!userId) return;

        // Conectar a Socket.io
        const newSocket = io(API_URL, {
            query: { userId },
            transports: ['websocket']
        });

        newSocket.on('connect', () => {
            console.log('Socket connected');
        });

        newSocket.on('new-notification', (notification: Notification) => {
            // Actualizar el estado interno de notificaciones
            setNotifications(prev => [notification, ...prev]);
            setUnreadCount(count => count + 1);

            // Mostrar una notificación según el estado de la app
            if (appState !== 'active') {
                // App en segundo plano - mostrar notificación local
                NotificationService.showLocalNotification({
                    title: `Nueva notificación - ${notification.type}`,
                    body: notification.message,
                    data: { notificationId: notification._id }
                });

                // Actualizar el badge count
                NotificationService.setBadgeCount(unreadCount + 1);
            } else {
                // App en primer plano - mostrar alerta
                Alert.alert('Nueva notificación', notification.message);
            }
        });

        newSocket.on('connect_error', (error: any) => {
            console.error('Socket connection error:', error);
        });

        setSocket(newSocket);

        // Cargar notificaciones existentes
        fetchNotifications();

        return () => {
            if (newSocket) newSocket.disconnect();
        };
    }, [userId]);

    // Función para cargar notificaciones desde la API
    const fetchNotifications = async () => {
        console.log('userId:', userId);
        console.log('token:', token);
        if (!userId || !token) return;

        try {
            setLoading(true);
            const response = await axios.get(`${API_URL}/api/notifications/${userId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.data) {
                setNotifications(response.data);
                const unread = response.data.filter((n: Notification) => !n.read).length;
                setUnreadCount(unread);

                // Actualizar el badge count
                NotificationService.setBadgeCount(unread);
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    // Marcar notificación como leída
    const markAsRead = async (notificationId: string) => {
        if (!token) return;

        try {
            await axios.patch(`${API_URL}/api/notifications/${notificationId}`, {}, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            setNotifications(notifications.map(notification =>
                notification._id === notificationId
                    ? { ...notification, read: true }
                    : notification
            ));

            const newUnreadCount = Math.max(0, unreadCount - 1);
            setUnreadCount(newUnreadCount);

            // Actualizar el badge count
            NotificationService.setBadgeCount(newUnreadCount);
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    // Marcar todas como leídas
    const markAllAsRead = async () => {
        if (!userId || !token) return;

        try {
            await axios.patch(`${API_URL}/api/notifications/${userId}/mark-all`, {}, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            setNotifications(notifications.map(notification => ({ ...notification, read: true })));
            setUnreadCount(0);

            // Actualizar el badge count
            NotificationService.setBadgeCount(0);
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    };

    // Valor del contexto
    const value = {
        notifications,
        unreadCount,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        loading
    };

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotifications = () => useContext(NotificationContext);