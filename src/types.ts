export type Turn = { user: string; assistant: string };
export type Source = { plant_name: string; title: string; url: string };
export type ChatResponse = { answer: string; sources: Source[] };

export type CareTaskType = 'water' | 'fertilize' | 'prune' | 'repot' | 'custom';
export type CareTaskStatus = 'pending' | 'done';

export interface CareTask {
    id: number;
    user_id?: number;
    plant_id?: number | null;
    type: CareTaskType;
    title?: string | null;
    due_at: string; // ISO timestamp
    notes?: string | null;
    status: CareTaskStatus;
    created_at: string;
    plant_name?: string | null; // convenience for UI
}
