import React from 'react';
import {
    View,
    TouchableOpacity,
    Text,
    StyleSheet,
    ActivityIndicator,
    Animated,
    Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

interface FooterProps {
    onSubmit: () => void;
    isLoading: boolean;
}

const { width } = Dimensions.get('window');

const Footer: React.FC<FooterProps> = ({ onSubmit, isLoading }) => {
    const [fadeAnim] = React.useState(new Animated.Value(0));
    const [scaleAnim] = React.useState(new Animated.Value(0.95));

    React.useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
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

    const handlePress = () => {
        if (!isLoading) {
            // Pequeña animación de feedback al presionar
            Animated.sequence([
                Animated.timing(scaleAnim, {
                    toValue: 0.98,
                    duration: 100,
                    useNativeDriver: true,
                }),
                Animated.timing(scaleAnim, {
                    toValue: 1,
                    duration: 100,
                    useNativeDriver: true,
                })
            ]).start();

            onSubmit();
        }
    };

    return (
        <Animated.View
            style={[
                styles.container,
                {
                    opacity: fadeAnim,
                    transform: [{ scale: scaleAnim }]
                }
            ]}
        >
            {/* Decorative background */}
            <View style={styles.decorativeBackground}>
                <View style={styles.decorativeCircle1} />
                <View style={styles.decorativeCircle2} />
                <View style={styles.decorativeShape} />
            </View>

            {/* Main content */}
            <View style={styles.content}>
                {/* Info section */}
                <View style={styles.infoSection}>
                    <View style={styles.infoCard}>
                        <View style={styles.infoHeader}>
                            <Ionicons name="information-circle-outline" size={20} color="#8B5CF6" />
                            <Text style={styles.infoTitle}>Último paso</Text>
                        </View>
                        <Text style={styles.infoText}>
                            Revisa toda la información antes de crear tu evento
                        </Text>
                    </View>
                </View>

                {/* Main button */}
                <TouchableOpacity
                    style={[
                        styles.button,
                        isLoading && styles.buttonDisabled
                    ]}
                    onPress={handlePress}
                    disabled={isLoading}
                    activeOpacity={0.9}
                >
                    <LinearGradient
                        colors={
                            isLoading
                                ? ['#9CA3AF', '#6B7280']
                                : ['#8B5CF6', '#7C3AED', '#6D28D9']
                        }
                        style={styles.buttonGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                    >
                        {isLoading ? (
                            <View style={styles.loadingContent}>
                                <ActivityIndicator
                                    size="small"
                                    color="#FFFFFF"
                                    style={styles.loadingSpinner}
                                />
                                <Text style={styles.buttonText}>Creando evento...</Text>
                            </View>
                        ) : (
                            <View style={styles.buttonContent}>
                                <Ionicons name="rocket-outline" size={20} color="#FFFFFF" />
                                <Text style={styles.buttonText}>Crear Evento</Text>
                            </View>
                        )}
                    </LinearGradient>

                    {/* Shimmer effect when not loading */}
                    {!isLoading && (
                        <View style={styles.shimmerContainer}>
                            <LinearGradient
                                colors={['transparent', 'rgba(255,255,255,0.3)', 'transparent']}
                                style={styles.shimmer}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                            />
                        </View>
                    )}
                </TouchableOpacity>
            </View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginTop: 32,
        marginBottom: 20,
        position: 'relative',
    },
    decorativeBackground: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        opacity: 0.05,
    },
    decorativeCircle1: {
        position: 'absolute',
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#8B5CF6',
        top: -20,
        right: 20,
    },
    decorativeCircle2: {
        position: 'absolute',
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#06B6D4',
        bottom: 20,
        left: 30,
    },
    decorativeShape: {
        position: 'absolute',
        width: 40,
        height: 40,
        backgroundColor: '#F59E0B',
        transform: [{ rotate: '45deg' }],
        top: 50,
        left: width - 80,
    },
    content: {
        paddingHorizontal: 20,
        zIndex: 1,
    },
    infoSection: {
        marginBottom: 24,
    },
    infoCard: {
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        padding: 16,
        borderLeftWidth: 4,
        borderLeftColor: '#8B5CF6',
    },
    infoHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
        gap: 8,
    },
    infoTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#111827',
    },
    infoText: {
        fontSize: 14,
        color: '#6B7280',
        lineHeight: 20,
    },
    button: {
        width: '100%',
        height: 56,
        borderRadius: 16,
        overflow: 'hidden',
        position: 'relative',
        shadowColor: '#8B5CF6',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 8,
    },
    buttonDisabled: {
        shadowOpacity: 0.1,
        elevation: 2,
    },
    buttonGradient: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    loadingContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    loadingSpinner: {
        transform: [{ scale: 1.2 }],
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    shimmerContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        overflow: 'hidden',
    },
    shimmer: {
        position: 'absolute',
        top: 0,
        left: '-100%',
        right: 0,
        bottom: 0,
        width: '100%',
    },
    secondaryActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 16,
        gap: 12,
    },
    secondaryButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        paddingVertical: 12,
        paddingHorizontal: 16,
        gap: 6,
    },
    secondaryButtonText: {
        fontSize: 14,
        color: '#8B5CF6',
        fontWeight: '600',
    },
    progressContainer: {
        alignItems: 'center',
        marginTop: 20,
        gap: 8,
    },
    progressDots: {
        flexDirection: 'row',
        gap: 8,
    },
    progressDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#E5E7EB',
    },
    progressDotActive: {
        backgroundColor: '#8B5CF6',
        width: 24,
    },
    progressText: {
        fontSize: 12,
        color: '#9CA3AF',
        fontWeight: '500',
    },
});

export default Footer;