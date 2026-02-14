import React from 'react';
import { Project } from '../types';

interface PortfolioProps {
  projects: Project[];
  filter: 'portfolio' | 'flash';
}

const Portfolio: React.FC<PortfolioProps> = ({ projects, filter }) => {
  const filteredProjects = projects.filter(p => p.category === filter);

  return (
    <div className="min-h-screen pt-32 pb-24 px-4 sm:px-6 lg:px-8 bg-transparent">
      <div className="max-w-7xl mx-auto">
        
        {/* Header Section */}
        <div className="border-b-4 border-black pb-8 mb-12 flex flex-col md:flex-row items-baseline justify-between gap-4">
          <div>
            <h2 className="text-7xl md:text-9xl font-display font-bold text-black uppercase leading-none tracking-tighter">
              {filter === 'portfolio' ? 'OBRAS' : 'FLASH'}
            </h2>
          </div>
          <div className="md:text-right">
             <p className="font-serif font-bold text-lg md:text-xl uppercase tracking-wider bg-black text-white px-2 inline-block">
                Colección 2024-2025
            </p>
          </div>
        </div>

        {filteredProjects.length === 0 ? (
          <div className="text-center py-32 border-4 border-dashed border-gray-400">
            <p className="font-display text-4xl uppercase text-gray-400 font-bold">Sin contenido</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-y-16">
            {filteredProjects.map((project, index) => (
              <div key={project.id} className="group flex flex-col">
                
                {/* Frame */}
                <div className="relative bg-white border-4 border-black p-2 shadow-hard transition-transform group-hover:-translate-y-1 group-hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                  <div className="aspect-[4/5] overflow-hidden border-2 border-black bg-gray-200 relative">
                    <img
                      src={project.imageUrl}
                      alt={project.title}
                      className="h-full w-full object-cover zine-image"
                    />
                    
                    {/* Price Tag for Flash */}
                    {filter === 'flash' && project.price && (
                        <div className="absolute top-2 right-2 bg-white border-2 border-black px-2 py-1 z-10">
                            <span className="font-display font-bold text-xl">${project.price}</span>
                        </div>
                    )}

                    {/* Overlay on hover */}
                     <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors pointer-events-none"></div>
                  </div>
                  
                  {/* Tape Effect */}
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-24 h-6 bg-white/80 rotate-2 border border-gray-300 shadow-sm z-20"></div>
                </div>

                {/* Metadata */}
                <div className="mt-4 px-2">
                    <div className="flex justify-between items-end border-b-2 border-black pb-2">
                         <h3 className="text-2xl font-display font-bold uppercase leading-none">{project.title}</h3>
                         <span className="font-mono text-xs font-bold">{index + 1 < 10 ? `0${index+1}` : index+1}</span>
                    </div>
                    {project.description && (
                        <p className="font-serif text-sm mt-2 text-gray-700">{project.description}</p>
                    )}
                </div>

              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Portfolio;