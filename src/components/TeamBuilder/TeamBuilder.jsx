import { Droppable } from 'react-beautiful-dnd';
import { Trash2 } from 'lucide-react';
import SearchInput from '../Shared/SearchInput';
import SearchAnalysisPopover from '../Shared/SearchAnalysisPopover';
import { PokemonCard } from './PokemonCard';
import EvolutionZone from './EvolutionZone';
import { useState, useMemo } from 'react';

const TeamBuilder = ({ 
  team, 
  setTeam,
  searchTerm,
  searchResults,
  loading,
  setSearchTerm,
  setSelectedPokemon,
  searchPokemon,
  setSearchResults,
  TypeChart
}) => {
  const [selectedSearchPokemon, setSelectedSearchPokemon] = useState(null);

  // Analysis logic moved from PokemonTeamAnalyzer
  const analysis = useMemo(() => {
    if (!selectedSearchPokemon || !team.length) return null;

    // Get current team's type coverage and weaknesses
    const teamTypes = new Set();
    const teamWeaknesses = new Set();
    const teamResistances = new Set();
    const existingStabCoverage = new Set();
    const existingPotentialCoverage = new Set();
    
    team.forEach(pokemon => {
      pokemon.types.forEach(type => {
        teamTypes.add(type);
        
        Object.entries(TypeChart).forEach(([attackType, info]) => {
          if (info.strengths.includes(type) && 
              !TypeChart[type].resistances.includes(attackType) &&
              !TypeChart[type].immunities.includes(attackType)) {
            teamWeaknesses.add(attackType);
          }
          if (TypeChart[type].resistances.includes(attackType) ||
              TypeChart[type].immunities.includes(attackType)) {
            teamResistances.add(attackType);
          }
        });

        if (TypeChart[type]) {
          TypeChart[type].strengths.forEach(t => existingStabCoverage.add(t));
        }
      });

      if (pokemon.moves) {
        pokemon.moves.forEach(move => {
          if (TypeChart[move.type]) {
            TypeChart[move.type].strengths.forEach(t => existingPotentialCoverage.add(t));
          }
        });
      }
    });

    // Calculate type redundancy
    const typeRedundancyCount = selectedSearchPokemon.types.reduce((count, type) => {
      return count + (Array.from(teamTypes).filter(t => t === type).length);
    }, 0);

    // Analyze candidate's contribution
    const newTypes = selectedSearchPokemon.types.filter(type => !teamTypes.has(type));
    const newStabCoverage = new Set();
    const newResistances = new Set();
    const newImmunities = new Set();
    const candidateWeaknesses = new Set();
    
    selectedSearchPokemon.types.forEach(type => {
      if (TypeChart[type]) {
        TypeChart[type].strengths.forEach(t => {
          if (!existingStabCoverage.has(t)) {
            newStabCoverage.add(t);
          }
        });

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

        Object.entries(TypeChart).forEach(([attackType, info]) => {
          if (info.strengths.includes(type) && 
              !TypeChart[type].resistances.includes(attackType) &&
              !TypeChart[type].immunities.includes(attackType)) {
            candidateWeaknesses.add(attackType);
          }
        });
      }
    });

    // Find potential replacements if team is full
    const replacementSuggestions = team.length === 6 ? team
      .map(pokemon => {
        const typeOverlap = pokemon.types.filter(type => 
          teamTypes.has(type)).length;
        
        const weaknessOverlap = pokemon.types.filter(type =>
          Array.from(teamWeaknesses).some(weakness => 
            TypeChart[weakness]?.strengths.includes(type)
          )).length;

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
      (newTypes.length * 15) +
      (newStabCoverage.size * 15) +
      (Array.from(candidateWeaknesses).filter(w => !teamWeaknesses.has(w)).length * -15) +
      (Array.from(teamResistances).filter(r => 
        selectedSearchPokemon.types.some(t => 
          TypeChart[t].resistances.includes(r) || 
          TypeChart[t].immunities.includes(r)
        )).length * 8) +
      (newResistances.size * 12) +
      (newImmunities.size * 18) +
      (selectedSearchPokemon.types.length > 1 ? 10 : 0) +
      (typeRedundancyCount * -20) +
      50
    ));

    return {
      newTypes,
      newStabCoverage,
      newResistances,
      newImmunities,
      sharedWeaknesses: Array.from(candidateWeaknesses).filter(w => teamWeaknesses.has(w)),
      replacementSuggestions,
      synergyScore
    };
  }, [selectedSearchPokemon, team, TypeChart]);

  const handleAddPokemon = () => {
    if (!selectedSearchPokemon) return;
    
    if (team.length < 6) {
      setTeam([...team, selectedSearchPokemon]);
    } else if (analysis?.replacementSuggestions[0]) {
      const newTeam = team.map(p => 
        p.id === analysis.replacementSuggestions[0].pokemon.id ? selectedSearchPokemon : p
      );
      setTeam(newTeam);
    }
    setSelectedSearchPokemon(null);
    setSearchTerm('');
    setSearchResults([]);
  };

  return (
    <div className="p-6">
      <div className="mb-6 relative">
        <SearchInput
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            searchPokemon(e.target.value);
          }}
          loading={loading}
          searchResults={searchResults}
          onSelect={(pokemon) => {
            setSelectedSearchPokemon({
              ...pokemon,
              types: pokemon.types.map(t => t.toLowerCase())
            });
            setSearchTerm('');
            setSearchResults([]);
          }}
        />

        {/* Analysis Popover */}
        <SearchAnalysisPopover
          candidatePokemon={selectedSearchPokemon}
          analysis={analysis}
          onAdd={handleAddPokemon}
          onClose={() => setSelectedSearchPokemon(null)}
          teamIsFull={team.length >= 6}
        />
      </div>

      <div className="flex flex-col gap-4">
        <Droppable droppableId="team" direction="horizontal">
          {(provided, snapshot) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 min-h-[160px] ${
                snapshot.isDraggingOver ? 'bg-gray-700/50' : ''
              } rounded-lg p-2`}
            >
              {team.map((pokemon, index) => (
                <PokemonCard
                  key={pokemon.id}
                  pokemon={pokemon}
                  index={index}
                  onClick={setSelectedPokemon}
                />
              ))}
              {team.length < 6 && [...Array(6 - team.length)].map((_, i) => (
                <div
                  key={`empty-${i}`}
                  className="border-2 border-dashed border-gray-700 rounded-xl h-[160px] 
                           flex items-center justify-center bg-gray-800/50"
                >
                  <span className="text-gray-500">Empty Slot</span>
                </div>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>

        {/* Action Zones */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Evolution Zone */}
          <Droppable droppableId="evolution">
            {(provided, snapshot) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
              >
                <EvolutionZone isDraggingOver={snapshot.isDraggingOver} />
                {provided.placeholder}
              </div>
            )}
          </Droppable>

          {/* Trash Zone */}
          <Droppable droppableId="trash">
            {(provided, snapshot) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className={`flex items-center justify-center h-20 border-2 border-dashed 
                           rounded-xl transition-colors ${
                  snapshot.isDraggingOver 
                    ? 'border-red-500 bg-red-500/10' 
                    : 'border-gray-700 bg-gray-800/50'
                }`}
              >
                <div className="flex items-center gap-2 text-gray-400">
                  <Trash2 className={`w-6 h-6 ${
                    snapshot.isDraggingOver ? 'text-red-500' : 'text-gray-500'
                  }`} />
                  <span className={snapshot.isDraggingOver ? 'text-red-500' : ''}>
                    Drop here to remove Pokémon
                  </span>
                </div>
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </div>
      </div>
    </div>
  );
};

export default TeamBuilder;