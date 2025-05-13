// src/utils/notificationUtils.ts
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../constants'; // Ajusta según tu configuración
import NotificationService from '../services/notification.service';
import * as Notifications from 'expo-notifications';

// Para crear una notificación desde el cliente (en el servidor)
export const createNotification = async (
    userId: string,
    message: string,
    type: 'info' | 'warning' | 'error' | 'success' = 'info'
): Promise<boolean> => {
    try {
        const token = await AsyncStorage.getItem('token');

        if (!token) {
            console.error('No hay token de autenticación');
            return false;
        }

        await axios.post(
            `${API_URL}/api/notifications`,
            {
                userId,
                message,
                type
            },
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        return true;
    } catch (error) {
        console.error('Error creando notificación:', error);
        return false;
    }
};

// Para mostrar una notificación local (en el dispositivo)
export const showLocalNotification = async (
    title: string,
    body: string,
    data?: Record<string, any>
): Promise<string | null> => {
    try {
        const notificationId = await NotificationService.showLocalNotification({
            title,
            body,
            data
        });

        return notificationId;
    } catch (error) {
        console.error('Error mostrando notificación local:', error);
        return null;
    }
};

// Para programar una notificación local
export const scheduleLocalNotification = async (
    title: string,
    body: string,
    seconds: number = 5,
    data?: Record<string, any>
): Promise<string | null> => {
    try {
        const notificationId = await NotificationService.scheduleLocalNotification(
            {
                title,
                body,
                data
            },
            { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds }
        );

        return notificationId;
    } catch (error) {
        console.error('Error programando notificación local:', error);
        return null;
    }
};

// Notificación para eventos próximos
export const scheduleEventReminder = async (
    eventId: string,
    eventTitle: string,
    startTime: Date,
    reminderMinutes: number = 30
): Promise<string | null> => {
    try {
        const reminderTime = new Date(startTime.getTime() - (reminderMinutes * 60 * 1000));
        const secondsUntilReminder = Math.max(1, Math.floor((reminderTime.getTime() - Date.now()) / 1000));

        const notificationId = await NotificationService.scheduleLocalNotification(
            {
                title: `Recordatorio: ${eventTitle}`,
                body: `Tu evento comienza en ${reminderMinutes} minutos`,
                data: {
                    screen: 'EventDetails',
                    params: { eventId },
                    type: 'event_reminder'
                }
            },
            { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: secondsUntilReminder }
        );

        return notificationId;
    } catch (error) {
        console.error('Error programando recordatorio de evento:', error);
        return null;
    }
};

// Cancelar una notificación programada
export const cancelScheduledNotification = async (notificationId: string): Promise<boolean> => {
    try {
        await NotificationService.cancelNotification(notificationId);
        return true;
    } catch (error) {
        console.error('Error cancelando notificación programada:', error);
        return false;
    }
};

// Configurar/actualizar el badge count manualmente
export const updateNotificationBadge = async (count: number): Promise<boolean> => {
    try {
        await NotificationService.setBadgeCount(count);
        return true;
    } catch (error) {
        console.error('Error actualizando badge de notificaciones:', error);
        return false;
    }
};