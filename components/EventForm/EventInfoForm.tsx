// components/EventForm/EventInfoForm.tsx
import React from 'react';
import { View, TextInput, Platform, Text } from 'react-native';
import CustomDropdown from '@/components/CustomDropdown';
import { EventForm } from './types';
import { commonStyles } from '@/styles/eventForm';

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
        <View style={commonStyles.container}>
            <Text style={{ color: '#000', fontWeight: 'bold', fontSize: 13, marginBottom: 5 }}>Nombre del evento</Text>
            <TextInput
                style={commonStyles.input}
                placeholder="Nombre del evento"
                value={form.nombre}
                onChangeText={(text) => updateForm('nombre', text)}
                placeholderTextColor="#999"
            />
            <CustomDropdown
                label="Tipo de evento"
                value={form.tipo}
                options={EVENT_TYPES}
                onValueChange={(value) => updateForm('tipo', value)}
                placeholder="Selecciona el tipo de evento"
            />
            <Text style={{ color: '#000', fontWeight: 'bold', fontSize: 13, marginBottom: 5 }}>Descripción</Text>
            <TextInput
                style={[commonStyles.input, commonStyles.textArea]}
                placeholder="Descripción"
                value={form.descripcion}
                onChangeText={(text) => updateForm('descripcion', text)}
                multiline
                numberOfLines={Platform.OS === 'ios' ? undefined : 3}
                placeholderTextColor="#999"
            />
            <Text style={{ color: '#000', fontWeight: 'bold', fontSize: 13, marginBottom: 5 }}>Cantidad de invitados</Text>
            <TextInput
                style={commonStyles.input}
                placeholder="Número de invitados"
                keyboardType="numeric"
                value={form.cantidadInvitados}
                onChangeText={(text) => updateForm('cantidadInvitados', text)}
                placeholderTextColor="#999"
            />
        </View>
    );
};

export default EventInfoForm;