'use client';

import { useCallback, useEffect, useState, useMemo } from 'react';

import { ClockLoader, MoonLoader } from 'react-spinners';

import { useRouter, useParams } from 'next/navigation';

import { Space_Grotesk } from 'next/font/google';

import { WeatherInfoPane, NotesSection, Header } from '@/components';

import { getWeatherData } from '@/services/weather-service';

import { useMainStore } from '@/stores';

import { logger, cls } from '@/utils';

import { appName } from '@/constants';

const spaceGrotesk = Space_Grotesk({ subsets: ['latin'] });

export default function CityWeatherInfoPage() {
  const { updateWeatherData, weatherData, cities } = useMainStore();

  const [isFetchingData, setIsFetchingData] = useState(false);

  const [isLoadingPage, setIsLoadingPage] = useState(true);

  const cityId = decodeURIComponent(`${useParams().id}`);

  const weather = weatherData[cityId];

  const router = useRouter();

  const city = useMemo(
    () => cities.find((item) => item.id === cityId),
    [cityId, cities]
  );

  const obtainWeatherData = useCallback(async () => {
    if (weather === undefined) {
      setIsFetchingData(true);
    }

    try {
      const [weatherInfo] = await getWeatherData([city!.name]);
      updateWeatherData(city!.id, weatherInfo);
    } catch (error) {
      logger.error(error);
    }

    setIsFetchingData(false);
  }, [updateWeatherData, weather, city]);

  useEffect(() => {
    setIsLoadingPage(false);

    if (city !== undefined) {
      if (weather !== undefined) {
        /* Use cached data if available and fresh (less than 30 minutes old) */

        const minutesSinceLastUpdate =
          (new Date().getTime() - new Date(weather.lastUpdated).getTime()) /
          (60 * 1000);

        if (minutesSinceLastUpdate < 30) {
          setIsFetchingData(false);
          return;
        }
      }

      obtainWeatherData();
    } else {
      router.push('/');
    }
  }, [obtainWeatherData, weather, router, city]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      if (document.title === appName && city !== undefined) {
        document.title += ` | Weather In ${city.name}, ${city.country}`;
      }
    }, 256);

    return () => clearInterval(intervalId);
  }, [city]);

  if (city !== undefined) {
    return (
      <main
        className={cls(
          'relative mx-auto flex w-full max-w-best flex-col gap-6',
          'pb-14 pt-32 transition-opacity duration-500 ease-in-out',
          isLoadingPage && 'opacity-0',
          spaceGrotesk.className
        )}
      >
        {isFetchingData || weather === undefined ? (
          <section className="absolute inset-0 flex h-screen w-full">
            <MoonLoader className="m-auto" color="#FFFFFF" size={64} />
          </section>
        ) : (
          <>
            <Header />
            <WeatherInfoPane data={{ ...city, weather }} />
            <NotesSection cityId={cityId} />
          </>
        )}
        <section
          className={cls(
            'absolute inset-0 flex h-screen w-full',
            'transition-opacity duration-500 ease-in-out',
            !isLoadingPage && '-z-10 opacity-0'
          )}
        >
          <ClockLoader className="m-auto" color="#FFFFFF" size={64} />
        </section>
      </main>
    );
  }

  return null;
}
