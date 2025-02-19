// components/PaymentSwitch.tsx
import React from 'react';
import { View, Text, Switch, StyleSheet } from 'react-native';

interface PaymentSwitchProps {
    requiresPayment: boolean;
    onToggle: (value: boolean) => void;
}

const PaymentSwitch: React.FC<PaymentSwitchProps> = ({ requiresPayment, onToggle }) => {
    return (
        <View style={styles.container}>
            <Text style={styles.label}>¿Requiere pago de cuota para los invitados?</Text>
            <Switch
                value={requiresPayment}
                onValueChange={onToggle}
                trackColor={{ false: '#767577', true: 'rgb(71, 25, 82)' }}
                thumbColor={requiresPayment ? 'rgb(51, 18, 59)' : '#f4f3f4'}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        paddingHorizontal: 20,
    },
    label: {
        fontSize: 16,
        color: 'rgb(51, 18, 59)',
    },
});

export default PaymentSwitch;
