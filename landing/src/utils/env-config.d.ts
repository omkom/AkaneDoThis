// Type definitions for environment variables
// Extend the Window interface to include our custom properties
export function setupEnvironment(): void;
export function getEnv(key: string, defaultValue?: string): string | undefined;

declare const envConfig: {
  setupEnvironment: typeof setupEnvironment;
  getEnv: typeof getEnv;
};

export default envConfig;
