// services/whatsapp.service.ts
import { API_URL } from "@/constants";

export interface WhatsAppGroup {
    id: string;
    name: string;
    inviteLink: string;
    members: Array<{
        phone: string;
        isAdmin: boolean;
    }>;
}

export const whatsappService = {
    /**
     * Crea un grupo de WhatsApp para un evento
     */
    async createGroup(token: string, eventId: string, groupName: string): Promise<WhatsAppGroup> {
        try {
            const response = await fetch(`${API_URL}/whatsapp/groups`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({
                    eventId,
                    groupName
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Error al crear grupo de WhatsApp');
            }

            return response.json();
        } catch (error: any) {
            console.error('Error al crear grupo de WhatsApp:', error);
            throw error;
        }
    },

    /**
     * Envía una solicitud de pago a un invitado
     */
    async sendPaymentRequest(
        token: string,
        eventId: string,
        phone: string,
        amount: number,
        concept: string
    ): Promise<any> {
        try {
            const response = await fetch(`${API_URL}/whatsapp/payment-request`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({
                    eventId,
                    phone,
                    amount,
                    concept
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Error al enviar solicitud de pago');
            }

            return response.json();
        } catch (error: any) {
            console.error('Error al enviar solicitud de pago:', error);
            throw error;
        }
    },

    /**
     * Envía una encuesta a un grupo de WhatsApp
     */
    async sendPoll(
        token: string,
        groupId: string,
        question: string,
        options: string[]
    ): Promise<any> {
        try {
            const response = await fetch(`${API_URL}/whatsapp/groups/${groupId}/poll`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({
                    question,
                    options
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Error al crear encuesta');
            }

            return response.json();
        } catch (error: any) {
            console.error('Error al crear encuesta en WhatsApp:', error);
            throw error;
        }
    }
};