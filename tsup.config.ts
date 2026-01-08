import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'script/index': 'src/script/index.ts',
    'cli/validate': 'src/cli/validate.ts',
  },
  format: ['cjs', 'esm'],
  dts: true,
  splitting: false,
  sourcemap: process.env.NODE_ENV === 'development',
  clean: true,
  treeshake: {
    preset: 'smallest',
    moduleSideEffects: false,
  },
  minify: process.env.NODE_ENV === 'production',
  external: ['react', 'next', 'zod'],
  esbuildOptions(options) {
    options.drop = process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : [];
  },
  noExternal: process.env.NODE_ENV === 'development' ? [] : [],
});
