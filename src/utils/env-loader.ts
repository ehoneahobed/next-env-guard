/**
 * Environment file loading utilities.
 * Handles loading and merging multiple .env files according to Next.js conventions.
 */

import * as fs from 'fs';
import * as path from 'path';

/**
 * Order of environment file loading (higher priority first):
 * 1. .env.development.local / .env.production.local
 * 2. .env.local (loaded in all environments except test)
 * 3. .env.development / .env.production / .env.test
 * 4. .env
 */
export interface EnvFileLoadOptions {
  /**
   * The directory to search for .env files.
   * @default process.cwd()
   */
  cwd?: string;

  /**
   * The current environment (development, production, test).
   * @default process.env.NODE_ENV || 'development'
   */
  nodeEnv?: string;

  /**
   * Whether to load .env.local files.
   * @default true
   */
  loadLocal?: boolean;
}

/**
 * Parses a .env file content into a key-value object.
 */
function parseEnvFile(content: string): Record<string, string> {
  const env: Record<string, string> = {};
  const lines = content.split('\n');

  for (const line of lines) {
    // Skip empty lines and comments
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    // Parse KEY=VALUE or KEY="VALUE" or KEY='VALUE'
    const match = trimmed.match(/^([^=]+)=(.*)$/);
    if (match) {
      const [, key, value] = match;
      // Remove quotes if present
      const unquotedValue = value.replace(/^["']|["']$/g, '');
      env[key.trim()] = unquotedValue.trim();
    }
  }

  return env;
}

/**
 * Loads a single .env file if it exists.
 */
function loadEnvFile(filePath: string): Record<string, string> | null {
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      return parseEnvFile(content);
    }
  } catch (error) {
    // Silently fail if file doesn't exist or can't be read
    if (process.env.NODE_ENV === 'development') {
      console.warn(`⚠️  Warning: Could not load ${filePath}:`, error);
    }
  }
  return null;
}

/**
 * Loads and merges environment files according to Next.js conventions.
 * Later files override earlier ones.
 * 
 * @param options - Configuration options
 * @returns Merged environment variables
 */
export function loadEnvFiles(options: EnvFileLoadOptions = {}): Record<string, string> {
  const {
    cwd = process.cwd(),
    nodeEnv = process.env.NODE_ENV || 'development',
    loadLocal = true,
  } = options;

  const env: Record<string, string> = {};

  // Order of loading (later files override earlier ones)
  const filesToLoad: string[] = [];

  // 1. Base .env file
  filesToLoad.push('.env');

  // 2. Environment-specific .env file (e.g., .env.development)
  if (nodeEnv) {
    filesToLoad.push(`.env.${nodeEnv}`);
  }

  // 3. .env.local (skip in test environment)
  if (loadLocal && nodeEnv !== 'test') {
    filesToLoad.push('.env.local');
  }

  // 4. Environment-specific .env.local (e.g., .env.development.local)
  if (loadLocal && nodeEnv) {
    filesToLoad.push(`.env.${nodeEnv}.local`);
  }

  // Load files in order (later files override earlier ones)
  for (const fileName of filesToLoad) {
    const filePath = path.join(cwd, fileName);
    const fileEnv = loadEnvFile(filePath);
    if (fileEnv) {
      Object.assign(env, fileEnv);
    }
  }

  return env;
}

/**
 * Loads environment files and merges with process.env.
 * process.env takes priority over .env files.
 * 
 * @param options - Configuration options
 * @returns Merged environment variables
 */
export function loadEnv(options: EnvFileLoadOptions = {}): NodeJS.ProcessEnv {
  const fileEnv = loadEnvFiles(options);
  
  // Merge with process.env (process.env takes priority)
  return {
    ...fileEnv,
    ...process.env,
  };
}
