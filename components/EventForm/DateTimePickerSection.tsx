// components/DateTimePickerSection.tsx
import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, Platform, StyleSheet } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { EventForm } from './types';

interface DateTimePickerSectionProps {
    form: any;
    updateForm: (field: keyof EventForm, value: any) => void;
}

const DateTimePickerSection: React.FC<DateTimePickerSectionProps> = ({ form, updateForm }) => {
    const [showStartDatePicker, setShowStartDatePicker] = useState(false);
    const [showEndDatePicker, setShowEndDatePicker] = useState(false);

    const handleStartDateChange = useCallback(
        (event: any, selectedDate?: Date) => {
            setShowStartDatePicker(false);
            if (selectedDate) {
                updateForm('fechaInicio', selectedDate);
                if (selectedDate > form.fechaFin) {
                    updateForm('fechaFin', selectedDate);
                }
            }
        },
        [updateForm, form.fechaFin]
    );

    const handleEndDateChange = useCallback(
        (event: any, selectedDate?: Date) => {
            setShowEndDatePicker(false);
            if (selectedDate) {
                updateForm('fechaFin', selectedDate);
            }
        },
        [updateForm]
    );

    return (
        <View style={styles.container}>
            <Text style={styles.cardTitle}>Detalles del Horario</Text>
            <TouchableOpacity style={styles.dateButton} onPress={() => setShowStartDatePicker(true)}>
                <Text style={styles.dateButtonLabel}>Fecha de inicio</Text>
                <Text style={styles.dateButtonText}>
                    {form.fechaInicio.toLocaleDateString()}{' '}
                    {form.fechaInicio.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
            </TouchableOpacity>
            {showStartDatePicker && (
                <DateTimePicker
                    value={form.fechaInicio}
                    mode="datetime"
                    display="default"
                    onChange={handleStartDateChange}
                    minimumDate={new Date()}
                />
            )}
            <TouchableOpacity style={styles.dateButton} onPress={() => setShowEndDatePicker(true)}>
                <Text style={styles.dateButtonLabel}>Fecha de finalización</Text>
                <Text style={styles.dateButtonText}>
                    {form.fechaFin.toLocaleDateString()}{' '}
                    {form.fechaFin.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
            </TouchableOpacity>
            {showEndDatePicker && (
                <DateTimePicker
                    value={form.fechaFin}
                    mode="datetime"
                    display="default"
                    onChange={handleEndDateChange}
                    minimumDate={form.fechaInicio}
                />
            )}
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
    dateButton: {
        width: '100%',
        height: 50,
        backgroundColor: '#ffffff',
        borderRadius: 10,
        paddingHorizontal: 15,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: 'rgb(71, 25, 82)',
        justifyContent: 'center',
    },
    dateButtonLabel: { fontSize: 12, color: '#666', marginBottom: 2 },
    dateButtonText: { fontSize: 16, color: '#333' },
});

export default DateTimePickerSection;
