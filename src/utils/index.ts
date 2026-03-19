import { type ClassValue, clsx } from 'clsx';

import { twMerge } from 'tailwind-merge';

export class RateLimitError extends Error {
  constructor() {
    super('API rate limit reached');
    this.name = 'RateLimitError';
  }
}

class Logger {
  private static instance: Logger;

  private isInProduction: boolean;

  private constructor() {
    this.isInProduction = process.env.NODE_ENV === 'production';
  }

  public static getInstance(): Logger {
    return (Logger.instance ||= new Logger());
  }

  public error(message: any, ...optionalParams: any[]): void {
    if (!this.isInProduction) {
      console.error(message, ...optionalParams);
    }
  }

  public debug(message: any, ...optionalParams: any[]): void {
    if (!this.isInProduction) {
      console.debug(message, ...optionalParams);
    }
  }

  public warn(message: any, ...optionalParams: any[]): void {
    if (!this.isInProduction) {
      console.warn(message, ...optionalParams);
    }
  }

  public info(message: any, ...optionalParams: any[]): void {
    if (!this.isInProduction) {
      console.info(message, ...optionalParams);
    }
  }
}

export const cls = (...inputs: ClassValue[]) => {
  return twMerge(clsx(inputs));
};

export const logger = Logger.getInstance();
