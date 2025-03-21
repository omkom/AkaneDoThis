// src/utils/env-config.d.ts
// Type definitions for environment variables

// Extend the Window interface to include our custom properties
interface Window {
    ENV: Record<string, unknown>;
    TWITCH_CLIENT_ID?: string;
    [key: string]: unknown;
  }
  
  // Export functions for TypeScript recognition
  export function setupEnvironment(): void;
  export function getEnv(key: string, defaultValue?: string): string;
  
  export default {
    setupEnvironment,
    getEnv
  };