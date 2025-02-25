import React, { useEffect } from 'react';
import { View, Text, TextInput } from 'react-native';
import { EventForm } from './types';
import { commonStyles, colors, typography, spacing } from '@/styles/eventForm';

interface PaymentDetailsSectionProps {
    form: any;
    updateForm: (field: keyof EventForm, value: any) => void;
}

const PaymentDetailsSection: React.FC<PaymentDetailsSectionProps> = ({ form, updateForm }) => {
    // Calculamos el total de productos considerando las cantidades
    const calculateTotalProductos = () => {
        if (!form.productos || !Array.isArray(form.productos) || form.productos.length === 0) {
            return 0;
        }

        return form.productos.reduce((sum: number, item: any) => {
            // Primero verificamos si el ítem tiene una estructura product/quantity
            if (item.product && typeof item.product === 'object') {
                const price = item.product.price || 0;
                const quantity = item.quantity || 1;
                return sum + (price * quantity);
            }
            // Alternativa: verificamos si el ítem es directamente un Product
            else if (item.price) {
                return sum + (item.price * (item.quantity || 1));
            }
            // Si no coincide con ninguna estructura, retornamos el acumulador actual
            return sum;
        }, 0);
    };

    // Función segura para verificar el valor de cuotaAmount
    const checkCuotaAmount = () => {
        const cuotaAmount = form.cuotaAmount;

        // Si cuotaAmount es nulo, undefined, NaN o una cadena vacía, usamos el valor calculado
        if (cuotaAmount === null || cuotaAmount === undefined ||
            cuotaAmount === '' || Number.isNaN(Number(cuotaAmount))) {
            return Math.ceil(cuotaPorPersona).toLocaleString();
        }

        // Si es un número válido, lo formateamos
        try {
            const numericValue = Number(cuotaAmount);
            return numericValue.toLocaleString();
        } catch (error) {
            console.error("Error al formatear cuotaAmount:", error);
            return Math.ceil(cuotaPorPersona).toLocaleString();
        }
    };

    // Obtenemos la cantidad de invitados
    const getCantidadPersonas = () => {
        const cantidad = parseInt(form.cantidadInvitados);
        return isNaN(cantidad) ? 0 : cantidad;
    };

    // Calculamos la cuota por persona
    const calculateCuotaPorPersona = (total: number, cantidad: number) => {
        return cantidad > 0 ? total / cantidad : 0;
    };

    // Valores actuales
    const totalProductos = calculateTotalProductos();
    const cantidadPersonas = getCantidadPersonas();
    const cuotaPorPersona = calculateCuotaPorPersona(totalProductos, cantidadPersonas);

    // Actualizamos el estado de cuotaCalculada y cuotaAmount cuando cambian los valores
    useEffect(() => {
        // Actualizamos cuotaCalculada con los valores correctos
        updateForm('cuotaCalculada', {
            cantidadPersonas,
            cuotaPorPersona,
            totalProductos,
        });

        // Actualizamos también el cuotaAmount si es necesario
        const cuotaPorPersonaRedondeada = Math.ceil(cuotaPorPersona);

        // Primero asegúrate de que form.cuotaAmount sea un valor que se pueda convertir a número
        // o un null/undefined, pero nunca un NaN
        let shouldUpdate = false;



        if (form.cuotaAmount === null || form.cuotaAmount === undefined || form.cuotaAmount === '') {
            shouldUpdate = true;
        } else {
            // Intenta convertir a número de manera segura
            const currentCuotaAmount = Number(form.cuotaAmount);

            // Verifica si la conversión resultó en NaN o si el valor es diferente al calculado
            if (isNaN(currentCuotaAmount) || currentCuotaAmount !== cuotaPorPersonaRedondeada) {
                shouldUpdate = true;
            }
        }

        console.log('form cuota amount: ', form.cuotaAmount);
        console.log('cuota por persona redondeada: ', cuotaPorPersonaRedondeada);

        // Solo actualiza si es necesario
        if (shouldUpdate) {
            updateForm('cuotaAmount', cuotaPorPersonaRedondeada.toString());
        }
    }, [totalProductos, cantidadPersonas]);

    // Handler para manejar cambios en la cuota manual
    const handleCuotaChange = (text: string) => {
        // Eliminar caracteres no numéricos
        const cleanedText = text.replace(/[^0-9]/g, '');

        // Si después de limpiar queda una cadena vacía, ponemos "0"
        // para evitar problemas con valores vacíos
        const numericValue = cleanedText === '' ? '0' : cleanedText;

        updateForm('cuotaAmount', numericValue);
    };

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

            {/* Útil solo para depuración, se puede eliminar en producción */}
            {/* <Text style={{ ...typography.subtitle }}>
                Valor Actual: {form.cuotaAmount === null ? 'null' : 
                               form.cuotaAmount === undefined ? 'undefined' : 
                               form.cuotaAmount}
            </Text> */}

            <TextInput
                style={commonStyles.input}
                placeholder="Ajustar cuota por persona"
                value={checkCuotaAmount()}
                onChangeText={handleCuotaChange}
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