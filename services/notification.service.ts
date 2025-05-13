// src/services/NotificationService.ts
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';

// Configuración inicial
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

export type NotificationContent = {
    title: string;
    body: string;
    data?: Record<string, any>;
};

class NotificationService {
    // Verifica y pide permisos
    async requestPermissions() {
        if (Device.isDevice) {
            const { status: existingStatus } = await Notifications.getPermissionsAsync();
            let finalStatus = existingStatus;

            if (existingStatus !== 'granted') {
                const { status } = await Notifications.requestPermissionsAsync();
                finalStatus = status;
            }

            if (finalStatus !== 'granted') {
                console.log('No se obtuvieron permisos para notificaciones');
                return false;
            }

            return true;
        } else {
            console.log('Las notificaciones requieren un dispositivo físico');
            return false;
        }
    }

    // Programa una notificación local
    async scheduleLocalNotification(
        content: NotificationContent,
        trigger: Notifications.NotificationTriggerInput = null
    ) {
        await this.requestPermissions();

        return await Notifications.scheduleNotificationAsync({
            content,
            trigger: trigger || { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 1 }, // Inmediata si no se proporciona un disparador
        });
    }

    // Muestra una notificación inmediatamente
    async showLocalNotification(content: NotificationContent) {
        return this.scheduleLocalNotification(content, { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 1 });
    }

    // Cancela una notificación específica
    async cancelNotification(identifier: string) {
        await Notifications.cancelScheduledNotificationAsync(identifier);
    }

    // Cancela todas las notificaciones programadas
    async cancelAllNotifications() {
        await Notifications.cancelAllScheduledNotificationsAsync();
    }

    // Escucha notificaciones recibidas (app en primer plano)
    addNotificationReceivedListener(
        callback: (notification: Notifications.Notification) => void
    ) {
        return Notifications.addNotificationReceivedListener(callback);
    }

    // Escucha interacciones del usuario (app en segundo plano)
    addNotificationResponseListener(
        callback: (response: Notifications.NotificationResponse) => void
    ) {
        return Notifications.addNotificationResponseReceivedListener(callback);
    }

    // Obtener todas las notificaciones programadas
    async getAllScheduledNotifications() {
        return await Notifications.getAllScheduledNotificationsAsync();
    }

    // Obtener la última notificación recibida
    async getLastNotificationResponse() {
        return await Notifications.getLastNotificationResponseAsync();
    }

    // Desactivar la insignia de notificación (contador)
    async setBadgeCount(count: number) {
        return await Notifications.setBadgeCountAsync(count);
    }
}

// Exporta una instancia singleton
export default new NotificationService();