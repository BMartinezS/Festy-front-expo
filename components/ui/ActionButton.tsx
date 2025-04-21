import { Ionicons } from '@expo/vector-icons';
import { View, Text, Animated, TouchableOpacity, StyleSheet } from 'react-native';
import { useState, useEffect } from 'react';

function ActionButton({ icon, title, onPress, color }: { icon: string, title: string, onPress: () => void, color: string }) {
    const [fadeAnim] = useState(new Animated.Value(0));

    // Añadimos useEffect para iniciar la animación cuando el componente se monta
    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true
        }).start();
    }, []);

    return (
        <Animated.View style={{
            opacity: fadeAnim,
            transform: [{
                translateY: fadeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0]
                })
            }]
        }}>
            <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: color }]}
                onPress={onPress}
                activeOpacity={0.8}
            >
                <View style={styles.actionButtonContent}>
                    <Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={24} color="white" />
                    <Text style={styles.actionButtonText}>{title}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.7)" />
            </TouchableOpacity>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 4,
        marginBottom: 12, // Añadido margen inferior para separar los botones
    },
    actionButtonContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    actionButtonText: {
        color: 'white',
        fontWeight: '600',
        fontSize: 16,
        marginLeft: 12,
    },
});

export default ActionButton;