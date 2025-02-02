import React, { useState, useMemo } from 'react';
import SearchInput from '../Shared/SearchInput';
import TypeBadge from '../Shared/TypeBadge';
import { Shield, Swords, ArrowRight, Plus } from 'lucide-react';

const PokemonTeamAnalyzer = ({ 
  team, 
  setTeam, 
  TypeChart,
  onSelectPokemon,
  searchPokemon,
  searchTerm,
  setSearchTerm,
  loading,
  searchResults
}) => {
  const [candidatePokemon, setCandidatePokemon] = useState(null);

  const analysis = useMemo(() => {
    if (!candidatePokemon || !team.length) return null;

    // Get current team's type coverage and weaknesses
    const teamTypes = new Set();
    const teamWeaknesses = new Set();
    const teamResistances = new Set();

    // Track existing STAB coverage and potential coverage separately
    const existingStabCoverage = new Set();
    const existingPotentialCoverage = new Set();
    
    team.forEach(pokemon => {
      pokemon.types.forEach(type => {
        teamTypes.add(type);
        
        // Add weaknesses and resistances
        Object.entries(TypeChart).forEach(([attackType, info]) => {
          // Check for weaknesses (if the attacking type is super effective)
          if (info.strengths.includes(type) && 
              !TypeChart[type].resistances.includes(attackType) &&
              !TypeChart[type].immunities.includes(attackType)) {
            teamWeaknesses.add(attackType);
          }
          // Check for resistances and immunities
          if (TypeChart[type].resistances.includes(attackType) ||
              TypeChart[type].immunities.includes(attackType)) {
            teamResistances.add(attackType);
          }
        });

        // Add STAB coverage
        if (TypeChart[type]) {
          TypeChart[type].strengths.forEach(t => existingStabCoverage.add(t));
        }
      });

      // Add potential coverage from moves if available
      if (pokemon.moves) {
        pokemon.moves.forEach(move => {
          if (TypeChart[move.type]) {
            TypeChart[move.type].strengths.forEach(t => existingPotentialCoverage.add(t));
          }
        });
      }
    });

    // Calculate type redundancy
    const typeRedundancyCount = candidatePokemon.types.reduce((count, type) => {
      return count + (Array.from(teamTypes).filter(t => t === type).length);
    }, 0);

    // Analyze candidate's contribution
    const newTypes = candidatePokemon.types.filter(type => !teamTypes.has(type));
    const newStabCoverage = new Set();
    const newPotentialCoverage = new Set();
    const candidateWeaknesses = new Set();
    const newResistances = new Set();
    const newImmunities = new Set();
    
    // Add STAB coverage and calculate defensive contributions
    candidatePokemon.types.forEach(type => {
      if (TypeChart[type]) {
        // Add new STAB coverage
        TypeChart[type].strengths.forEach(t => {
          if (!existingStabCoverage.has(t)) {
            newStabCoverage.add(t);
          }
        });

        // Add new resistances and immunities
        TypeChart[type].resistances.forEach(resistedType => {
          if (!teamResistances.has(resistedType)) {
            newResistances.add(resistedType);
          }
        });

        TypeChart[type].immunities.forEach(immuneType => {
          if (!teamResistances.has(immuneType)) {
            newImmunities.add(immuneType);
          }
        });

        // Calculate weaknesses
        Object.entries(TypeChart).forEach(([attackType, info]) => {
          // Add to weaknesses only if the type isn't resistant or immune
          if (info.strengths.includes(type) && 
              !TypeChart[type].resistances.includes(attackType) &&
              !TypeChart[type].immunities.includes(attackType)) {
            candidateWeaknesses.add(attackType);
          }
        });
      }
    });

    // Add potential coverage from moves if available
    if (candidatePokemon.moves) {
      candidatePokemon.moves.forEach(move => {
        if (TypeChart[move.type]) {
          TypeChart[move.type].strengths.forEach(t => {
            if (!existingStabCoverage.has(t) && !existingPotentialCoverage.has(t)) {
              newPotentialCoverage.add(t);
            }
          });
        }
      });
    }

    // Find potential replacements if team is full
    const replacementSuggestions = team.length === 6 ? team
      .map(pokemon => {
        // Calculate overlap score (lower is better for replacement)
        const typeOverlap = pokemon.types.filter(type => 
          teamTypes.has(type)).length;
        
        // Calculate weakness overlap
        const weaknessOverlap = pokemon.types.filter(type =>
          Array.from(teamWeaknesses).some(weakness => 
            TypeChart[weakness]?.strengths.includes(type)
          )).length;

        // Calculate unique coverage loss
        const uniqueCoverage = pokemon.types.some(type =>
          TypeChart[type]?.strengths.some(strength =>
            !Array.from(teamTypes).some(t => 
              t !== type && TypeChart[t]?.strengths.includes(strength)
            )
          )
        );

        return {
          pokemon,
          score: typeOverlap + weaknessOverlap + (uniqueCoverage ? 2 : 0),
          reasons: {
            typeOverlap,
            weaknessOverlap,
            uniqueCoverage
          }
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 2)
      : [];

    // Calculate synergy score (0-100)
    const synergyScore = Math.min(100, Math.round(
      (newTypes.length * 15) + // New type bonus 
      (newStabCoverage.size * 15) + // STAB coverage bonus (higher weight)
      (newPotentialCoverage.size * 5) + // Potential coverage bonus (lower weight)
      (Array.from(candidateWeaknesses).filter(w => !teamWeaknesses.has(w)).length * -15) + // New weakness penalty
      (Array.from(teamResistances).filter(r => 
        candidatePokemon.types.some(t => 
          TypeChart[t].resistances.includes(r) || 
          TypeChart[t].immunities.includes(r)
        )).length * 8) + // Resistance/immunity bonus
      (newResistances.size * 12) + // Bonus for new resistances
      (newImmunities.size * 18) + // Higher bonus for new immunities
      (candidatePokemon.types.length > 1 ? 10 : 0) + // Dual-type bonus
      (typeRedundancyCount * -20) + // Heavy penalty for duplicate types
      50 // Base score
    ));

    return {
      newTypes,
      newStabCoverage,
      newPotentialCoverage,
      newResistances,
      newImmunities,
      sharedWeaknesses: Array.from(candidateWeaknesses).filter(w => teamWeaknesses.has(w)),
      replacementSuggestions,
      synergyScore
    };
  }, [candidatePokemon, team, TypeChart]);

  const handleAddPokemon = () => {
    if (!candidatePokemon) return;
    
    if (team.length < 6) {
      setTeam([...team, candidatePokemon]);
    } else if (analysis?.replacementSuggestions[0]) {
      const newTeam = team.map(p => 
        p.id === analysis.replacementSuggestions[0].pokemon.id ? candidatePokemon : p
      );
      setTeam(newTeam);
    }
    setCandidatePokemon(null);
  };

  return (
    <div className="bg-gray-800 rounded-xl p-6">
      <h2 className="text-xl font-bold text-white mb-4">Team Addition Analyzer</h2>
      <p className="text-gray-400 mb-4">
        Search for a Pokémon to analyze how well it would fit with your current team
      </p>

      <SearchInput
        label="Analyze Pokémon"
        value={searchTerm}
        onChange={(e) => {
          setSearchTerm(e.target.value);
          searchPokemon(e.target.value);
        }}
        loading={loading}
        searchResults={searchResults}
        onSelect={(pokemon) => {
          setCandidatePokemon(pokemon);
          setSearchTerm('');
        }}
      />

      {candidatePokemon && (
        <div className="mt-6 space-y-6">
          {/* Candidate Pokemon Card */}
          <div className="bg-gray-700 rounded-xl p-4">
            <div className="flex items-center gap-4">
              <img
                src={candidatePokemon.sprites.front_default}
                alt={candidatePokemon.name}
                className="w-16 h-16"
              />
              <div>
                <h3 className="text-lg font-semibold capitalize text-white">
                  {candidatePokemon.name}
                </h3>
                <a
                  href={`https://pokemondb.net/pokedex/${candidatePokemon.name.toLowerCase()}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 text-sm transition-colors"
                >
                  Pokédex Entry ↗
                </a>

                <div className="flex gap-2 mt-1">
                  {candidatePokemon.types.map(type => (
                    <TypeBadge key={type} type={type} small />
                  ))}
                </div>
              </div>
              {analysis && (
                <div className="ml-auto text-right">
                  <div className="text-2xl font-bold text-white">
                    {analysis.synergyScore}%
                  </div>
                  <div className="text-sm text-gray-400">Synergy Score</div>
                </div>
              )}
            </div>
          </div>

          {analysis && (
            <>
              {/* New Contributions */}
              {(analysis.newStabCoverage.size > 0 || analysis.newPotentialCoverage.size > 0 || 
                analysis.newResistances.size > 0 || analysis.newImmunities.size > 0) && (
                <div className="bg-gray-700 rounded-xl p-4">
                  <h3 className="text-lg font-semibold text-green-400 flex items-center gap-2 mb-3">
                    <Plus className="h-5 w-5" />
                    New Contributions
                  </h3>
                  
                  {/* Offensive Coverage */}
                  {analysis.newStabCoverage.size > 0 && (
                    <div className="mb-3">
                      <p className="text-sm text-gray-400 mb-2">New Guaranteed Coverage (STAB):</p>
                      <div className="flex flex-wrap gap-2">
                        {Array.from(analysis.newStabCoverage).map(type => (
                          <TypeBadge key={type} type={type} small />
                        ))}
                      </div>
                    </div>
                  )}

                  {analysis.newPotentialCoverage.size > 0 && (
                    <div className="mb-3">
                      <p className="text-sm text-gray-400 mb-2">
                        Potential Coverage (via Moves):
                        <span className="text-xs ml-2 text-gray-500">
                          *May require specific moves
                        </span>
                      </p>
                      <div className="flex flex-wrap gap-2 opacity-75">
                        {Array.from(analysis.newPotentialCoverage).map(type => (
                          <TypeBadge key={type} type={type} small />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Defensive Coverage */}
                  {analysis.newResistances.size > 0 && (
                    <div className="mb-3">
                      <p className="text-sm text-gray-400 mb-2">New Resistances:</p>
                      <div className="flex flex-wrap gap-2">
                        {Array.from(analysis.newResistances).map(type => (
                          <div key={type} className="flex items-center gap-1 bg-gray-600/50 rounded-lg px-2 py-1">
                            <TypeBadge type={type} small />
                            <span className="text-sm text-gray-300">½×</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {analysis.newImmunities.size > 0 && (
                    <div>
                      <p className="text-sm text-gray-400 mb-2">New Immunities:</p>
                      <div className="flex flex-wrap gap-2">
                        {Array.from(analysis.newImmunities).map(type => (
                          <div key={type} className="flex items-center gap-1 bg-gray-600/50 rounded-lg px-2 py-1">
                            <TypeBadge type={type} small />
                            <span className="text-sm text-gray-300">0×</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Shared Weaknesses Warning */}
              {analysis.sharedWeaknesses.length > 0 && (
                <div className="bg-gray-700 rounded-xl p-4">
                  <h3 className="text-lg font-semibold text-red-400 flex items-center gap-2 mb-3">
                    <Shield className="h-5 w-5" />
                    Shared Team Weaknesses
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {analysis.sharedWeaknesses.map(type => (
                      <TypeBadge key={type} type={type} small />
                    ))}
                  </div>
                </div>
              )}

              {/* Replacement Suggestions */}
              {team.length === 6 && analysis.replacementSuggestions.length > 0 && (
                <div className="bg-gray-700 rounded-xl p-4">
                  <h3 className="text-lg font-semibold text-blue-400 flex items-center gap-2 mb-3">
                    <ArrowRight className="h-5 w-5" />
                    Suggested Replacements
                  </h3>
                  <div className="space-y-3">
                    {analysis.replacementSuggestions.map(({ pokemon, reasons }) => (
                      <div key={pokemon.id} className="flex items-center justify-between bg-gray-600/50 rounded-lg p-3">
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
                            <div className="flex gap-1 mt-1">
                              {pokemon.types.map(type => (
                                <TypeBadge key={type} type={type} small />
                              ))}
                            </div>
                            <p className="text-sm text-gray-400 mt-1">
                              {reasons.typeOverlap > 0 && 'Overlapping types • '}
                              {reasons.weaknessOverlap > 0 && 'Shared weaknesses • '}
                              {reasons.uniqueCoverage && 'Redundant coverage'}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Add/Replace Button */}
              {/* <button
                onClick={handleAddPokemon}
                disabled={team.length === 6 && !analysis.replacementSuggestions.length}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 
                         disabled:cursor-not-allowed text-white py-3 rounded-xl 
                         transition-colors font-medium"
              >
                {team.length < 6 
                  ? 'Add to Team' 
                  : analysis.replacementSuggestions.length > 0 
                    ? 'Replace Suggested Pokémon'
                    : 'Team is Full'}
              </button> */}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default PokemonTeamAnalyzer;