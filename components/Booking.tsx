import React, { useState } from 'react';
import { Booking, AIResponse } from '../types';
import { refineTattooIdea } from '../services/geminiService';
import { Sparkles, Loader2, Info, ArrowRight } from 'lucide-react';

interface BookingProps {
  onAddBooking: (booking: Booking) => void;
}

const BookingSection: React.FC<BookingProps> = ({ onAddBooking }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    idea: '',
    date: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<AIResponse | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleConsultAI = async () => {
    if (!formData.idea.trim()) return;
    setIsRefining(true);
    const suggestion = await refineTattooIdea(formData.idea);
    setAiSuggestion(suggestion);
    setIsRefining(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    setTimeout(() => {
      const newBooking: Booking = {
        id: Date.now().toString(),
        clientName: formData.name,
        clientEmail: formData.email,
        idea: formData.idea,
        date: formData.date,
        status: 'pending',
        aiRefinedIdea: aiSuggestion ? `Idea: ${aiSuggestion.refinedIdea} | Estilo: ${aiSuggestion.suggestedStyle}` : undefined
      };
      
      onAddBooking(newBooking);
      setIsSubmitting(false);
      setSubmitted(true);
    }, 1500);
  };

  if (submitted) {
    return (
      <div className="min-h-screen pt-24 px-4 flex items-center justify-center bg-transparent">
        <div className="bg-white p-12 border-4 border-black text-center max-w-lg w-full shadow-hard">
          <h3 className="text-5xl font-display font-bold text-black uppercase mb-6 tracking-tighter">RECIBIDO</h3>
          <p className="text-black font-serif text-lg mb-8 border-y-2 border-black py-4">
            Tu solicitud ha sido registrada.<br/>
            Te contactaré vía email: <br/>
            <span className="font-bold bg-black text-white px-1">{formData.email}</span>
          </p>
          <button 
            onClick={() => { setSubmitted(false); setFormData({name:'', email:'', idea:'', date:''}); setAiSuggestion(null); }}
            className="w-full bg-black text-white py-4 font-display font-bold text-xl uppercase tracking-widest hover:bg-gray-800"
          >
            Volver al Inicio
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-32 pb-12 px-4 sm:px-6 lg:px-8 bg-transparent">
      <div className="max-w-6xl mx-auto">
        
        {/* Header Style "Cuidados" */}
        <div className="mb-16 border-y-4 border-black py-8 text-center bg-white relative">
            <h2 className="text-5xl md:text-7xl font-serif text-black tracking-tight z-10 relative">
                AGENDAR CITA
            </h2>
             {/* Decorative lines inside header */}
            <div className="absolute top-2 left-2 right-2 bottom-2 border border-black pointer-events-none"></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
            
            {/* Left Column: Instructions (The Zine List) */}
            <div className="relative">
                <div className="bg-white border-4 border-black p-8 shadow-hard relative overflow-hidden">
                     {/* Background noise specifically for this box */}
                    <div className="absolute inset-0 bg-noise opacity-20 pointer-events-none"></div>
                    
                    <h3 className="font-display font-bold text-3xl uppercase border-b-4 border-black pb-4 mb-6">
                        CONDICIONES
                    </h3>
                    
                    <ul className="space-y-6 font-serif text-lg text-black">
                        <li className="flex gap-4 items-start">
                             <span className="font-display font-bold text-2xl">01</span>
                             <p><span className="font-bold uppercase block text-sm tracking-wider mb-1">Depósito</span>Requerido del 30% para confirmar. No reembolsable.</p>
                        </li>
                         <li className="flex gap-4 items-start">
                             <span className="font-display font-bold text-2xl">02</span>
                             <p><span className="font-bold uppercase block text-sm tracking-wider mb-1">Diseños</span>Se visualizan únicamente el día de la cita.</p>
                        </li>
                         <li className="flex gap-4 items-start">
                             <span className="font-display font-bold text-2xl">03</span>
                             <p><span className="font-bold uppercase block text-sm tracking-wider mb-1">Acompañantes</span>Solo se permite el ingreso al cliente.</p>
                        </li>
                    </ul>

                    {/* Tribal element at bottom of card */}
                    <div className="mt-8 flex justify-center">
                        <svg width="120" height="40" viewBox="0 0 120 40" className="fill-black">
                             <path d="M60,40 C40,20 20,10 0,0 L20,5 C40,15 80,15 100,5 L120,0 C100,10 80,20 60,40 Z" />
                        </svg>
                    </div>
                </div>
            </div>

            {/* Right Column: The Form */}
            <div className="relative">
                <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                    
                    {/* Inputs styled as distinct blocks */}
                    <div className="relative group">
                        <label className="absolute -top-3 left-4 bg-black text-white px-2 font-display font-bold text-xs uppercase tracking-wider">Nombre Completo</label>
                        <input
                            type="text"
                            name="name"
                            required
                            value={formData.name}
                            onChange={handleInputChange}
                            className="w-full bg-white border-4 border-black p-4 font-serif text-lg outline-none focus:bg-gray-50 placeholder-gray-400"
                            placeholder="Introduce tu nombre"
                        />
                    </div>
                    
                    <div className="relative group">
                        <label className="absolute -top-3 left-4 bg-black text-white px-2 font-display font-bold text-xs uppercase tracking-wider">Email</label>
                         <input
                            type="email"
                            name="email"
                            required
                            value={formData.email}
                            onChange={handleInputChange}
                            className="w-full bg-white border-4 border-black p-4 font-serif text-lg outline-none focus:bg-gray-50 placeholder-gray-400"
                            placeholder="contacto@email.com"
                        />
                    </div>

                    <div className="relative group">
                        <label className="absolute -top-3 left-4 bg-black text-white px-2 font-display font-bold text-xs uppercase tracking-wider">Fecha Estimada</label>
                         <input
                            type="date"
                            name="date"
                            required
                            value={formData.date}
                            onChange={handleInputChange}
                            className="w-full bg-white border-4 border-black p-4 font-serif text-lg outline-none focus:bg-gray-50"
                        />
                    </div>

                    <div className="relative group">
                        <div className="flex justify-between items-center absolute -top-3 left-0 right-0 px-4">
                             <label className="bg-black text-white px-2 font-display font-bold text-xs uppercase tracking-wider">Tu Idea</label>
                             <button
                                type="button"
                                onClick={handleConsultAI}
                                disabled={!formData.idea || isRefining}
                                className="bg-white border-2 border-black px-2 py-0.5 text-xs font-bold uppercase hover:bg-black hover:text-white transition-colors flex items-center gap-1"
                             >
                                 {isRefining ? <Loader2 size={10} className="animate-spin" /> : <Sparkles size={10} />}
                                 Mejorar con IA
                             </button>
                        </div>
                        <textarea
                            name="idea"
                            required
                            rows={6}
                            value={formData.idea}
                            onChange={handleInputChange}
                            className="w-full bg-white border-4 border-black p-4 mt-2 font-serif text-lg outline-none focus:bg-gray-50 resize-none"
                            placeholder="Describe el tatuaje, zona del cuerpo y tamaño..."
                        />
                         {/* AI Result Box inside form */}
                        {aiSuggestion && (
                            <div className="mt-2 border-2 border-dashed border-black bg-gray-50 p-3 text-sm font-serif">
                                <p className="font-bold mb-1 uppercase text-xs">Sugerencia IA:</p>
                                <p>{aiSuggestion.refinedIdea}</p>
                            </div>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="mt-4 w-full bg-black text-white font-display font-bold text-2xl uppercase py-5 border-4 border-black hover:bg-white hover:text-black transition-all shadow-hard active:translate-x-[6px] active:translate-y-[6px] active:shadow-none"
                    >
                        {isSubmitting ? 'ENVIANDO...' : 'ENVIAR SOLICITUD'}
                    </button>
                </form>
            </div>
        </div>
      </div>
    </div>
  );
};

export default BookingSection;