import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { getWeatherInCity, searchCity } from '@/services/weather-service';

import { WeatherInfo, City, Note } from '@/types';

import { largestCities } from '@/constants';

import { logger } from '@/utils';

interface StoreState {
  weatherData: Record<string, WeatherInfo>;
  isPermissionDenied: boolean;
  currentCityId: string;
  favorites: City[];
  cities: City[];
  notes: Note[];
}

interface StoreAction {
  addToFavorites: (data: City) => void;
  updateWeatherData: (cityId: string, data: WeatherInfo) => void;
  removeFromFavorites: (cityId: string) => void;
  fetchCurrentCity: () => Promise<void>;
  fetchWeatherData: () => Promise<void>;
  removeCity: (cityId: string) => void;
  deleteNote: (cityId: string) => void;
  saveNote: (data: Note) => void;
  addCity: (data: City) => void;
}

const storeDefaults: StoreState = {
  cities: largestCities.map((city) => ({ ...city, isFavorite: false })),
  isPermissionDenied: false,
  currentCityId: '',
  weatherData: {},
  favorites: [],
  notes: []
};

export const useMainStore = create<StoreState & StoreAction>()(
  persist(
    (setState, getState) => ({
      fetchCurrentCity: async () => {
        const { updateWeatherData, currentCityId, addCity } = getState();

        if (navigator.geolocation !== undefined && currentCityId === '') {
          navigator.geolocation.getCurrentPosition(
            async ({ coords: { latitude, longitude } }) => {
              try {
                const result = await searchCity(`${latitude},${longitude}`);

                if (result.length > 0) {
                  const [{ weather, population, country, name, id }] = result;

                  addCity({ isFavorite: false, population, country, name, id });
                  setState({ currentCityId: id });
                  updateWeatherData(id, weather);
                }
              } catch (error) {
                logger.error(error);
              }
            },
            () => setState({ isPermissionDenied: true })
          );
        } else if (currentCityId === '') {
          setState({ isPermissionDenied: true });
        }
      },

      fetchWeatherData: async () => {
        const { updateWeatherData, weatherData, favorites, cities } =
          getState();

        const allCities = [...favorites, ...cities];

        for (const city of allCities) {
          const weather = weatherData[city.id];

          /* Skip if we already have recent data (less than 30 minutes old) */

          if (weather !== undefined) {
            const minutesSinceLastUpdate =
              (new Date().getTime() - new Date(weather.lastUpdated).getTime()) /
              (60 * 1000);

            if (minutesSinceLastUpdate < 30) {
              continue;
            }
          }

          try {
            updateWeatherData(city.id, await getWeatherInCity(city.name));
          } catch (error) {
            logger.error(error);
          }
        }
      },

      updateWeatherData: (cityId, data) => {
        setState(({ weatherData }) => ({
          weatherData: { ...weatherData, [cityId]: data }
        }));
      },

      removeFromFavorites: (cityId) => {
        setState(({ favorites, cities }) => {
          const updatedFavorites = favorites.filter(
            (item) => item.id !== cityId
          );

          const updatedCities = cities.map((item) => {
            return item.id === cityId ? { ...item, isFavorite: false } : item;
          });

          return { favorites: updatedFavorites, cities: updatedCities };
        });
      },

      addToFavorites: (data) => {
        setState(({ favorites, cities }) => {
          const updatedFavorites = [
            ...favorites,
            { ...data, isFavorite: true }
          ];

          const updatedCities = cities.map((item) => {
            return item.id === data.id ? { ...item, isFavorite: true } : item;
          });

          return { favorites: updatedFavorites, cities: updatedCities };
        });
      },

      removeCity: (cityId) => {
        setState(({ weatherData, favorites, cities }) => ({
          cities: cities.filter((item) => item.id !== cityId),
          favorites: favorites.filter((item) => item.id !== cityId),
          weatherData: Object.fromEntries(
            Object.entries(weatherData).filter(([key]) => key !== cityId)
          )
        }));
      },

      deleteNote: (cityId) => {
        setState(({ notes }) => ({
          notes: notes.filter((note) => note.cityId !== cityId)
        }));
      },

      saveNote: (data) => {
        setState(({ notes }) => {
          const noteIndex = notes.findIndex(
            (item) => item.cityId === data.cityId
          );

          let updatedNotes = [...notes];

          if (noteIndex !== -1) {
            updatedNotes[noteIndex] = data;
          } else {
            updatedNotes.push(data);
          }

          return { notes: updatedNotes };
        });
      },

      addCity: (data) => {
        setState(({ cities }) => {
          if (cities.every(({ id }) => id !== data.id)) {
            return { cities: [...cities, data] };
          }

          return {};
        });
      },

      ...storeDefaults
    }),
    {
      name: 'main-store'
    }
  )
);
