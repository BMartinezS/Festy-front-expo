// services/payment.service.ts
import { API_URL } from "@/constants";

export interface PaymentMethod {
    id: string;
    type: 'card' | 'transfer' | 'cash';
    last4?: string;
    brand?: string;
    name?: string;
    isDefault?: boolean;
}

export interface PaymentIntent {
    id: string;
    eventId: string;
    guestPhone: string;
    amount: number;
    currency: string;
    status: 'pending' | 'processing' | 'succeeded' | 'failed' | 'canceled';
    paymentMethod?: string;
    createdAt: string;
    updatedAt: string;
}

export interface PaymentStatus {
    totalPaid: number;
    totalPending: number;
    guests: {
        paid: number;
        pending: number;
    };
}

export const paymentService = {
    // Obtener métodos de pago del usuario
    async getPaymentMethods(token: string): Promise<PaymentMethod[]> {
        try {
            const response = await fetch(`${API_URL}/payments/methods`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                },
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Error al obtener métodos de pago');
            }

            return response.json();
        } catch (error: any) {
            console.error('Error al obtener métodos de pago:', error);
            throw error;
        }
    },

    // Añadir nuevo método de pago
    async addPaymentMethod(token: string, paymentMethodData: any): Promise<PaymentMethod> {
        try {
            const response = await fetch(`${API_URL}/payments/methods`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify(paymentMethodData),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Error al añadir método de pago');
            }

            return response.json();
        } catch (error: any) {
            console.error('Error al añadir método de pago:', error);
            throw error;
        }
    },

    // Eliminar método de pago
    async deletePaymentMethod(token: string, paymentMethodId: string): Promise<void> {
        try {
            const response = await fetch(`${API_URL}/payments/methods/${paymentMethodId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                },
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Error al eliminar método de pago');
            }
        } catch (error: any) {
            console.error('Error al eliminar método de pago:', error);
            throw error;
        }
    },

    // Crear intención de pago (para invitados o anfitriones)
    async createPaymentIntent(
        token: string,
        eventId: string,
        amount: number,
        paymentMethodId?: string
    ): Promise<PaymentIntent> {
        try {
            const response = await fetch(`${API_URL}/payments/intent`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({
                    eventId,
                    amount,
                    paymentMethodId
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Error al crear intención de pago');
            }

            return response.json();
        } catch (error: any) {
            console.error('Error al crear intención de pago:', error);
            throw error;
        }
    },

    // Confirmar un pago
    async confirmPayment(token: string, paymentIntentId: string, paymentMethodId: string): Promise<PaymentIntent> {
        try {
            const response = await fetch(`${API_URL}/payments/intent/${paymentIntentId}/confirm`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({
                    paymentMethodId
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Error al confirmar pago');
            }

            return response.json();
        } catch (error: any) {
            console.error('Error al confirmar pago:', error);
            throw error;
        }
    },

    // Obtener estado de pago de un evento
    async getEventPaymentStatus(token: string, eventId: string): Promise<PaymentStatus> {
        try {
            const response = await fetch(`${API_URL}/events/${eventId}/payments/status`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                },
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Error al obtener estado de pagos');
            }

            return response.json();
        } catch (error: any) {
            console.error('Error al obtener estado de pagos:', error);
            throw error;
        }
    },

    // Obtener historial de pagos de un evento
    async getEventPaymentHistory(token: string, eventId: string): Promise<PaymentIntent[]> {
        try {
            const response = await fetch(`${API_URL}/events/${eventId}/payments/history`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                },
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Error al obtener historial de pagos');
            }

            return response.json();
        } catch (error: any) {
            console.error('Error al obtener historial de pagos:', error);
            throw error;
        }
    },

    // Generar enlace de pago para compartir con invitados
    async generatePaymentLink(token: string, eventId: string, guestPhone?: string): Promise<string> {
        try {
            const response = await fetch(`${API_URL}/payments/link`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({
                    eventId,
                    guestPhone
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Error al generar enlace de pago');
            }

            const data = await response.json();
            return data.paymentLink;
        } catch (error: any) {
            console.error('Error al generar enlace de pago:', error);
            throw error;
        }
    }
};