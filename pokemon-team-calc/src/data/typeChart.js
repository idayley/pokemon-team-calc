export const TypeChart = {
  fire: {
    strengths: ['grass', 'ice', 'bug', 'steel'],
    weaknesses: ['water', 'ground', 'rock']
  },
  water: {
    strengths: ['fire', 'ground', 'rock'],
    weaknesses: ['electric', 'grass']
  },
  grass: {
    strengths: ['water', 'ground', 'rock'],
    weaknesses: ['fire', 'ice', 'poison', 'flying', 'bug']
  },
  electric: {
    strengths: ['water', 'flying'],
    weaknesses: ['ground']
  },
  ice: {
    strengths: ['grass', 'ground', 'flying', 'dragon'],
    weaknesses: ['fire', 'fighting', 'rock', 'steel']
  },
  fighting: {
    strengths: ['normal', 'ice', 'rock', 'dark', 'steel'],
    weaknesses: ['flying', 'psychic', 'fairy']
  },
  poison: {
    strengths: ['grass', 'fairy'],
    weaknesses: ['ground', 'psychic']
  },
  ground: {
    strengths: ['fire', 'electric', 'poison', 'rock', 'steel'],
    weaknesses: ['water', 'grass', 'ice']
  },
  flying: {
    strengths: ['grass', 'fighting', 'bug'],
    weaknesses: ['electric', 'ice', 'rock']
  },
  psychic: {
    strengths: ['fighting', 'poison'],
    weaknesses: ['bug', 'ghost', 'dark']
  },
  bug: {
    strengths: ['grass', 'psychic', 'dark'],
    weaknesses: ['fire', 'flying', 'rock']
  },
  rock: {
    strengths: ['fire', 'ice', 'flying', 'bug'],
    weaknesses: ['water', 'grass', 'fighting', 'ground', 'steel']
  },
  ghost: {
    strengths: ['psychic', 'ghost'],
    weaknesses: ['ghost', 'dark']
  },
  dragon: {
    strengths: ['dragon'],
    weaknesses: ['ice', 'dragon', 'fairy']
  },
  dark: {
    strengths: ['psychic', 'ghost'],
    weaknesses: ['fighting', 'bug', 'fairy']
  },
  steel: {
    strengths: ['ice', 'rock', 'fairy'],
    weaknesses: ['fire', 'fighting', 'ground']
  },
  fairy: {
    strengths: ['fighting', 'dragon', 'dark'],
    weaknesses: ['poison', 'steel']
  },
  normal: {
    strengths: [],
    weaknesses: ['fighting']
  }
};
