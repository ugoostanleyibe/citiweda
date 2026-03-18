'use client';

import dynamic from 'next/dynamic';

export default dynamic(() => import('./weather-info-page'), { ssr: false });
