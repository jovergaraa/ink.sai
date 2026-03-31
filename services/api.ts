import { Design, PortfolioItem, Appointment, User } from '../types';

// Mock Database Initial State
const MOCK_DB = {
  designs: [
    { id: '1', title: 'Daga Cursed', imageUrl: 'https://images.unsplash.com/photo-1562962230-16bc46364924', style: 'Blackwork', price: 150, available: true, size: '15cm' },
    { id: '2', title: 'Ojo Sagrado', imageUrl: 'https://images.unsplash.com/photo-1611501275019-9b5cda994e8d', style: 'Surrealism', price: 200, available: true, size: '10cm' },
  ] as Design[],
  portfolio: [
    { id: '1', title: 'Samurai Backpiece', imageUrl: 'https://images.unsplash.com/photo-1590246235044-f92e48f8670b', description: 'Espalda completa en 3 sesiones.', date: '2023-10-15', tags: ['Oriental', 'Blackwork'] },
    { id: '2', title: 'Dark Sleeve', imageUrl: 'https://images.unsplash.com/photo-1598371839696-5c5bb00bdc28', description: 'Composición de manga completa.', date: '2023-11-01', tags: ['Realism', 'Dark'] },
  ] as PortfolioItem[],
  appointments: [
    { id: '101', clientName: 'Carlos Ruiz', clientEmail: 'carlos@test.com', idea: 'Lobo geométrico', date: '2025-03-20', status: 'pending', createdAt: new Date().toISOString() }
  ] as Appointment[]
};

// --- AUTH CONTROLLER ---
export const AuthService = {
  login: async (password: string): Promise<User | null> => {
    // Simulating secure backend check
    if (password === 'ink2025') {
      return { id: 'admin-1', username: 'INK.SAI', role: 'admin', token: 'mock-jwt-token-123' };
    }
    return null;
  }
};

// --- BOOKING CONTROLLER ---
export const BookingController = {
  findAll: async (): Promise<Appointment[]> => {
    return [...MOCK_DB.appointments];
  },

  create: async (data: Omit<Appointment, 'id' | 'status' | 'createdAt'>): Promise<Appointment> => {
    const newAppointment: Appointment = {
      ...data,
      id: Date.now().toString(),
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    MOCK_DB.appointments.unshift(newAppointment);
    return newAppointment;
  },

  updateStatus: async (id: string, status: Appointment['status']): Promise<Appointment | null> => {
    const idx = MOCK_DB.appointments.findIndex(a => a.id === id);
    if (idx === -1) return null;
    MOCK_DB.appointments[idx].status = status;
    return MOCK_DB.appointments[idx];
  }
};

// --- CONTENT CONTROLLER (CMS) ---
export const ContentController = {
  // Designs (Flash)
  getDesigns: async (): Promise<Design[]> => [...MOCK_DB.designs],
  addDesign: async (design: Omit<Design, 'id'>): Promise<Design> => {
    const newDesign = { ...design, id: Date.now().toString() };
    MOCK_DB.designs.unshift(newDesign);
    return newDesign;
  },
  deleteDesign: async (id: string) => {
    MOCK_DB.designs = MOCK_DB.designs.filter(d => d.id !== id);
  },

  // Portfolio
  getPortfolio: async (): Promise<PortfolioItem[]> => [...MOCK_DB.portfolio],
  addPortfolioItem: async (item: Omit<PortfolioItem, 'id'>): Promise<PortfolioItem> => {
    const newItem = { ...item, id: Date.now().toString() };
    MOCK_DB.portfolio.unshift(newItem);
    return newItem;
  },
  deletePortfolioItem: async (id: string) => {
    MOCK_DB.portfolio = MOCK_DB.portfolio.filter(p => p.id !== id);
  }
};