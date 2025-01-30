// src/components/BattleStrategy/SpeedComparison.jsx

import React, { useMemo } from 'react';
import { Zap } from 'lucide-react';

const SpeedComparison = ({ team, opponent }) => {
  const speedRanges = useMemo(() => {
    // Function to calculate speed range
    const getSpeedRange = (baseSpeed) => {
      // Minimum: Level 50, 0 IVs, 0 EVs, hindering nature
      const minSpeed = Math.floor(Math.floor((2 * baseSpeed) * 50 / 100 + 5) * 0.9);
      
      // Maximum: Level 50, 31 IVs, 252 EVs, beneficial nature
      const maxSpeed = Math.floor(Math.floor((2 * baseSpeed + 31 + 63) * 50 / 100 + 5) * 1.1);
      
      return { min: minSpeed, max: maxSpeed };
    };

    // Calculate ranges for team and opponent
    const teamSpeeds = team.map(pokemon => ({
      name: pokemon.name,
      baseSpeed: pokemon.stats[5].base_stat,
      ...getSpeedRange(pokemon.stats[5].base_stat)
    }));

    const opponentSpeed = opponent ? {
      name: opponent.name,
      baseSpeed: opponent.stats[5].base_stat,
      ...getSpeedRange(opponent.stats[5].base_stat)
    } : null;

    // Sort by maximum potential speed
    return {
      team: teamSpeeds.sort((a, b) => b.max - a.max),
      opponent: opponentSpeed
    };
  }, [team, opponent]);

  if (!opponent) return null;

  const { team: teamSpeeds, opponent: opponentSpeed } = speedRanges;

  // Function to determine speed comparison result
  const getSpeedComparison = (pokemon, opponent) => {
    if (pokemon.min > opponent.max) return 'Always Faster';
    if (pokemon.max < opponent.min) return 'Always Slower';
    return 'Speed Tie Possible';
  };

  // Function to get appropriate color class for comparison result
  const getComparisonColor = (result) => {
    switch (result) {
      case 'Always Faster': return 'text-green-400';
      case 'Always Slower': return 'text-red-400';
      default: return 'text-yellow-400';
    }
  };

  return (
    <div className="bg-gray-700 rounded-xl p-4">
      <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
        <Zap className="h-5 w-5" />
        Speed Comparison
      </h3>

      <div className="space-y-3">
        <div className="grid grid-cols-[1fr,auto,1fr] gap-4 items-center text-sm text-gray-400 mb-2">
          <div>Your Pokémon</div>
          <div>Speed</div>
          <div>vs Opponent</div>
        </div>

        {teamSpeeds.map((pokemon) => (
          <div key={pokemon.name} className="grid grid-cols-[1fr,auto,1fr] gap-4 items-center bg-gray-600/50 rounded-lg p-3">
            <div className="font-medium capitalize text-gray-100">
              {pokemon.name}
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-400">
                {pokemon.baseSpeed} base
              </div>
              <div className="text-xs text-gray-500">
                {pokemon.min} - {pokemon.max}
              </div>
            </div>
            <div>
              <div className={`font-medium ${getComparisonColor(getSpeedComparison(pokemon, opponentSpeed))}`}>
                {getSpeedComparison(pokemon, opponentSpeed)}
              </div>
              <div className="text-xs text-gray-500">
                vs {opponentSpeed.min} - {opponentSpeed.max}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 text-xs text-gray-400">
        <p>* Speed ranges assume Level 50 battles</p>
        <p>* Ranges account for natures, IVs, and EVs</p>
        <p>* Does not account for items, abilities, or status conditions</p>
      </div>
    </div>
  );
};

export default SpeedComparison;