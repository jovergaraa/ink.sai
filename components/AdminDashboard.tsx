import React, { useState } from 'react';
import { Design, PortfolioItem, Appointment, User } from '../types';
import { BookingController, ContentController, AuthService } from '../services/api';
import { Trash2, Plus, Check, X, LogIn, Lock, Grid, Image as ImageIcon, Calendar } from 'lucide-react';

interface AdminDashboardProps {
  user: User | null;
  onLogin: (user: User) => void;
  // Data passed from parent to keep sync, or fetched inside
  bookings: Appointment[];
  designs: Design[];
  portfolio: PortfolioItem[];
  refreshData: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ user, onLogin, bookings, designs, portfolio, refreshData }) => {
  const [activeTab, setActiveTab] = useState<'bookings' | 'flash' | 'portfolio'>('bookings');
  const [loginPass, setLoginPass] = useState('');
  const [loginError, setLoginError] = useState(false);

  // CMS States
  const [newDesign, setNewDesign] = useState<Partial<Design>>({ available: true });
  const [newPortfolio, setNewPortfolio] = useState<Partial<PortfolioItem>>({});

  // --- HANDLERS ---
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const user = await AuthService.login(loginPass);
    if (user) {
      onLogin(user);
      setLoginError(false);
    } else {
      setLoginError(true);
    }
  };

  const handleStatusUpdate = async (id: string, status: Appointment['status']) => {
    await BookingController.updateStatus(id, status);
    refreshData();
  };

  const handleAddDesign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDesign.title || !newDesign.imageUrl || !newDesign.price) return;
    await ContentController.addDesign(newDesign as Design);
    setNewDesign({ available: true, title: '', imageUrl: '', price: 0, style: '', size: '' });
    refreshData();
  };

  const handleDeleteDesign = async (id: string) => {
    if (window.confirm('¿Eliminar diseño?')) {
      await ContentController.deleteDesign(id);
      refreshData();
    }
  };

  const handleAddPortfolio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPortfolio.title || !newPortfolio.imageUrl) return;
    await ContentController.addPortfolioItem({
      ...newPortfolio,
      date: new Date().toISOString(),
      tags: []
    } as PortfolioItem);
    setNewPortfolio({ title: '', imageUrl: '', description: '' });
    refreshData();
  };

  const handleDeletePortfolio = async (id: string) => {
     if (window.confirm('¿Eliminar trabajo?')) {
      await ContentController.deletePortfolioItem(id);
      refreshData();
    }
  };

  // --- LOGIN VIEW ---
  if (!user) {
    return (
      <div className="min-h-screen pt-32 pb-12 px-4 flex items-center justify-center bg-transparent">
        <div className="bg-white border-4 border-black p-8 max-w-sm w-full shadow-hard">
          <div className="flex justify-center mb-6">
            <div className="bg-black text-white p-3">
              <Lock size={32} />
            </div>
          </div>
          <h2 className="text-3xl font-display font-bold text-center uppercase mb-6">Acceso Privado</h2>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              placeholder="Contraseña Maestra"
              value={loginPass}
              onChange={(e) => setLoginPass(e.target.value)}
              className="w-full border-4 border-black p-3 font-serif outline-none focus:bg-gray-50 text-center tracking-widest"
            />
            {loginError && <p className="text-red-600 font-bold text-center text-xs uppercase">Acceso Denegado</p>}
            <button type="submit" className="w-full bg-black text-white font-display font-bold uppercase py-3 border-4 border-black hover:bg-white hover:text-black transition-colors">
              Entrar
            </button>
          </form>
          <div className="mt-6 text-center">
             <p className="text-xs text-gray-400 font-mono">INK.SAI SYSTEM v1.0</p>
          </div>
        </div>
      </div>
    );
  }

  // --- DASHBOARD VIEW ---
  return (
    <div className="min-h-screen pt-32 pb-12 px-4 sm:px-6 lg:px-8 bg-gray-50/50">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-10 pb-4 border-b-4 border-black gap-4">
          <h2 className="text-4xl font-display font-bold text-black uppercase tracking-tighter">
            PANEL DE CONTROL
          </h2>
          <div className="flex gap-2">
            {[
              { id: 'bookings', label: 'Citas', icon: Calendar },
              { id: 'flash', label: 'Catálogo Flash', icon: Grid },
              { id: 'portfolio', label: 'Portafolio', icon: ImageIcon },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 font-bold uppercase text-sm border-2 ${
                  activeTab === tab.id ? 'bg-black text-white border-black' : 'bg-white text-gray-500 border-transparent hover:border-black'
                }`}
              >
                <tab.icon size={16} />
                <span className="hidden md:inline">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* --- BOOKINGS TAB --- */}
        {activeTab === 'bookings' && (
          <div className="bg-white border-4 border-black shadow-sm">
             {bookings.length === 0 && <p className="text-center py-12 text-gray-400 font-display uppercase">Sin Citas Pendientes</p>}
             <div className="divide-y-2 divide-gray-100">
              {bookings.map(booking => (
                <div key={booking.id} className="p-6 flex flex-col md:flex-row justify-between gap-6 hover:bg-gray-50">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-2">
                      <h3 className="text-xl font-display font-bold text-black uppercase">{booking.clientName}</h3>
                      <span className={`px-2 py-1 text-[10px] uppercase font-bold tracking-wider text-white ${
                        booking.status === 'pending' ? 'bg-yellow-500' :
                        booking.status === 'confirmed' ? 'bg-green-600' :
                        'bg-red-600'
                      }`}>
                        {booking.status}
                      </span>
                    </div>
                    <div className="font-serif text-sm text-gray-600 space-y-1 mb-4">
                        <p>📅 {booking.date}</p>
                        <p>📧 {booking.clientEmail}</p>
                    </div>
                    
                    <div className="p-4 bg-gray-100 border-l-4 border-black">
                      <p className="text-black font-bold text-sm uppercase mb-1">Proyecto:</p>
                      <p className="text-gray-800 font-serif italic">"{booking.idea}"</p>
                      {booking.aiRefinedIdea && (
                         <div className="mt-2 pt-2 border-t border-gray-300">
                           <p className="text-[10px] text-gray-500 uppercase tracking-wider">IA Refinada</p>
                           <p className="text-xs text-gray-600">{booking.aiRefinedIdea}</p>
                         </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex md:flex-col gap-2 justify-start">
                    {booking.status === 'pending' && (
                      <>
                        <button onClick={() => handleStatusUpdate(booking.id, 'confirmed')} className="bg-black text-white p-3 hover:bg-gray-800" title="Confirmar">
                            <Check size={20} />
                        </button>
                        <button onClick={() => handleStatusUpdate(booking.id, 'rejected')} className="bg-white border-2 border-black text-black p-3 hover:bg-red-50" title="Rechazar">
                            <X size={20} />
                        </button>
                      </>
                    )}
                    <button className="text-gray-400 hover:text-red-600 p-3" title="Eliminar Registro">
                        <Trash2 size={20} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- FLASH TAB --- */}
        {activeTab === 'flash' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
             {/* Upload Form */}
            <div className="bg-white p-6 border-4 border-black h-fit">
              <h3 className="text-xl font-display font-bold uppercase mb-4 flex items-center gap-2">
                <Plus size={20} /> Nuevo Flash
              </h3>
              <form onSubmit={handleAddDesign} className="space-y-4">
                <input type="text" placeholder="Título" required value={newDesign.title || ''} onChange={e => setNewDesign({...newDesign, title: e.target.value})} className="w-full border-b-2 border-gray-300 p-2 outline-none focus:border-black font-serif"/>
                <input type="url" placeholder="URL Imagen" required value={newDesign.imageUrl || ''} onChange={e => setNewDesign({...newDesign, imageUrl: e.target.value})} className="w-full border-b-2 border-gray-300 p-2 outline-none focus:border-black font-serif"/>
                <div className="flex gap-2">
                    <input type="number" placeholder="Precio ($)" required value={newDesign.price || ''} onChange={e => setNewDesign({...newDesign, price: Number(e.target.value)})} className="w-1/2 border-b-2 border-gray-300 p-2 outline-none focus:border-black font-serif"/>
                    <input type="text" placeholder="Tamaño" value={newDesign.size || ''} onChange={e => setNewDesign({...newDesign, size: e.target.value})} className="w-1/2 border-b-2 border-gray-300 p-2 outline-none focus:border-black font-serif"/>
                </div>
                <input type="text" placeholder="Estilo (Ej. Blackwork)" value={newDesign.style || ''} onChange={e => setNewDesign({...newDesign, style: e.target.value})} className="w-full border-b-2 border-gray-300 p-2 outline-none focus:border-black font-serif"/>
                
                <button type="submit" className="w-full bg-black text-white font-bold py-3 uppercase hover:bg-gray-800 mt-4">Publicar Diseño</button>
              </form>
            </div>

            {/* Grid */}
            <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-4">
               {designs.map(design => (
                 <div key={design.id} className="relative group border-2 border-black bg-white p-2">
                    <img src={design.imageUrl} className="w-full aspect-[3/4] object-cover grayscale" />
                    <div className="mt-2">
                        <p className="font-display font-bold text-sm uppercase truncate">{design.title}</p>
                        <p className="text-xs font-mono">${design.price}</p>
                    </div>
                    <button onClick={() => handleDeleteDesign(design.id)} className="absolute top-2 right-2 bg-red-600 text-white p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Trash2 size={14} />
                    </button>
                 </div>
               ))}
            </div>
          </div>
        )}

        {/* --- PORTFOLIO TAB --- */}
        {activeTab === 'portfolio' && (
           <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
             {/* Upload Form */}
            <div className="bg-white p-6 border-4 border-black h-fit">
              <h3 className="text-xl font-display font-bold uppercase mb-4 flex items-center gap-2">
                <Plus size={20} /> Nuevo Trabajo
              </h3>
              <form onSubmit={handleAddPortfolio} className="space-y-4">
                <input type="text" placeholder="Título" required value={newPortfolio.title || ''} onChange={e => setNewPortfolio({...newPortfolio, title: e.target.value})} className="w-full border-b-2 border-gray-300 p-2 outline-none focus:border-black font-serif"/>
                <input type="url" placeholder="URL Imagen" required value={newPortfolio.imageUrl || ''} onChange={e => setNewPortfolio({...newPortfolio, imageUrl: e.target.value})} className="w-full border-b-2 border-gray-300 p-2 outline-none focus:border-black font-serif"/>
                <textarea placeholder="Descripción del trabajo" rows={3} value={newPortfolio.description || ''} onChange={e => setNewPortfolio({...newPortfolio, description: e.target.value})} className="w-full border-2 border-gray-200 p-2 outline-none focus:border-black font-serif resize-none"/>
                
                <button type="submit" className="w-full bg-black text-white font-bold py-3 uppercase hover:bg-gray-800 mt-4">Subir Foto</button>
              </form>
            </div>

            {/* Grid */}
            <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-4">
               {portfolio.map(item => (
                 <div key={item.id} className="relative group border-2 border-black bg-white p-2">
                    <img src={item.imageUrl} className="w-full aspect-square object-cover grayscale" />
                    <div className="mt-2">
                        <p className="font-display font-bold text-sm uppercase truncate">{item.title}</p>
                    </div>
                    <button onClick={() => handleDeletePortfolio(item.id)} className="absolute top-2 right-2 bg-red-600 text-white p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Trash2 size={14} />
                    </button>
                 </div>
               ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default AdminDashboard;