import { authService } from './authService';
import type { CareTask } from '../types';

const API_URL = 'http://localhost:5000/api/care';

export const careService = {
    async getTasks(): Promise<CareTask[]> {
        const token = authService.getToken();
        const response = await fetch(`${API_URL}`, {
            headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!response.ok) throw new Error('Failed to fetch care tasks');
        const data = await response.json();
        return data.tasks;
    },

    async addTask(payload: {
        plant_id?: number | null;
        type: CareTask['type'];
        title?: string | null;
        due_at: string; // ISO string
        notes?: string | null;
    }): Promise<CareTask> {
        const token = authService.getToken();
        const response = await fetch(`${API_URL}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(payload),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to add task');
        return data.task;
    },

    async updateTask(id: number, changes: Partial<{
        plant_id: number | null;
        type: CareTask['type'];
        title: string | null;
        due_at: string;
        notes: string | null;
        status: CareTask['status'];
    }>): Promise<CareTask> {
        const token = authService.getToken();
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(changes),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to update task');
        return data.task;
    },

    async deleteTask(id: number): Promise<void> {
        const token = authService.getToken();
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || 'Failed to delete task');
        }
    },
};
