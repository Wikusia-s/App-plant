import { authService } from './authService';

const API_URL = 'http://localhost:5000/api/collection';

export interface Plant {
    id: number;
    user_id: number;
    name: string;
    image_url: string;
    species: string;
    created_at: string;
}

export const collectionService = {
    async getPlants(): Promise<Plant[]> {
        const token = authService.getToken();
        const response = await fetch(`${API_URL}`, {
            headers: { 'Authorization': `Bearer ${token}` },
        });

        if (!response.ok) throw new Error('Failed to fetch plants');

        const data = await response.json();
        return data.plants;
    },

    async addPlant(formData: FormData): Promise<Plant> {
        const token = authService.getToken();
        const response = await fetch(`${API_URL}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
            body: formData,
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to add plant');
        }

        const data = await response.json();
        return data.plant;
    },


    async updatePlantName(plantId: number, name: string): Promise<Plant> {
        const token = authService.getToken();
        const response = await fetch(`${API_URL}/${plantId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ name }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to update plant name');
        }

        const data = await response.json();
        return data.plant;
    },

    async deletePlant(plantId: number): Promise<void> {
        const token = authService.getToken();
        const response = await fetch(`${API_URL}/${plantId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` },
        });

        if (!response.ok) throw new Error('Failed to delete plant');
        // const data = await response.json();
        // return data.plant;
    },
};
