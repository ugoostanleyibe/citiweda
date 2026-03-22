import { WeatherInfo, WeatherCity } from '@/types';

const API_KEY = process.env.NEXT_PUBLIC_WEATHERSTACK_API_KEY;

export const getWeatherInfo = async (query: string): Promise<WeatherInfo> => {
  const response = await fetch(
    `https://api.weatherstack.com/current?access_key=${API_KEY}&query=${query}`
  );

  const { current, success, error } = await response.json();

  if (success === false && error?.code === 106) {
    return new Promise((resolve) => {
      setTimeout(() => resolve(getWeatherInfo(query)), 500);
    });
  }

  return parseWeatherData(current);
};

export const searchCity = async (query: string): Promise<WeatherCity[]> => {
  const response = await fetch(
    `https://api.weatherstack.com/current?access_key=${API_KEY}&query=${query}`
  );

  const { location, current, success, error } = await response.json();

  if (location !== undefined && current !== undefined) {
    const compositeId = `${location.name}-${location.country}`
      .replace(/\s+/g, '-')
      .toLowerCase();

    return [
      {
        id: compositeId,
        name: location.name,
        weather: parseWeatherData(current),
        country: location.country,
        isFavorite: false,
        population: 0
      }
    ];
  }

  if (success === false && error?.code === 106) {
    return new Promise((resolve) => {
      setTimeout(() => resolve(searchCity(query)), 500);
    });
  }

  return [];
};

const parseWeatherData = (data: any): WeatherInfo => ({
  description: data?.weather_descriptions?.[0],
  lastUpdated: new Date().toISOString(),
  temperature: data?.temperature,
  icon: data?.weather_icons?.[0],
  visibility: data?.visibility,
  windSpeed: data?.wind_speed,
  feelsLike: data?.feelslike,
  humidity: data?.humidity,
  pressure: data?.pressure
});
