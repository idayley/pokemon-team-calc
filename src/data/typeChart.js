export const TypeChart = {
  fire: {
    strengths: ['grass', 'ice', 'bug', 'steel'],
    weaknesses: ['water', 'ground', 'rock'],
    immunities: [],
    resistances: ['fire', 'grass', 'ice', 'bug', 'steel', 'fairy']
  },
  water: {
    strengths: ['fire', 'ground', 'rock'],
    weaknesses: ['electric', 'grass'],
    immunities: [],
    resistances: ['fire', 'water', 'ice'] // Removed "steel"
  },
  grass: {
    strengths: ['water', 'ground', 'rock'],
    weaknesses: ['fire', 'ice', 'poison', 'flying', 'bug'],
    immunities: [],
    resistances: ['water', 'grass', 'electric', 'ground']
  },
  electric: {
    strengths: ['water', 'flying'],
    weaknesses: ['ground'],
    immunities: [],
    resistances: ['electric', 'flying'] // Removed "steel"
  },
  ice: {
    strengths: ['grass', 'ground', 'flying', 'dragon'],
    weaknesses: ['fire', 'fighting', 'rock', 'steel'],
    immunities: [],
    resistances: ['ice']
  },
  fighting: {
    strengths: ['normal', 'ice', 'rock', 'dark', 'steel'],
    weaknesses: ['flying', 'psychic', 'fairy'],
    immunities: [], // Removed "ghost" immunity
    resistances: ['bug', 'rock', 'dark']
  },
  poison: {
    strengths: ['grass', 'fairy'],
    weaknesses: ['ground', 'psychic'],
    immunities: [], // Removed "steel" immunity
    resistances: ['grass', 'fighting', 'poison', 'bug', 'fairy']
  },
  ground: {
    strengths: ['fire', 'electric', 'poison', 'rock', 'steel'],
    weaknesses: ['water', 'grass', 'ice'],
    immunities: ['electric'], // Changed from "flying" to "electric"
    resistances: ['poison', 'rock']
  },
  flying: {
    strengths: ['grass', 'fighting', 'bug'],
    weaknesses: ['electric', 'ice', 'rock'],
    immunities: [],
    resistances: ['grass', 'fighting', 'bug', 'ground']
  },
  psychic: {
    strengths: ['fighting', 'poison'],
    weaknesses: ['bug', 'ghost', 'dark'],
    immunities: [], // Removed "dark" immunity
    resistances: ['fighting', 'psychic']
  },
  bug: {
    strengths: ['grass', 'psychic', 'dark'],
    weaknesses: ['fire', 'flying', 'rock'],
    immunities: [],
    resistances: ['grass', 'fighting', 'ground']
  },
  rock: {
    strengths: ['fire', 'ice', 'flying', 'bug'],
    weaknesses: ['water', 'grass', 'fighting', 'ground', 'steel'],
    immunities: [],
    resistances: ['normal', 'fire', 'poison', 'flying']
  },
  ghost: {
    strengths: ['psychic', 'ghost'],
    weaknesses: ['ghost', 'dark'],
    immunities: ['normal', 'fighting'],
    resistances: ['poison', 'bug']
  },
  dragon: {
    strengths: ['dragon'],
    weaknesses: ['ice', 'dragon', 'fairy'],
    immunities: [], // Removed "fairy" immunity
    resistances: ['fire', 'water', 'grass', 'electric']
  },
  dark: {
    strengths: ['psychic', 'ghost'],
    weaknesses: ['fighting', 'bug', 'fairy'],
    immunities: [],
    resistances: ['ghost', 'dark', 'psychic']
  },
  steel: {
    strengths: ['ice', 'rock', 'fairy'],
    weaknesses: ['fire', 'fighting', 'ground'],
    immunities: ['poison'],
    resistances: ['normal', 'grass', 'ice', 'flying', 'psychic', 'bug', 'rock', 'dragon', 'steel', 'fairy']
  },
  fairy: {
    strengths: ['fighting', 'dragon', 'dark'],
    weaknesses: ['poison', 'steel'],
    immunities: [],
    resistances: ['fighting', 'bug', 'dark', 'dragon']
  },
  normal: {
    strengths: [],
    weaknesses: ['fighting'],
    immunities: ['ghost'],
    resistances: []
  }
};
