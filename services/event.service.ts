// services/eventService.ts
import { API_URL } from "@/constants";
import { Product } from "@/types/event_types";


export interface EventToUpdate {
    _id: string;
    anfitrion: any;
    cantidadInvitados: number;
    createdAt: Date;
    cuotaAmount: number;
    cuotaCalculada: {
        cantidadPersonas: number;
        cuotaPorPersona: number;
        totalProductos: number;
    };
    descripcion: string;
    duracion: string;
    fechaFin: Date;
    fechaInicio: Date;
    imagen: string;
    invitados: any[];
    nombre: string;
    notasAdicionales: string;
    productos: Product[];
    requerimientos: {
        alimentacion: string;
        codigoVestimenta: string;
        edadMinima: string;
        llevar: string;
    };
    requiresPayment: boolean;
    status: string;
    tipo: string;
    ubicacion: {
        _id: string;
        address: string;
        coordinates: number[];
    };
    updatedAt: Date;
}

export interface Event {
    _id: string;
    imagen?: string;
    nombre: string;
    descripcion?: string;
    fechaInicio: Date;
    fechaFin?: Date;
    duracion?: string;
    tipo: string;
    ubicacion: {
        coordinates: [number, number];
        address: string;
    };
    productos?: Array<{
        externalId: string;
        name: string;
        brand?: string;
        imageUrl?: string;
        price: number;
        quantity?: number;
    }>;
    cantidadInvitados?: number;
    notasAdicionales?: string;
    requerimientos?: {
        codigoVestimenta?: string;
        alimentacion?: string;
        edadMinima?: string;
        llevar?: string;
    };
    requiresPayment: boolean;
    cuotaAmount?: number;
    invitados: Array<{
        userId?: string;
        phone: string;
        status: 'pending' | 'registered' | 'confirmed' | 'declined';
        hasPaid: boolean;
        paymentStatus: 'pending' | 'processing' | 'completed' | 'failed';
    }>;
    status: 'draft' | 'active' | 'cancelled' | 'completed';
    whatsappGroupId?: string;
    encuestas?: Array<{
        _id: string;
        pregunta: string;
        opciones: string[];
        votos: Array<{
            opcion: string;
            cantidad: number;
        }>;
        estado: 'active' | 'closed';
    }>;
}

// Interfaz para crear/actualizar un evento
export interface EventInput {
    nombre: string;
    descripcion?: string;
    fechaInicio: Date;
    fechaFin?: Date;
    duracion?: string;
    tipo: string;
    imagen?: string;
    ubicacion: {
        coordinates: number[];
        address: string;
    };
    productos?: Array<{
        externalId: string;
        name: string;
        brand?: string;
        imageUrl?: string;
        price: number;
        quantity?: number;
    }>;
    requiresPayment: boolean;
    cuotaAmount?: number;
    cantidadInvitados?: number;
    requerimientos?: {
        codigoVestimenta?: string;
        alimentacion?: string;
        edadMinima?: string;
        llevar?: string;
    };
    notasAdicionales?: string;
}

export const eventService = {
    async getEvents(token: string): Promise<any> {
        try {
            const response = await fetch(`${API_URL}/events`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                },
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Error al obtener eventos');
            }

            return response.json();
        } catch (error: any) {
            console.error('Error al obtener eventos:', error);
            return { error: error.message, data: [] };
        }
    },

    async createEvent(token: string, eventData: EventInput): Promise<Event> {
        const response = await fetch(`${API_URL}/events`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify(eventData),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Error al crear evento');
        }

        return response.json();
    },

    async getEventById(token: string, eventId: string): Promise<Event> {
        const response = await fetch(`${API_URL}/events/${eventId}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
            },
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Error al obtener el evento');
        }

        return response.json();
    },

    async updateEvent(token: string, eventId: string, eventData: Partial<EventInput>): Promise<Event> {
        const response = await fetch(`${API_URL}/events/${eventId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify(eventData),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Error al actualizar el evento');
        }

        return response.json();
    },

    async deleteEvent(token: string, eventId: string): Promise<void> {
        const response = await fetch(`${API_URL}/events/${eventId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
            },
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Error al eliminar el evento');
        }
    },

    async inviteGuests(token: string, eventId: string, phones: string[]): Promise<Event> {
        const response = await fetch(`${API_URL}/events/${eventId}/invite`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({ invitados: phones.map(phone => ({ phone })) }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Error al invitar personas');
        }

        return response.json();
    },

    async removeGuest(token: string, eventId: string, phone: string): Promise<Event> {
        const response = await fetch(`${API_URL}/events/${eventId}/guests/${encodeURIComponent(phone)}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
            },
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Error al eliminar invitado');
        }

        return response.json();
    },

    async createPoll(
        token: string,
        eventId: string,
        question: string,
        options: string[]
    ): Promise<Event> {
        const response = await fetch(`${API_URL}/events/${eventId}/polls`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({
                pregunta: question,
                opciones: options
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Error al crear encuesta');
        }

        return response.json();
    },

    async addProducto(
        token: string,
        eventId: string,
        producto: {
            externalId: string;
            name: string;
            brand?: string;
            imageUrl?: string;
            price: number;
            quantity?: number;
        }
    ): Promise<Event> {
        const response = await fetch(`${API_URL}/events/${eventId}/productos`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify(producto),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Error al agregar producto');
        }

        return response.json();
    },

    async removeProducto(token: string, eventId: string, productoId: string): Promise<Event> {
        const response = await fetch(`${API_URL}/events/${eventId}/productos/${productoId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
            },
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Error al eliminar producto');
        }

        return response.json();
    },

    async markGuestAsPaid(token: string, eventId: string, phone: string): Promise<Event> {
        const response = await fetch(`${API_URL}/events/${eventId}/guests/${encodeURIComponent(phone)}/paid`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
            },
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Error al marcar como pagado');
        }

        return response.json();
    }
};