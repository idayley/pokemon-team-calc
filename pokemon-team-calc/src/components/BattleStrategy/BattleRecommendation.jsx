import React from 'react';
import TypeBadge from '../Shared/TypeBadge';
import { Shield, Swords } from 'lucide-react';

const BattleRecommendation = ({ team, opponent, TypeChart }) => {
  if (!opponent) return null;

  // Find vulnerable Pokémon against the opponent
  const getVulnerablePokemon = () => {
    return team
      .map(pokemon => {
        // Calculate how many of the opponent's types are super effective against this Pokémon
        const vulnerabilities = opponent.types.filter(oppType => 
          TypeChart[oppType]?.strengths.some(strength => 
            pokemon.types.includes(strength)
          )
        );

        // Calculate if the Pokémon is doubly weak (4x damage)
        const doubleWeakness = opponent.types.some(oppType =>
          pokemon.types.every(pokeType =>
            TypeChart[oppType]?.strengths.includes(pokeType)
          )
        );

        return {
          pokemon,
          vulnerabilities,
          doubleWeakness,
          vulnerabilityScore: vulnerabilities.length + (doubleWeakness ? 2 : 0)
        };
      })
      .filter(({ vulnerabilityScore }) => vulnerabilityScore > 0)
      .sort((a, b) => b.vulnerabilityScore - a.vulnerabilityScore);
  };

  // Find the best attacking types against the opponent
  const getTypeAdvantages = () => {
    const advantages = [];
    
    Object.entries(TypeChart).forEach(([attackType, typeInfo]) => {
      let multiplier = 1;
      
      opponent.types.forEach(defenseType => {
        if (typeInfo.strengths.includes(defenseType)) {
          multiplier *= 2;
        }
        if (typeInfo.weaknesses.includes(defenseType)) {
          multiplier *= 0.5;
        }
      });
      
      advantages.push({
        type: attackType,
        multiplier
      });
    });

    return advantages.sort((a, b) => b.multiplier - a.multiplier);
  };

  // Calculate defensive effectiveness for a Pokémon against the opponent's types
  const getDefensiveEffectiveness = (pokemon) => {
    let bestResistance = 1;
    let bestResistanceType = '';

    opponent.types.forEach(attackType => {
      const typeInfo = TypeChart[attackType];
      if (!typeInfo) return;

      let resistance = 1;
      pokemon.types.forEach(defenseType => {
        if (typeInfo.weaknesses.includes(defenseType)) {
          resistance *= 0.5; // Resistant
        }
        if (typeInfo.strengths.includes(defenseType)) {
          resistance *= 2; // Weak
        }
      });

      if (resistance < bestResistance) {
        bestResistance = resistance;
        bestResistanceType = attackType;
      }
    });

    return {
      resistance: bestResistance,
      type: bestResistanceType
    };
  };

  const getBestDefenders = () => {
    return team.map(pokemon => ({
      pokemon,
      ...getDefensiveEffectiveness(pokemon)
    }))
    .sort((a, b) => a.resistance - b.resistance)
    .filter(({ resistance }) => resistance < 1);
  };

  const getBestAttackers = (typeAdvantages) => {
    const matches = [];
    
    team.forEach(pokemon => {
      const bestType = typeAdvantages.find(advantage => 
        pokemon.types.includes(advantage.type)
      );
      
      if (bestType) {
        matches.push({
          pokemon,
          ...bestType
        });
      }
    });

    return matches.sort((a, b) => b.multiplier - a.multiplier);
  };

  const typeAdvantages = getTypeAdvantages();
  const bestAttackers = getBestAttackers(typeAdvantages);
  const bestDefenders = getBestDefenders();
  const vulnerablePokemon = getVulnerablePokemon();
  const bestTypes = typeAdvantages.slice(0, 2);

  return (
    <div className="space-y-6">
      {/* Opponent Type Display */}
      <div className="flex items-center justify-between bg-gray-700 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <img
            src={opponent.sprites.front_default}
            alt={opponent.name}
            className="w-12 h-12"
          />
          <div>
            <h3 className="text-lg font-semibold capitalize text-gray-100">
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

      {/* Avoid Using Section */}
      {vulnerablePokemon.length > 0 && (
        <div className="bg-gray-700 rounded-xl p-4">
          <h3 className="text-lg font-semibold mb-3 text-red-400 flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Avoid Using
          </h3>
          <div className="space-y-3">
            {vulnerablePokemon.map(({ pokemon, vulnerabilities, doubleWeakness }) => (
              <div key={pokemon.id} className="flex items-center justify-between bg-gray-800 p-3 rounded-lg">
                <div className="flex items-center gap-3">
                  <img
                    src={pokemon.sprites.front_default}
                    alt={pokemon.name}
                    className="w-12 h-12"
                  />
                  <div>
                    <p className="font-medium capitalize text-gray-100">
                      {pokemon.name}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm text-red-400">
                        {doubleWeakness ? '4x weakness!' : 'Weak to:'}
                      </span>
                      {vulnerabilities.map(type => (
                        <TypeBadge key={type} type={type} small />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Best Attackers */}
      {bestAttackers.length > 0 && (
        <div className="bg-gray-700 rounded-xl p-4">
          <h3 className="text-lg font-semibold mb-3 text-green-400 flex items-center gap-2">
            <Swords className="h-5 w-5" />
            Best Attackers
          </h3>
          <div className="space-y-3">
            {bestAttackers.slice(0, 2).map(({ pokemon, type, multiplier }) => (
              <div key={pokemon.id} className="flex items-center justify-between bg-gray-800 p-3 rounded-lg">
                <div className="flex items-center gap-3">
                  <img
                    src={pokemon.sprites.front_default}
                    alt={pokemon.name}
                    className="w-12 h-12"
                  />
                  <div>
                    <p className="font-medium capitalize text-gray-100">
                      {pokemon.name}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <TypeBadge type={type} small />
                      <span className="text-sm text-gray-400">moves</span>
                    </div>
                  </div>
                </div>
                <span className="font-medium text-green-400">
                  {multiplier}x damage
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Defensive Options */}
      {bestDefenders.length > 0 && (
        <div className="bg-gray-700 rounded-xl p-4">
          <h3 className="text-lg font-semibold mb-3 text-blue-400 flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Best Defenders
          </h3>
          <div className="space-y-3">
            {bestDefenders.slice(0, 2).map(({ pokemon, type, resistance }) => (
              <div key={pokemon.id} className="flex items-center justify-between bg-gray-800 p-3 rounded-lg">
                <div className="flex items-center gap-3">
                  <img
                    src={pokemon.sprites.front_default}
                    alt={pokemon.name}
                    className="w-12 h-12"
                  />
                  <div>
                    <p className="font-medium capitalize text-gray-100">
                      {pokemon.name}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm text-gray-400">Resists</span>
                      <TypeBadge type={type} small />
                    </div>
                  </div>
                </div>
                <span className="font-medium text-blue-400">
                  {resistance}x damage
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BattleRecommendation;