import React, { useState } from 'react';
import { Project, Booking } from '../types';
import { Trash2, Plus, Check, X, Calendar, Image as ImageIcon } from 'lucide-react';

interface AdminDashboardProps {
  projects: Project[];
  bookings: Booking[];
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
  setBookings: React.Dispatch<React.SetStateAction<Booking[]>>;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ projects, bookings, setProjects, setBookings }) => {
  const [activeTab, setActiveTab] = useState<'bookings' | 'content'>('bookings');
  const [newProject, setNewProject] = useState({
    title: '',
    imageUrl: '',
    category: 'portfolio',
    description: '',
    price: ''
  });

  const handleBookingStatus = (id: string, status: 'confirmed' | 'rejected') => {
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status } : b));
  };

  const handleDeleteProject = (id: string) => {
    setProjects(prev => prev.filter(p => p.id !== id));
  };

  const handleAddProject = (e: React.FormEvent) => {
    e.preventDefault();
    const project: Project = {
      id: Date.now().toString(),
      title: newProject.title,
      imageUrl: newProject.imageUrl || `https://picsum.photos/seed/${Date.now()}/400/400`,
      category: newProject.category as 'portfolio' | 'flash',
      description: newProject.description,
      price: newProject.price ? Number(newProject.price) : undefined
    };
    setProjects(prev => [project, ...prev]);
    setNewProject({ title: '', imageUrl: '', category: 'portfolio', description: '', price: '' });
  };

  return (
    <div className="min-h-screen pt-32 pb-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-10 pb-4 border-b border-gray-200">
          <h2 className="text-2xl font-serif font-bold text-black uppercase tracking-wider">Dashboard</h2>
          <div className="flex space-x-2">
            <button
              onClick={() => setActiveTab('bookings')}
              className={`px-6 py-2 text-sm font-bold uppercase tracking-wider transition-all ${activeTab === 'bookings' ? 'bg-black text-white' : 'bg-white text-gray-500 border border-gray-200 hover:border-black'}`}
            >
              Citas
            </button>
            <button
              onClick={() => setActiveTab('content')}
              className={`px-6 py-2 text-sm font-bold uppercase tracking-wider transition-all ${activeTab === 'content' ? 'bg-black text-white' : 'bg-white text-gray-500 border border-gray-200 hover:border-black'}`}
            >
              Contenido
            </button>
          </div>
        </div>

        {activeTab === 'bookings' ? (
          <div className="bg-white border border-gray-200 rounded-sm shadow-sm">
             {bookings.length === 0 && <p className="text-gray-400 text-center py-12 font-light">No hay solicitudes pendientes.</p>}
             <div className="divide-y divide-gray-100">
              {bookings.map(booking => (
                <div key={booking.id} className="p-6 flex flex-col md:flex-row justify-between gap-6 hover:bg-gray-50 transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-2">
                      <h3 className="text-lg font-bold text-black">{booking.clientName}</h3>
                      <span className={`px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider border ${
                        booking.status === 'pending' ? 'border-yellow-500 text-yellow-600' :
                        booking.status === 'confirmed' ? 'border-green-500 text-green-600' :
                        'border-red-500 text-red-600'
                      }`}>
                        {booking.status}
                      </span>
                    </div>
                    <p className="text-gray-500 text-sm mb-1">{booking.clientEmail} • {booking.date}</p>
                    
                    <div className="mt-3 p-4 bg-gray-50 border-l-2 border-black">
                      <p className="text-gray-800 text-sm font-serif">"{booking.idea}"</p>
                      {booking.aiRefinedIdea && (
                         <div className="mt-2 pt-2 border-t border-gray-200">
                           <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">IA Refinada</p>
                           <p className="text-xs text-gray-600 italic">{booking.aiRefinedIdea}</p>
                         </div>
                      )}
                    </div>
                  </div>

                  {booking.status === 'pending' && (
                    <div className="flex items-start gap-2">
                      <button 
                        onClick={() => handleBookingStatus(booking.id, 'confirmed')}
                        className="bg-black hover:bg-gray-800 text-white p-2 rounded-sm transition-colors"
                        title="Aceptar"
                      >
                        <Check size={16} />
                      </button>
                      <button 
                         onClick={() => handleBookingStatus(booking.id, 'rejected')}
                        className="border border-gray-300 text-gray-400 hover:text-red-500 hover:border-red-500 p-2 rounded-sm transition-colors"
                        title="Rechazar"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="bg-white p-8 border border-gray-200 h-fit lg:sticky lg:top-24">
              <h3 className="text-lg font-bold text-black mb-6 uppercase tracking-wider flex items-center gap-2">
                <Plus size={18} /> Nuevo Proyecto
              </h3>
              <form onSubmit={handleAddProject} className="space-y-4">
                <input
                  type="text"
                  placeholder="Título del proyecto"
                  required
                  value={newProject.title}
                  onChange={e => setNewProject({...newProject, title: e.target.value})}
                  className="w-full bg-white border-b border-gray-300 p-2 text-black focus:border-black outline-none placeholder-gray-400"
                />
                <input
                  type="url"
                  placeholder="URL de la imagen"
                  value={newProject.imageUrl}
                  onChange={e => setNewProject({...newProject, imageUrl: e.target.value})}
                  className="w-full bg-white border-b border-gray-300 p-2 text-black focus:border-black outline-none placeholder-gray-400"
                />
                <select
                  value={newProject.category}
                  onChange={e => setNewProject({...newProject, category: e.target.value})}
                  className="w-full bg-white border-b border-gray-300 p-2 text-black focus:border-black outline-none"
                >
                  <option value="portfolio">Portafolio</option>
                  <option value="flash">Flash</option>
                </select>
                
                {newProject.category === 'flash' && (
                  <input
                    type="number"
                    placeholder="Precio"
                    value={newProject.price}
                    onChange={e => setNewProject({...newProject, price: e.target.value})}
                    className="w-full bg-white border-b border-gray-300 p-2 text-black focus:border-black outline-none placeholder-gray-400"
                  />
                )}
                
                <textarea
                  placeholder="Descripción breve"
                  rows={3}
                  value={newProject.description}
                  onChange={e => setNewProject({...newProject, description: e.target.value})}
                  className="w-full bg-white border border-gray-200 p-3 text-black focus:border-black outline-none placeholder-gray-400 mt-2 resize-none"
                />
                
                <button type="submit" className="w-full bg-black text-white font-bold py-3 uppercase tracking-widest hover:bg-gray-800 transition-colors text-sm mt-4">
                  Publicar
                </button>
              </form>
            </div>

            <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
              {projects.map(project => (
                <div key={project.id} className="group bg-white border border-gray-200 flex flex-col">
                  <div className="relative h-64 overflow-hidden">
                    <img src={project.imageUrl} alt={project.title} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" />
                    <span className="absolute top-2 right-2 bg-white text-black text-[10px] font-bold px-2 py-1 uppercase tracking-wider border border-black">
                      {project.category}
                    </span>
                  </div>
                  <div className="p-5 flex-1">
                    <div className="flex justify-between items-start mb-2">
                        <h4 className="font-bold text-black uppercase tracking-wide">{project.title}</h4>
                        {project.price && <p className="text-black font-bold">${project.price}</p>}
                    </div>
                    <p className="text-gray-500 text-xs">{project.description}</p>
                  </div>
                  <button 
                    onClick={() => handleDeleteProject(project.id)}
                    className="w-full border-t border-gray-100 text-gray-400 hover:text-red-600 hover:bg-red-50 py-3 transition-colors text-xs uppercase font-bold flex items-center justify-center gap-2"
                  >
                    <Trash2 size={14} /> Eliminar
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