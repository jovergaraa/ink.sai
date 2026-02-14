export interface Project {
  id: string;
  title: string;
  imageUrl: string;
  category: 'portfolio' | 'flash';
  description?: string;
  price?: number; // For flash
}

export interface Booking {
  id: string;
  clientName: string;
  clientEmail: string;
  idea: string;
  date: string; // ISO string
  status: 'pending' | 'confirmed' | 'rejected';
  aiRefinedIdea?: string;
}

export type ViewState = 'home' | 'portfolio' | 'flash' | 'booking' | 'admin';

export interface AIResponse {
  refinedIdea: string;
  suggestedStyle: string;
  technicalNotes: string;
}