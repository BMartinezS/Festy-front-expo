import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
    View,
    TextInput,
    TouchableOpacity,
    Text,
    ActivityIndicator,
    ScrollView,
    StatusBar,
    Platform,
    Animated,
    Dimensions,
    StyleSheet
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { API_URL } from '@/constants';
import { EventForm } from './types';
import { Product } from '@/types/event_types';

const { width } = Dimensions.get('window');

interface ProductSearchSectionProps {
    form: any;
    updateForm: (field: keyof EventForm, value: any) => void;
    setError: (msg: string) => void;
    isEditing?: boolean;
}

interface ProductInstance {
    instanceId: string;
    product: Product;
}

const ProductSearchSection: React.FC<ProductSearchSectionProps> = ({
    form,
    updateForm,
    setError,
    isEditing = false
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isSearchVisible, setIsSearchVisible] = useState(false);
    const searchInputRef = useRef<TextInput>(null);
    const [initialLoadComplete, setInitialLoadComplete] = useState(false);
    const [productosInternos, setProductosInternos] = useState<ProductInstance[]>([]);
    const [fadeAnim] = useState(new Animated.Value(0));
    const [slideAnim] = useState(new Animated.Value(20));

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 600,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 500,
                useNativeDriver: true,
            })
        ]).start();
    }, []);

    const hacerItemValido = (item: any) => {
        if (!item || typeof item !== 'object') {
            return null;
        }
        const { externalId, name, brand, price, imageUrl } = item;
        return {
            externalId: externalId || `product-${Date.now()}`,
            name: name || 'Producto sin nombre',
            brand: brand || 'Sin marca',
            price: typeof price === 'number' ? price : 0,
            imageUrl: imageUrl || 'https://via.placeholder.com/150',
        };
    };

    const handleUpdateQuantity = (instanceId: string, delta: number) => {
        if (!Array.isArray(productosInternos)) {
            console.error('productosInternos no es un array:', productosInternos);
            return;
        }

        const updatedProducts = [...productosInternos];
        const productIndex = updatedProducts.findIndex(item =>
            item && item.instanceId === instanceId
        );

        if (productIndex === -1) {
            console.error(`No se encontró producto con instanceId: ${instanceId}`);
            return;
        }

        const currentProduct = updatedProducts[productIndex];

        if (!currentProduct || !currentProduct.product) {
            console.error('Estructura de producto inválida:', currentProduct);
            return;
        }

        const currentQuantity = typeof currentProduct.product.quantity === 'number'
            ? currentProduct.product.quantity
            : 1;
        const newQuantity = Math.max(1, currentQuantity + delta);

        const updatedProduct = {
            ...currentProduct,
            product: {
                ...currentProduct.product,
                quantity: newQuantity
            }
        };

        updatedProducts[productIndex] = updatedProduct;
        syncFormWithInternalState(updatedProducts);
    };

    const normalizarProductos = (productos: any[]): ProductInstance[] => {
        if (!Array.isArray(productos)) return [];

        const assignedIds = new Set<string>();

        return productos.map(item => {
            if (item && item.instanceId && item.product) {
                let instanceId = item.instanceId;

                if (assignedIds.has(instanceId)) {
                    const externalId = item.product.externalId || `product-${Date.now()}`;
                    instanceId = `${externalId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                }

                assignedIds.add(instanceId);

                return {
                    ...item,
                    instanceId,
                    product: {
                        ...item.product,
                        quantity: typeof item.product.quantity === 'number' ? item.product.quantity : 1
                    }
                };
            }

            if (item && typeof item === 'object') {
                const externalId = item.externalId || `product-${Date.now()}`;
                const instanceId = `${externalId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

                assignedIds.add(instanceId);

                return {
                    instanceId,
                    product: {
                        ...item,
                        quantity: typeof item.quantity === 'number' ? item.quantity : 1
                    }
                };
            }

            return null;
        }).filter(Boolean) as ProductInstance[];
    };

    const desnormalizarProductos = (productosInstancia: ProductInstance[]): any[] => {
        if (!Array.isArray(productosInstancia)) return [];

        return productosInstancia.map(item => {
            if (item && item.product) {
                return item.product;
            }
            return null;
        }).filter(Boolean);
    };

    useEffect(() => {
        if (!initialLoadComplete) return;

        if (Array.isArray(form.productos) && form.productos.length > 0) {
            const primerElemento = form.productos[0];
            const esFormatoPlano = primerElemento && !primerElemento.instanceId && (primerElemento.externalId || primerElemento.name);

            if (esFormatoPlano || productosInternos.length !== form.productos.length) {
                console.log('Detectado cambio externo en form.productos, sincronizando');
                const productosNormalizados = normalizarProductos(form.productos);

                setTimeout(() => {
                    setProductosInternos(productosNormalizados);
                }, 0);
            }
        }
    }, [form.productos, initialLoadComplete]);

    useEffect(() => {
        if (!initialLoadComplete) {
            if (form.productos && Array.isArray(form.productos) && form.productos.length > 0) {
                console.log('Inicializando productos en el primer renderizado');
                const productosNormalizados = normalizarProductos(form.productos);
                setProductosInternos(productosNormalizados);
            }
            setInitialLoadComplete(true);
        }
    }, []);

    const safeCalculatePrice = (item: any): number => {
        if (!item || !item.product) return 0;

        const price = typeof item.product.price === 'number' ? item.product.price : 0;
        const quantity = typeof item.product.quantity === 'number' ? item.product.quantity : 0;

        return price * quantity;
    };

    const syncFormWithInternalState = (internalProducts: ProductInstance[]) => {
        const validProducts = internalProducts.filter(item => item && item.product);
        setProductosInternos(validProducts);

        const productosPlanos = desnormalizarProductos(validProducts);
        updateForm('productos', productosPlanos);
    };

    const totalAmount = Array.isArray(productosInternos)
        ? productosInternos.reduce((sum: number, item: ProductInstance) => sum + safeCalculatePrice(item), 0)
        : 0;

    const totalItems = Array.isArray(productosInternos)
        ? productosInternos.reduce((sum: number, item: ProductInstance) => {
            if (item && item.product && typeof item.product.quantity === 'number') {
                return sum + item.product.quantity;
            }
            return sum;
        }, 0)
        : 0;

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
        const validProduct = hacerItemValido(product);

        if (!validProduct) {
            console.error('Producto inválido:', product);
            setError('No se pudo agregar el producto: datos inválidos');
            return;
        }

        const newInstance: ProductInstance = {
            instanceId: `${validProduct.externalId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            product: {
                ...validProduct,
                quantity: product.quantity || 1
            }
        };

        const nuevosProductosInternos = [...productosInternos, newInstance];
        syncFormWithInternalState(nuevosProductosInternos);

        setSearchResults([]);
        setSearchQuery('');
        setIsSearchVisible(false);
    };

    const handleRemoveProduct = (instanceId: string) => {
        const nuevosProductosInternos = productosInternos.filter(p => p.instanceId !== instanceId);
        syncFormWithInternalState(nuevosProductosInternos);
    };

    const toggleSearch = () => {
        setIsSearchVisible(!isSearchVisible);
        if (!isSearchVisible) {
            setTimeout(() => {
                searchInputRef.current?.focus();
            }, 100);
        } else {
            setSearchResults([]);
            setSearchQuery('');
        }
    };

    const renderSelectedProduct = (item: any) => {
        let validItem = item;

        if (!item || !item.instanceId || !item.product) {
            console.warn('Intentando reparar producto inválido:', item);

            if (item && typeof item === 'object') {
                if (!item.instanceId && !item.product) {
                    const validProduct = hacerItemValido(item);
                    if (validProduct) {
                        validItem = {
                            instanceId: `${validProduct.externalId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                            product: { ...validProduct, quantity: item.quantity || 1 }
                        };
                    } else {
                        return null;
                    }
                }
                else if (item.instanceId && !item.product) {
                    validItem = {
                        ...item,
                        product: {
                            name: 'Producto recuperado',
                            price: 0,
                            quantity: 1,
                            externalId: `recovered-${Date.now()}`,
                            imageUrl: 'https://via.placeholder.com/40'
                        }
                    };
                }
                else if (!item.instanceId && item.product) {
                    const validProduct = hacerItemValido(item.product);
                    validItem = {
                        instanceId: `${validProduct?.externalId || 'unknown'}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                        product: validProduct || {
                            name: 'Producto recuperado',
                            price: 0,
                            quantity: 1,
                            externalId: `recovered-${Date.now()}`,
                            imageUrl: 'https://via.placeholder.com/40'
                        }
                    };
                }
            } else {
                return null;
            }
        }

        if (!validItem || !validItem.instanceId || !validItem.product) {
            console.error('No se pudo reparar el producto inválido:', item);
            return null;
        }

        const {
            imageUrl = 'https://via.placeholder.com/40',
            name = 'Producto sin nombre',
            brand = 'Sin marca',
            price = 0,
            quantity = 1
        } = validItem.product || {};

        const totalPrice = typeof price === 'number' && typeof quantity === 'number'
            ? price * quantity
            : 0;

        return (
            <Animated.View
                key={validItem.instanceId}
                style={[
                    styles.productCard,
                    {
                        opacity: fadeAnim,
                        transform: [{ translateY: slideAnim }]
                    }
                ]}
            >
                <View style={styles.productImageContainer}>
                    <Image
                        source={{ uri: imageUrl }}
                        style={styles.productImage}
                        contentFit="cover"
                    />
                </View>

                <View style={styles.productInfo}>
                    <Text style={styles.productName} numberOfLines={1}>{name}</Text>
                    <Text style={styles.productBrand} numberOfLines={1}>{brand}</Text>
                    <View style={styles.priceContainer}>
                        <Text style={styles.productPrice}>
                            ${totalPrice.toLocaleString()}
                        </Text>
                        <Text style={styles.unitPrice}>
                            (${price.toLocaleString()} c/u)
                        </Text>
                    </View>
                </View>

                <View style={styles.quantityControls}>
                    <TouchableOpacity
                        onPress={() => handleUpdateQuantity(validItem.instanceId, -1)}
                        style={styles.quantityButton}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="remove" size={16} color="#8B5CF6" />
                    </TouchableOpacity>

                    <View style={styles.quantityDisplay}>
                        <Text style={styles.quantityText}>{quantity}</Text>
                    </View>

                    <TouchableOpacity
                        onPress={() => handleUpdateQuantity(validItem.instanceId, 1)}
                        style={styles.quantityButton}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="add" size={16} color="#8B5CF6" />
                    </TouchableOpacity>
                </View>

                <TouchableOpacity
                    onPress={() => handleRemoveProduct(validItem.instanceId)}
                    style={styles.removeButton}
                    activeOpacity={0.7}
                >
                    <Ionicons name="trash-outline" size={16} color="#FFFFFF" />
                </TouchableOpacity>
            </Animated.View>
        );
    };

    const renderSearchResult = (item: any) => (
        <TouchableOpacity
            key={item.externalId}
            style={styles.searchResultItem}
            onPress={() => handleAddProduct(item)}
            activeOpacity={0.9}
        >
            <Image
                source={{ uri: item.imageUrl }}
                style={styles.searchResultImage}
                contentFit="cover"
            />
            <View style={styles.searchResultInfo}>
                <Text style={styles.searchResultName} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.searchResultBrand} numberOfLines={1}>{item.brand}</Text>
                <Text style={styles.searchResultPrice}>
                    ${item.price.toLocaleString()}
                </Text>
            </View>
            <View style={styles.addIcon}>
                <Ionicons name="add-circle" size={24} color="#8B5CF6" />
            </View>
        </TouchableOpacity>
    );

    return (
        <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
            {/* Summary header */}
            <View style={styles.summaryCard}>
                <LinearGradient
                    colors={['#8B5CF6', '#7C3AED']}
                    style={styles.summaryGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                >
                    <View style={styles.summaryContent}>
                        <View style={styles.summaryItem}>
                            <Ionicons name="bag-outline" size={20} color="#FFFFFF" />
                            <Text style={styles.summaryText}>
                                {totalItems} productos
                            </Text>
                        </View>
                        <View style={styles.summaryDivider} />
                        <View style={styles.summaryItem}>
                            <Ionicons name="cash-outline" size={20} color="#FFFFFF" />
                            <Text style={styles.summaryText}>
                                ${totalAmount.toLocaleString()}
                            </Text>
                        </View>
                    </View>
                </LinearGradient>
            </View>

            {/* Selected products */}
            {productosInternos && Array.isArray(productosInternos) && productosInternos.length > 0 ? (
                <View style={styles.selectedProductsContainer}>
                    <Text style={styles.sectionTitle}>Productos seleccionados</Text>
                    <View style={styles.productsList}>
                        {productosInternos.map((item: any, index: number) => {
                            const renderedProduct = renderSelectedProduct(item);
                            return renderedProduct;
                        })}
                    </View>
                </View>
            ) : (
                <View style={styles.emptyState}>
                    <View style={styles.emptyIconContainer}>
                        <Ionicons name="bag-outline" size={48} color="#C4B5FD" />
                    </View>
                    <Text style={styles.emptyTitle}>Sin productos</Text>
                    <Text style={styles.emptySubtitle}>
                        Agrega productos para tu evento
                    </Text>
                </View>
            )}

            {/* Add product button */}
            <TouchableOpacity
                style={styles.addButton}
                onPress={toggleSearch}
                activeOpacity={0.9}
            >
                <LinearGradient
                    colors={['#8B5CF6', '#7C3AED']}
                    style={styles.addButtonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                >
                    <Ionicons
                        name={isSearchVisible ? "close" : "add"}
                        size={20}
                        color="#FFFFFF"
                    />
                    <Text style={styles.addButtonText}>
                        {isSearchVisible ? 'Cerrar búsqueda' : 'Agregar producto'}
                    </Text>
                </LinearGradient>
            </TouchableOpacity>

            {/* Search section */}
            {isSearchVisible && (
                <Animated.View
                    style={[
                        styles.searchContainer,
                        {
                            opacity: fadeAnim,
                            transform: [{ translateY: slideAnim }]
                        }
                    ]}
                >
                    <View style={styles.searchHeader}>
                        <Text style={styles.searchTitle}>Buscar productos</Text>
                    </View>

                    <View style={styles.searchInputContainer}>
                        <View style={styles.searchInputWrapper}>
                            <Ionicons name="search-outline" size={20} color="#6B7280" />
                            <TextInput
                                ref={searchInputRef}
                                style={styles.searchInput}
                                placeholder="Buscar productos..."
                                placeholderTextColor="#9CA3AF"
                                value={searchQuery}
                                onChangeText={handleSearchChange}
                                onSubmitEditing={handleSearch}
                            />
                        </View>
                        <TouchableOpacity
                            style={[
                                styles.searchButton,
                                isSearching && styles.searchButtonDisabled
                            ]}
                            onPress={handleSearch}
                            disabled={isSearching}
                            activeOpacity={0.8}
                        >
                            {isSearching ? (
                                <ActivityIndicator size="small" color="#FFFFFF" />
                            ) : (
                                <Ionicons name="search" size={16} color="#FFFFFF" />
                            )}
                        </TouchableOpacity>
                    </View>

                    {isSearching && (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color="#8B5CF6" />
                            <Text style={styles.loadingText}>Buscando productos...</Text>
                        </View>
                    )}

                    {searchResults.length > 0 && (
                        <View style={styles.searchResults}>
                            <Text style={styles.resultsTitle}>
                                {searchResults.length} resultados encontrados
                            </Text>
                            <View style={styles.resultsList}>
                                {searchResults.map((item, index) => renderSearchResult(item))}
                            </View>
                        </View>
                    )}

                    {!isSearching && searchQuery.length >= 3 && searchResults.length === 0 && (
                        <View style={styles.noResults}>
                            <Ionicons name="search-outline" size={32} color="#C4B5FD" />
                            <Text style={styles.noResultsText}>
                                No se encontraron productos
                            </Text>
                            <Text style={styles.noResultsSubtext}>
                                Intenta con otros términos de búsqueda
                            </Text>
                        </View>
                    )}
                </Animated.View>
            )}
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    summaryCard: {
        marginBottom: 20,
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#8B5CF6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 6,
    },
    summaryGradient: {
        padding: 20,
    },
    summaryContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    summaryItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    summaryText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
    summaryDivider: {
        width: 1,
        height: 20,
        backgroundColor: 'rgba(255,255,255,0.3)',
        marginHorizontal: 20,
    },
    selectedProductsContainer: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 16,
    },
    productsList: {
        // Removemos maxHeight para que no corte la vista
    },
    productCard: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    productImageContainer: {
        width: 48,
        height: 48,
        borderRadius: 8,
        overflow: 'hidden',
        backgroundColor: '#F9FAFB',
    },
    productImage: {
        width: '100%',
        height: '100%',
    },
    productInfo: {
        flex: 1,
        marginLeft: 12,
    },
    productName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 2,
    },
    productBrand: {
        fontSize: 12,
        color: '#6B7280',
        marginBottom: 4,
    },
    priceContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    productPrice: {
        fontSize: 14,
        fontWeight: '700',
        color: '#8B5CF6',
    },
    unitPrice: {
        fontSize: 11,
        color: '#9CA3AF',
    },
    quantityControls: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        borderRadius: 8,
        padding: 4,
        marginRight: 12,
    },
    quantityButton: {
        width: 28,
        height: 28,
        borderRadius: 6,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    quantityDisplay: {
        minWidth: 32,
        alignItems: 'center',
        justifyContent: 'center',
    },
    quantityText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#111827',
    },
    removeButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#EF4444',
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        marginBottom: 20,
        borderWidth: 2,
        borderColor: '#F3F4F6',
        borderStyle: 'dashed',
    },
    emptyIconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#F9FAFB',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#6B7280',
        marginBottom: 4,
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#9CA3AF',
        textAlign: 'center',
    },
    addButton: {
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 20,
        shadowColor: '#8B5CF6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 6,
    },
    addButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        gap: 8,
    },
    addButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
    searchContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 6,
    },
    searchHeader: {
        marginBottom: 16,
    },
    searchTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
    },
    searchInputContainer: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 16,
    },
    searchInputWrapper: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        borderWidth: 2,
        borderColor: '#F3F4F6',
        borderRadius: 12,
        paddingHorizontal: 16,
        height: 48,
        gap: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: '#111827',
    },
    searchButton: {
        width: 48,
        height: 48,
        backgroundColor: '#8B5CF6',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    searchButtonDisabled: {
        opacity: 0.7,
    },
    loadingContainer: {
        alignItems: 'center',
        paddingVertical: 20,
        gap: 12,
    },
    loadingText: {
        color: '#8B5CF6',
        fontSize: 14,
        fontWeight: '500',
    },
    searchResults: {
        // Removemos maxHeight para que no corte la vista
    },
    resultsTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6B7280',
        marginBottom: 12,
    },
    resultsList: {
        // Removemos flex para que no cause problemas de renderizado
    },
    searchResultItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    searchResultImage: {
        width: 40,
        height: 40,
        borderRadius: 8,
        backgroundColor: '#F9FAFB',
    },
    searchResultInfo: {
        flex: 1,
        marginLeft: 12,
    },
    searchResultName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 2,
    },
    searchResultBrand: {
        fontSize: 12,
        color: '#6B7280',
        marginBottom: 4,
    },
    searchResultPrice: {
        fontSize: 14,
        fontWeight: '700',
        color: '#8B5CF6',
    },
    addIcon: {
        marginLeft: 8,
    },
    noResults: {
        alignItems: 'center',
        paddingVertical: 32,
        gap: 8,
    },
    noResultsText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#6B7280',
    },
    noResultsSubtext: {
        fontSize: 14,
        color: '#9CA3AF',
        textAlign: 'center',
    },
});

export default ProductSearchSection;