/**
 * Migration utilities for migrating from other environment variable solutions.
 */

/**
 * Configuration for dotenv migration.
 */
export interface DotenvMigrationConfig {
  /**
   * Path to .env file (defaults to .env in current directory).
   */
  envPath?: string;

  /**
   * Whether to include optional variables in the schema.
   * @default false
   */
  includeOptional?: boolean;
}

/**
 * Migrates from dotenv-style .env file to next-env-guard schema.
 * Reads the .env file and generates a Zod schema.
 * 
 * @param config - Migration configuration
 * @returns Generated schema code as a string
 */
export function migrateFromDotenv(config: DotenvMigrationConfig = {}): string {
  const { envPath = '.env', includeOptional = false } = config;

  // This would require fs access, so we provide a template
  // In practice, users would run this in a Node.js script
  const template = `
// Migration from dotenv to next-env-guard
// Run this script to generate your schema:

import { readFileSync } from 'fs';
import { createEnv } from 'next-env-guard';
import { z } from 'zod';

// Read your .env file
const envContent = readFileSync('${envPath}', 'utf-8');

// Parse environment variables
const envVars: Record<string, string> = {};
const lines = envContent.split('\\n');
for (const line of lines) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const match = trimmed.match(/^([^=]+)=(.*)$/);
  if (match) {
    const [, key, value] = match;
    envVars[key.trim()] = value.trim();
  }
}

// Generate schema
const serverSchema: Record<string, any> = {};
const clientSchema: Record<string, any> = {};

for (const [key, value] of Object.entries(envVars)) {
  // Detect type from value
  let schema = z.string();
  
  if (value === 'true' || value === 'false') {
    schema = z.string().transform((val) => val === 'true');
  } else if (!isNaN(Number(value)) && value.trim() !== '') {
    schema = z.string().transform(Number);
  } else if (value.startsWith('http://') || value.startsWith('https://')) {
    schema = z.string().url();
  } else if (value.trim() === '' && ${includeOptional}) {
    schema = z.string().optional();
  }

  // Determine if server or client
  if (key.startsWith('NEXT_PUBLIC_')) {
    clientSchema[key] = schema;
  } else {
    serverSchema[key] = schema;
  }
}

// Export the env object
export const env = createEnv({
  server: serverSchema,
  client: clientSchema,
  runtimeEnv: process.env,
});
`;

  return template;
}

/**
 * Migrates from next-runtime-env to next-env-guard.
 * Provides a migration guide and helper function.
 */
export function migrateFromNextRuntimeEnv(): string {
  return `
// Migration from next-runtime-env to next-env-guard

// 1. Replace this (next-runtime-env):
//    import { getEnv } from '@next-runtime-env/core';
//    const apiUrl = getEnv('NEXT_PUBLIC_API_URL');

// 2. With this (next-env-guard):
import { createEnv } from 'next-env-guard';
import { z } from 'zod';

export const env = createEnv({
  client: {
    NEXT_PUBLIC_API_URL: z.string().url(),
  },
  runtimeEnv: process.env,
});

// Then use:
import { env } from '@/env';
const apiUrl = env.NEXT_PUBLIC_API_URL;

// 3. Replace RuntimeEnvProvider with PublicEnvScript in your layout:
import { PublicEnvScript } from 'next-env-guard/script';

export default function RootLayout({ children }) {
  return (
    <html>
      <head>
        <PublicEnvScript />
      </head>
      <body>{children}</body>
    </html>
  );
}
`;
}

/**
 * Generates a migration script that can be run to help migrate.
 */
export function generateMigrationScript(): string {
  return `
#!/usr/bin/env node

/**
 * Migration script to help migrate from other solutions to next-env-guard.
 * Run: npx tsx migrate.ts
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

console.log('🚀 Next.js Env Guard Migration Helper\\n');

const envPath = join(process.cwd(), '.env');
if (!existsSync(envPath)) {
  console.log('❌ No .env file found. Nothing to migrate.');
  process.exit(1);
}

console.log('📝 Found .env file. Analyzing...\\n');

const envContent = readFileSync(envPath, 'utf-8');
const lines = envContent.split('\\n');
const vars: Array<{ key: string; value: string; isPublic: boolean }> = [];

for (const line of lines) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const match = trimmed.match(/^([^=]+)=(.*)$/);
  if (match) {
    const [, key, value] = match;
    vars.push({
      key: key.trim(),
      value: value.trim(),
      isPublic: key.trim().startsWith('NEXT_PUBLIC_'),
    });
  }
}

console.log(\`Found \${vars.length} environment variable(s):\\n\`);

// Generate suggested schema
const serverVars = vars.filter((v) => !v.isPublic);
const clientVars = vars.filter((v) => v.isPublic);

console.log('// Generated schema for env.mjs:\\n');
console.log('import { createEnv } from "next-env-guard";');
console.log('import { z } from "zod";\\n');
console.log('export const env = createEnv({');

if (serverVars.length > 0) {
  console.log('  server: {');
  for (const { key } of serverVars) {
    console.log(\`    \${key}: z.string(),\`);
  }
  console.log('  },');
}

if (clientVars.length > 0) {
  console.log('  client: {');
  for (const { key } of clientVars) {
    console.log(\`    \${key}: z.string(),\`);
  }
  console.log('  },');
}

console.log('  runtimeEnv: process.env,');
console.log('});\\n');

console.log('✅ Migration guide generated!');
console.log('📝 Review and refine the schema types (string, number, boolean, url, etc.)');
console.log('🔧 Update your code to use env.* instead of process.env.*');
`;
}
