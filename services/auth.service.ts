import { API_URL } from "@/constants";

interface LoginData {
    email: string;
    password: string;
}

interface RegisterData extends LoginData {
    name: string;
}

interface AuthResponse {
    token: string;
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
            const response = await fetch(`${API_URL}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                throw new Error('Error en el registro');
            }

            return response.json();
        } catch (error) {
            console.error('Error en registro:', error);
            throw error;
        }
    },
};