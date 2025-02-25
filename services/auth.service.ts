// services/auth.service.ts - Actualizado para incluir teléfono en registro
import { API_URL } from "@/constants";

interface LoginData {
    email: string;
    password: string;
}

interface RegisterData {
    name: string;
    email: string;
    password: string;
    phone: string; // Agregado campo de teléfono
}

interface AuthResponse {
    token: string;
    user?: {
        id: string;
        name: string;
        email: string;
        phone?: string;
    };
    // Otros datos que devuelva tu backend
}

export const authService = {
    async login(data: LoginData): Promise<AuthResponse> {
        try {
            console.log('Intentando login con:', data);
            console.log('URL:', `${API_URL}/auth/login`);

            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify(data),
            });

            console.log('Status:', response.status);
            const responseData = await response.json();
            console.log('Respuesta:', responseData);

            if (!response.ok) {
                throw new Error(responseData.message || 'Error en el login');
            }

            return responseData;
        } catch (error) {
            console.error('Error detallado:', error);
            throw error;
        }
    },

    async register(data: RegisterData): Promise<AuthResponse> {
        try {
            console.log('Intentando registro con:', data);

            const response = await fetch(`${API_URL}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify(data),
            });

            const responseData = await response.json();

            if (!response.ok) {
                throw new Error(responseData.message || 'Error en el registro');
            }

            return responseData;
        } catch (error) {
            console.error('Error en registro:', error);
            throw error;
        }
    },

    async getUserProfile(token: string): Promise<any> {
        try {
            const response = await fetch(`${API_URL}/users/profile`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error('Error al obtener perfil de usuario');
            }

            return response.json();
        } catch (error) {
            console.error('Error al obtener perfil:', error);
            throw error;
        }
    },

    async updateUserProfile(token: string, userData: {
        name?: string;
        email?: string;
        phone?: string;
        avatar?: string;
    }): Promise<any> {
        try {
            const response = await fetch(`${API_URL}/users/profile`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify(userData),
            });

            if (!response.ok) {
                throw new Error('Error al actualizar perfil');
            }

            return response.json();
        } catch (error) {
            console.error('Error al actualizar perfil:', error);
            throw error;
        }
    },

    async changePassword(token: string, data: {
        currentPassword: string;
        newPassword: string;
    }): Promise<any> {
        try {
            const response = await fetch(`${API_URL}/users/password`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                throw new Error('Error al cambiar contraseña');
            }

            return response.json();
        } catch (error) {
            console.error('Error al cambiar contraseña:', error);
            throw error;
        }
    },

    async logout(token: string): Promise<void> {
        try {
            const response = await fetch(`${API_URL}/auth/logout`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error('Error al cerrar sesión');
            }
        } catch (error) {
            console.error('Error al cerrar sesión:', error);
            throw error;
        }
    },

    async forgotPassword(email: string): Promise<any> {
        try {
            const response = await fetch(`${API_URL}/auth/forgot-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({ email }),
            });

            if (!response.ok) {
                throw new Error('Error al solicitar recuperación de contraseña');
            }

            return response.json();
        } catch (error) {
            console.error('Error en recuperación:', error);
            throw error;
        }
    },

    async resetPassword(token: string, newPassword: string): Promise<any> {
        try {
            const response = await fetch(`${API_URL}/auth/reset-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({ token, newPassword }),
            });

            if (!response.ok) {
                throw new Error('Error al restablecer contraseña');
            }

            return response.json();
        } catch (error) {
            console.error('Error al restablecer contraseña:', error);
            throw error;
        }
    }
};