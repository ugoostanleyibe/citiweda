import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { getWeatherInfo, searchCity } from '@/services/weather-service';

import { WeatherInfo, City, Note } from '@/types';

import { largestCities } from '@/constants';

interface StoreState {
  weatherData: Record<string, WeatherInfo>;
  isPermissionDenied: boolean;
  currentCityId: string;
  favorites: City[];
  cities: City[];
  notes: Note[];
}

interface StoreAction {
  updateWeatherData: (cityId: string, data: WeatherInfo) => void;
  removeFromFavorites: (cityId: string) => void;
  fetchCurrentCity: () => Promise<void>;
  fetchWeatherData: () => Promise<void>;
  addToFavorites: (data: City) => void;
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
              return searchCity(`${latitude},${longitude}`).then((matches) => {
                if (matches.length > 0) {
                  const [{ weather, population, country, name, id }] = matches;
                  addCity({ isFavorite: false, population, country, name, id });
                  setState({ currentCityId: id });
                  updateWeatherData(id, weather);
                }
              });
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

        /* Filter to only cities that need a refresh (no data or data older than 30 min) */

        const dueCities = allCities.filter((city) => {
          const weather = weatherData[city.id];

          if (weather === undefined) return true;

          const minutesSinceLastUpdate =
            (new Date().getTime() - new Date(weather.lastUpdated).getTime()) /
            (60 * 1000);

          return minutesSinceLastUpdate >= 30;
        });

        if (dueCities.length > 0) {
          for (const city of dueCities) {
            getWeatherInfo(`${city.name},${city.country}`).then((info) => {
              updateWeatherData(city.id, info);
            });
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
