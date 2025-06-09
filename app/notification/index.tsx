import React, { useEffect, useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    RefreshControl,
    ActivityIndicator,
    Animated,
    Platform,
    SafeAreaView,
    StatusBar,
    Dimensions,
    Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useNotifications, Notification } from '../../context/NotificationContext';
import { differenceInSeconds, differenceInMinutes, differenceInHours, differenceInDays, differenceInMonths, differenceInYears } from 'date-fns';

const { width, height } = Dimensions.get('window');

const NotificationItem: React.FC<{
    item: Notification,
    onPress: (id: string) => void,
    index: number
}> = ({ item, onPress, index }) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;
    const scaleAnim = useRef(new Animated.Value(0.95)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 600,
                delay: index * 100,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 500,
                delay: index * 100,
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                tension: 100,
                friction: 8,
                delay: index * 50,
                useNativeDriver: true,
            })
        ]).start();
    }, []);

    const getIconName = () => {
        switch (item.type) {
            case 'info': return 'information-circle';
            case 'warning': return 'warning';
            case 'error': return 'alert-circle';
            case 'success': return 'checkmark-circle';
            default: return 'notifications';
        }
    };

    const getGradientColors = () => {
        switch (item.type) {
            case 'info': return ['#8B5CF6', '#7C3AED'];
            case 'warning': return ['#F59E0B', '#D97706'];
            case 'error': return ['#EF4444', '#DC2626'];
            case 'success': return ['#10B981', '#059669'];
            default: return ['#6B7280', '#4B5563'];
        }
    };

    const getTimeAgo = (dateString: string) => {
        try {
            const date = new Date(dateString);
            const now = new Date();

            const secondsDiff = differenceInSeconds(now, date);
            const minutesDiff = differenceInMinutes(now, date);
            const hoursDiff = differenceInHours(now, date);
            const daysDiff = differenceInDays(now, date);
            const monthsDiff = differenceInMonths(now, date);
            const yearsDiff = differenceInYears(now, date);

            if (secondsDiff < 60) {
                return 'Ahora';
            } else if (minutesDiff < 60) {
                return minutesDiff === 1 ? '1 min' : `${minutesDiff} min`;
            } else if (hoursDiff < 24) {
                return hoursDiff === 1 ? '1 hora' : `${hoursDiff} horas`;
            } else if (daysDiff < 30) {
                return daysDiff === 1 ? '1 día' : `${daysDiff} días`;
            } else if (monthsDiff < 12) {
                return monthsDiff === 1 ? '1 mes' : `${monthsDiff} meses`;
            } else {
                return yearsDiff === 1 ? '1 año' : `${yearsDiff} años`;
            }
        } catch (error) {
            console.error('Error formateando fecha:', error);
            return 'Fecha desconocida';
        }
    };

    return (
        <Animated.View
            style={[
                styles.notificationWrapper,
                {
                    opacity: fadeAnim,
                    transform: [
                        { translateY: slideAnim },
                        { scale: scaleAnim }
                    ]
                }
            ]}
        >
            <TouchableOpacity
                style={[
                    styles.notificationItem,
                    !item.read && styles.unreadItem
                ]}
                onPress={() => onPress(item._id)}
                activeOpacity={0.7}
            >
                <View style={styles.notificationContent}>
                    <View style={styles.iconWrapper}>
                        <LinearGradient
                            colors={['#10B981', '#059669']}
                            style={styles.iconContainer}
                        >
                            <Ionicons
                                name={getIconName()}
                                size={20}
                                color="#FFFFFF"
                            />
                        </LinearGradient>
                    </View>

                    <View style={styles.contentContainer}>
                        <View style={styles.messageHeader}>
                            <Text style={[
                                styles.message,
                                !item.read && styles.unreadText
                            ]} numberOfLines={2}>
                                {item.message}
                            </Text>
                            {!item.read && (
                                <View style={styles.unreadIndicator}>
                                    <LinearGradient
                                        colors={['#8B5CF6', '#7C3AED']}
                                        style={styles.unreadDot}
                                    />
                                </View>
                            )}
                        </View>

                        <View style={styles.metaContainer}>
                            <Text style={styles.timestamp}>
                                {getTimeAgo(item.createdAt)}
                            </Text>
                            <View style={styles.typeTag}>
                                <Text style={[styles.typeText, { color: getGradientColors()[0] }]}>
                                    {item.type.toUpperCase()}
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>

                <View style={styles.actionContainer}>
                    <Ionicons
                        name="chevron-forward"
                        size={16}
                        color="#9CA3AF"
                    />
                </View>
            </TouchableOpacity>
        </Animated.View>
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
    const [filter, setFilter] = useState<'all' | 'unread'>('all');

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;

    useEffect(() => {
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
            })
        ]).start();
    }, []);

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchNotifications();
        setRefreshing(false);
    };

    useEffect(() => {
        console.log('NotificationsScreen mounted');
        try {
            fetchNotifications();
            console.log('fetchNotifications llamado con éxito');
        } catch (error) {
            console.error('Error llamando fetchNotifications:', error);
        }
    }, []);

    const filteredNotifications = filter === 'all'
        ? notifications
        : notifications.filter(n => !n.read);

    const handleMarkAllAsRead = () => {
        if (unreadCount === 0) return;

        Alert.alert(
            "Marcar como leídas",
            `¿Estás seguro de que quieres marcar todas las ${unreadCount} notificaciones como leídas?`,
            [
                { text: "Cancelar", style: "cancel" },
                { text: "Confirmar", onPress: markAllAsRead }
            ]
        );
    };

    const EmptyState = () => (
        <Animated.View
            style={[
                styles.emptyContainer,
                {
                    opacity: fadeAnim,
                    transform: [{ translateY: slideAnim }]
                }
            ]}
        >
            <LinearGradient
                colors={['#F3F4F6', '#E5E7EB']}
                style={styles.emptyIconContainer}
            >
                <Ionicons
                    name={filter === 'unread' ? "checkmark-done-circle" : "notifications-off-outline"}
                    size={48}
                    color="#9CA3AF"
                />
            </LinearGradient>
            <Text style={styles.emptyTitle}>
                {filter === 'unread' ? '¡Todo al día!' : 'Sin notificaciones'}
            </Text>
            <Text style={styles.emptySubtitle}>
                {filter === 'unread'
                    ? 'No tienes notificaciones sin leer'
                    : 'Te avisaremos cuando tengas algo nuevo'
                }
            </Text>
        </Animated.View>
    );

    const LoadingState = () => (
        <View style={styles.loadingContainer}>
            <LinearGradient
                colors={['#8B5CF6', '#7C3AED']}
                style={styles.loadingWrapper}
            >
                <ActivityIndicator size="large" color="#FFFFFF" />
                <Text style={styles.loadingText}>Cargando notificaciones...</Text>
            </LinearGradient>
        </View>
    );

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="light-content" backgroundColor="#8B5CF6" />

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
                    {/* Decorative elements */}
                    <View style={styles.decorativeElements}>
                        <View style={styles.circle1} />
                        <View style={styles.circle2} />
                        <View style={styles.circle3} />
                    </View>

                    <View style={styles.headerContent}>
                        <View style={styles.titleContainer}>
                            <View style={styles.headerIconContainer}>
                                <LinearGradient
                                    colors={['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.1)']}
                                    style={styles.headerIcon}
                                >
                                    <Ionicons name="notifications" size={24} color="#FFFFFF" />
                                </LinearGradient>
                            </View>
                            <View>
                                <Text style={styles.title}>Notificaciones</Text>
                                <Text style={styles.subtitle}>
                                    {unreadCount > 0 ? `${unreadCount} sin leer` : 'Todo al día'}
                                </Text>
                            </View>
                        </View>

                        {unreadCount > 0 && (
                            <TouchableOpacity
                                style={styles.markAllButton}
                                onPress={handleMarkAllAsRead}
                                activeOpacity={0.8}
                            >
                                <BlurView intensity={20} style={styles.markAllBlur}>
                                    <Ionicons name="checkmark-done" size={16} color="#FFFFFF" />
                                    <Text style={styles.markAllText}>Marcar leídas</Text>
                                </BlurView>
                            </TouchableOpacity>
                        )}
                    </View>
                </LinearGradient>
            </Animated.View>

            {/* Filter Tabs */}
            <Animated.View
                style={[
                    styles.filterContainer,
                    {
                        opacity: fadeAnim,
                        transform: [{ translateY: slideAnim }]
                    }
                ]}
            >
                <View style={styles.filterTabs}>
                    <TouchableOpacity
                        style={[styles.filterTab, filter === 'all' && styles.filterTabActive]}
                        onPress={() => setFilter('all')}
                        activeOpacity={0.8}
                    >
                        {filter === 'all' && (
                            <LinearGradient
                                colors={['#8B5CF6', '#7C3AED']}
                                style={styles.filterTabGradient}
                            />
                        )}
                        <Text style={[styles.filterTabText, filter === 'all' && styles.filterTabTextActive]}>
                            Todas ({notifications.length})
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.filterTab, filter === 'unread' && styles.filterTabActive]}
                        onPress={() => setFilter('unread')}
                        activeOpacity={0.8}
                    >
                        {filter === 'unread' && (
                            <LinearGradient
                                colors={['#8B5CF6', '#7C3AED']}
                                style={styles.filterTabGradient}
                            />
                        )}
                        <Text style={[styles.filterTabText, filter === 'unread' && styles.filterTabTextActive]}>
                            Sin leer ({unreadCount})
                        </Text>
                    </TouchableOpacity>
                </View>
            </Animated.View>

            {/* Content */}
            <View style={styles.container}>
                {loading && notifications.length === 0 && <LoadingState />}

                {!loading && filteredNotifications.length === 0 && <EmptyState />}

                {filteredNotifications.length > 0 && (
                    <FlatList
                        data={filteredNotifications}
                        keyExtractor={item => item._id}
                        renderItem={({ item, index }) => (
                            <NotificationItem
                                item={item}
                                onPress={markAsRead}
                                index={index}
                            />
                        )}
                        refreshControl={
                            <RefreshControl
                                refreshing={refreshing}
                                onRefresh={onRefresh}
                                colors={['#8B5CF6']}
                                tintColor="#8B5CF6"
                                progressBackgroundColor="#FFFFFF"
                            />
                        }
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.listContainer}
                    />
                )}
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#F9FAFB',
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
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        top: -30,
        right: -20,
    },
    circle2: {
        position: 'absolute',
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        top: 40,
        right: 40,
    },
    circle3: {
        position: 'absolute',
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.06)',
        bottom: -10,
        left: -10,
    },
    headerContent: {
        position: 'relative',
        zIndex: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    titleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    headerIconContainer: {
        marginRight: 12,
    },
    headerIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 2,
    },
    subtitle: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.8)',
    },
    markAllButton: {
        overflow: 'hidden',
        borderRadius: 20,
    },
    markAllBlur: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
    },
    markAllText: {
        color: '#FFFFFF',
        fontWeight: '600',
        fontSize: 14,
        marginLeft: 6,
    },
    filterContainer: {
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
    filterTabs: {
        flexDirection: 'row',
    },
    filterTab: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 12,
        position: 'relative',
    },
    filterTabActive: {
        // Styles applied via gradient
    },
    filterTabGradient: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        borderRadius: 12,
    },
    filterTabText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6B7280',
        position: 'relative',
        zIndex: 1,
    },
    filterTabTextActive: {
        color: '#FFFFFF',
    },
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    listContainer: {
        padding: 16,
        paddingTop: 24,
    },
    notificationWrapper: {
        marginBottom: 12,
    },
    notificationItem: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    unreadItem: {
        borderColor: '#DDD6FE',
        backgroundColor: '#FAF5FF',
    },
    notificationContent: {
        flexDirection: 'row',
        flex: 1,
    },
    iconWrapper: {
        marginRight: 12,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    contentContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    messageHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 6,
    },
    message: {
        fontSize: 15,
        color: '#374151',
        lineHeight: 20,
        flex: 1,
    },
    unreadText: {
        fontWeight: '600',
        color: '#1F2937',
    },
    unreadIndicator: {
        marginLeft: 8,
        marginTop: 2,
    },
    unreadDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    metaContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    timestamp: {
        fontSize: 12,
        color: '#9CA3AF',
        fontWeight: '500',
    },
    typeTag: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        backgroundColor: '#F3F4F6',
        borderRadius: 8,
    },
    typeText: {
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    actionContainer: {
        justifyContent: 'center',
        marginLeft: 8,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    loadingWrapper: {
        padding: 32,
        borderRadius: 20,
        alignItems: 'center',
        minWidth: 200,
    },
    loadingText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
        marginTop: 16,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
        paddingBottom: 80,
    },
    emptyIconContainer: {
        width: 96,
        height: 96,
        borderRadius: 48,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 8,
        textAlign: 'center',
    },
    emptySubtitle: {
        fontSize: 16,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 22,
    },
});

export default NotificationsScreen;