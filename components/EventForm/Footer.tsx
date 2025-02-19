// components/Footer.tsx
import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';

interface FooterProps {
    onSubmit: () => void;
    isLoading: boolean;
}

const Footer: React.FC<FooterProps> = ({ onSubmit, isLoading }) => {
    return (
        <View style={styles.container}>
            <TouchableOpacity
                style={[styles.button, isLoading && styles.buttonDisabled]}
                onPress={onSubmit}
                disabled={isLoading}
            >
                <Text style={styles.buttonText}>{isLoading ? 'Creando...' : 'Crear Evento'}</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { paddingHorizontal: 20, marginBottom: 20 },
    button: {
        width: '100%',
        height: 50,
        backgroundColor: 'rgb(51, 18, 59)',
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
    },
    buttonDisabled: { opacity: 0.7 },
    buttonText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' },
});

export default Footer;
