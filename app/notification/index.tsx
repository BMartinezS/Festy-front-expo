import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    RefreshControl,
    ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNotifications, Notification } from '../../context/NotificationContext';
import { differenceInSeconds, differenceInMinutes, differenceInHours, differenceInDays, differenceInMonths, differenceInYears } from 'date-fns';

const NotificationItem: React.FC<{
    item: Notification,
    onPress: (id: string) => void
}> = ({ item, onPress }) => {
    const getIconName = () => {
        switch (item.type) {
            case 'info': return 'information-circle';
            case 'warning': return 'warning';
            case 'error': return 'alert-circle';
            case 'success': return 'checkmark-circle';
            default: return 'notifications';
        }
    };

    const getIconColor = () => {
        switch (item.type) {
            case 'info': return '#2196F3';
            case 'warning': return '#FFC107';
            case 'error': return '#F44336';
            case 'success': return '#4CAF50';
            default: return '#9E9E9E';
        }
    };

    const getTimeAgo = (dateString: string) => {
        try {
            const date = new Date(dateString);
            const now = new Date();

            // Calcular diferencias de tiempo
            const secondsDiff = differenceInSeconds(now, date);
            const minutesDiff = differenceInMinutes(now, date);
            const hoursDiff = differenceInHours(now, date);
            const daysDiff = differenceInDays(now, date);
            const monthsDiff = differenceInMonths(now, date);
            const yearsDiff = differenceInYears(now, date);

            // Formato relativo simple
            if (secondsDiff < 60) {
                return 'hace un momento';
            } else if (minutesDiff < 60) {
                return minutesDiff === 1 ? 'hace 1 minuto' : `hace ${minutesDiff} minutos`;
            } else if (hoursDiff < 24) {
                return hoursDiff === 1 ? 'hace 1 hora' : `hace ${hoursDiff} horas`;
            } else if (daysDiff < 30) {
                return daysDiff === 1 ? 'hace 1 día' : `hace ${daysDiff} días`;
            } else if (monthsDiff < 12) {
                return monthsDiff === 1 ? 'hace 1 mes' : `hace ${monthsDiff} meses`;
            } else {
                return yearsDiff === 1 ? 'hace 1 año' : `hace ${yearsDiff} años`;
            }

            // Alternativa: Si prefieres mostrar la fecha completa para tiempos más antiguos
            /* 
            if (daysDiff < 1) {
              // Para el mismo día
              return format(date, "'hoy a las' HH:mm", { locale: es });
            } else if (daysDiff < 2) {
              // Para ayer
              return format(date, "'ayer a las' HH:mm", { locale: es });
            } else {
              // Para fechas más antiguas
              return format(date, "d 'de' MMMM 'de' yyyy", { locale: es });
            }
            */
        } catch (error) {
            console.error('Error formateando fecha:', error);
            return 'fecha desconocida';
        }
    };

    return (
        <TouchableOpacity
            style={[
                styles.notificationItem,
                !item.read && styles.unreadItem
            ]}
            onPress={() => onPress(item._id)}
        >
            <View style={styles.iconContainer}>
                <Ionicons
                    name={getIconName()}
                    size={26}
                    color={getIconColor()}
                />
            </View>
            <View style={styles.contentContainer}>
                <Text style={[
                    styles.message,
                    !item.read && styles.unreadText
                ]}>
                    {item.message}
                </Text>
                <Text style={styles.timestamp}>
                    {getTimeAgo(item.createdAt)}
                </Text>
            </View>
            {!item.read && (
                <View style={styles.unreadDot} />
            )}
        </TouchableOpacity>
    );
};

const NotificationsScreen = () => {
    const {
        notifications,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        unreadCount,
        loading
    } = useNotifications();

    const [refreshing, setRefreshing] = useState(false);

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchNotifications();
        setRefreshing(false);
    };

    console.log('fetchNotifications es:', typeof fetchNotifications);

    useEffect(() => {
        console.log('NotificationsScreen mounted');
        // Envuelve la llamada en un try-catch para ver si hay errores
        try {
            fetchNotifications();
            console.log('fetchNotifications llamado con éxito');
        } catch (error) {
            console.error('Error llamando fetchNotifications:', error);
        }
    }, []);

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Notificaciones</Text>

                {unreadCount > 0 && (
                    <TouchableOpacity
                        style={styles.markAllButton}
                        onPress={markAllAsRead}
                    >
                        <Text style={styles.markAllText}>Marcar todas como leídas</Text>
                    </TouchableOpacity>
                )}
            </View>

            {loading && notifications.length === 0 && (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#2196F3" />
                </View>
            )}

            {!loading && notifications.length === 0 && (
                <View style={styles.emptyContainer}>
                    <Ionicons name="notifications-off-outline" size={60} color="#BDBDBD" />
                    <Text style={styles.emptyText}>No tienes notificaciones</Text>
                </View>
            )}

            <FlatList
                data={notifications}
                keyExtractor={item => item._id}
                renderItem={({ item }) => (
                    <NotificationItem
                        item={item}
                        onPress={markAsRead}
                    />
                )}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={['#2196F3']}
                    />
                }
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
        backgroundColor: 'white',
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#212121',
    },
    markAllButton: {
        padding: 8,
    },
    markAllText: {
        color: '#2196F3',
        fontWeight: '500',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    notificationItem: {
        flexDirection: 'row',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
        backgroundColor: 'white',
    },
    unreadItem: {
        backgroundColor: '#EBF5FB',
    },
    iconContainer: {
        marginRight: 16,
        justifyContent: 'center',
    },
    contentContainer: {
        flex: 1,
    },
    message: {
        fontSize: 16,
        marginBottom: 6,
        color: '#424242',
    },
    unreadText: {
        fontWeight: '600',
        color: '#212121',
    },
    timestamp: {
        fontSize: 12,
        color: '#757575',
    },
    unreadDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#2196F3',
        alignSelf: 'center',
        marginLeft: 8,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingBottom: 50,
    },
    emptyText: {
        marginTop: 16,
        fontSize: 16,
        color: '#757575',
    },
});

export default NotificationsScreen;