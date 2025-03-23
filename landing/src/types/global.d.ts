// landing/src/types/global.d.ts
// Add this file to provide global type declarations for Twitch integration

import { TwitchAuthData } from '../../services/twitch/twitch-types';

declare global {
  interface Window {
    loginWithTwitch?: (scopes: string[]) => Promise<TwitchAuthData>;
    validateTwitchToken?: (token: string) => Promise<boolean>;
    logoutFromTwitch?: (token?: string) => Promise<boolean>;
    getTwitchAuth?: () => TwitchAuthData | null;
    setTwitchClientId?: (clientId: string) => void;
    TWITCH_CLIENT_ID?: string;
    ENV: Record<string, unknown>;
  }
}

// This empty export makes this file a module
export {};