import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { DragDropContext } from 'react-beautiful-dnd';
import axios from 'axios';
import localforage from 'localforage';
import { TypeChart } from '../data/typeChart';
import TeamBuilder from './TeamBuilder/TeamBuilder';
import BattleRecommendation from './BattleStrategy/BattleRecommendation';
import TeamRecommendations from './TeamBuilder/TeamRecommendations';
import PokemonTeamAnalyzer from './TeamBuilder/PokemonTeamAnalyzer'; 
import SearchInput from './Shared/SearchInput';
import PokemonDetailsModal from './Modals/PokemonDetailsModal';
import Header from './Header';
import {
  searchPokemon as searchPokemonCache,
  getPokemonDetails,
  getSpeciesDetails,
  getMoveDetails
} from '../utils/pokemonCache';

// Configure localforage
localforage.config({
  name: 'pokemon-cache',
  storeName: 'pokemon_data'
});

// Constants for storage keys
const STORAGE_KEYS = {
  TEAM: 'pokemon-team',
  OPPONENT: 'current-opponent',
  MOVE_DATA: 'pokemon-move-data',
  LAST_UPDATED: 'last-updated'
};

const fetchEvolutionData = async (pokemon) => {
  try {
    // Get species data which contains evolution chain URL
    const speciesResponse = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${pokemon.name}`);
    const speciesData = await speciesResponse.json();
    
    // Fetch evolution chain data
    const evolutionResponse = await fetch(speciesData.evolution_chain.url);
    const evolutionData = await evolutionResponse.json();
    
    // Helper function to extract evolution chain
    const getEvolutionChain = (chain) => {
      const evolutions = [chain.species.name];
      let currentChain = chain;
      
      while (currentChain.evolves_to.length > 0) {
        // Get the first evolution path (most common)
        currentChain = currentChain.evolves_to[0];
        evolutions.push(currentChain.species.name);
      }
      
      return evolutions;
    };
    
    const evolutionChain = getEvolutionChain(evolutionData.chain);
    const currentIndex = evolutionChain.indexOf(pokemon.name);
    return currentIndex < evolutionChain.length - 1 ? evolutionChain[currentIndex + 1] : null;
    
  } catch (error) {
    console.error('Error fetching evolution data:', error);
    return null;
  }
};

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

  // Load saved data on component mount
  useEffect(() => {
    const loadSavedData = async () => {
      try {
        const savedTeam = localStorage.getItem(STORAGE_KEYS.TEAM);
        if (savedTeam) {
          setTeam(JSON.parse(savedTeam));
        }

        const savedOpponent = localStorage.getItem(STORAGE_KEYS.OPPONENT);
        if (savedOpponent) {
          setOpponent(JSON.parse(savedOpponent));
        }

        const savedMoveData = localStorage.getItem(STORAGE_KEYS.MOVE_DATA);
        if (savedMoveData) {
          setMoveData(JSON.parse(savedMoveData));
        }
      } catch (error) {
        console.error('Error loading saved data:', error);
        localStorage.clear();
      }
    };

    loadSavedData();
  }, []);

  // Save data whenever it changes
  useEffect(() => {
    if (team.length > 0) {
      localStorage.setItem(STORAGE_KEYS.TEAM, JSON.stringify(team));
    }
    if (opponent) {
      localStorage.setItem(STORAGE_KEYS.OPPONENT, JSON.stringify(opponent));
    }
    if (Object.keys(moveData).length > 0) {
      localStorage.setItem(STORAGE_KEYS.MOVE_DATA, JSON.stringify(moveData));
    }
    localStorage.setItem(STORAGE_KEYS.LAST_UPDATED, new Date().toISOString());
  }, [team, opponent, moveData]);

  const searchPokemon = useCallback(async (query, isOpponent = false) => {
    if (query.length < 2) return;
    setLoading(true);
    try {
      const searchResults = await searchPokemonCache(query);
      if (searchResults.length > 0) {
        const pokemonData = await getPokemonDetails(searchResults[0].name);
        
        if (isOpponent) {
          setOpponent(pokemonData);
        } else {
          setSearchResults([pokemonData]);
          await loadMoveData(pokemonData);
        }
      }
    } catch (err) {
      setError('Pokémon not found');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMoveData = useCallback(async (pokemon) => {
    try {
      const moves = await Promise.all(
        pokemon.moves.slice(0, 4).map(async move => {
          const data = await getMoveDetails(move.move.url);
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
  }, []);

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

  useEffect(() => {
    document.documentElement.classList.add('dark');
    return () => document.documentElement.classList.remove('dark');
  }, []);

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

  const handleDragEnd = async (result) => {
    if (!result.destination) return;
  
    const sourceIndex = result.source.index;
    const pokemon = team[sourceIndex];
  
    // Handle dropping into trash
    if (result.destination.droppableId === 'trash') {
      setTeam(team.filter((_, index) => index !== sourceIndex));
      return;
    }
  
    // Handle dropping into evolution zone
    if (result.destination.droppableId === 'evolution') {
      setLoading(true);
      try {
        const nextEvolution = await fetchEvolutionData(pokemon);
        
        if (nextEvolution) {
          // Fetch evolved Pokemon data
          const evolvedResponse = await fetch(`https://pokeapi.co/api/v2/pokemon/${nextEvolution}`);
          const evolvedPokemon = await evolvedResponse.json();
          
          // Replace the original Pokemon with its evolution
          const newTeam = [...team];
          newTeam[sourceIndex] = {
            ...evolvedPokemon,
            types: evolvedPokemon.types.map(t => t.type.name.toLowerCase())
          };
          setTeam(newTeam);
        } else {
          // No evolution available, just add the original back
          const newTeam = [...team];
          newTeam[sourceIndex] = pokemon;
          setTeam(newTeam);
        }
      } catch (error) {
        console.error('Error evolving Pokemon:', error);
        // In case of error, keep the original Pokemon
        const newTeam = [...team];
        newTeam[sourceIndex] = pokemon;
        setTeam(newTeam);
      }
      setLoading(false);
      return;
    }
  
    // Handle reordering within team
    if (result.destination.droppableId === 'team') {
      const items = Array.from(team);
      const [reorderedItem] = items.splice(sourceIndex, 1);
      items.splice(result.destination.index, 0, reorderedItem);
      setTeam(items);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      <Header />
      <div className="container mx-auto px-4 py-8">
        {/* Mobile: Opponent Search First */}
        <div className="md:hidden mb-6">
          <div className="bg-gray-800 rounded-xl shadow-lg">
            <div className="p-6 border-b border-gray-700">
              <h2 className="text-xl font-bold text-white">Current Opponent</h2>
              <p className="text-gray-400 mt-1">Select your opponent</p>
            </div>
            <div className="p-6">
              <SearchInput
                label="Opponent"
                value={opponentSearch}
                onChange={(e) => {
                  setOpponentSearch(e.target.value);
                  searchPokemon(e.target.value, true);
                }}
                opponent={opponent}
              />
            </div>
          </div>

          {opponent && (
            <div className="bg-gray-800 rounded-xl shadow-lg mt-6">
              <div className="p-6 border-b border-gray-700">
                <h2 className="text-xl font-bold text-white">Battle Analysis</h2>
                <p className="text-gray-400 mt-1">Best matchup against current opponent</p>
              </div>
              <div className="p-6">
                <BattleRecommendation 
                  team={team}
                  opponent={opponent}
                  moveData={moveData}
                  calculateDamage={calculateDamage}
                  TypeChart={TypeChart}
                  battleRecommendation={battleRecommendation}
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col md:flex-row gap-6">
          {/* Left Column - Team Builder */}
          <div className="w-full md:w-2/3">
            <div className="bg-gray-800 rounded-xl shadow-lg">
              <div className="p-6 border-b border-gray-700">
                <h2 className="text-2xl font-bold text-white">Your Team</h2>
                <p className="text-gray-400 mt-1">Build your perfect team of 6 Pokémon, tap on a pokemon to see its stats</p>
              </div>
              
              <DragDropContext onDragEnd={handleDragEnd}>
                <TeamBuilder 
                  team={team}
                  setTeam={setTeam}
                  searchTerm={searchTerm}
                  searchResults={searchResults}
                  loading={loading}
                  setSearchTerm={setSearchTerm}
                  setSelectedPokemon={setSelectedPokemon}
                  searchPokemon={searchPokemon}
                  setSearchResults={setSearchResults}
                  TypeChart={TypeChart}
                />
              </DragDropContext>
            </div>

            {team.length > 0 && (
              <>
                <div className="mt-6">
                  <TeamRecommendations team={team} TypeChart={TypeChart} />
                </div>
                {/* <div className="mt-6">
                  <PokemonTeamAnalyzer 
                    team={team}
                    setTeam={setTeam}
                    TypeChart={TypeChart}
                    onSelectPokemon={setSelectedPokemon}
                    searchPokemon={searchPokemon}
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                    loading={loading}
                    searchResults={searchResults}
                  />
                </div> */}
              </>
            )}
          </div>

          {/* Right Column - Battle Info (Hidden on Mobile) */}
          <div className="hidden md:block w-full md:w-1/3">
            <div className="bg-gray-800 rounded-xl shadow-lg">
              <div className="p-6 border-b border-gray-700">
                <h2 className="text-xl font-bold text-white">Current Opponent</h2>
                <p className="text-gray-400 mt-1">Select your opponent</p>
              </div>
              <div className="p-6">
                <SearchInput
                  label="Opponent"
                  value={opponentSearch}
                  onChange={(e) => {
                    setOpponentSearch(e.target.value);
                    searchPokemon(e.target.value, true);
                  }}
                  opponent={opponent}
                />
              </div>
            </div>

            {opponent && (
              <div className="bg-gray-800 rounded-xl shadow-lg mt-6">
                <div className="p-6 border-b border-gray-700">
                  <h2 className="text-xl font-bold text-white">Battle Analysis</h2>
                  <p className="text-gray-400 mt-1">Best matchup against current opponent</p>
                </div>
                <div className="p-6">
                  <BattleRecommendation 
                    team={team}
                    opponent={opponent}
                    moveData={moveData}
                    calculateDamage={calculateDamage}
                    TypeChart={TypeChart}
                    battleRecommendation={battleRecommendation}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <PokemonDetailsModal
          selectedPokemon={selectedPokemon}
          setSelectedPokemon={setSelectedPokemon}
          moveData={moveData}
          TypeChart={TypeChart}
        />
      </div>
    </div>
  );
};

export default PokemonTeamCalculator;