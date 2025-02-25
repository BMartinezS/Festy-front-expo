import React, { useState, useCallback, useRef } from 'react';
import {
    View,
    TextInput,
    TouchableOpacity,
    Text,
    ActivityIndicator,
    ScrollView,
    StatusBar,
    Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { API_URL } from '@/constants';
import { EventForm } from './types';
import { commonStyles, colors, typography, spacing } from '@/styles/eventForm';
import { Product } from '@/app/event/create';

interface ProductSearchSectionProps {
    form: any;
    updateForm: (field: keyof EventForm, value: any) => void;
    setError: (msg: string) => void;
}

interface ProductInstance {
    instanceId: string;
    product: Product;
}

const ProductSearchSection: React.FC<ProductSearchSectionProps> = ({ form, updateForm, setError }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isSearchVisible, setIsSearchVisible] = useState(false);
    const searchInputRef = useRef<TextInput>(null);

    const totalAmount = form.productos.reduce((sum: number, item: ProductInstance) =>
        sum + (item.product.price * item.product.quantity), 0);

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
        product.quantity = 1;
        const newInstance: ProductInstance = {
            instanceId: `${product.externalId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            product: product,
        };

        updateForm('productos', [...form.productos, newInstance]);
        setSearchResults([]);
        setSearchQuery('');
    };

    const handleRemoveProduct = (instanceId: string) => {
        updateForm('productos', form.productos.filter((p: ProductInstance) => p.instanceId !== instanceId));
    };

    const handleUpdateQuantity = (instanceId: string, delta: number) => {
        const updatedProducts = form.productos.map((item: ProductInstance) => {
            if (item.instanceId === instanceId) {
                item.product.quantity = Math.max(1, item.product.quantity + delta); // Mínimo 1
                return { ...item };
            }
            return item;
        });
        updateForm('productos', updatedProducts);
    };

    const renderSelectedProduct = (item: ProductInstance) => (
        <View
            key={item.instanceId}
            style={{
                flexDirection: 'row',
                backgroundColor: colors.white,
                padding: spacing.md,
                borderRadius: spacing.md,
                marginBottom: spacing.sm,
                alignItems: 'center',
                borderWidth: 1,
                borderColor: colors.primary,
            }}
        >
            <Image
                source={{ uri: item.product.imageUrl }}
                style={{ width: 40, height: 40, borderRadius: 5 }}
                contentFit="cover"
            />
            <View style={{ flex: 1, marginLeft: spacing.md }}>
                <Text style={{ ...typography.body, fontWeight: '500' }}>{item.product.name}</Text>
                <Text style={{ ...typography.body, color: colors.primaryDark, fontWeight: '600' }}>
                    <Text>$</Text>
                    {(item.product.price * item.product.quantity).toLocaleString()}
                </Text>
            </View>
            <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginRight: spacing.md,
                backgroundColor: colors.primaryLight,
                borderRadius: spacing.sm,
                padding: spacing.xs,
            }}>
                <TouchableOpacity
                    onPress={() => handleUpdateQuantity(item.instanceId, -1)}
                    style={{
                        width: 24,
                        height: 24,
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}
                >
                    <Text style={{ ...typography.body, color: colors.primary }}>-</Text>
                </TouchableOpacity>
                <Text style={{
                    ...typography.body,
                    marginHorizontal: spacing.sm,
                    minWidth: 20,
                    textAlign: 'center'
                }}>
                    {item.product.quantity}
                </Text>
                <TouchableOpacity
                    onPress={() => handleUpdateQuantity(item.instanceId, 1)}
                    style={{
                        width: 24,
                        height: 24,
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}
                >
                    <Text style={{ ...typography.body, color: colors.primary }}>+</Text>
                </TouchableOpacity>
            </View>
            <TouchableOpacity
                onPress={() => handleRemoveProduct(item.instanceId)}
                style={{
                    width: 24,
                    height: 24,
                    borderRadius: 12,
                    backgroundColor: colors.error,
                    justifyContent: 'center',
                    alignItems: 'center',
                }}
            >
                <Text style={{ color: colors.white, fontSize: 16, fontWeight: 'bold' }}>×</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <SafeAreaView style={{
            flex: 1,
            paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0
        }}>
            <ScrollView
                style={commonStyles.container}
                contentContainerStyle={{ paddingBottom: 200 }}
                showsVerticalScrollIndicator={true}
            >
                {/* Sección de Productos Seleccionados */}
                <View style={{
                    backgroundColor: colors.primaryLight,
                    borderRadius: spacing.md,
                    padding: spacing.md,
                    marginBottom: spacing.lg,
                }}>
                    <View style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: spacing.md,
                    }}>
                        <Text style={{ ...typography.subtitle }}>
                            <Text>Productos Seleccionados (</Text>
                            <Text>{form.productos.reduce((sum: number, item: ProductInstance) => sum + item.product.quantity, 0)}</Text>
                            <Text>)</Text>
                        </Text>
                        <Text style={{ ...typography.subtitle }}>
                            <Text>Total: $</Text>
                            <Text>{totalAmount.toLocaleString()}</Text>
                        </Text>
                    </View>

                    {form.productos.map((item: ProductInstance) => renderSelectedProduct(item))}

                    {form.productos.length === 0 && (
                        <Text style={{ ...typography.body, textAlign: 'center', color: colors.gray[600] }}>
                            No hay productos seleccionados
                        </Text>
                    )}
                </View>

                {/* Resto del componente igual... */}
                {/* Botón de búsqueda y sección de búsqueda permanecen sin cambios */}
                <TouchableOpacity
                    style={[commonStyles.button, { marginBottom: isSearchVisible ? spacing.md : 0 }]}
                    onPress={() => {
                        setIsSearchVisible(!isSearchVisible);
                        if (!isSearchVisible) {
                            setTimeout(() => {
                                searchInputRef.current?.focus();
                            }, 100);
                        }
                    }}
                >
                    <Text style={commonStyles.buttonText}>
                        {isSearchVisible ? 'Ocultar búsqueda' : 'Agregar producto'}
                    </Text>
                </TouchableOpacity>

                {isSearchVisible && (
                    <View>
                        <View style={{ flexDirection: 'row', gap: spacing.md }}>
                            <TextInput
                                ref={searchInputRef}
                                style={[commonStyles.input, { flex: 1, marginBottom: 0 }]}
                                placeholder="Buscar productos..."
                                placeholderTextColor={colors.gray[400]}
                                value={searchQuery}
                                onChangeText={handleSearchChange}
                            />
                            <TouchableOpacity
                                style={[
                                    commonStyles.button,
                                    { width: 100, marginBottom: 0 },
                                    isSearching && commonStyles.buttonDisabled
                                ]}
                                onPress={handleSearch}
                                disabled={isSearching}
                            >
                                <Text style={commonStyles.buttonText}>
                                    {isSearching ? '...' : 'Buscar'}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {isSearching && (
                            <ActivityIndicator
                                color={colors.primaryDark}
                                style={{ marginVertical: spacing.md }}
                            />
                        )}

                        {searchResults.length > 0 && (
                            <View style={{
                                marginTop: spacing.md,
                                maxHeight: 300,
                                borderRadius: spacing.md,
                                borderWidth: 1,
                                borderColor: colors.primaryBorder,
                            }}>
                                <ScrollView>
                                    {searchResults.map((item) => (
                                        <TouchableOpacity
                                            key={item.externalId}
                                            style={{
                                                flexDirection: 'row',
                                                padding: spacing.md,
                                                borderBottomWidth: 1,
                                                borderBottomColor: colors.gray[300],
                                                backgroundColor: colors.white,
                                                alignItems: 'center',
                                            }}
                                            onPress={() => handleAddProduct(item)}
                                        >
                                            <Image
                                                source={{ uri: item.imageUrl }}
                                                style={{ width: 50, height: 50, borderRadius: 5 }}
                                                contentFit="cover"
                                            />
                                            <View style={{ flex: 1, marginLeft: spacing.md }}>
                                                <Text style={{ ...typography.subtitle }}>{item.name}</Text>
                                                <Text style={{ ...typography.body }}>{item.brand}</Text>
                                                <Text style={{ ...typography.subtitle }}>
                                                    <Text>$</Text>
                                                    {item.price.toLocaleString()}
                                                </Text>
                                            </View>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>
                        )}
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
};

export default ProductSearchSection;