import React from 'react';
import { View, Text, TextInput } from 'react-native';
import { EventForm } from './types';
import { commonStyles, colors, typography, spacing } from '@/styles/eventForm';

interface PaymentDetailsSectionProps {
    form: any;
    updateForm: (field: keyof EventForm, value: any) => void;
}

const PaymentDetailsSection: React.FC<PaymentDetailsSectionProps> = ({ form, updateForm }) => {
    // Calculamos el total de productos considerando las cantidades
    const totalProductos = form.productos.reduce((sum: number, item: any) =>
        sum + (item.product.price * item.quantity), 0);

    // Calculamos la cantidad total de invitados
    const cantidadPersonas = parseInt(form.cantidadInvitados) || 0;

    // Calculamos la cuota por persona
    const cuotaPorPersona = cantidadPersonas > 0 ? totalProductos / cantidadPersonas : 0;

    // Actualizamos el estado de cuotaCalculada cuando cambian los valores
    React.useEffect(() => {
        updateForm('cuotaCalculada', {
            totalProductos,
            cantidadPersonas,
            cuotaPorPersona
        });
    }, [totalProductos, cantidadPersonas, cuotaPorPersona, updateForm]);

    return (
        <View style={commonStyles.container}>
            <Text style={commonStyles.cardTitle}>Cálculo de Cuota</Text>

            <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingVertical: spacing.sm,
            }}>
                <Text style={{ ...typography.body, color: colors.gray[600] }}>Total Productos:</Text>
                <Text style={{ ...typography.body, color: colors.primaryDark, fontWeight: '500' }}>
                    ${totalProductos.toLocaleString()}
                </Text>
            </View>

            <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingVertical: spacing.sm,
            }}>
                <Text style={{ ...typography.body, color: colors.gray[600] }}>Cantidad de Invitados:</Text>
                <Text style={{ ...typography.body, color: colors.primaryDark, fontWeight: '500' }}>
                    {cantidadPersonas}
                </Text>
            </View>

            <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingVertical: spacing.sm,
                borderTopWidth: 1,
                borderTopColor: colors.primaryBorder,
                marginTop: spacing.sm,
                paddingTop: spacing.md,
                marginBottom: spacing.lg,
            }}>
                <Text style={{ ...typography.subtitle }}>Cuota por Persona:</Text>
                <Text style={{ ...typography.subtitle }}>
                    ${Math.ceil(cuotaPorPersona).toLocaleString()}
                </Text>
            </View>

            <TextInput
                style={commonStyles.input}
                placeholder="Ajustar cuota por persona"
                value={Math.ceil(cuotaPorPersona).toLocaleString()}
                onChangeText={(text) => updateForm('cuotaAmount', text)}
                keyboardType="numeric"
                placeholderTextColor={colors.gray[400]}
            />

            <Text style={{
                ...typography.small,
                color: colors.gray[600],
                fontStyle: 'italic',
                marginTop: spacing.xs
            }}>
                Puedes ajustar la cuota manualmente si lo deseas
            </Text>
        </View>
    );
};

export default PaymentDetailsSection;