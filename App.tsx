import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Portfolio from './components/Portfolio';
import BookingSection from './components/Booking';
import AdminDashboard from './components/AdminDashboard';
import { ViewState, Project, Booking, Design, PortfolioItem, Appointment, User } from './types';
import { ContentController, BookingController } from './services/api';

function App() {
  const [currentView, setCurrentView] = useState<ViewState>('home');
  const [user, setUser] = useState<User | null>(null);

  // DATA STATE (Simulating Database connection)
  const [designs, setDesigns] = useState<Design[]>([]);
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  // Initial Data Load
  const refreshData = async () => {
    const d = await ContentController.getDesigns();
    const p = await ContentController.getPortfolio();
    const a = await BookingController.findAll();
    setDesigns(d);
    setPortfolio(p);
    setAppointments(a);
  };

  useEffect(() => {
    refreshData();
  }, []);

  const toggleAdmin = () => {
    if (currentView === 'admin') {
      setCurrentView('home');
    } else {
      setCurrentView('admin');
    }
  };

  const addBooking = async (bookingData: Booking) => {
    // Adapter to match new Appointment schema
    await BookingController.create({
      clientName: bookingData.clientName,
      clientEmail: bookingData.clientEmail,
      idea: bookingData.idea,
      date: bookingData.date,
      aiRefinedIdea: bookingData.aiRefinedIdea
    });
    refreshData(); // Refresh admin view
  };

  // ADAPTERS FOR OLD COMPONENTS (To avoid breaking changes in UI while using new data)
  // Converting new Schema to old 'Project' type for the Portfolio Component
  const portfolioProjects: Project[] = portfolio.map(p => ({
    id: p.id,
    title: p.title,
    imageUrl: p.imageUrl,
    category: 'portfolio',
    description: p.description
  }));

  const flashProjects: Project[] = designs.map(d => ({
    id: d.id,
    title: d.title,
    imageUrl: d.imageUrl,
    category: 'flash',
    price: d.price,
    description: `${d.style} - ${d.size || ''}`
  }));

  const allProjectsForView = [...portfolioProjects, ...flashProjects];

  const renderView = () => {
    switch (currentView) {
      case 'home':
        return <Hero setView={setCurrentView} />;
      case 'portfolio':
        return <Portfolio projects={allProjectsForView} filter="portfolio" />;
      case 'flash':
        return <Portfolio projects={allProjectsForView} filter="flash" />;
      case 'booking':
        return <BookingSection onAddBooking={addBooking} />;
      case 'admin':
        return (
          <AdminDashboard 
            user={user}
            onLogin={setUser}
            bookings={appointments}
            designs={designs}
            portfolio={portfolio}
            refreshData={refreshData}
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
        isAdmin={!!user}
        toggleAdmin={toggleAdmin}
      />
      <main className="relative z-10">
        {renderView()}
      </main>
      
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-50 bg-repeat bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] mix-blend-multiply"></div>
      
      {currentView !== 'home' && currentView !== 'admin' && (
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