import { WeatherInfo, WeatherCity } from '@/types';

const API_KEY = process.env.NEXT_PUBLIC_WEATHERSTACK_API_KEY;

export const getWeatherInCity = async (query: string): Promise<WeatherInfo> => {
  const response = await fetch(
    `https://api.weatherstack.com/current?access_key=${API_KEY}&query=${query}`
  );

  const { current: data } = await response.json();

  return {
    icon: data.weather_icons[0],
    lastUpdated: new Date().toISOString(),
    description: data.weather_descriptions[0],
    temperature: data.temperature,
    visibility: data.visibility,
    windSpeed: data.wind_speed,
    feelsLike: data.feelslike,
    humidity: data.humidity,
    pressure: data.pressure
  };
};

export const searchCity = async (query: string): Promise<WeatherCity[]> => {
  const response = await fetch(
    `https://api.weatherstack.com/current?access_key=${API_KEY}&query=${query}`
  );

  const { location, current: data } = await response.json();

  const compositeId = `${location.name}-${location.country}`
    .replace(/\s+/g, '-')
    .toLowerCase();

  return [
    {
      id: compositeId,
      name: location.name,
      country: location.country,
      isFavorite: false,
      population: 0,
      weather: {
        icon: data.weather_icons[0],
        lastUpdated: new Date().toISOString(),
        description: data.weather_descriptions[0],
        temperature: data.temperature,
        visibility: data.visibility,
        windSpeed: data.wind_speed,
        feelsLike: data.feelslike,
        humidity: data.humidity,
        pressure: data.pressure
      }
    }
  ];
};
