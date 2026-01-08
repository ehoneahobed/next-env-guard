#!/usr/bin/env node

/**
 * CLI tool for validating environment variables without starting the server.
 * 
 * Usage:
 *   next-env-guard-validate [options]
 * 
 * Options:
 *   --schema <path>    Path to env.mjs file (default: ./env.mjs)
 *   --env <path>       Path to .env file (default: .env in cwd)
 *   --format <format>  Output format: json, human (default: human)
 *   --help             Show help message
 */

import * as fs from 'fs';
import * as path from 'path';
import { loadEnv } from '../utils/env-loader';

/**
 * CLI options.
 */
interface CliOptions {
  schema?: string;
  env?: string;
  format?: 'json' | 'human';
  help?: boolean;
}

/**
 * Parses command line arguments.
 */
function parseArgs(): CliOptions {
  const args = process.argv.slice(2);
  const options: CliOptions = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    switch (arg) {
      case '--schema':
        options.schema = args[++i];
        break;
      case '--env':
        options.env = args[++i];
        break;
      case '--format':
        options.format = args[++i] as 'json' | 'human';
        break;
      case '--help':
      case '-h':
        options.help = true;
        break;
      default:
        if (arg.startsWith('--')) {
          console.error(`Unknown option: ${arg}`);
          process.exit(1);
        }
    }
  }

  return options;
}

/**
 * Prints help message.
 */
function printHelp(): void {
  console.log(`
Usage: next-env-guard-validate [options]

Validate environment variables against your schema without starting the server.

Options:
  --schema <path>    Path to env.mjs file (default: ./env.mjs)
  --env <path>       Path to .env file or directory (default: .env in cwd)
  --format <format>  Output format: json, human (default: human)
  --help, -h         Show this help message

Examples:
  next-env-guard-validate
  next-env-guard-validate --schema ./src/env.mjs
  next-env-guard-validate --format json
`);
}

/**
 * Validates environment variables.
 */
function validate(options: CliOptions): { success: boolean; errors?: string[] } {
  const schemaPath = options.schema || path.join(process.cwd(), 'env.mjs');
  const envPath = options.env || process.cwd();

  // Check if schema file exists
  if (!fs.existsSync(schemaPath)) {
    return {
      success: false,
      errors: [`ENV Schema file not found: ${schemaPath}`],
    };
  }

  try {
    // Load environment variables (validation happens when accessing env)
    // This ensures env vars are available for the schema file
    void (typeof envPath === 'string' && fs.existsSync(envPath) && fs.statSync(envPath).isDirectory()
      ? loadEnv({ cwd: envPath })
      : loadEnv({ cwd: process.cwd() }));

    // Dynamically import and execute the schema
    // Note: This requires the schema file to export `env` or a `createEnv` result
    // For TypeScript files, this might require ts-node or similar
    // CLI uses require() for dynamic module loading (built to CJS)
    const schemaModule = require(schemaPath);
    const env = schemaModule.env;

    if (!env) {
      return {
        success: false,
        errors: [
          `Schema file ${schemaPath} does not export an "env" object. ` +
            'Make sure to export: export const env = createEnv({ ... });',
        ],
      };
    }

    // Try to access env to trigger validation
    // If validation fails, it will throw
    Object.keys(env);

    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      errors: [errorMessage],
    };
  }
}

/**
 * Main CLI function.
 */
function main(): void {
  const options = parseArgs();

  if (options.help) {
    printHelp();
    process.exit(0);
  }

  const format = options.format || 'human';
  const result = validate(options);

  if (format === 'json') {
    console.log(JSON.stringify(result, null, 2));
    process.exit(result.success ? 0 : 1);
  } else {
    if (result.success) {
      console.log('✅ All environment variables are valid!');
      process.exit(0);
    } else {
      console.error('❌ Environment variable validation failed:\n');
      if (result.errors) {
        result.errors.forEach((error) => {
          console.error(`  ${error}`);
        });
      }
      process.exit(1);
    }
  }
}

// Run CLI if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { validate, parseArgs, printHelp };
