import React, { useState } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Portfolio from './components/Portfolio';
import BookingSection from './components/Booking';
import AdminDashboard from './components/AdminDashboard';
import { ViewState, Project, Booking } from './types';

// Mock Initial Data
const INITIAL_PROJECTS: Project[] = [
  { id: '1', title: 'Samurai Blackwork', imageUrl: 'https://images.unsplash.com/photo-1590246235044-f92e48f8670b?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80', category: 'portfolio', description: 'Espalda completa / 3 sesiones' },
  { id: '2', title: 'Dark Surrealism', imageUrl: 'https://images.unsplash.com/photo-1598371839696-5c5bb00bdc28?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80', category: 'portfolio', description: 'Antebrazo' },
  { id: '3', title: 'Daga Cursed', imageUrl: 'https://images.unsplash.com/photo-1562962230-16bc46364924?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80', category: 'flash', price: 150, description: '15cm' },
  { id: '4', title: 'Ojo Sagrado', imageUrl: 'https://images.unsplash.com/photo-1611501275019-9b5cda994e8d?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80', category: 'flash', price: 200, description: '10cm' },
];

const INITIAL_BOOKINGS: Booking[] = [
  { id: '101', clientName: 'Carlos Ruiz', clientEmail: 'carlos@test.com', idea: 'Un lobo geométrico en el pecho', date: '2023-11-20', status: 'pending' },
];

function App() {
  const [currentView, setCurrentView] = useState<ViewState>('home');
  const [isAdmin, setIsAdmin] = useState(false); // Toggle for demo purposes
  const [projects, setProjects] = useState<Project[]>(INITIAL_PROJECTS);
  const [bookings, setBookings] = useState<Booking[]>(INITIAL_BOOKINGS);

  const toggleAdmin = () => {
    const newAdminState = !isAdmin;
    setIsAdmin(newAdminState);
    if (!newAdminState && currentView === 'admin') {
      setCurrentView('home');
    }
  };

  const addBooking = (booking: Booking) => {
    setBookings(prev => [booking, ...prev]);
  };

  const renderView = () => {
    if (currentView === 'admin' && !isAdmin) return <Hero setView={setCurrentView} />;

    switch (currentView) {
      case 'home':
        return <Hero setView={setCurrentView} />;
      case 'portfolio':
        return <Portfolio projects={projects} filter="portfolio" />;
      case 'flash':
        return <Portfolio projects={projects} filter="flash" />;
      case 'booking':
        return <BookingSection onAddBooking={addBooking} />;
      case 'admin':
        return (
          <AdminDashboard 
            projects={projects} 
            bookings={bookings} 
            setProjects={setProjects}
            setBookings={setBookings}
          />
        );
      default:
        return <Hero setView={setCurrentView} />;
    }
  };

  return (
    <div className="min-h-screen bg-ink-900 bg-noise text-black font-sans selection:bg-black selection:text-white overflow-x-hidden">
      <Navbar 
        currentView={currentView} 
        setView={setCurrentView} 
        isAdmin={isAdmin}
        toggleAdmin={toggleAdmin}
      />
      <main className="relative z-10">
        {renderView()}
      </main>
      
      {/* Texture Overlay for Grain effect */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-50 bg-repeat bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] mix-blend-multiply"></div>
      
      {/* Footer */}
      {currentView !== 'home' && (
        <footer className="relative bg-transparent border-t-2 border-black py-12 text-center overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-ink-900 px-4">
             <span className="font-display font-bold text-xl uppercase tracking-widest">INK.SAI</span>
          </div>
          <p className="font-serif text-sm text-gray-600">© 2025. All Rights Reserved.</p>
        </footer>
      )}
    </div>
  );
}

export default App;