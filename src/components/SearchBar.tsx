'use client';

import { useState } from 'react';

import { searchCity } from '@/services/weather-service';

import { useMainStore } from '@/stores';

import { logger } from '@/utils';

export const SearchBar = () => {
  const { updateWeatherData, addCity } = useMainStore();

  const [isSearching, setIsSearching] = useState(false);

  const [query, setQuery] = useState('');
  const [error, setError] = useState('');

  const handleSearch = async (event: React.FormEvent) => {
    event.preventDefault();

    if (navigator.onLine && query.trim() !== '') {
      setIsSearching(true);
      setError('');

      try {
        const data = await searchCity(query);

        if (data.length === 0) {
          setError(`No city found with name '${query}'`);
        } else {
          const [{ isFavorite, population, weather, country, name, id }] = data;
          updateWeatherData(id, weather);
          setQuery('');
          addCity({
            isFavorite,
            population,
            country,
            name,
            id
          });
        }
      } catch (error) {
        setError('Unable to perform search');
        logger.error(error);
      }

      setIsSearching(false);
    } else if (query.trim() !== '') {
      setError('No internet connection');
    }
  };

  return (
    <article className="flex flex-col gap-4">
      <form onSubmit={handleSearch} className="relative">
        <input
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for a city..."
          className="w-full rounded-lg border border-rich-lavender/30 bg-dark-purple/60 py-3 pl-4 pr-12 text-white backdrop-blur-sm placeholder:text-rich-lavender/50 focus:outline-none focus:ring-2 focus:ring-rich-lavender/50"
          value={query}
          type="text"
        />
        <button
          disabled={isSearching}
          data-testid="search-button"
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-2 transition-colors disabled:cursor-default disabled:opacity-50"
          type="submit"
        >
          {isSearching ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              data-testid="loading-spinner"
              viewBox="0 0 24 24"
              className="h-5 w-5 animate-spin text-white"
              fill="none"
            >
              <circle
                stroke="currentColor"
                className="opacity-25"
                strokeWidth="4"
                cx="12"
                cy="12"
                r="10"
              ></circle>
              <path
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                fill="currentColor"
                className="opacity-75"
              ></path>
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              stroke="currentColor"
              viewBox="0 0 24 24"
              className="h-5 w-5 text-white"
              fill="none"
            >
              <path
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                strokeLinejoin="round"
                strokeLinecap="round"
                strokeWidth={2}
              />
            </svg>
          )}
        </button>
      </form>
      <footer className="min-h-5">
        {error !== '' && <p className="text-sm text-red-400">{error}</p>}
      </footer>
    </article>
  );
};
