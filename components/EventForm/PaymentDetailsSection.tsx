// components/PaymentDetailsSection.tsx
import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { EventForm } from './types';

interface PaymentDetailsSectionProps {
    form: any;
    updateForm: (field: keyof EventForm, value: any) => void;
}

const PaymentDetailsSection: React.FC<PaymentDetailsSectionProps> = ({ form, updateForm }) => {
    return (
        <View style={styles.container}>
            <Text style={styles.cardTitle}>Cálculo de Cuota</Text>
            <View style={styles.calculoRow}>
                <Text style={styles.calculoLabel}>Total Productos:</Text>
                <Text style={styles.calculoValue}>
                    ${form.cuotaCalculada.totalProductos.toLocaleString()}
                </Text>
            </View>
            <View style={styles.calculoRow}>
                <Text style={styles.calculoLabel}>Cantidad de Invitados:</Text>
                <Text style={styles.calculoValue}>{form.cuotaCalculada.cantidadPersonas}</Text>
            </View>
            <View style={[styles.calculoRow, styles.totalRow]}>
                <Text style={styles.calculoLabelTotal}>Cuota por Persona:</Text>
                <Text style={styles.calculoValueTotal}>
                    ${Math.ceil(form.cuotaCalculada.cuotaPorPersona).toLocaleString()}
                </Text>
            </View>
            <TextInput
                style={styles.input}
                placeholder="Ajustar cuota por persona"
                value={form.cuotaAmount}
                onChangeText={(text) => updateForm('cuotaAmount', text)}
                keyboardType="numeric"
            />
            <Text style={styles.helperText}>
                Puedes ajustar la cuota manualmente si lo deseas
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { paddingHorizontal: 20, marginBottom: 20 },
    cardTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(71, 25, 82, 0.1)',
        paddingBottom: 8,
    },
    calculoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
    },
    calculoLabel: { fontSize: 14, color: '#666' },
    calculoValue: { fontSize: 14, color: 'rgb(51, 18, 59)', fontWeight: '500' },
    totalRow: {
        borderTopWidth: 1,
        borderTopColor: 'rgba(71, 25, 82, 0.1)',
        marginTop: 8,
        paddingTop: 12,
        marginBottom: 15,
    },
    calculoLabelTotal: { fontSize: 16, fontWeight: '600', color: 'rgb(51, 18, 59)' },
    calculoValueTotal: { fontSize: 16, fontWeight: '600', color: 'rgb(51, 18, 59)' },
    input: {
        width: '100%',
        height: 50,
        backgroundColor: '#ffffff',
        borderRadius: 10,
        paddingHorizontal: 15,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: 'rgb(71, 25, 82)',
    },
    helperText: {
        fontSize: 12,
        color: '#666',
        fontStyle: 'italic',
        marginTop: 5,
    },
});

export default PaymentDetailsSection;
