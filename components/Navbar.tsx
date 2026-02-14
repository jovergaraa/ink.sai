import React, { useState } from 'react';
import { Menu, X, Lock } from 'lucide-react';
import { ViewState } from '../types';

interface NavbarProps {
  currentView: ViewState;
  setView: (view: ViewState) => void;
  isAdmin: boolean;
  toggleAdmin: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ currentView, setView, isAdmin, toggleAdmin }) => {
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { id: 'home', label: 'Inicio' },
    { id: 'portfolio', label: 'Obras' },
    { id: 'flash', label: 'Flash' },
    { id: 'booking', label: 'Agendar' },
  ];

  const handleNav = (view: ViewState) => {
    setView(view);
    setIsOpen(false);
  };

  return (
    <nav className="fixed w-full z-50 bg-white border-b-4 border-black transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <div className="flex items-center cursor-pointer group" onClick={() => handleNav('home')}>
             <div className="bg-black text-white px-2 py-1 border-2 border-transparent group-hover:bg-white group-hover:text-black group-hover:border-black transition-colors">
                <span className="font-serif text-2xl font-bold tracking-tighter">INK.SAI</span>
             </div>
          </div>
          
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-6">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleNav(item.id as ViewState)}
                  className={`px-3 py-1 text-lg font-display font-bold uppercase tracking-widest transition-all duration-200 border-2 ${
                    currentView === item.id
                      ? 'bg-black text-white border-black'
                      : 'bg-transparent text-gray-500 border-transparent hover:border-black hover:text-black'
                  }`}
                >
                  {item.label}
                </button>
              ))}
              {isAdmin && (
                <button
                   onClick={() => handleNav('admin')}
                   className="px-2 py-1 text-lg font-display font-bold uppercase tracking-wider text-red-600 border-2 border-transparent hover:border-red-600"
                >
                  Admin
                </button>
              )}
            </div>
          </div>

          <div className="hidden md:flex items-center pl-4 border-l-4 border-black ml-4 h-full">
            <button onClick={toggleAdmin} className="text-black hover:text-gray-600 transition-colors">
              <Lock size={20} />
            </button>
          </div>

          <div className="-mr-2 flex md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-black hover:bg-gray-100 focus:outline-none"
            >
              {isOpen ? <X className="block h-8 w-8" /> : <Menu className="block h-8 w-8" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden bg-white border-b-4 border-black relative z-50">
          <div className="px-4 pt-4 pb-6 space-y-2">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNav(item.id as ViewState)}
                className={`block w-full text-left px-4 py-3 text-3xl font-display font-bold uppercase tracking-tighter border-2 border-transparent ${
                   currentView === item.id
                      ? 'bg-black text-white border-black'
                      : 'text-gray-400 hover:text-black hover:border-black'
                }`}
              >
                {item.label}
              </button>
            ))}
             <button
                onClick={() => { toggleAdmin(); setIsOpen(false); }}
                className="block w-full text-left px-4 py-2 text-sm text-gray-400 uppercase mt-4"
              >
                {isAdmin ? 'Salir Admin' : 'Admin Login'}
              </button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;