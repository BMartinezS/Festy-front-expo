// components/ProductSearchSection.tsx
import React, { useState, useCallback } from 'react';
import { View, TextInput, TouchableOpacity, Text, ActivityIndicator, StyleSheet, FlatList } from 'react-native';
import { Image } from 'expo-image';
import { API_URL } from '@/constants';
import { EventForm } from './types';

interface ProductSearchSectionProps {
    form: any;
    updateForm: (field: keyof EventForm, value: any) => void;
    setError: (msg: string) => void;
}

const ProductSearchSection: React.FC<ProductSearchSectionProps> = ({ form, updateForm, setError }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    const handleSearchChange = (text: string) => {
        setSearchQuery(text);
    };

    const handleSearch = useCallback(async () => {
        if (!searchQuery.trim() || searchQuery.length < 3) {
            setError('Ingresa al menos 3 caracteres para buscar');
            setSearchResults([]);
            return;
        }
        setError('');
        setIsSearching(true);
        try {
            const response = await fetch(`${API_URL}/products/${searchQuery}`);
            const data = await response.json();
            if (data.success) {
                setSearchResults(data.data);
            }
        } catch (error) {
            setError('Error al buscar productos');
        } finally {
            setIsSearching(false);
        }
    }, [searchQuery, setError]);

    const handleAddProduct = (product: any) => {
        updateForm('productos', [...form.productos, product]);
    };

    const handleRemoveProduct = (externalId: string) => {
        updateForm('productos', form.productos.filter((p: any) => p.externalId !== externalId));
    };

    const renderProductItem = ({ item }: { item: any }) => (
        <View style={styles.selectedProduct}>
            <Image source={{ uri: item.imageUrl }} style={styles.selectedProductImage} contentFit="cover" />
            <View style={styles.selectedProductInfo}>
                <Text style={styles.selectedProductName}>{item.name}</Text>
                <Text style={styles.selectedProductPrice}>${item.price.toLocaleString()}</Text>
            </View>
            <TouchableOpacity onPress={() => handleRemoveProduct(item.externalId)} style={styles.removeButton}>
                <Text style={styles.removeButtonText}>×</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={styles.container}>
            <TextInput
                style={styles.searchInput}
                placeholder="Buscar productos..."
                value={searchQuery}
                onChangeText={handleSearchChange}
            />
            <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
                <Text style={styles.searchButtonText}>Buscar</Text>
            </TouchableOpacity>
            {isSearching && <ActivityIndicator color="rgb(51, 18, 59)" style={styles.loader} />}
            {searchResults.length > 0 && (
                <View style={styles.searchResults}>
                    {searchResults.map((item) => (
                        <TouchableOpacity
                            key={item.externalId}
                            style={styles.searchResultItem}
                            onPress={() => handleAddProduct(item)}
                        >
                            <Image source={{ uri: item.imageUrl }} style={styles.productImage} contentFit="cover" />
                            <View style={styles.productInfo}>
                                <Text style={styles.productName}>{item.name}</Text>
                                <Text style={styles.productBrand}>{item.brand}</Text>
                                <Text style={styles.productPrice}>${item.price.toLocaleString()}</Text>
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>
            )}
            {form.productos.length > 0 && (
                <FlatList
                    data={form.productos}
                    renderItem={renderProductItem}
                    keyExtractor={(item) => item.externalId}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { paddingHorizontal: 20, marginBottom: 20 },
    searchInput: {
        height: 50,
        backgroundColor: '#ffffff',
        borderRadius: 10,
        paddingHorizontal: 15,
        borderWidth: 1,
        borderColor: 'rgb(71, 25, 82)',
        marginBottom: 15,
    },
    searchButton: {
        backgroundColor: 'rgb(51, 18, 59)',
        height: 50,
        paddingHorizontal: 20,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 15,
    },
    searchButtonText: { color: '#ffffff', fontWeight: 'bold' },
    loader: { marginVertical: 10 },
    searchResults: { marginBottom: 15 },
    searchResultItem: {
        flexDirection: 'row',
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        backgroundColor: '#fff',
        alignItems: 'center',
        marginBottom: 5,
        borderRadius: 10,
    },
    productImage: { width: 60, height: 60, borderRadius: 5 },
    productInfo: { flex: 1, marginLeft: 10 },
    productName: { fontSize: 16, fontWeight: '500' },
    productBrand: { fontSize: 14, color: '#666' },
    productPrice: { fontSize: 16, fontWeight: '600', color: 'rgb(51, 18, 59)' },
    selectedProduct: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        padding: 10,
        borderRadius: 10,
        marginBottom: 10,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgb(71, 25, 82)',
    },
    selectedProductImage: { width: 50, height: 50, borderRadius: 5 },
    selectedProductInfo: { flex: 1, marginLeft: 10 },
    selectedProductName: { fontSize: 14, fontWeight: '500' },
    selectedProductPrice: { fontSize: 14, color: 'rgb(51, 18, 59)', fontWeight: '600' },
    removeButton: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#ff4646', justifyContent: 'center', alignItems: 'center' },
    removeButtonText: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
});

export default ProductSearchSection;
