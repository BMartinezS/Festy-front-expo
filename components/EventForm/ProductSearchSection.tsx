import React, { useState, useCallback, useRef, useEffect } from 'react';
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
import { Product } from '@/types/event_types';

interface ProductSearchSectionProps {
    form: any;
    updateForm: (field: keyof EventForm, value: any) => void;
    setError: (msg: string) => void;
    isEditing?: boolean; // Añadir una prop para saber si estamos editando
}

interface ProductInstance {
    instanceId: string;
    product: Product;
}

const ProductSearchSection: React.FC<ProductSearchSectionProps> = ({
    form,
    updateForm,
    setError,
    isEditing = false // Por defecto no estamos editando
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isSearchVisible, setIsSearchVisible] = useState(false);
    const searchInputRef = useRef<TextInput>(null);
    const [initialLoadComplete, setInitialLoadComplete] = useState(false);

    // Función para validar y completar propiedades faltantes de un producto
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

    // Solución principal: modifica esta función
    const handleUpdateQuantity = (instanceId: string, delta: number) => {
        // Verificar que productosInternos sea un array
        if (!Array.isArray(productosInternos)) {
            console.error('productosInternos no es un array:', productosInternos);
            return;
        }

        // Crear una copia del array para evitar mutaciones directas
        const updatedProducts = [...productosInternos];

        // Encontrar el índice del producto que queremos actualizar
        const productIndex = updatedProducts.findIndex(item =>
            item && item.instanceId === instanceId
        );

        if (productIndex === -1) {
            console.error(`No se encontró producto con instanceId: ${instanceId}`);
            return;
        }

        // Obtener el producto actual
        const currentProduct = updatedProducts[productIndex];

        // Verificar que el producto tenga la estructura correcta
        if (!currentProduct || !currentProduct.product) {
            console.error('Estructura de producto inválida:', currentProduct);
            return;
        }

        // Obtener la cantidad actual y calcular la nueva
        const currentQuantity = typeof currentProduct.product.quantity === 'number'
            ? currentProduct.product.quantity
            : 1;
        const newQuantity = Math.max(1, currentQuantity + delta);

        // Crear un nuevo objeto para el producto actualizado (sin modificar el original)
        const updatedProduct = {
            ...currentProduct,
            product: {
                ...currentProduct.product,
                quantity: newQuantity
            }
        };

        // Reemplazar el producto en el array
        updatedProducts[productIndex] = updatedProduct;

        // Actualizar usando la función centralizada
        syncFormWithInternalState(updatedProducts);
    };

    // También mejora la función normalizarProductos para evitar instanceIds duplicados
    const normalizarProductos = (productos: any[]): ProductInstance[] => {
        if (!Array.isArray(productos)) return [];

        // Usamos un Set para trackear IDs ya asignados
        const assignedIds = new Set<string>();

        return productos.map(item => {
            // Si ya es formato instancia, verificar que el ID sea único
            if (item && item.instanceId && item.product) {
                let instanceId = item.instanceId;

                // Si el ID ya está usado, generar uno nuevo
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

            // Si es formato plano, convertir a instancia con ID único
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

            // Si no se reconoce el formato, devolver null
            return null;
        }).filter(Boolean) as ProductInstance[];
    };

    // Función para extraer datos en el formato esperado por la API
    const desnormalizarProductos = (productosInstancia: ProductInstance[]): any[] => {
        if (!Array.isArray(productosInstancia)) return [];

        return productosInstancia.map(item => {
            if (item && item.product) {
                return item.product;
            }
            return null;
        }).filter(Boolean);
    };

    // Este efecto se ejecuta cuando cambia form.productos
    useEffect(() => {
        // No hacer nada durante la carga inicial
        if (!initialLoadComplete) return;

        // Verificar si los productos externos (form.productos) cambiaron externamente (sin pasar por nuestros métodos)
        // Solo si la longitud es diferente, o si hay nuevos IDs que no existen en nuestro estado interno
        if (Array.isArray(form.productos) && form.productos.length > 0) {
            // Detectamos formato plano vs. instancia
            const primerElemento = form.productos[0];
            const esFormatoPlano = primerElemento && !primerElemento.instanceId && (primerElemento.externalId || primerElemento.name);

            // Si hay cambios en el formato o la longitud, normalizar
            if (esFormatoPlano ||
                productosInternos.length !== form.productos.length) {

                console.log('Detectado cambio externo en form.productos, sincronizando');
                const productosNormalizados = normalizarProductos(form.productos);

                // Usar setTimeout para evitar ciclos de actualización
                setTimeout(() => {
                    setProductosInternos(productosNormalizados);
                }, 0);
            }
        }
    }, [form.productos, initialLoadComplete]);

    // Estado interno para manejar productos en formato instancia
    const [productosInternos, setProductosInternos] = useState<ProductInstance[]>([]);

    // Sincronizar estado interno cuando se inicializa
    useEffect(() => {
        // Solo inicializar una vez
        if (!initialLoadComplete) {
            if (form.productos && Array.isArray(form.productos) && form.productos.length > 0) {
                console.log('Inicializando productos en el primer renderizado');
                const productosNormalizados = normalizarProductos(form.productos);
                setProductosInternos(productosNormalizados);
            }
            setInitialLoadComplete(true);
        }
    }, []);

    // Función auxiliar para calcular el precio de un producto de forma segura
    const safeCalculatePrice = (item: any): number => {
        if (!item) return 0;
        if (!item.product) return 0;

        const price = typeof item.product.price === 'number' ? item.product.price : 0;
        const quantity = typeof item.product.quantity === 'number' ? item.product.quantity : 0;

        return price * quantity;
    };

    const syncFormWithInternalState = (internalProducts: ProductInstance[]) => {
        // Normaliza para garantizar la estructura correcta
        const validProducts = internalProducts.filter(item => item && item.product);

        // Actualiza el estado interno
        setProductosInternos(validProducts);

        // Actualiza el estado del formulario padre
        const productosPlanos = desnormalizarProductos(validProducts);
        updateForm('productos', productosPlanos);
    };

    // Calcular el monto total de forma segura
    const totalAmount = Array.isArray(productosInternos)
        ? productosInternos.reduce((sum: number, item: ProductInstance) => sum + safeCalculatePrice(item), 0)
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

    // Funciones para añadir y eliminar productos que trabajen con nuestro estado interno
    const handleAddProduct = (product: any) => {
        // Validar el producto antes de agregarlo
        const validProduct = hacerItemValido(product);

        if (!validProduct) {
            console.error('Producto inválido:', product);
            setError('No se pudo agregar el producto: datos inválidos');
            return;
        }

        // Crear instancia normalizada
        const newInstance: ProductInstance = {
            instanceId: `${validProduct.externalId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            product: {
                ...validProduct,
                quantity: product.quantity || 1
            }
        };

        // Actualizar usando la función centralizada
        const nuevosProductosInternos = [...productosInternos, newInstance];
        syncFormWithInternalState(nuevosProductosInternos);

        // Limpiar la interfaz de búsqueda
        setSearchResults([]);
        setSearchQuery('');
    };

    const handleRemoveProduct = (instanceId: string) => {
        const nuevosProductosInternos = productosInternos.filter(p => p.instanceId !== instanceId);
        syncFormWithInternalState(nuevosProductosInternos);
    };

    const renderSelectedProduct = (item: any) => {
        let validItem = item;

        // Intentar reparar el item si no es válido
        if (!item || !item.instanceId || !item.product) {
            console.warn('Intentando reparar producto inválido:', item);

            // Si tenemos un objeto pero le falta la estructura correcta
            if (item && typeof item === 'object') {
                // Si el item es un producto plano (sin la estructura de instancia)
                if (!item.instanceId && !item.product) {
                    const validProduct = hacerItemValido(item);
                    if (validProduct) {
                        validItem = {
                            instanceId: `${validProduct.externalId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                            product: { ...validProduct, quantity: item.quantity || 1 }
                        };
                    } else {
                        return null; // No podemos reparar este item
                    }
                }
                // Si tiene instanceId pero le falta product
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
                // Si tiene product pero le falta instanceId
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
                return null; // Si no es ni siquiera un objeto, no podemos repararlo
            }
        }

        // Si después de intentar reparar sigue siendo inválido
        if (!validItem || !validItem.instanceId || !validItem.product) {
            console.error('No se pudo reparar el producto inválido:', item);
            return null;
        }

        // Extraer datos con valores predeterminados en caso de que falten
        const {
            imageUrl = 'https://via.placeholder.com/40',
            name = 'Producto sin nombre',
            price = 0,
            quantity = 1
        } = validItem.product || {};

        // Calcular precio total de forma segura
        const totalPrice = typeof price === 'number' && typeof quantity === 'number'
            ? price * quantity
            : 0;

        return (
            <View
                key={validItem.instanceId}
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
                    source={{ uri: imageUrl }}
                    style={{ width: 40, height: 40, borderRadius: 5 }}
                    contentFit="cover"
                />
                <View style={{ flex: 1, marginLeft: spacing.md }}>
                    <Text style={{ ...typography.body, fontWeight: '500' }}>{name}</Text>
                    <Text style={{ ...typography.body, color: colors.primaryDark, fontWeight: '600' }}>
                        <Text>$</Text>
                        {totalPrice.toLocaleString()}
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
                        onPress={() => handleUpdateQuantity(validItem.instanceId, -1)}
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
                        {quantity}
                    </Text>
                    <TouchableOpacity
                        onPress={() => handleUpdateQuantity(validItem.instanceId, 1)}
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
                    onPress={() => handleRemoveProduct(validItem.instanceId)}
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
    };

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
                            <Text>{productosInternos.reduce((sum: number, item: ProductInstance) => {
                                // Verificar que item.product existe y tiene quantity
                                if (item && item.product && typeof item.product.quantity === 'number') {
                                    return sum + item.product.quantity;
                                }
                                return sum;
                            }, 0)}</Text>
                            <Text>)</Text>
                        </Text>
                        <Text style={{ ...typography.subtitle }}>
                            <Text>Total: $</Text>
                            <Text>{totalAmount.toLocaleString()}</Text>
                        </Text>
                    </View>

                    {productosInternos && Array.isArray(productosInternos) && productosInternos.length > 0 ? (
                        productosInternos.map((item: any, index: number) => {
                            const renderedProduct = renderSelectedProduct(item);
                            // Si el renderSelectedProduct devuelve null (producto irrecuperable),
                            // podemos intentar eliminar este elemento del arreglo en el próximo ciclo
                            if (!renderedProduct && index === 0) {
                                // Solo mostramos el error una vez, no para cada producto inválido
                                console.error('Se encontraron productos irrecuperables en form.productos');
                            }
                            return renderedProduct;
                        }).filter(Boolean) // Eliminar los null que pueden haber sido devueltos
                    ) : (
                        <Text style={{ ...typography.body, textAlign: 'center', color: colors.gray[600] }}>
                            No hay productos seleccionados
                        </Text>
                    )}
                </View>

                {/* Botón de búsqueda y sección de búsqueda */}
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