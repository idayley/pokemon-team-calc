import React from 'react';
import { ArrowUpCircle } from 'lucide-react';

const EvolutionZone = ({ isDraggingOver }) => {
  return (
    <div className={`flex items-center justify-center h-20 border-2 border-dashed 
                   rounded-xl transition-colors ${
      isDraggingOver 
        ? 'border-blue-500 bg-blue-500/10' 
        : 'border-gray-700 bg-gray-800/50'
    }`}>
      <div className="flex items-center gap-2 text-gray-400">
        <ArrowUpCircle className={`w-6 h-6 ${
          isDraggingOver ? 'text-blue-500' : 'text-gray-500'
        }`} />
        <span className={isDraggingOver ? 'text-blue-500' : ''}>
          Drop to evolve Pokémon
        </span>
      </div>
    </div>
  );
};

export default EvolutionZone;