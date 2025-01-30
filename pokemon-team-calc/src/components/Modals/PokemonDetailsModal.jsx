import React, { useState, useEffect } from 'react';
import TypeBadge from '../Shared/TypeBadge';
import { Shield, Swords, Zap } from 'lucide-react';

const StatBar = ({ value, maxValue = 255, label }) => (
  <div className="w-full">
    <div className="flex justify-between mb-1">
      <span className="text-sm font-medium text-gray-300">{label}</span>
      <span className="text-sm font-medium text-gray-400">{value}</span>
    </div>
    <div className="w-full bg-gray-700 rounded-full h-2.5">
      <div
        className="bg-blue-500 h-2.5 rounded-full"
        style={{ width: `${(value / maxValue) * 100}%` }}
      ></div>
    </div>
  </div>
);

const RoleIndicator = ({ stat, threshold, icon: Icon, label }) => {
  const isGood = stat >= threshold;
  return (
    <div className={`flex items-center gap-2 ${isGood ? 'text-green-400' : 'text-gray-500'}`}>
      <Icon size={16} />
      <span className="text-sm">{label}</span>
    </div>
  );
};

const PokemonDetailsModal = ({ selectedPokemon, setSelectedPokemon, moveData, TypeChart }) => {

    const [speciesData, setSpeciesData] = useState(null);
    const [recommendedMoves, setRecommendedMoves] = useState([]);
    const [loading, setLoading] = useState(true);
  
    useEffect(() => {
      const fetchSpeciesData = async () => {
        if (!selectedPokemon) return;
        
        setLoading(true);
        try {
          // Fetch species data for description
          const speciesResponse = await fetch(
            `https://pokeapi.co/api/v2/pokemon-species/${selectedPokemon.id}`
          );
          const speciesJson = await speciesResponse.json();
          
          // Get English flavor text
          const englishEntry = speciesJson.flavor_text_entries.find(
            entry => entry.language.name === 'en'
          );
          
          setSpeciesData({
            description: englishEntry ? englishEntry.flavor_text.replace(/\\f/g, ' ') : '',
            genus: speciesJson.genera.find(g => g.language.name === 'en')?.genus || ''
          });
  
          // Get recommended moves based on stats and type
          const allMoves = await Promise.all(
            selectedPokemon.moves
              .filter(move => {
                // Filter moves that are learned by level-up
                return move.version_group_details.some(
                  detail => detail.move_learn_method.name === 'level-up'
                );
              })
              .slice(0, 8) // Get first 8 moves to avoid too many requests
              .map(async move => {
                const moveResponse = await fetch(move.move.url);
                const moveData = await moveResponse.json();
                return {
                  name: moveData.name,
                  type: moveData.type.name,
                  power: moveData.power,
                  accuracy: moveData.accuracy,
                  pp: moveData.pp,
                  damage_class: moveData.damage_class.name,
                  priority: moveData.priority,
                  meta: moveData.meta
                };
              })
          );
  
          // Select recommended moves based on stats and types
          const recommended = allMoves
            .filter(move => move.power) // Only moves with power
            .sort((a, b) => {
              // Prioritize STAB moves
              const aStab = selectedPokemon.types.includes(a.type) ? 1.5 : 1;
              const bStab = selectedPokemon.types.includes(b.type) ? 1.5 : 1;
              
              // Consider physical/special split based on pokemon's stats
              const physicalBias = selectedPokemon.stats[1].base_stat > selectedPokemon.stats[3].base_stat;
              const aPhysical = a.damage_class === 'physical';
              const bPhysical = b.damage_class === 'physical';
              
              // Calculate move score
              const aScore = a.power * aStab * (aPhysical === physicalBias ? 1.2 : 1);
              const bScore = b.power * bStab * (bPhysical === physicalBias ? 1.2 : 1);
              
              return bScore - aScore;
            })
            .slice(0, 4); // Get top 4 recommended moves
  
          setRecommendedMoves(recommended);
          setLoading(false);
        } catch (error) {
          console.error('Error fetching additional data:', error);
          setLoading(false);
        }
      };
  
      fetchSpeciesData();
    }, [selectedPokemon]);
  
    if (!selectedPokemon) return null;
  
    const stats = {
      hp: selectedPokemon.stats[0].base_stat,
      attack: selectedPokemon.stats[1].base_stat,
      defense: selectedPokemon.stats[2].base_stat,
      specialAttack: selectedPokemon.stats[3].base_stat,
      specialDefense: selectedPokemon.stats[4].base_stat,
      speed: selectedPokemon.stats[5].base_stat
    };
  
    const totalStats = Object.values(stats).reduce((a, b) => a + b, 0);
  
    const StatBar = ({ value, maxValue = 255, label }) => (
      <div className="w-full">
        <div className="flex justify-between mb-1">
          <span className="text-sm font-medium text-gray-300">{label}</span>
          <span className="text-sm font-medium text-gray-400">{value}</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2.5">
          <div
            className="bg-blue-500 h-2.5 rounded-full"
            style={{ width: `${(value / maxValue) * 100}%` }}
          ></div>
        </div>
      </div>
    );
  
    const RoleIndicator = ({ stat, threshold, icon: Icon, label }) => {
      const isGood = stat >= threshold;
      return (
        <div className={`flex items-center gap-2 ${isGood ? 'text-green-400' : 'text-gray-500'}`}>
          <Icon size={16} />
          <span className="text-sm">{label}</span>
        </div>
      );
    };
  
    // Calculate potential roles based on stats
    const roles = [
      {
        icon: Swords,
        label: 'Physical Attacker',
        value: stats.attack >= 100
      },
      {
        icon: Swords,
        label: 'Special Attacker',
        value: stats.specialAttack >= 100
      },
      {
        icon: Shield,
        label: 'Physical Wall',
        value: stats.defense >= 100 && stats.hp >= 80
      },
      {
        icon: Shield,
        label: 'Special Wall',
        value: stats.specialDefense >= 100 && stats.hp >= 80
      },
      {
        icon: Zap,
        label: 'Fast Sweeper',
        value: stats.speed >= 100 && (stats.attack >= 90 || stats.specialAttack >= 90)
      }
    ].filter(role => role.value);
  
    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
        <div className="bg-gray-800 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="p-6 border-b border-gray-700">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold capitalize text-white">
                {selectedPokemon.name}
              </h2>
              <div className="flex gap-2">
                {selectedPokemon.types.map((type) => (
                  <TypeBadge key={type} type={type} />
                ))}
              </div>
            </div>
          </div>
  
          <div className="p-6">
            <div className="grid md:grid-cols-2 gap-8">
              {/* Left Column */}
              <div>
                {/* Sprite and Basic Info */}
                <div className="bg-gray-700/50 rounded-xl p-6 text-center mb-6">
                  <img
                    src={selectedPokemon.sprites.front_default}
                    alt={selectedPokemon.name}
                    className="w-40 h-40 mx-auto"
                  />
                  <div className="mt-4">
                    <p className="text-gray-300">Height: {selectedPokemon.height / 10}m</p>
                    <p className="text-gray-300">Weight: {selectedPokemon.weight / 10}kg</p>
                  </div>
                </div>
  
                {/* Description */}
                {speciesData && (
                  <div className="bg-gray-700/50 rounded-xl p-6 mb-6">
                    <h3 className="text-xl font-semibold mb-2 text-white">About</h3>
                    <p className="text-gray-300 italic mb-2">{speciesData.genus}</p>
                    <p className="text-gray-300">{speciesData.description}</p>
                  </div>
                )}
  
                {/* Moves */}
                <div className="bg-gray-700/50 rounded-xl p-6">
                  <h3 className="text-xl font-semibold mb-4 text-white">
                    Recommended Moves
                  </h3>
                  {loading ? (
                    <div className="text-center text-gray-400">Loading moves...</div>
                  ) : (
                    <div className="space-y-3">
                      {recommendedMoves.map((move) => (
                        <div
                          key={move.name}
                          className="flex items-center justify-between bg-gray-600/50 rounded-lg p-3"
                        >
                          <div>
                            <p className="capitalize text-gray-100">{move.name}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <TypeBadge type={move.type} small />
                              <span className="text-sm text-gray-400">
                                {move.damage_class === 'physical' ? 'Physical' : 'Special'}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-gray-100">{move.power || '-'} Power</p>
                            <p className="text-sm text-gray-400">{move.accuracy || 100}% Accuracy</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
  
              {/* Right Column */}
              <div className="space-y-6">
                {/* Base Stats */}
                <div className="bg-gray-700/50 rounded-xl p-6">
                  <h3 className="text-xl font-semibold mb-4 text-white">Base Stats</h3>
                  <div className="space-y-4">
                    <StatBar value={stats.hp} label="HP" />
                    <StatBar value={stats.attack} label="Attack" />
                    <StatBar value={stats.defense} label="Defense" />
                    <StatBar value={stats.specialAttack} label="Sp. Attack" />
                    <StatBar value={stats.specialDefense} label="Sp. Defense" />
                    <StatBar value={stats.speed} label="Speed" />
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-600">
                    <p className="text-gray-300">
                      Total: <span className="font-bold text-white">{totalStats}</span>
                    </p>
                  </div>
                </div>
  
                {/* Potential Roles */}
                <div className="bg-gray-700/50 rounded-xl p-6">
                  <h3 className="text-xl font-semibold mb-4 text-white">Potential Roles</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <RoleIndicator
                      stat={stats.attack}
                      threshold={100}
                      icon={Swords}
                      label="Physical Attacker"
                    />
                    <RoleIndicator
                      stat={stats.specialAttack}
                      threshold={100}
                      icon={Swords}
                      label="Special Attacker"
                    />
                    <RoleIndicator
                      stat={stats.defense}
                      threshold={100}
                      icon={Shield}
                      label="Physical Wall"
                    />
                    <RoleIndicator
                      stat={stats.specialDefense}
                      threshold={100}
                      icon={Shield}
                      label="Special Wall"
                    />
                    <RoleIndicator
                      stat={stats.speed}
                      threshold={100}
                      icon={Zap}
                      label="Speed Sweeper"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
  
          {/* Footer */}
          <div className="p-6 border-t border-gray-700">
            <button
              onClick={() => setSelectedPokemon(null)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl transition-colors font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };
  
  export default PokemonDetailsModal;