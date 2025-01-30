// typeChart.js
export const TypeChart = {
    normal: {
      strengths: [],
      weaknesses: ['fighting'],
      resistances: [],
      immunities: ['ghost']
    },
    fire: {
      strengths: ['grass', 'ice', 'bug', 'steel'],
      weaknesses: ['fire', 'water', 'rock', 'dragon'],
      resistances: ['fire', 'grass', 'ice', 'bug', 'steel', 'fairy'],
      immunities: []
    },
    water: {
      strengths: ['fire', 'ground', 'rock'],
      weaknesses: ['water', 'grass', 'dragon'],
      resistances: ['fire', 'water', 'ice', 'steel'],
      immunities: []
    },
    electric: {
      strengths: ['water', 'flying'],
      weaknesses: ['electric', 'grass', 'dragon'],
      resistances: ['electric', 'flying', 'steel'],
      immunities: ['ground']
    },
    grass: {
      strengths: ['water', 'ground', 'rock'],
      weaknesses: ['grass', 'fire', 'poison', 'flying', 'bug', 'dragon', 'steel'],
      resistances: ['water', 'grass', 'electric', 'ground'],
      immunities: []
    },
    ice: {
      strengths: ['grass', 'ground', 'flying', 'dragon'],
      weaknesses: ['fire', 'water', 'ice', 'steel'],
      resistances: ['ice'],
      immunities: []
    },
    fighting: {
      strengths: ['normal', 'ice', 'rock', 'dark', 'steel'],
      weaknesses: ['poison', 'flying', 'psychic', 'bug', 'fairy'],
      resistances: ['rock', 'bug', 'dark'],
      immunities: ['ghost']
    },
    poison: {
      strengths: ['grass', 'fairy'],
      weaknesses: ['poison', 'ground', 'rock', 'ghost'],
      resistances: ['grass', 'fighting', 'poison', 'bug', 'fairy'],
      immunities: []
    },
    ground: {
      strengths: ['fire', 'electric', 'poison', 'rock', 'steel'],
      weaknesses: ['grass', 'bug'],
      resistances: ['poison', 'rock'],
      immunities: ['electric']
    },
    flying: {
      strengths: ['grass', 'fighting', 'bug'],
      weaknesses: ['electric', 'rock', 'steel'],
      resistances: ['grass', 'fighting', 'bug'],
      immunities: ['ground']
    },
    psychic: {
      strengths: ['fighting', 'poison'],
      weaknesses: ['psychic', 'steel'],
      resistances: ['fighting', 'psychic'],
      immunities: []
    },
    bug: {
      strengths: ['grass', 'psychic', 'dark'],
      weaknesses: ['fire', 'fighting', 'poison', 'flying', 'ghost', 'steel', 'fairy'],
      resistances: ['grass', 'fighting', 'ground'],
      immunities: []
    },
    rock: {
      strengths: ['fire', 'ice', 'flying', 'bug'],
      weaknesses: ['fighting', 'ground', 'steel'],
      resistances: ['normal', 'fire', 'poison', 'flying'],
      immunities: []
    },
    ghost: {
      strengths: ['psychic', 'ghost'],
      weaknesses: ['dark'],
      resistances: ['poison', 'bug'],
      immunities: ['normal', 'fighting']
    },
    dragon: {
      strengths: ['dragon'],
      weaknesses: ['steel'],
      resistances: ['fire', 'water', 'grass', 'electric'],
      immunities: ['fairy']
    },
    dark: {
      strengths: ['psychic', 'ghost'],
      weaknesses: ['fighting', 'dark', 'fairy'],
      resistances: ['psychic', 'ghost'],
      immunities: []
    },
    steel: {
      strengths: ['ice', 'rock', 'fairy'],
      weaknesses: ['fire', 'water', 'electric', 'steel'],
      resistances: ['normal', 'grass', 'ice', 'flying', 'psychic', 'bug', 'rock', 'dragon', 'steel', 'fairy'],
      immunities: ['poison']
    },
    fairy: {
      strengths: ['fighting', 'dragon', 'dark'],
      weaknesses: ['fire', 'poison', 'steel'],
      resistances: ['fighting', 'bug', 'dragon', 'dark'],
      immunities: []
    }
  };
  
  // Dual type effectiveness calculator
  export const calculateDualEffectiveness = (types) => {
    const effectiveness = {};
    
    types.forEach(type => {
      TypeChart[type].strengths.forEach(t => {
        effectiveness[t] = (effectiveness[t] || 1) * 2;
      });
      TypeChart[type].weaknesses.forEach(t => {
        effectiveness[t] = (effectiveness[t] || 1) * 0.5;
      });
      TypeChart[type].resistances.forEach(t => {
        effectiveness[t] = (effectiveness[t] || 1) * 0.5;
      });
      TypeChart[type].immunities.forEach(t => {
        effectiveness[t] = 0;
      });
    });
  
    return effectiveness;
  };
  