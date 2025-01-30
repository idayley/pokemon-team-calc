import { Droppable } from 'react-beautiful-dnd';
import SearchInput from '../Shared/SearchInput';
import { PokemonCard } from './PokemonCard';

const TeamBuilder = ({ 
  team, 
  setTeam,
  searchTerm,
  searchResults,
  loading,
  setSearchTerm,
  setSelectedPokemon,
  searchPokemon,
  setSearchResults
}) => {
  const handleRemovePokemon = (pokemonId) => {
    setTeam(currentTeam => currentTeam.filter(pokemon => pokemon.id !== pokemonId));
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <SearchInput
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            searchPokemon(e.target.value);
          }}
          loading={loading}
          searchResults={searchResults}
          onSelect={(pokemon) => {
            if (team.length < 6) {
              setTeam(prev => [...prev, {
                ...pokemon,
                types: pokemon.types.map(t => t.toLowerCase())
              }]);
              setSearchTerm('');
              setSearchResults([]);
            }
          }}
        />
      </div>

      <Droppable droppableId="team" direction="horizontal">
        {(provided, snapshot) => (
          <div
            {...provided.droppableProps}
            ref={provided.innerRef}
            className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 min-h-[160px] ${
              snapshot.isDraggingOver ? 'bg-gray-700/50' : ''
            } rounded-lg p-2`}
          >
            {team.map((pokemon, index) => (
              <PokemonCard
                key={pokemon.id}
                pokemon={pokemon}
                index={index}
                onClick={setSelectedPokemon}
                onRemove={handleRemovePokemon}
              />
            ))}
            {team.length < 6 && [...Array(6 - team.length)].map((_, i) => (
              <div
                key={`empty-${i}`}
                className="border-2 border-dashed border-gray-700 rounded-xl h-[160px] 
                         flex items-center justify-center bg-gray-800/50"
              >
                <span className="text-gray-500">Empty Slot</span>
              </div>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
};

export default TeamBuilder;