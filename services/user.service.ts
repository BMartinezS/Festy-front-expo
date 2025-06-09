import { API_URL } from "@/constants";
import { UserGetDtoResponse } from "@/types/profile";
import AsyncStorage from "@react-native-async-storage/async-storage";

class UserService {
    constructor() { }

    async getUserProfile(): Promise<UserGetDtoResponse> {
        try {

            const userToken = await AsyncStorage.getItem('userToken');
            if (!userToken) {
                throw new Error('No authentication token found');
            }

            const response = await fetch(`${API_URL}/user/profile`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${userToken}`
                }
            });

            if (!response.ok) {
                throw new Error('Error fetching user profile');
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching user profile:', error);
            throw error;
        }
    }

    async getUserId() {
        try {
            const userToken = await AsyncStorage.getItem('userToken');
            if (!userToken) {
                throw new Error('No authentication token found');
            }

            console.log('Auth Token:', userToken);

            const response = await fetch(`${API_URL}/user/profile`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${userToken}`
                }
            });

            if (!response.ok) {
                throw new Error('Error fetching user ID');
            }

            const data = await response.json();

            if (!data || !data._id) {
                throw new Error('User ID not found in response');
            }

            const userId = data._id;

            return userId;
        } catch (error) {
            console.error('Error fetching user ID:', error);
            throw error;
        }
    }

    async updateUserProfile(token: string, userData: {
        name?: string;
        email?: string;
        phone?: string;
        password?: string;
        newPassword?: string;
        repeatNewPassword?: string;
    }): Promise<any> {
        try {
            const response = await fetch(`${API_URL}/user/update`, {
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
    }
}


export default new UserService();