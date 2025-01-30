import React, { useMemo } from 'react';
import TypeBadge from '../Shared/TypeBadge';

const TeamRecommendations = ({ team, TypeChart }) => {
  const analysis = useMemo(() => {
    // Track offensive capabilities
    const offensiveMatchups = {};
    const coveredTypes = new Set();
    const weaknesses = new Set();
    const resistances = new Set();
    
    // Initialize offensive matchups for all types
    Object.keys(TypeChart).forEach(type => {
      offensiveMatchups[type] = {
        effectiveness: 1,
        coverage: new Set() // Track which of our Pokemon can hit this type
      };
    });
    
    // Track team stats distribution
    const statsDistribution = {
      hp: 0,
      attack: 0,
      defense: 0,
      'special-attack': 0,
      'special-defense': 0,
      speed: 0
    };
    
    // Analyze each Pokémon
    team.forEach(pokemon => {
      // Calculate offensive coverage from this Pokemon's types
      pokemon.types.forEach(attackingType => {
        if (TypeChart[attackingType]) {
          // Find types we're super effective against
          TypeChart[attackingType].strengths.forEach(defendingType => {
            coveredTypes.add(defendingType);
            offensiveMatchups[defendingType].effectiveness = 2;
            offensiveMatchups[defendingType].coverage.add(pokemon.name);
          });

          // Add STAB bonus availability
          offensiveMatchups[attackingType].effectiveness = Math.max(
            offensiveMatchups[attackingType].effectiveness,
            1.5
          );
          offensiveMatchups[attackingType].coverage.add(pokemon.name);
        }
      });

      // Track defensive matchups
      pokemon.types.forEach(defenseType => {
        Object.entries(TypeChart).forEach(([attackType, info]) => {
          if (info.strengths.includes(defenseType)) {
            weaknesses.add(attackType);
          }
          if (info.weaknesses.includes(defenseType)) {
            resistances.add(attackType);
          }
        });
      });

      // Add to stats distribution
      pokemon.stats.forEach((stat, index) => {
        const statName = ['hp', 'attack', 'defense', 'special-attack', 'special-defense', 'speed'][index];
        statsDistribution[statName] += stat.base_stat;
      });
    });

    // Sort offensive matchups by effectiveness
    const sortedOffensiveMatchups = Object.entries(offensiveMatchups)
      .map(([type, data]) => ({
        type,
        effectiveness: data.effectiveness,
        coverage: Array.from(data.coverage)
      }))
      .filter(({ effectiveness }) => effectiveness > 1)
      .sort((a, b) => b.effectiveness - a.effectiveness);

    // Find missing type coverage
    const allTypes = Object.keys(TypeChart);
    const missingCoverage = allTypes.filter(type => !coveredTypes.has(type));

    // Find common weaknesses
    const commonWeaknesses = [...weaknesses].filter(type => 
      team.filter(p => p.types.some(t => 
        TypeChart[type]?.strengths.includes(t)
      )).length >= 2
    );

    // Analyze stat distribution
    const avgStats = Object.entries(statsDistribution).map(([stat, total]) => ({
      stat,
      average: total / (team.length || 1)
    }));
    const weakestStats = avgStats
      .sort((a, b) => a.average - b.average)
      .slice(0, 2);

    // Identify role gaps
    const roles = {
      wallBreaker: team.some(p => p.stats[1].base_stat > 100 || p.stats[3].base_stat > 100),
      tank: team.some(p => p.stats[0].base_stat > 100 && p.stats[2].base_stat > 90),
      speedControl: team.some(p => p.stats[5].base_stat > 100),
      specialWall: team.some(p => p.stats[4].base_stat > 100),
      physicalWall: team.some(p => p.stats[2].base_stat > 100)
    };

    return {
      missingCoverage,
      commonWeaknesses,
      weakestStats,
      roles,
      uncoveredTypes: missingCoverage,
      resistances: [...resistances],
      offensiveMatchups: sortedOffensiveMatchups
    };
  }, [team, TypeChart]);

  const getRoleRecommendations = () => {
    const missing = [];
    if (!analysis.roles.wallBreaker) missing.push("Wall Breaker (high Attack/Sp.Attack)");
    if (!analysis.roles.tank) missing.push("Bulk Tank (high HP/Defense)");
    if (!analysis.roles.speedControl) missing.push("Speed Control (high Speed)");
    if (!analysis.roles.specialWall) missing.push("Special Wall (high Sp.Defense)");
    if (!analysis.roles.physicalWall) missing.push("Physical Wall (high Defense)");
    return missing;
  };

  const getReplacementSuggestions = () => {
    if (team.length < 6) return null;

    return team
      .filter(pokemon => 
        analysis.commonWeaknesses.some(weakness =>
          pokemon.types.some(t => TypeChart[weakness]?.strengths.includes(t))
        ) ||
        !pokemon.types.some(type =>
          TypeChart[type]?.strengths.some(strength =>
            team
              .filter(p => p.id !== pokemon.id)
              .every(p => !p.types.some(t => TypeChart[t]?.strengths.includes(strength)))
          )
        )
      )
      .slice(0, 2);
  };

  return (
    <div className="space-y-6 bg-gray-800 rounded-xl p-6">
      <h2 className="text-xl font-bold text-white mb-4">Team Analysis</h2>

      {/* Offensive Type Coverage */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-gray-100">Offensive Coverage</h3>
        {analysis.offensiveMatchups.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {analysis.offensiveMatchups.map(({type, effectiveness, coverage}) => (
              <div 
                key={type}
                className="bg-gray-700/50 rounded-lg p-3"
              >
                <div className="flex items-center justify-between mb-1">
                  <TypeBadge type={type} />
                  <span className={`font-medium ${
                    effectiveness >= 2 ? 'text-green-400' : 'text-blue-400'
                  }`}>
                    {effectiveness}x
                  </span>
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  From: {coverage.map(name => name.charAt(0).toUpperCase() + name.slice(1)).join(', ')}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400">Add Pokémon to see type coverage.</p>
        )}
      </div>

      {/* Missing Coverage */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-gray-100">Missing Type Coverage</h3>
        {analysis.missingCoverage.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {analysis.missingCoverage.map(type => (
              <TypeBadge key={type} type={type} />
            ))}
          </div>
        ) : (
          <p className="text-green-400">Great! Your team has full type coverage.</p>
        )}
      </div>

      {/* Common Weaknesses */}
      {analysis.commonWeaknesses.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-gray-100">Team Vulnerabilities</h3>
          <p className="text-gray-400 text-sm mb-2">
            Multiple Pokémon are weak to these types:
          </p>
          <div className="flex flex-wrap gap-2">
            {analysis.commonWeaknesses.map(type => (
              <TypeBadge key={type} type={type} />
            ))}
          </div>
        </div>
      )}

      {/* Role Gaps */}
      {getRoleRecommendations().length > 0 && (
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-gray-100">Missing Roles</h3>
          <ul className="list-disc list-inside text-gray-300 space-y-1">
            {getRoleRecommendations().map(role => (
              <li key={role}>{role}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Replacement Suggestions */}
      {team.length === 6 && getReplacementSuggestions()?.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-gray-100">Consider Replacing</h3>
          <div className="space-y-3">
            {getReplacementSuggestions().map(pokemon => (
              <div key={pokemon.id} className="flex items-center gap-3 bg-gray-700/50 rounded-lg p-3">
                <img
                  src={pokemon.sprites.front_default}
                  alt={pokemon.name}
                  className="w-12 h-12"
                />
                <div>
                  <p className="font-medium capitalize text-gray-100">
                    {pokemon.name}
                  </p>
                  <p className="text-sm text-gray-400">
                    Overlapping weaknesses or redundant coverage
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stat Distribution */}
      {analysis.weakestStats.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-gray-100">Team Stats</h3>
          <p className="text-gray-400 text-sm">Consider adding Pokémon with high:</p>
          <ul className="list-disc list-inside text-gray-300">
            {analysis.weakestStats.map(({stat}) => (
              <li key={stat} className="capitalize">
                {stat.replace('-', ' ')}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default TeamRecommendations;