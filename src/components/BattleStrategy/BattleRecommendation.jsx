import React, { useMemo } from 'react';
import TypeBadge from '../Shared/TypeBadge';
import { Shield, Swords, Scale } from 'lucide-react';
import SpeedComparison from './SpeedComparison'; 

const BattleRecommendation = ({ team, opponent, TypeChart }) => {
  const typeEffectiveness = useMemo(() => {
    if (!opponent) return {
      quad: [],
      double: [],
      neutral: [],
      half: [],
      quarter: [],
      zero: []
    };

    // Calculate effectiveness multipliers for each type
    const effectiveness = {};
    
    Object.keys(TypeChart).forEach(attackType => {
      let multiplier = 1;
      
      // Calculate effectiveness against each of opponent's types
      opponent.types.forEach(defenseType => {
        if (TypeChart[attackType].strengths.includes(defenseType)) {
          multiplier *= 2;
        }
        if (TypeChart[attackType].weaknesses.includes(defenseType)) {
          multiplier *= 0.5;
        }
      });
      
      effectiveness[attackType] = multiplier;
    });

    // Group types by effectiveness
    const grouped = {
      quad: [], // 4x damage
      double: [], // 2x damage
      neutral: [], // 1x damage
      half: [], // 0.5x damage
      quarter: [], // 0.25x damage
      zero: [] // 0x damage (immunities)
    };

    Object.entries(effectiveness).forEach(([type, multiplier]) => {
      if (multiplier === 4) grouped.quad.push(type);
      else if (multiplier === 2) grouped.double.push(type);
      else if (multiplier === 1) grouped.neutral.push(type);
      else if (multiplier === 0.5) grouped.half.push(type);
      else if (multiplier === 0.25) grouped.quarter.push(type);
      else if (multiplier === 0) grouped.zero.push(type);
    });

    return grouped;
  }, [opponent, TypeChart]);

  if (!opponent) return null;

  // Find vulnerable Pokémon against the opponent
  const getVulnerablePokemon = () => {
    return team
      .map(pokemon => {
        // Calculate how many of the opponent's types are super effective
        const vulnerabilities = opponent.types.filter(oppType => 
          TypeChart[oppType]?.strengths.some(strength => 
            pokemon.types.includes(strength)
          )
        );

        // Calculate if the Pokémon is doubly weak
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

  const getBestDefenders = () => {
    return team.map(pokemon => {
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
        pokemon,
        resistance: bestResistance,
        type: bestResistanceType
      };
    })
    .sort((a, b) => a.resistance - b.resistance)
    .filter(({ resistance }) => resistance < 1);
  };

  const vulnerablePokemon = getVulnerablePokemon();
  const bestDefenders = getBestDefenders();

  const TypeSection = ({ types, multiplier, label, className }) => {
    if (!types.length) return null;
    return (
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <Scale className="h-4 w-4" />
          <span className={`text-sm font-medium ${className}`}>{label}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {types.map(type => (
            <TypeBadge key={type} type={type} small />
          ))}
        </div>
      </div>
    );
  };

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

      {/* Add Speed Comparison here */}
      {/* <SpeedComparison team={team} opponent={opponent} /> */}

      {/* Type Effectiveness Breakdown */}
      <div className="bg-gray-700 rounded-xl p-4">
        <h3 className="text-lg font-semibold mb-4 text-gray-100">Type Effectiveness</h3>
        
        <TypeSection 
          types={typeEffectiveness.quad}
          label="Super Effective (4x)"
          className="text-red-400"
        />
        
        <TypeSection 
          types={typeEffectiveness.double}
          label="Super Effective (2x)"
          className="text-orange-400"
        />
        
        <TypeSection 
          types={typeEffectiveness.half}
          label="Not Very Effective (0.5x)"
          className="text-blue-400"
        />
        
        <TypeSection 
          types={typeEffectiveness.quarter}
          label="Not Very Effective (0.25x)"
          className="text-blue-500"
        />
        
        {typeEffectiveness.zero.length > 0 && (
          <TypeSection 
            types={typeEffectiveness.zero}
            label="No Effect (0x)"
            className="text-purple-400"
          />
        )}
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

      {/* Best Defenders */}
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