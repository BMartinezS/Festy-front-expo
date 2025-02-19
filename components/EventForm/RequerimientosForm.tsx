// components/RequerimientosForm.tsx
import React from 'react';
import { View, TextInput, Text, StyleSheet } from 'react-native';
import { EventForm } from './types';

interface RequerimientosFormProps {
    requerimientos: any;
    updateForm: (field: keyof EventForm, value: any) => void;
}

const RequerimientosForm: React.FC<RequerimientosFormProps> = ({ requerimientos, updateForm }) => {
    const handleChange = (field: string, value: string) => {
        updateForm('requerimientos', { ...requerimientos, [field]: value });
    };

    return (
        <View style={styles.container}>
            <Text style={styles.sectionTitle}>Requerimientos Especiales</Text>
            <TextInput
                style={styles.input}
                placeholder="Código de vestimenta"
                value={requerimientos.codigoVestimenta}
                onChangeText={(text) => handleChange('codigoVestimenta', text)}
            />
            <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Restricciones alimenticias"
                value={requerimientos.alimentacion}
                onChangeText={(text) => handleChange('alimentacion', text)}
                multiline
                numberOfLines={3}
            />
            <TextInput
                style={styles.input}
                placeholder="Edad mínima"
                value={requerimientos.edadMinima}
                onChangeText={(text) => handleChange('edadMinima', text)}
            />
            <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Qué deben traer los invitados"
                value={requerimientos.llevar}
                onChangeText={(text) => handleChange('llevar', text)}
                multiline
                numberOfLines={3}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { paddingHorizontal: 20, marginBottom: 20 },
    sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 10 },
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
    textArea: { height: 100, textAlignVertical: 'top' },
});

export default RequerimientosForm;
