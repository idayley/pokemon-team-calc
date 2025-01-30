import React, { useState, useEffect } from 'react';
import TypeBadge from './TypeBadge';

const SearchInput = ({
  label,
  value,
  onChange,
  loading,
  searchResults,
  onSelect,
  opponent,
  isOpponentSearch
}) => {
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (value.length < 2) {
        setSuggestions([]);
        return;
      }

      try {
        const response = await fetch('https://pokeapi.co/api/v2/pokemon?limit=898');
        const data = await response.json();
        
        const filtered = data.results
          .filter(pokemon => {
            const name = pokemon.name.toLowerCase();
            const search = value.toLowerCase();
            return (
              name.startsWith(search) ||
              name.includes(search)
            );
          })
          .sort((a, b) => {
            const aName = a.name.toLowerCase();
            const bName = b.name.toLowerCase();
            const search = value.toLowerCase();
            
            const aStartsWith = aName.startsWith(search);
            const bStartsWith = bName.startsWith(search);
            
            if (aStartsWith && !bStartsWith) return -1;
            if (!aStartsWith && bStartsWith) return 1;
            return aName.localeCompare(bName);
          })
          .slice(0, 8);

        setSuggestions(filtered);
        setShowSuggestions(true);
      } catch (error) {
        console.error('Error fetching suggestions:', error);
      }
    };

    fetchSuggestions();
  }, [value]);

  const handleSuggestionClick = async (suggestion) => {
    try {
      const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${suggestion.name}`);
      const pokemonData = await response.json();
      const processedPokemon = {
        ...pokemonData,
        types: pokemonData.types.map(t => t.type.name.toLowerCase())
      };
      
      // Update input value
      onChange({ target: { value: suggestion.name } });
      
      // Call onSelect with the processed pokemon data
      onSelect(processedPokemon);
      
      // Hide suggestions
      setShowSuggestions(false);
      
      // Clear input only for team pokemon search, not opponent
      if (!isOpponentSearch) {
        onChange({ target: { value: '' } });
      }
    } catch (error) {
      console.error('Error fetching Pokemon details:', error);
    }
  };

  // Handle clicking outside of the search component
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.search-container')) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  return (
    <div className="relative mb-4 search-container">
      <input
        type="text"
        placeholder={`Search ${label || 'Pokémon'}...`}
        className="w-full p-3 bg-gray-800 border border-gray-700 rounded-xl 
                 focus:outline-none focus:ring-2 focus:ring-blue-500 
                 text-gray-100 placeholder-gray-500"
        value={value}
        onChange={onChange}
        onFocus={() => setShowSuggestions(value.length >= 2)}
      />
      
      {loading && (
        <div className="absolute right-3 top-3 animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500" />
      )}

      {/* Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-gray-800 border border-gray-700 
                      rounded-xl shadow-lg max-h-80 overflow-y-auto">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion.name}
              className="w-full text-left px-4 py-3 hover:bg-gray-700 
                       transition-colors cursor-pointer border-b border-gray-700
                       last:border-b-0 capitalize text-gray-100"
              onClick={() => handleSuggestionClick(suggestion)}
            >
              {suggestion.name}
            </button>
          ))}
        </div>
      )}

      {opponent && (
        <div className="mt-4 p-4 bg-gray-700 rounded-xl">
          <div className="flex items-center">
            <img
              src={opponent.sprites.front_default}
              alt={opponent.name}
              className="w-16 h-16 mr-4"
            />
            <div>
              <h3 className="text-xl font-bold capitalize text-gray-100">
                {opponent.name}
              </h3>
              <div className="flex gap-1 mt-1">
                {opponent.types.map(type => (
                  <TypeBadge key={type} type={type} small />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchInput;