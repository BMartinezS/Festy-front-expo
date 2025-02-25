// CreateEventScreen.tsx
import React, { useState, useCallback, useEffect } from 'react';
import { StyleSheet, KeyboardAvoidingView, Platform, FlatList } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { eventService } from '@/services/event.service';

// Importamos los componentes separados
import ImageSelector from '@/components/EventForm/ImageSelector';
import EventInfoForm from '@/components/EventForm/EventInfoForm';
import RequerimientosForm from '@/components/EventForm/RequerimientosForm';
import DateTimePickerSection from '@/components/EventForm/DateTimePickerSection';
import MapSection from '@/components/EventForm/MapSection';
import ProductSearchSection from '@/components/EventForm/ProductSearchSection';
import PaymentDetailsSection from '@/components/EventForm/PaymentDetailsSection';
import Footer from '@/components/EventForm/Footer';
import PaymentSwitch from '@/components/EventForm/PaymentSwitch';

// Estado inicial del formulario
export interface Product {
    externalId: string;
    name: string;
    brand: string;
    imageUrl: string;
    price: number;
    quantity: number;
}

export interface EventForm {
    imagen: string;
    nombre: string;
    descripcion: string;
    fechaInicio: Date;
    fechaFin: Date;
    duracion: string;
    tipo: string;
    ubicacion: {
        coordinates: [number, number];
        address: string;
    };
    productos: any[];
    cantidadInvitados: string;
    notasAdicionales: string;
    requerimientos: {
        codigoVestimenta: string;
        alimentacion: string;
        edadMinima: string;
        llevar: string;
    };
    requiresPayment: boolean;
    cuotaAmount: string;
    cuotaCalculada: {
        totalProductos: number;
        cuotaPorPersona: number;
        cantidadPersonas: number;
    };
}

export const INITIAL_FORM_STATE: EventForm = {
    imagen: '',
    nombre: '',
    descripcion: '',
    fechaInicio: new Date(),
    fechaFin: new Date(),
    duracion: '',
    tipo: '',
    ubicacion: { coordinates: [0, 0], address: '' },
    productos: [],
    cantidadInvitados: '0',
    notasAdicionales: '',
    requerimientos: {
        codigoVestimenta: '',
        alimentacion: '',
        edadMinima: '',
        llevar: '',
    },
    requiresPayment: false,
    cuotaAmount: '0',
    cuotaCalculada: {
        totalProductos: 0,
        cuotaPorPersona: 0,
        cantidadPersonas: 0,
    },
};

const INITIAL_COORDINATES = {
    latitude: -33.441622,
    longitude: -70.654049,
};

