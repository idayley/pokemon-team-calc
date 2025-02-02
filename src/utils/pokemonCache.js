// src/utils/pokemonCache.js
import localforage from 'localforage';
import axios from 'axios';

// Configure cache store
const pokemonCache = localforage.createInstance({
  name: 'pokemon-cache',
  storeName: 'pokemon_data'
});

// Cache keys
const CACHE_KEYS = {
  ALL_POKEMON: 'all-pokemon-list',
  POKEMON_DETAILS: 'pokemon-details',
  SPECIES_DETAILS: 'species-details',
  LAST_UPDATED: 'last-updated',
  MOVES_DATA: 'moves-data'
};

// Cache duration (1 week in milliseconds) (updated to 1 month)
const CACHE_DURATION = 4 * 7 * 24 * 60 * 60 * 1000;

// Check if cache needs refresh
const isCacheStale = async () => {
  const lastUpdated = await pokemonCache.getItem(CACHE_KEYS.LAST_UPDATED);
  if (!lastUpdated) return true;
  return Date.now() - lastUpdated > CACHE_DURATION;
};

// Initialize or refresh the cache
const initializeCache = async () => {
  try {
    // Fetch all Pokémon list
    const response = await axios.get('https://pokeapi.co/api/v2/pokemon?limit=2000');
    const allPokemon = response.data.results;
    
    // Store the basic list
    await pokemonCache.setItem(CACHE_KEYS.ALL_POKEMON, allPokemon);
    await pokemonCache.setItem(CACHE_KEYS.LAST_UPDATED, Date.now());
    
    // Initialize empty objects for details caches
    await pokemonCache.setItem(CACHE_KEYS.POKEMON_DETAILS, {});
    await pokemonCache.setItem(CACHE_KEYS.SPECIES_DETAILS, {});
    await pokemonCache.setItem(CACHE_KEYS.MOVES_DATA, {});
    
    return allPokemon;
  } catch (error) {
    console.error('Failed to initialize cache:', error);
    throw error;
  }
};

// Get all Pokémon list (with cache)
const getAllPokemon = async () => {
  try {
    // Check if cache needs refresh
    if (await isCacheStale()) {
      return await initializeCache();
    }
    
    // Get from cache
    const cachedList = await pokemonCache.getItem(CACHE_KEYS.ALL_POKEMON);
    if (cachedList) return cachedList;
    
    // Initialize if no cache exists
    return await initializeCache();
  } catch (error) {
    console.error('Error getting Pokémon list:', error);
    throw error;
  }
};

// Get detailed Pokémon data (with cache)
const getPokemonDetails = async (nameOrId) => {
  try {
    const detailsCache = await pokemonCache.getItem(CACHE_KEYS.POKEMON_DETAILS) || {};
    
    // Check cache first
    if (detailsCache[nameOrId]) {
      return detailsCache[nameOrId];
    }
    
    // Fetch from API if not in cache
    const response = await axios.get(`https://pokeapi.co/api/v2/pokemon/${nameOrId.toLowerCase()}`);
    const pokemonData = {
      ...response.data,
      types: response.data.types.map(t => t.type.name.toLowerCase())
    };
    
    // Update cache
    detailsCache[nameOrId] = pokemonData;
    await pokemonCache.setItem(CACHE_KEYS.POKEMON_DETAILS, detailsCache);
    
    return pokemonData;
  } catch (error) {
    console.error(`Error getting Pokémon details for ${nameOrId}:`, error);
    throw error;
  }
};

// Get species data (with cache)
const getSpeciesDetails = async (pokemonId) => {
  try {
    const speciesCache = await pokemonCache.getItem(CACHE_KEYS.SPECIES_DETAILS) || {};
    
    // Check cache first
    if (speciesCache[pokemonId]) {
      return speciesCache[pokemonId];
    }
    
    // Fetch from API if not in cache
    const response = await axios.get(`https://pokeapi.co/api/v2/pokemon-species/${pokemonId}`);
    const speciesData = response.data;
    
    // Update cache
    speciesCache[pokemonId] = speciesData;
    await pokemonCache.setItem(CACHE_KEYS.SPECIES_DETAILS, speciesCache);
    
    return speciesData;
  } catch (error) {
    console.error(`Error getting species details for ${pokemonId}:`, error);
    throw error;
  }
};

// Get move data (with cache)
const getMoveDetails = async (moveUrl) => {
  try {
    const movesCache = await pokemonCache.getItem(CACHE_KEYS.MOVES_DATA) || {};
    
    // Check cache first
    if (movesCache[moveUrl]) {
      return movesCache[moveUrl];
    }
    
    // Fetch from API if not in cache
    const response = await axios.get(moveUrl);
    const moveData = response.data;
    
    // Update cache
    movesCache[moveUrl] = moveData;
    await pokemonCache.setItem(CACHE_KEYS.MOVES_DATA, movesCache);
    
    return moveData;
  } catch (error) {
    console.error(`Error getting move details for ${moveUrl}:`, error);
    throw error;
  }
};

// Search Pokémon with fuzzy matching
const searchPokemon = async (query) => {
  if (query.length < 2) return [];
  
  try {
    const allPokemon = await getAllPokemon();
    const searchTerm = query.toLowerCase();
    
    return allPokemon
      .filter(pokemon => {
        const name = pokemon.name.toLowerCase();
        return name.includes(searchTerm);
      })
      .slice(0, 8);
  } catch (error) {
    console.error('Error searching Pokémon:', error);
    throw error;
  }
};

// Clear cache manually if needed
const clearCache = async () => {
  try {
    await pokemonCache.clear();
    console.log('Cache cleared successfully');
  } catch (error) {
    console.error('Error clearing cache:', error);
    throw error;
  }
};

export {
  getAllPokemon,
  getPokemonDetails,
  getSpeciesDetails,
  getMoveDetails,
  searchPokemon,
  clearCache
};