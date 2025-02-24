// components/CustomDropdown.tsx
import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Modal,
    ScrollView,
    StyleSheet,
    Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface DropdownOption {
    label: string;
    value: string;
}

interface CustomDropdownProps {
    value: string;
    disabled?: boolean;
    onValueChange: (value: string) => void;
    options: DropdownOption[];
    placeholder?: string;
    label: string;
}

const CustomDropdown: React.FC<CustomDropdownProps> = ({
    value,
    onValueChange,
    options,
    placeholder = 'Seleccionar',
    label
}) => {
    const [isVisible, setIsVisible] = useState(false);
    const selectedOption = options.find(option => option.value === value);

    const handleSelect = (option: DropdownOption) => {
        onValueChange(option.value);
        setIsVisible(false);
    };

    return (
        <View style={styles.container}>
            <Text style={styles.label}>{label}</Text>

            <TouchableOpacity
                style={styles.dropdownButton}
                onPress={() => setIsVisible(true)}
            >
                <Text style={[
                    styles.selectedText,
                    !selectedOption && styles.placeholderText
                ]}>
                    {selectedOption ? selectedOption.label : placeholder}
                </Text>
                <Ionicons
                    name="chevron-down"
                    size={20}
                    color="#666"
                    style={styles.icon}
                />
            </TouchableOpacity>

            <Modal
                visible={isVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setIsVisible(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setIsVisible(false)}
                >
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{label}</Text>
                            <TouchableOpacity
                                onPress={() => setIsVisible(false)}
                                style={styles.closeButton}
                            >
                                <Ionicons name="close" size={24} color="#666" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.optionsList}>
                            {options.map((option) => (
                                <TouchableOpacity
                                    key={option.value}
                                    style={[
                                        styles.optionItem,
                                        option.value === value && styles.selectedOption
                                    ]}
                                    onPress={() => handleSelect(option)}
                                >
                                    <Text style={[
                                        styles.optionText,
                                        option.value === value && styles.selectedOptionText
                                    ]}>
                                        {option.label}
                                    </Text>
                                    {option.value === value && (
                                        <Ionicons
                                            name="checkmark"
                                            size={20}
                                            color="#2196F3"
                                        />
                                    )}
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </TouchableOpacity>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        marginBottom: 16,
    },
    label: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 8,
        color: '#333',
        alignSelf: 'flex-start',
    },
    dropdownButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#ffffff',
        paddingHorizontal: 15,
        height: 50,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: 'rgb(71, 25, 82)',
        width: '100%',
    },
    selectedText: {
        fontSize: 16,
        color: '#333',
        flex: 1,
    },
    placeholderText: {
        color: '#666',
    },
    icon: {
        marginLeft: 8,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: 'white',
        borderRadius: 12,
        width: '100%',
        maxHeight: '80%',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.25,
                shadowRadius: 4,
            },
            android: {
                elevation: 5,
            },
        }),
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    closeButton: {
        padding: 4,
    },
    optionsList: {
        maxHeight: 300,
    },
    optionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    selectedOption: {
        backgroundColor: '#f0f9ff',
    },
    optionText: {
        fontSize: 16,
        color: '#333',
    },
    selectedOptionText: {
        color: '#2196F3',
        fontWeight: 'bold',
    },
});

export default CustomDropdown;