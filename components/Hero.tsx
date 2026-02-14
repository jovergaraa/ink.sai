import React from 'react';
import { ViewState } from '../types';

interface HeroProps {
  setView: (view: ViewState) => void;
}

const Hero: React.FC<HeroProps> = ({ setView }) => {
  return (
    <div className="relative min-h-screen pt-20 pb-12 px-4 md:px-8 max-w-7xl mx-auto flex flex-col md:flex-row gap-8 overflow-hidden">
      
      {/* SECCIÓN IZQUIERDA: Collage y Texto */}
      <div className="flex-1 flex flex-col relative">
        
        {/* Header Visual: INK.SAI */}
        <div className="mb-12">
           <h1 className="font-serif text-5xl md:text-7xl font-bold tracking-tighter text-black z-10 relative">
             INK.SAI
           </h1>
        </div>

        <div className="relative flex-1">
            {/* Imagen Principal (Tigre/Cuerpo) */}
            <div className="w-full md:w-3/5 border-4 border-black bg-white p-2 shadow-hard z-10 relative">
                 <img
                    src="https://images.unsplash.com/photo-1590246235044-f92e48f8670b?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"
                    alt="Tattoo Work"
                    className="w-full h-auto object-cover aspect-[3/4] zine-image"
                />
            </div>

            {/* Imagen Secundaria (Santa/Cara) - Superpuesta */}
            <div className="absolute top-0 right-0 md:right-10 w-2/5 md:w-1/3 border-4 border-black bg-white p-2 shadow-hard z-20">
                <img
                    src="https://images.unsplash.com/photo-1598371839696-5c5bb00bdc28?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80"
                    alt="Detail"
                    className="w-full h-auto object-cover aspect-square zine-image"
                />
            </div>

            {/* Poema (Bloque de texto flotante) */}
            <div className="mt-8 md:absolute md:bottom-20 md:right-0 md:text-right font-serif text-sm md:text-base font-bold leading-relaxed z-0 bg-transparent p-4">
                <p>Cae eternamente</p>
                <p>Cae al fondo del infinito</p>
                <p>Cae al fondo del tiempo</p>
                <p>Cae al fondo de ti mismo</p>
                <p className="mt-4">Cae lo más bajo que se</p>
                <p>pueda caer</p>
                <p>Cae sin vértigo</p>
                <p>A través de todos los</p>
                <p>espacios y todas las edades</p>
            </div>
            
            {/* Tribal Decorator */}
            <div className="absolute top-1/2 -left-10 w-32 h-64 pointer-events-none opacity-80 mix-blend-multiply">
                 <svg viewBox="0 0 100 200" className="w-full h-full fill-black">
                    <path d="M50,0 C60,20 80,40 100,50 C80,60 60,80 50,100 C40,80 20,60 0,50 C20,40 40,20 50,0 Z M50,100 C60,120 80,140 90,150 C70,160 60,180 50,200 C40,180 30,160 10,150 C20,140 40,120 50,100 Z" />
                 </svg>
            </div>
        </div>

        {/* Bottom Wide Image (Ojos) */}
        <div className="mt-8 w-full border-4 border-black h-32 md:h-48 overflow-hidden shadow-hard bg-black">
             <img
                src="https://images.unsplash.com/photo-1611501275019-9b5cda994e8d?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80"
                alt="Eyes"
                className="w-full h-full object-cover zine-image opacity-80"
            />
        </div>
      </div>

      {/* SECCIÓN DERECHA: Barra Vertical "DISPONIBLES" */}
      <div className="md:w-32 lg:w-40 flex flex-col md:border-l-4 border-black pl-0 md:pl-8 justify-between">
         
         <div className="hidden md:block">
            {/* Tribal small top */}
            <svg width="100%" height="60" viewBox="0 0 100 60" className="fill-black mb-8">
               <path d="M50,60 C40,40 20,20 0,0 L20,0 C40,20 60,20 80,0 L100,0 C80,20 60,40 50,60 Z" />
            </svg>
         </div>

         <div className="flex-1 flex flex-row md:flex-col items-center justify-between md:justify-center py-8 gap-4">
             {/* Main Vertical Text */}
             <h2 className="text-6xl md:text-8xl font-display font-bold text-black uppercase tracking-tighter md:writing-mode-vertical md:rotate-180 select-none leading-none">
                 DISPONIBLES
             </h2>
             
             {/* Sub Vertical Text */}
             <div className="flex flex-col md:flex-row items-center gap-2">
                <span className="font-display font-bold text-2xl md:text-3xl md:writing-mode-vertical md:rotate-180">DISEÑOS</span>
                <span className="font-display font-bold text-2xl md:text-3xl md:writing-mode-vertical md:rotate-180 text-white bg-black px-1">2025</span>
             </div>
         </div>

         {/* CTA Button */}
         <button
            onClick={() => setView('booking')}
            className="w-full py-4 bg-black text-white font-display font-bold text-xl uppercase tracking-widest border-2 border-black hover:bg-white hover:text-black transition-colors shadow-hard-sm"
          >
            AGENDAR
          </button>
      </div>

    </div>
  );
};

export default Hero;