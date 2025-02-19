// components/EventInfoForm.tsx
import React from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import CustomDropdown from '@/components/CustomDropdown';
import { EventForm } from './types';

const EVENT_TYPES = [
    { label: 'Asado', value: 'asado' },
    { label: 'Cumpleaños', value: 'cumpleanos' },
    { label: 'Reunión', value: 'reunion' },
];

interface EventInfoFormProps {
    form: any;
    updateForm: (field: keyof EventForm, value: any) => void;
}

const EventInfoForm: React.FC<EventInfoFormProps> = ({ form, updateForm }) => {
    return (
        <View style={styles.container}>
            <TextInput
                style={styles.input}
                placeholder="Nombre del evento"
                value={form.nombre}
                onChangeText={(text) => updateForm('nombre', text)}
            />
            <CustomDropdown
                label="Tipo de evento"
                value={form.tipo}
                options={EVENT_TYPES}
                onValueChange={(value) => updateForm('tipo', value)}
                placeholder="Selecciona el tipo de evento"
            />
            <TextInput
                style={styles.input}
                placeholder="Duración del evento"
                value={form.duracion}
                onChangeText={(text) => updateForm('duracion', text)}
            />
            <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Descripción"
                value={form.descripcion}
                onChangeText={(text) => updateForm('descripcion', text)}
                multiline
                numberOfLines={3}
            />
            <TextInput
                style={styles.input}
                placeholder="Número de invitados"
                keyboardType="numeric"
                value={form.cantidadInvitados}
                onChangeText={(text) => updateForm('cantidadInvitados', text)}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { paddingHorizontal: 20, marginBottom: 20 },
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

export default EventInfoForm;
