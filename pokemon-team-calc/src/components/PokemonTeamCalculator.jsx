import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import axios from 'axios';
import { VictoryBar, VictoryChart, VictoryTheme, VictoryTooltip } from 'victory';
import localforage from 'localforage';
import { TypeChart } from '../data/typeChart';

// Type colors mapping
const typeColors = {
  fire: 'bg-orange-500',
  water: 'bg-blue-500',
  grass: 'bg-green-500',
  electric: 'bg-yellow-500',
  ice: 'bg-cyan-400',
  fighting: 'bg-red-700',
  poison: 'bg-purple-600',
  ground: 'bg-amber-700',
  flying: 'bg-sky-400',
  psychic: 'bg-pink-500',
  bug: 'bg-lime-600',
  rock: 'bg-stone-500',
  ghost: 'bg-indigo-600',
  dragon: 'bg-violet-600',
  dark: 'bg-neutral-800',
  steel: 'bg-slate-400',
  fairy: 'bg-rose-300',
  normal: 'bg-gray-400'
};

localforage.config({
  name: 'pokemon-cache',
  storeName: 'pokemon_data'
});

const PokemonTeamCalculator = () => {
  const [team, setTeam] = useState([]);
  const [opponent, setOpponent] = useState(null);
  const [suggestions, setSuggestions] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [opponentSearch, setOpponentSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [moveData, setMoveData] = useState({});
  const [selectedPokemon, setSelectedPokemon] = useState(null);

  const fetchWithCache = useCallback(async (url) => {
    const cached = await localforage.getItem(url);
    if (cached) return cached;
    
    const response = await axios.get(url);
    await localforage.setItem(url, response.data);
    return response.data;
  }, []);

  const searchPokemon = useCallback(async (query, isOpponent = false) => {
    if (query.length < 2) return;
    setLoading(true);
    try {
      const data = await fetchWithCache(
        `https://pokeapi.co/api/v2/pokemon/${query.toLowerCase()}`
      );
      const processedPokemon = {
        ...data,
        types: data.types.map(t => t.type.name.toLowerCase())
      };
      
      if (isOpponent) {
        setOpponent(processedPokemon);
      } else {
        setSearchResults([processedPokemon]);
        loadMoveData(processedPokemon);
      }
    } catch (err) {
      setError('PokÃ©mon not found');
    } finally {
      setLoading(false);
    }
  }, [fetchWithCache]);

  const loadMoveData = useCallback(async (pokemon) => {
    try {
      const moves = await Promise.all(
        pokemon.moves.slice(0, 4).map(async move => {
          const data = await fetchWithCache(move.move.url);
          return {
            name: data.name,
            type: data.type.name.toLowerCase(),
            power: data.power || 60,
            accuracy: data.accuracy || 100,
            pp: data.pp || 20
          };
        })
      );
      
      setMoveData(prev => ({
        ...prev,
        [pokemon.id]: moves
      }));
    } catch (err) {
      setError('Failed to load move data');
    }
  }, [fetchWithCache]);

  const calculateDamage = useCallback((attacker, move, defender) => {
    if (!defender?.types?.[0]) return 0;
    
    const level = 50;
    const attackStat = attacker.stats[1].base_stat;
    const defenseStat = defender.stats[2].base_stat;
    
    const base = Math.floor((2 * level) / 5 + 2);
    const damage = Math.floor(
      (base * move.power * (attackStat / defenseStat)) / 50 + 2
    );
    
    const stab = attacker.types.includes(move.type) ? 1.5 : 1;
    const effectiveness = TypeChart[move.type]?.strengths?.includes(defender.types[0]) ? 2 : 1;
    
    return Math.floor(damage * stab * effectiveness);
  }, []);

  const { coverage, weaknesses } = useMemo(() => {
    const coverage = new Set();
    const weaknesses = new Set();

    team.forEach(pokemon => {
      pokemon.types.forEach(type => {
        if (TypeChart[type]) {
          TypeChart[type].strengths.forEach(t => coverage.add(t));
          TypeChart[type].weaknesses.forEach(t => weaknesses.add(t));
        }
      });
    });

    return { coverage: [...coverage], weaknesses: [...weaknesses] };
  }, [team]);

  useEffect(() => {
    const newSuggestions = {
      addTypes: Object.keys(TypeChart).filter(type => 
        !coverage.includes(type) &&
        TypeChart[type].strengths.some(t => weaknesses.includes(t))
      ),
      replacePokemon: team.filter(pokemon => 
        pokemon.types.every(type => 
          TypeChart[type]?.weaknesses?.some(w => weaknesses.includes(w))
        )
      )
    };
    setSuggestions(newSuggestions);
  }, [coverage, weaknesses, team]);

  const battleRecommendation = useMemo(() => {
    if (!opponent) return null;

    return team.reduce((best, pokemon) => {
      const moves = moveData[pokemon.id] || [];
      const pokemonBest = moves.reduce((top, move) => {
        const damage = calculateDamage(pokemon, move, opponent);
        return damage > top.damage ? { move, damage } : top;
      }, { damage: 0 });

      return pokemonBest.damage > best.damage ? 
        { pokemon, ...pokemonBest } : best;
    }, { damage: 0 });
  }, [team, opponent, moveData, calculateDamage]);

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    const items = Array.from(team);
    const [reordered] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reordered);
    setTeam(items);
  };

  const statsData = (pokemon) => 
    pokemon.stats.map((stat, index) => ({
      stat: ['HP', 'Attack', 'Defense', 'Sp.Atk', 'Sp.Def', 'Speed'][index],
      value: stat.base_stat
    }));

  return (
    <div className="container mx-auto p-4 bg-gray-50 min-h-screen">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Team Builder Section */}
      <div className="mb-8 bg-white rounded-xl p-6 shadow-lg">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">Your Team</h2>
        
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="team" direction="horizontal">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="flex flex-wrap gap-4 mb-4 min-h-[120px]"
              >
                {team.map((pokemon, index) => (
                  <Draggable
                    key={pokemon.id}
                    draggableId={pokemon.id.toString()}
                    index={index}
                  >
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className="p-4 bg-white rounded-xl shadow-md cursor-move hover:shadow-lg transition-all transform hover:-translate-y-1"
                        onClick={() => setSelectedPokemon(pokemon)}
                      >
                        <img
                          src={pokemon.sprites.front_default}
                          alt={pokemon.name}
                          className="w-24 h-24 mx-auto"
                        />
                        <div className="flex gap-1 mt-2 justify-center">
                          {pokemon.types.map(type => (
                            <span
                              key={type}
                              className={`${typeColors[type]} text-white px-2 py-1 rounded-full text-xs font-medium`}
                            >
                              {type}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>

        {/* PokÃ©mon Search */}
        <div className="relative mb-4">
          <input
            type="text"
            placeholder="Search PokÃ©mon to add to your team..."
            className="w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              searchPokemon(e.target.value);
            }}
          />
          
          {loading && (
            <div className="absolute right-3 top-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            </div>
          )}

          {searchResults.length > 0 && (
            <div className="absolute z-10 w-full bg-white shadow-lg rounded-xl mt-1 max-h-60 overflow-y-auto">
              {searchResults.map((pokemon) => (
                <div
                  key={pokemon.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (team.length < 6) {
                      setTeam(prev => [...prev, {
                        ...pokemon,
                        types: pokemon.types.map(t => t.toLowerCase())
                      }]);
                      setSearchTerm('');
                      setSearchResults([]);
                    }
                  }}
                  className="p-3 hover:bg-blue-50 cursor-pointer flex items-center border-b"
                >
                  <img
                    src={pokemon.sprites.front_default}
                    alt={pokemon.name}
                    className="w-12 h-12 mr-3"
                  />
                  <div>
                    <span className="capitalize font-medium text-gray-800">{pokemon.name}</span>
                    <div className="flex gap-1 mt-1">
                      {pokemon.types.map(type => (
                        <span
                          key={type}
                          className={`${typeColors[type]} text-white px-2 py-1 rounded-full text-xs`}
                        >
                          {type}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Opponent Section */}
      <div className="mb-8 bg-white rounded-xl p-6 shadow-lg">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">Current Opponent</h2>
        <div className="relative">
          <input
            type="text"
            placeholder="Search opponent PokÃ©mon..."
            className="w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
            value={opponentSearch}
            onChange={(e) => {
              setOpponentSearch(e.target.value);
              searchPokemon(e.target.value, true);
            }}
          />
          {opponent && (
            <div className="mt-4 p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center">
                <img
                  src={opponent.sprites.front_default}
                  alt={opponent.name}
                  className="w-16 h-16 mr-4"
                />
                <div>
                  <h3 className="text-xl font-bold capitalize text-gray-800">{opponent.name}</h3>
                  <div className="flex gap-1 mt-1">
                    {opponent.types.map(type => (
                      <span
                        key={type}
                        className={`${typeColors[type]} text-white px-2 py-1 rounded-full text-xs`}
                      >
                        {type}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recommendations Dashboard */}
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        {/* Type Suggestions */}
        <div className="p-6 bg-white rounded-xl shadow-lg">
          <h3 className="text-xl font-bold mb-3 text-gray-800">Recommended Types</h3>
          <div className="flex flex-wrap gap-2">
            {suggestions.addTypes?.map((type) => (
              <span
                key={type}
                className={`${typeColors[type]} text-white px-3 py-1.5 rounded-full text-sm font-medium capitalize`}
              >
                {type}
              </span>
            ))}
          </div>
        </div>

        {/* Team Optimization */}
        <div className="p-6 bg-white rounded-xl shadow-lg">
          <h3 className="text-xl font-bold mb-3 text-gray-800">Team Optimization</h3>
          <ul className="space-y-2">
            {suggestions.replacePokemon?.map((pokemon) => (
              <li
                key={pokemon.id}
                className="flex items-center p-2 hover:bg-gray-50 rounded-lg cursor-pointer"
                onClick={() => setTeam(prev => prev.filter(p => p.id !== pokemon.id))}
              >
                <img
                  src={pokemon.sprites.front_default}
                  alt={pokemon.name}
                  className="w-10 h-10 mr-3"
                />
                <div>
                  <span className="capitalize font-medium text-gray-800">{pokemon.name}</span>
                  <div className="flex gap-1 mt-1">
                    {pokemon.types.map(type => (
                      <span
                        key={type}
                        className={`${typeColors[type]} text-white px-2 py-1 rounded-full text-xs`}
                      >
                        {type}
                      </span>
                    ))}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Battle Strategy */}
        <div className="p-6 bg-white rounded-xl shadow-lg">
          <h3 className="text-xl font-bold mb-3 text-gray-800">Best Matchup</h3>
          {battleRecommendation?.pokemon && (
            <div className="space-y-3">
              <div className="flex items-center bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-xl">
                <img
                  src={battleRecommendation.pokemon.sprites.front_default}
                  alt={battleRecommendation.pokemon.name}
                  className="w-16 h-16 mr-4"
                />
                <div>
                  <p className="font-semibold capitalize text-lg text-gray-800">
                    {battleRecommendation.pokemon.name}
                  </p>
                  <p className="text-sm text-gray-600 capitalize">
                    {battleRecommendation.move?.name}
                  </p>
                </div>
              </div>
              <div className="bg-gray-100 p-4 rounded-xl">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">Estimated Damage:</span>
                  <span className="text-lg font-bold text-blue-600">
                    {battleRecommendation.damage}
                  </span>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-sm font-medium text-gray-700">Effectiveness:</span>
                  <span className="text-lg font-bold text-green-600">
                    {TypeChart[battleRecommendation.move?.type]?.strengths.includes(opponent?.types[0]) ? '2x' : '1x'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stats Visualization */}
      {team.map((pokemon) => (
        <div key={pokemon.id} className="mb-8 bg-white rounded-xl p-6 shadow-lg">
          <h3 className="text-xl font-bold mb-4 text-gray-800 capitalize">{pokemon.name} Stats</h3>
          <div className="overflow-x-auto">
            <VictoryChart
              theme={VictoryTheme.material}
              domainPadding={20}
              height={300}
              width={600}
              padding={{ top: 20, bottom: 50, left: 50, right: 20 }}
            >
              <VictoryBar
                data={statsData(pokemon)}
                x="stat"
                y="value"
                labels={({ datum }) => `${datum.value}`}
                labelComponent={<VictoryTooltip />}
                style={{
                  data: { fill: "#4F46E5", width: 30 },
                  labels: { fontSize: 12 }
                }}
              />
            </VictoryChart>
          </div>
        </div>
      ))}

      {/* PokÃ©mon Details Modal */}
      {selectedPokemon && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4 capitalize text-gray-800">
              {selectedPokemon.name}
            </h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <img
                  src={selectedPokemon.sprites.front_default}
                  alt={selectedPokemon.name}
                  className="w-32 h-32 mx-auto"
                />
                <div className="mt-4 flex flex-wrap gap-2 justify-center">
                  {selectedPokemon.types.map((type) => (
                    <span
                      key={type}
                      className={`${typeColors[type]} text-white px-3 py-1.5 rounded-full text-sm font-medium`}
                    >
                      {type}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3 text-gray-800">Moves</h3>
                <ul className="space-y-2">
                  {(moveData[selectedPokemon.id] || []).map((move) => (
                    <li
                      key={move.name}
                      className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                    >
                      <span className="capitalize text-gray-700">{move.name}</span>
                      <div className="flex items-center gap-2">
                        <span
                          className={`${typeColors[move.type]} text-white px-2 py-1 rounded text-xs font-medium`}
                        >
                          {move.type}
                        </span>
                        <span className="text-sm font-medium text-gray-600">
                          {move.power} PWR
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <button
              onClick={() => setSelectedPokemon(null)}
              className="mt-6 w-full bg-blue-500 text-white py-2.5 rounded-xl hover:bg-blue-600 transition-colors font-medium"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PokemonTeamCalculator;