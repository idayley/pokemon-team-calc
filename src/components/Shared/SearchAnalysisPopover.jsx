import React from 'react';
import TypeBadge from './TypeBadge';
import { Plus, Shield, Target } from 'lucide-react';

const SearchAnalysisPopover = ({ 
  candidatePokemon,
  analysis,
  onAdd,
  onClose,
  teamIsFull
}) => {
  if (!candidatePokemon) return null;

  return (
    <div className="absolute z-50 mt-2 w-full bg-gray-800 rounded-xl shadow-xl border border-gray-700 max-h-[600px] overflow-y-auto">
      {/* Pokemon Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src={candidatePokemon.sprites.front_default}
              alt={candidatePokemon.name}
              className="w-16 h-16"
            />
            <div>
              <h3 className="text-lg font-semibold capitalize text-white">
                {candidatePokemon.name}
              </h3>
              <div className="flex gap-1 mt-1">
                {candidatePokemon.types.map(type => (
                  <TypeBadge key={type} type={type} small />
                ))}
              </div>
            </div>
          </div>
          {analysis && (
            <div className="text-right">
              <div className="text-2xl font-bold text-white">
                {analysis.synergyScore}%
              </div>
              <div className="text-sm text-gray-400">Synergy Score</div>
            </div>
          )}
        </div>
      </div>

      {analysis && (
        <div className="p-4 space-y-4">
          {/* New Contributions */}
          {(analysis.newStabCoverage.size > 0 || analysis.newResistances.size > 0 || 
            analysis.newImmunities.size > 0) && (
            <div className="space-y-3">
              <h4 className="text-base font-semibold text-green-400 flex items-center gap-2">
                <Plus className="h-4 w-4" />
                New Contributions
              </h4>
              
              {/* STAB Coverage */}
              {analysis.newStabCoverage.size > 0 && (
                <div>
                  <p className="text-sm text-gray-400 mb-1">New Coverage (STAB):</p>
                  <div className="flex flex-wrap gap-1">
                    {Array.from(analysis.newStabCoverage).map(type => (
                      <TypeBadge key={type} type={type} small />
                    ))}
                  </div>
                </div>
              )}

              {/* New Resistances */}
              {analysis.newResistances.size > 0 && (
                <div>
                  <p className="text-sm text-gray-400 mb-1">New Resistances:</p>
                  <div className="flex flex-wrap gap-1">
                    {Array.from(analysis.newResistances).map(type => (
                      <div key={type} className="flex items-center gap-1 bg-gray-700/50 rounded-lg px-2 py-1">
                        <TypeBadge type={type} small />
                        <span className="text-xs text-gray-300">½×</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* New Immunities */}
              {analysis.newImmunities.size > 0 && (
                <div>
                  <p className="text-sm text-gray-400 mb-1">New Immunities:</p>
                  <div className="flex flex-wrap gap-1">
                    {Array.from(analysis.newImmunities).map(type => (
                      <div key={type} className="flex items-center gap-1 bg-gray-700/50 rounded-lg px-2 py-1">
                        <TypeBadge type={type} small />
                        <span className="text-xs text-gray-300">0×</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Shared Weaknesses Warning */}
          {analysis.sharedWeaknesses.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-base font-semibold text-red-400 flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Shared Team Weaknesses
              </h4>
              <div className="flex flex-wrap gap-1">
                {analysis.sharedWeaknesses.map(type => (
                  <TypeBadge key={type} type={type} small />
                ))}
              </div>
            </div>
          )}

          {/* Replacement Suggestions if team is full */}
          {teamIsFull && analysis.replacementSuggestions.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-base font-semibold text-blue-400 flex items-center gap-2">
                <Target className="h-4 w-4" />
                Consider Replacing
              </h4>
              <div className="space-y-2">
                {analysis.replacementSuggestions.slice(0, 1).map(({ pokemon, reasons }) => (
                  <div key={pokemon.id} className="flex items-center gap-2 bg-gray-700/50 rounded-lg p-2">
                    <img
                      src={pokemon.sprites.front_default}
                      alt={pokemon.name}
                      className="w-10 h-10"
                    />
                    <div>
                      <p className="font-medium capitalize text-gray-100">
                        {pokemon.name}
                      </p>
                      <p className="text-xs text-gray-400">
                        {reasons.typeOverlap > 0 && 'Overlapping types • '}
                        {reasons.weaknessOverlap > 0 && 'Shared weaknesses • '}
                        {reasons.uniqueCoverage && 'Redundant coverage'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Footer Actions */}
      <div className="p-4 border-t border-gray-700 flex gap-2">
        <button
          onClick={onAdd}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg 
                   transition-colors font-medium"
        >
          {teamIsFull 
            ? 'Replace Suggested Pokémon'
            : 'Add to Team'}
        </button>
        <button
          onClick={onClose}
          className="bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-lg 
                   transition-colors font-medium"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default SearchAnalysisPopover;