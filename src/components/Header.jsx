import React from 'react';
import { Swords } from 'lucide-react';

const Header = () => {
  return (
    <header className="bg-gray-800 border-b border-gray-700">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Swords size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Pokémon Team Calculator</h1>
              <p className="text-gray-400 text-sm">Build your perfect competitive team</p>
            </div>
          </div>
          
          <div className="hidden sm:flex items-center gap-4">
            <a 
              href="https://pokemondb.net/pokedex/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-300 hover:text-white transition-colors"
            >
              Pokédex
            </a>
            <a 
              href="https://pokemonshowdown.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-300 hover:text-white transition-colors"
            >
              Pokémon Showdown
            </a>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;