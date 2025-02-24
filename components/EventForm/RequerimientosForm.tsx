import React from 'react';
import { View, TextInput, Text, StyleSheet, Platform } from 'react-native';
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
            <Text style={{ color: '#000', fontWeight: 'bold', fontSize: 13, marginBottom: 5 }}>Código de vestimenta</Text>

            <TextInput
                style={styles.input}
                placeholder="Código de vestimenta"
                value={requerimientos.codigoVestimenta}
                onChangeText={(text) => handleChange('codigoVestimenta', text)}
                placeholderTextColor="#999"
            />
            <Text style={{ color: '#000', fontWeight: 'bold', fontSize: 13, marginBottom: 5 }}>Restricciones alimentarias</Text>
            <TextInput
                style={[
                    styles.input,
                    styles.textArea,
                    Platform.select({
                        ios: {
                            paddingTop: 15,
                            paddingBottom: 15,
                        },
                        android: {
                            textAlignVertical: 'top',
                            paddingTop: 10,
                        },
                    }),
                ]}
                placeholder="Restricciones alimentarias"
                value={requerimientos.alimentacion}
                onChangeText={(text) => handleChange('alimentacion', text)}
                multiline
                numberOfLines={Platform.OS === 'ios' ? undefined : 3}
                placeholderTextColor="#999"
            />
            <Text style={{ color: '#000', fontWeight: 'bold', fontSize: 13, marginBottom: 5 }}>Edad mínima</Text>
            <TextInput
                style={styles.input}
                placeholder="Edad mínima"
                value={requerimientos.edadMinima}
                onChangeText={(text) => handleChange('edadMinima', text)}
                keyboardType="numeric"
                placeholderTextColor="#999"
            />

            <Text style={{ color: '#000', fontWeight: 'bold', fontSize: 13, marginBottom: 5 }}>Qué deben traer los invitados</Text>
            <TextInput
                style={[
                    styles.input,
                    styles.textArea,
                    Platform.select({
                        ios: {
                            paddingTop: 15,
                            paddingBottom: 15,
                        },
                        android: {
                            textAlignVertical: 'top',
                            paddingTop: 10,
                        },
                    }),
                ]}
                placeholder="Qué deben traer los invitados"
                value={requerimientos.llevar}
                onChangeText={(text) => handleChange('llevar', text)}
                multiline
                numberOfLines={Platform.OS === 'ios' ? undefined : 3}
                placeholderTextColor="#999"
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 10,
        color: '#000000',
    },
    input: {
        width: '100%',
        height: 50,
        backgroundColor: '#ffffff',
        borderRadius: 10,
        paddingHorizontal: 15,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: 'rgb(71, 25, 82)',
        color: '#000000',
    },
    textArea: {
        height: Platform.OS === 'ios' ? 100 : undefined,
        minHeight: Platform.OS === 'android' ? 100 : undefined,
    },
});

export default RequerimientosForm;