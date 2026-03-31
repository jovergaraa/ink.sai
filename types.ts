// ENTITIES

export type UserRole = 'admin' | 'public';

export interface User {
  id: string;
  username: string;
  role: UserRole;
  token?: string; // JWT Simulation
}

// Catálogo de Diseños (Flash)
export interface Design {
  id: string;
  title: string;
  imageUrl: string;
  style: string; // e.g., 'Blackwork', 'Tradicional'
  price: number;
  available: boolean;
  size?: string; // e.g., '15cm'
}

// Portafolio (Trabajos Realizados)
export interface PortfolioItem {
  id: string;
  title: string;
  imageUrl: string;
  description: string;
  date: string; // ISO Date
  tags: string[];
}

// Agendamiento
export interface Appointment {
  id: string;
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  idea: string;
  date: string; // ISO Date selected
  status: 'pending' | 'confirmed' | 'rejected' | 'completed';
  aiRefinedIdea?: string;
  createdAt: string;
}

// UI Types
export interface Project {
  id: string;
  title: string;
  imageUrl: string;
  category: 'portfolio' | 'flash';
  description?: string;
  price?: number;
}

export interface Booking {
  id: string;
  clientName: string;
  clientEmail: string;
  idea: string;
  date: string;
  status: 'pending' | 'confirmed' | 'rejected' | 'completed';
  aiRefinedIdea?: string;
}

// UTILS
export type ViewState = 'home' | 'portfolio' | 'flash' | 'booking' | 'admin';

export interface AIResponse {
  refinedIdea: string;
  suggestedStyle: string;
  technicalNotes: string;
}