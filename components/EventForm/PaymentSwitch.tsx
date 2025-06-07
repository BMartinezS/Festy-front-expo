import React from 'react';
import { View, Text, Switch, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

interface PaymentSwitchProps {
    requiresPayment: boolean;
    onToggle: (value: boolean) => void;
}

const PaymentSwitch: React.FC<PaymentSwitchProps> = ({ requiresPayment, onToggle }) => {
    const [fadeAnim] = React.useState(new Animated.Value(0));

    React.useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
        }).start();
    }, []);

    return (
        <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
            {/* Main card */}
            <View style={styles.card}>
                <View style={styles.header}>
                    <View style={styles.iconContainer}>
                        <LinearGradient
                            colors={requiresPayment ? ['#8B5CF6', '#7C3AED'] : ['#F3F4F6', '#E5E7EB']}
                            style={styles.iconGradient}
                        >
                            <Ionicons
                                name={requiresPayment ? "card" : "card-outline"}
                                size={20}
                                color={requiresPayment ? "#FFFFFF" : "#6B7280"}
                            />
                        </LinearGradient>
                    </View>

                    <View style={styles.textContainer}>
                        <Text style={styles.title}>Configuración de pago</Text>
                        <Text style={styles.subtitle}>
                            {requiresPayment
                                ? 'Los invitados pagarán una cuota'
                                : 'Evento gratuito para los invitados'
                            }
                        </Text>
                    </View>

                    <View style={styles.switchContainer}>
                        <Switch
                            value={requiresPayment}
                            onValueChange={onToggle}
                            trackColor={{
                                false: '#E5E7EB',
                                true: '#C4B5FD'
                            }}
                            thumbColor={requiresPayment ? '#8B5CF6' : '#F9FAFB'}
                            ios_backgroundColor="#E5E7EB"
                            style={styles.switch}
                        />
                    </View>
                </View>

                {/* Info section */}
                <View style={styles.infoSection}>
                    <View style={styles.infoItem}>
                        <View style={styles.bulletPoint}>
                            <Ionicons
                                name={requiresPayment ? "checkmark-circle" : "information-circle-outline"}
                                size={16}
                                color={requiresPayment ? "#22C55E" : "#8B5CF6"}
                            />
                        </View>
                        <Text style={styles.infoText}>
                            {requiresPayment
                                ? 'Se habilitará el sistema de pagos y división de gastos'
                                : 'Los invitados solo necesitan confirmar su asistencia'
                            }
                        </Text>
                    </View>

                    {requiresPayment && (
                        <View style={styles.infoItem}>
                            <View style={styles.bulletPoint}>
                                <Ionicons name="calculator-outline" size={16} color="#06B6D4" />
                            </View>
                            <Text style={styles.infoText}>
                                La cuota se calculará automáticamente según los productos seleccionados
                            </Text>
                        </View>
                    )}
                </View>

                {/* Status indicator */}
                <View style={[
                    styles.statusBar,
                    requiresPayment ? styles.statusBarActive : styles.statusBarInactive
                ]}>
                    {requiresPayment ? (
                        <LinearGradient
                            colors={['#8B5CF6', '#7C3AED']}
                            style={styles.statusGradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                        />
                    ) : null}
                </View>
            </View>

            {/* Additional info card for payment mode */}
            {requiresPayment && (
                <Animated.View
                    style={[
                        styles.additionalCard,
                        { opacity: fadeAnim }
                    ]}
                >
                    <View style={styles.additionalHeader}>
                        <Ionicons name="information-circle" size={20} color="#8B5CF6" />
                        <Text style={styles.additionalTitle}>¿Cómo funciona?</Text>
                    </View>

                    <View style={styles.featuresList}>
                        <View style={styles.featureItem}>
                            <View style={styles.featureNumber}>
                                <Text style={styles.featureNumberText}>1</Text>
                            </View>
                            <Text style={styles.featureText}>
                                Agrega productos y la app calculará el costo total
                            </Text>
                        </View>

                        <View style={styles.featureItem}>
                            <View style={styles.featureNumber}>
                                <Text style={styles.featureNumberText}>2</Text>
                            </View>
                            <Text style={styles.featureText}>
                                La cuota se divide automáticamente entre todos los invitados
                            </Text>
                        </View>

                        <View style={styles.featureItem}>
                            <View style={styles.featureNumber}>
                                <Text style={styles.featureNumberText}>3</Text>
                            </View>
                            <Text style={styles.featureText}>
                                Los invitados reciben un enlace para pagar su parte
                            </Text>
                        </View>
                    </View>
                </Animated.View>
            )}
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 24,
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 6,
        borderWidth: 1,
        borderColor: '#F3F4F6',
        position: 'relative',
        overflow: 'hidden',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    iconContainer: {
        marginRight: 12,
    },
    iconGradient: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    textContainer: {
        flex: 1,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 2,
    },
    subtitle: {
        fontSize: 14,
        color: '#6B7280',
        fontWeight: '500',
    },
    switchContainer: {
        marginLeft: 12,
    },
    switch: {
        transform: [{ scaleX: 1.1 }, { scaleY: 1.1 }],
    },
    infoSection: {
        gap: 12,
        marginBottom: 16,
    },
    infoItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
    },
    bulletPoint: {
        marginTop: 2,
    },
    infoText: {
        flex: 1,
        fontSize: 14,
        color: '#374151',
        lineHeight: 20,
    },
    statusBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 4,
    },
    statusBarActive: {
        overflow: 'hidden',
    },
    statusBarInactive: {
        backgroundColor: '#F3F4F6',
    },
    statusGradient: {
        flex: 1,
    },
    additionalCard: {
        backgroundColor: '#FDFBFF',
        borderRadius: 12,
        padding: 16,
        marginTop: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    additionalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        gap: 8,
    },
    additionalTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
    },
    featuresList: {
        gap: 12,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
    },
    featureNumber: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#8B5CF6',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 2,
    },
    featureNumberText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    featureText: {
        flex: 1,
        fontSize: 14,
        color: '#374151',
        lineHeight: 20,
    },
});

export default PaymentSwitch;