import React from 'react';
import { Draggable } from 'react-beautiful-dnd';
import { X } from 'lucide-react';
import TypeBadge from '../Shared/TypeBadge';

// Stat badge colors and icons using tailwind classes
const statConfig = {
  hp: {
    color: 'bg-red-500',
    icon: '❤️',
    label: 'HP'
  },
  attack: {
    color: 'bg-orange-500',
    icon: '⚔️',
    label: 'Atk'
  },
  defense: {
    color: 'bg-yellow-500',
    icon: '🛡️',
    label: 'Def'
  },
  'special-attack': {
    color: 'bg-purple-500',
    icon: '✨',
    label: 'Sp.Atk'
  },
  'special-defense': {
    color: 'bg-green-500',
    icon: '🌟',
    label: 'Sp.Def'
  },
  speed: {
    color: 'bg-blue-500',
    icon: '⚡',
    label: 'Spd'
  }
};

const StatBadge = ({ stat, value }) => {
  const config = statConfig[stat];
  
  return (
    <div className={`flex items-center px-2 py-1 rounded-full ${config.color} 
                    text-white text-xs font-medium shadow-sm`}>
      <span className="mr-1">{config.icon}</span>
      <span>{config.label}</span>
    </div>
  );
};

// Function to get the two highest stats
const getTopStats = (stats) => {
  const formattedStats = stats.map((stat, index) => ({
    name: ['hp', 'attack', 'defense', 'special-attack', 'special-defense', 'speed'][index],
    value: stat.base_stat
  }));

  return formattedStats
    .sort((a, b) => b.value - a.value)
    .slice(0, 2);
};

// Updated PokemonCard component
const PokemonCard = ({ pokemon, index, onClick, onRemove }) => {
  const topStats = getTopStats(pokemon.stats);

  return (
    <Draggable draggableId={`pokemon-${pokemon.id}`} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`
            bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-all 
            transform hover:-translate-y-1 cursor-move relative group
            ${snapshot.isDragging ? 'shadow-lg ring-2 ring-blue-400' : ''}
          `}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove(pokemon.id);
            }}
            className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 
                     text-white rounded-full p-1 z-10 opacity-0 group-hover:opacity-100 
                     transition-opacity shadow-lg"
          >
            <X size={16} />
          </button>

          <div 
            className="p-3"
            onClick={() => onClick(pokemon)}
          >
            <div className="relative bg-gray-700/50 rounded-lg p-2">
              <img
                src={pokemon.sprites.front_default}
                alt={pokemon.name}
                className="w-full h-24 object-contain mx-auto"
              />
              <h3 className="text-center text-sm font-medium capitalize mb-2 text-gray-100">
                {pokemon.name}
              </h3>
            </div>
            
            {/* Types */}
            <div className="flex flex-wrap gap-1 justify-center mt-2">
              {pokemon.types.map(type => (
                <TypeBadge key={type} type={type} small />
              ))}
            </div>

            {/* Stat Badges */}
            <div className="flex flex-wrap gap-1 justify-center mt-2">
              {topStats.map(stat => (
                <StatBadge key={stat.name} stat={stat.name} value={stat.value} />
              ))}
            </div>
          </div>
        </div>
      )}
    </Draggable>
  );
};

export { PokemonCard, StatBadge, getTopStats };