export type Turn = { user: string; assistant: string };
export type Source = { plant_name: string; title: string; url: string };
export type ChatResponse = { answer: string; sources: Source[] };