export default function CreateEventScreen() {
    const [form, setForm] = useState<EventForm>(INITIAL_FORM_STATE);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [initialCalculationDone, setInitialCalculationDone] = useState(false);

    // Función para actualizar el formulario
    const updateForm = useCallback((field: keyof EventForm, value: any) => {
        setForm((prev) => ({ ...prev, [field]: value }));
    }, []);

    // Efecto para calcular la cuota cuando se modifican productos o cantidad de invitados
    useEffect(() => {
        if (form.requiresPayment && (form.productos.length > 0 || parseInt(form.cantidadInvitados) > 0)) {
            // Calcula el valor total de los productos según la estructura Product
            const totalProductos = form.productos.reduce((sum, p) => {
                // Si el producto tiene la estructura {product: Product, quantity: number}
                if (p.product && typeof p.product === 'object') {
                    const price = p.product.price || 0;
                    const quantity = p.quantity || 1;
                    return sum + (price * quantity);
                }
                // Si el producto es directamente un Product
                else if (p.price && typeof p.price === 'number') {
                    return sum + (p.price * (p.quantity || 1));
                }
                return sum;
            }, 0);

            // Resto del código para calcular cuota...
            const cantidadPersonas = parseInt(form.cantidadInvitados) || 0;
            const cuotaPorPersona = cantidadPersonas > 0 ? totalProductos / cantidadPersonas : 0;
            const cuotaRedondeada = Math.ceil(cuotaPorPersona);

            updateForm('cuotaCalculada', {
                totalProductos,
                cuotaPorPersona,
                cantidadPersonas,
            });

            if (!form.cuotaAmount || form.cuotaAmount === '0' || isNaN(Number(form.cuotaAmount))) {
                updateForm('cuotaAmount', cuotaRedondeada.toString());
            }

            setInitialCalculationDone(true);
        }
    }, [form.productos, form.cantidadInvitados, form.requiresPayment]);

    // Función para validar y enviar el formulario
    const handleSubmit = async () => {
        // Aquí podrías agregar validaciones adicionales...
        if (!form.nombre.trim()) {
            setError('El nombre del evento es requerido');
            return;
        }
        if (!form.ubicacion.address) {
            setError('La ubicación es requerida');
            return;
        }
        if (!form.tipo) {
            setError('El tipo de evento es requerido');
            return;
        }
        if (form.requiresPayment && (!form.cuotaAmount || parseFloat(form.cuotaAmount) <= 0)) {
            setError('Ingresa un monto válido para la cuota');
            return;
        }

        try {
            setIsLoading(true);
            setError('');
            const token = await AsyncStorage.getItem('userToken');
            if (!token) throw new Error('No hay sesión activa');

            const { productos } = form;

            const productosSinInstanceId = productos.map((producto: any) => {
                const { instanceId, ...resto } = producto;
                return resto;
            })

            const productosTransformados = productosSinInstanceId.map((item: any) => {
                // Si el item tiene una estructura con product como clave, retornamos solo ese objeto
                if (item.product) {
                    return item.product;
                }
                // Si no tiene esa estructura, retornamos el objeto original
                return item;
            });

            form.productos = productosTransformados;

            // Envío del formulario (adaptar según la API)
            const response = await eventService.createEvent(token, {
                ...form,
                cuotaAmount: form.requiresPayment ? parseFloat(form.cuotaAmount) : 0,
                cantidadInvitados: parseInt(form.cantidadInvitados) || 0,
            });

            if ('success' in response) {
                console.log('Evento creado con éxito!');
                router.push('/event')
            }
        } catch (error: any) {
            setError(error.message || 'Error al crear el evento');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <FlatList
                data={form.productos}
                keyExtractor={(item) => item.externalId}
                renderItem={({ item }) => null} // Add a renderItem function
                // La cabecera incluye todos los componentes de formulario
                ListHeaderComponent={
                    <>
                        <ImageSelector
                            image={form.imagen}
                            updateImage={(uri) => updateForm('imagen', uri)}
                            setError={setError}
                        />
                        <EventInfoForm form={form} updateForm={updateForm} />
                        <RequerimientosForm
                            requerimientos={form.requerimientos}
                            updateForm={updateForm}
                        />
                        <DateTimePickerSection form={form} updateForm={updateForm} />
                        <MapSection
                            initialCoordinates={INITIAL_COORDINATES}
                            onLocationSelect={(lat, lng, address) =>
                                updateForm('ubicacion', {
                                    coordinates: [lat, lng],
                                    address: address || 'Dirección pendiente'
                                })
                            }
                        />
                        <ProductSearchSection form={form} updateForm={updateForm} setError={setError} />

                        {/* Aquí se incluye el switch para habilitar/deshabilitar el pago */}
                        <PaymentSwitch
                            requiresPayment={form.requiresPayment}
                            onToggle={(value) => updateForm('requiresPayment', value)}
                        />

                        {form.requiresPayment && (
                            <PaymentDetailsSection form={form} updateForm={updateForm} />
                        )}
                    </>
                }
                ListFooterComponent={<Footer onSubmit={handleSubmit} isLoading={isLoading} />}
                contentContainerStyle={styles.flatListContent}
            />
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8f9fa' },
    flatListContent: { flexGrow: 1 },
});
