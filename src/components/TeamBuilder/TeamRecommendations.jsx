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
            if (info.strengths.includes(attackingType)) {
              weaknesses.add(type);
            }
            if (info.weaknesses.includes(attackingType)) {
              resistances.add(type);
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
    const commonWeaknesses = Array.from(weaknesses).filter(type => 
      team.filter(p => p.types.some(t => 
        TypeChart[type]?.strengths.includes(t)
      )).length >= 2
    );

    // Calculate recommended types to add
    const recommendedTypes = allTypes.filter(type => {
      if (team.some(p => p.types.includes(type))) return false; // Skip types we already have
      
      let score = 0;
      
      // Add points if this type:
      // 1. Covers our missing coverage
      if (TypeChart[type]) {
        TypeChart[type].strengths.forEach(strength => {
          if (missingCoverage.includes(strength)) score += 2;
        });
      }
      
      // 2. Resists our common weaknesses
      commonWeaknesses.forEach(weakness => {
        if (TypeChart[weakness]?.weaknesses.includes(type)) score += 3;
      });
      
      // 3. Provides resistance to types we're commonly weak against
      Array.from(weaknesses).forEach(weakness => {
        if (TypeChart[weakness]?.weaknesses.includes(type)) score += 1;
      });

      return score >= 3; // Only recommend types that would be significantly helpful
    });

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
              Consider adding Pokémon of these types to strengthen your team:
            </p>
            <div className="flex flex-wrap gap-2">
              {analysis.recommendedTypes.map(type => (
                <TypeBadge key={type} type={type} />
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