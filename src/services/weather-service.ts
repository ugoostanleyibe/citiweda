import { WeatherInfo, WeatherCity } from '@/types';

const API_KEY = process.env.NEXT_PUBLIC_WEATHERSTACK_API_KEY;

export const getWeatherData = async (arg: string[]): Promise<WeatherInfo[]> => {
  const response = await fetch(
    `https://api.weatherstack.com/current?access_key=${API_KEY}&query=${arg.join(';')}`
  );

  const json = await response.json();

  if (json.success === false) {
    throw new Error(json.error?.info ?? 'Failed to fetch weather data');
  }

  if (arg.length > 1) {
    return json.map((entry: any) => parseWeatherData(entry.current));
  }

  return [parseWeatherData(json.current)];
};

export const searchCity = async (query: string): Promise<WeatherCity[]> => {
  const response = await fetch(
    `https://api.weatherstack.com/current?access_key=${API_KEY}&query=${query}`
  );

  const { location, current: data } = await response.json();

  if (location !== undefined && data !== undefined) {
    const compositeId = `${location.name}-${location.country}`
      .replace(/\s+/g, '-')
      .toLowerCase();

    return [
      {
        id: compositeId,
        name: location.name,
        weather: parseWeatherData(data),
        country: location.country,
        isFavorite: false,
        population: 0
      }
    ];
  }

  return [];
};

const parseWeatherData = (data: any): WeatherInfo => ({
  description: data.weather_descriptions[0],
  lastUpdated: new Date().toISOString(),
  temperature: data.temperature,
  icon: data.weather_icons[0],
  visibility: data.visibility,
  windSpeed: data.wind_speed,
  feelsLike: data.feelslike,
  humidity: data.humidity,
  pressure: data.pressure
});
