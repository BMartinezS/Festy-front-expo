interface GetEventDto {
    _id: string;
}

interface EventAnfitrion {
    _id: string;
    createdAt: Date;
    email: string;
    name: string;
}


interface Product {
    externalId: string;
    name: string;
    brand: string;
    quantity: number;
    imageUrl: string;
    price: number;
}

interface EventForm {
    imagen: string;
    nombre: string;
    descripcion: string;
    fechaInicio: Date;
    fechaFin: Date;
    duracion: string;
    tipo: string;
    ubicacion: {
        coordinates: number[];
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

const INITIAL_FORM_STATE: EventForm = {
    imagen: '',
    nombre: '',
    descripcion: '',
    fechaInicio: new Date(),
    fechaFin: new Date(),
    duracion: '',
    tipo: '',
    ubicacion: {
        coordinates: [0, 0],
        address: '',
    },
    productos: [],
    cantidadInvitados: '0',
    notasAdicionales: '',
    requerimientos: {
        codigoVestimenta: '',
        alimentacion: '',
        edadMinima: '',
        llevar: ''
    },
    requiresPayment: false,
    cuotaAmount: '0',
    cuotaCalculada: {
        totalProductos: 0,
        cuotaPorPersona: 0,
        cantidadPersonas: 0
    }
};

const EVENT_TYPES = [
    { label: 'Asado', value: 'asado' },
    { label: 'Cumpleaños', value: 'cumpleanos' },
    { label: 'Reunión', value: 'reunion' }
];

const INITIAL_COORDINATES = {
    latitude: -33.441622,
    longitude: -70.654049
};

export type { Product, EventForm };
export { INITIAL_FORM_STATE, EVENT_TYPES, INITIAL_COORDINATES };