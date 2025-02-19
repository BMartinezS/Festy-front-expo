// services/eventService.ts
import { API_URL } from "@/constants";

export interface Event {
    _id: string;
    nombre: string;
    descripcion?: string;
    fecha: Date;
    tipo: string;
    ubicacion: {
        coordinates: number[];
        address: string;
    };
    invitados: Array<{
        userId?: string;
        phone: string;
        status: 'pending' | 'registered' | 'confirmed';
        hasPaid: boolean;
        paymentStatus: 'pending' | 'processing' | 'completed' | 'failed';
    }>;
    status: 'draft' | 'active' | 'cancelled' | 'completed';
    requiresPayment: boolean;
    cuotaAmount?: number;
    cantidadInvitados?: number;
}

export const eventService = {
    async getEvents(token: string): Promise<any> {
        const response = await fetch(`${API_URL}/events`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
            },
        });

        if (!response.ok) throw new Error('Error al obtener eventos');
        return response.json();
    },

    async createEvent(token: string, eventData: Partial<Event>): Promise<Event> {
        const response = await fetch(`${API_URL}/events`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify(eventData),
        });
        if (!response.ok) throw new Error('Error al crear evento');
        return response.json();
    },

    async getEventById(token: string, eventId: string): Promise<Event> {
        const response = await fetch(`${API_URL}/events/${eventId}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
            },
        });
        if (!response.ok) throw new Error('Error al obtener el evento');
        return response.json();
    },

    async inviteGuests(token: string, eventId: string, phones: string[]): Promise<Event> {
        const response = await fetch(`${API_URL}/events/${eventId}/invite`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ invitados: phones.map(phone => ({ phone })) }),
        });
        if (!response.ok) throw new Error('Error al invitar personas');
        return response.json();
    },
};