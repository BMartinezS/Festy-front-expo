// components/ImageSelector.tsx
import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';

interface ImageSelectorProps {
    image: string;
    updateImage: (uri: string) => void;
    setError: (msg: string) => void;
}

const ImageSelector: React.FC<ImageSelectorProps> = ({ image, updateImage, setError }) => {
    const handleSelectImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            setError('Se necesitan permisos para acceder a la galería');
            return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [16, 9],
            quality: 0.8,
        });
        if (!result.canceled) {
            updateImage(result.assets[0].uri);
        }
    };

    return (
        <View style={styles.imageContainer}>
            <TouchableOpacity style={styles.imageSelector} onPress={handleSelectImage}>
                {image ? (
                    <Image source={{ uri: image }} style={styles.eventImage} contentFit="cover" />
                ) : (
                    <View style={styles.imagePlaceholder}>
                        <Text style={styles.imagePlaceholderText}>
                            Toca para agregar una imagen del evento
                        </Text>
                    </View>
                )}
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    imageContainer: { marginVertical: 20 },
    imageSelector: {
        width: '100%',
        height: 200,
        borderRadius: 10,
        overflow: 'hidden',
        backgroundColor: '#f0f0f0',
        borderWidth: 1,
        borderColor: 'rgb(71, 25, 82)',
    },
    eventImage: { width: '100%', height: '100%' },
    imagePlaceholder: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: 'rgba(71, 25, 82, 0.05)',
    },
    imagePlaceholderText: {
        color: 'rgb(71, 25, 82)',
        textAlign: 'center',
        fontSize: 16,
    },
});

export default ImageSelector;
