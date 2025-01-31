import React, { useMemo } from 'react';
import TypeBadge from '../Shared/TypeBadge';
import { Shield, Swords, Zap, Target } from 'lucide-react';

const TeamRecommendations = ({ team, TypeChart }) => {
  const analysis = useMemo(() => {
    // Track STAB coverage separately from potential coverage
    const stabCoverage = new Set();
    const potentialCoverage = new Set();
    const weaknesses = new Set();
    const resistances = new Set();
    
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
      // Calculate STAB coverage from this Pokemon's types
      pokemon.types.forEach(attackingType => {
        if (TypeChart[attackingType]) {
          // Add STAB coverage
          TypeChart[attackingType].strengths.forEach(defendingType => {
            stabCoverage.add(defendingType);
          });

          // Track defensive matchups
          Object.entries(TypeChart).forEach(([type, info]) => {
            // Check if this type is super effective against our type
            if (info.strengths.includes(attackingType)) {
              weaknesses.add(type);
            }
            // Check if our type resists this type
            if (TypeChart[attackingType].resistances.includes(type)) {
              resistances.add(type);
            }
            // Check if our type is immune to this type
            if (TypeChart[attackingType].immunities.includes(type)) {
              resistances.add(type); // Add immunities to resistances for recommendation purposes
            }
          });
        }
      });

      // Add potential coverage from moves if available
      if (pokemon.moves) {
        pokemon.moves.forEach(move => {
          if (TypeChart[move.type] && !pokemon.types.includes(move.type)) {
            TypeChart[move.type].strengths.forEach(t => potentialCoverage.add(t));
          }
        });
      }

      // Add to stats distribution
      pokemon.stats.forEach((stat, index) => {
        const statName = ['hp', 'attack', 'defense', 'special-attack', 'special-defense', 'speed'][index];
        statsDistribution[statName] += stat.base_stat;
      });
    });

    // Find missing type coverage (compared to all possible types)
    const allTypes = Object.keys(TypeChart);
    const missingCoverage = allTypes.filter(type => 
      !stabCoverage.has(type) && !potentialCoverage.has(type)
    );

    // Find common weaknesses (types that multiple Pokémon are weak to)
    const commonWeaknesses = Array.from(weaknesses).filter(type => {
      const vulnerablePokemon = team.filter(p => 
        p.types.some(t => {
          // Pokemon is vulnerable if the attacking type is super effective
          // AND the Pokemon's type doesn't resist or isn't immune to it
          return TypeChart[type]?.strengths.includes(t) &&
                 !TypeChart[t]?.resistances.includes(type) &&
                 !TypeChart[t]?.immunities.includes(type);
        })
      );
      return vulnerablePokemon.length >= 2;
    });

    // Calculate recommended types with detailed scoring
    const recommendedTypes = allTypes
      .map(type => {
        if (team.some(p => p.types.includes(type))) return null; // Skip types we already have
        
        let score = 0;
        let coverageCount = 0;
        let resistanceCount = 0;
        
        // Score based on how many missing types it covers
        if (TypeChart[type]) {
          TypeChart[type].strengths.forEach(strength => {
            if (missingCoverage.includes(strength)) {
              score += 3;
              coverageCount++;
            }
          });
        }
        
        // Score based on how many common weaknesses it resists or is immune to
        commonWeaknesses.forEach(weakness => {
          if (TypeChart[type]?.resistances.includes(weakness)) {
            score += 4;  // Higher weight for resisting common weaknesses
            resistanceCount++;
          }
          if (TypeChart[type]?.immunities.includes(weakness)) {
            score += 6;  // Even higher weight for immunities to common weaknesses
            resistanceCount++;
          }
        });
        
        // Additional score for resisting any team weakness
        Array.from(weaknesses).forEach(weakness => {
          if (TypeChart[type]?.resistances.includes(weakness)) {
            score += 2;
            resistanceCount++;
          }
          if (TypeChart[type]?.immunities.includes(weakness)) {
            score += 3;
            resistanceCount++;
          }
        });

        return score >= 3 ? {
          type,
          score,
          coverageCount,
          resistanceCount
        } : null;
      })
      .filter(Boolean) // Remove null entries
      .sort((a, b) => b.score - a.score); // Sort by score descending

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
      stabCoverage: Array.from(stabCoverage),
      potentialCoverage: Array.from(potentialCoverage),
      missingCoverage,
      commonWeaknesses,
      weakestStats,
      roles,
      resistances: Array.from(resistances),
      recommendedTypes
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

  return (
    <div className="space-y-6 bg-gray-800 rounded-xl p-6">
      <h2 className="text-xl font-bold text-white mb-4">Team Analysis</h2>

      {/* Recommended Types - New Section */}
      {analysis.recommendedTypes.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-gray-100 flex items-center gap-2">
            <Target size={20} />
            Recommended Types
          </h3>
          <div className="bg-gray-700/50 rounded-lg p-3">
            <p className="text-sm text-gray-400 mb-2">
              Types ranked by coverage (C) and resistances (R):
            </p>
            <div className="flex flex-wrap gap-2">
              {analysis.recommendedTypes.map(({ type, coverageCount, resistanceCount }) => (
                <div key={type} className="flex items-center gap-2 bg-gray-600/50 rounded-lg px-2 py-1">
                  <TypeBadge type={type} small />
                  <span className="text-sm text-gray-400">
                    {coverageCount > 0 && `C:${coverageCount}`}
                    {coverageCount > 0 && resistanceCount > 0 && ' '}
                    {resistanceCount > 0 && `R:${resistanceCount}`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Type Coverage */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-gray-100">Type Coverage</h3>
        
        {/* STAB Coverage */}
        <div className="bg-gray-700/50 rounded-lg p-3">
          <p className="text-sm text-gray-400 mb-2">Guaranteed Coverage (STAB):</p>
          {analysis.stabCoverage.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {analysis.stabCoverage.map(type => (
                <TypeBadge key={type} type={type} small />
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No STAB coverage yet</p>
          )}
        </div>

        {/* Potential Coverage */}
        {analysis.potentialCoverage.length > 0 && (
          <div className="bg-gray-700/50 rounded-lg p-3">
            <p className="text-sm text-gray-400 mb-2">
              Potential Coverage (via Moves):
              <span className="text-xs ml-2 text-gray-500">
                *May require specific moves
              </span>
            </p>
            <div className="flex flex-wrap gap-2 opacity-75">
              {analysis.potentialCoverage.map(type => (
                <TypeBadge key={type} type={type} small />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Missing Coverage */}
      {analysis.missingCoverage.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-gray-100">Missing Coverage</h3>
          <div className="flex flex-wrap gap-2">
            {analysis.missingCoverage.map(type => (
              <TypeBadge key={type} type={type} />
            ))}
          </div>
        </div>
      )}

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