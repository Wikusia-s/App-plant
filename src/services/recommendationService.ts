import { authService } from './authService';

const API_URL = 'http://localhost:5000/api/recommendations';

type ConstraintValue = string | null;

export interface ConstraintsPayload {
  light?: ConstraintValue;
  water?: ConstraintValue;
  humidity?: ConstraintValue;
  pets_safe?: boolean | null;
  difficulty?: ConstraintValue;
  top_k?: number;
}

export interface HybridPayload extends ConstraintsPayload {
  seed_plants?: string[];
}

export interface RecommendationItem {
  plant_name: string;
  score: number;
}

const authHeaders = () => ({
  Authorization: `Bearer ${authService.getToken()}`,
  'Content-Type': 'application/json',
});

async function handleResponse(res: Response) {
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || 'Request failed');
  }
  return res.json();
}

export const recommendationService = {
  async getSimilar(seed_plants?: string[], top_k?: number): Promise<RecommendationItem[]> {
    const res = await fetch(`${API_URL}/similar`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ seed_plants, top_k }),
    });
    const data = await handleResponse(res);
    return data.recommendations;
  },

  async getByConstraints(payload: ConstraintsPayload): Promise<RecommendationItem[]> {
    const res = await fetch(`${API_URL}/constraints`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(payload),
    });
    const data = await handleResponse(res);
    return data.recommendations;
  },

  async getHybrid(payload: HybridPayload): Promise<RecommendationItem[]> {
    const res = await fetch(`${API_URL}/hybrid`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(payload),
    });
    const data = await handleResponse(res);
    return data.recommendations;
  },
};
