# Architecture Documentation

## Overview

next-env-guard is built with a modular architecture that separates concerns and provides clear interfaces for different runtime environments.

## Core Principles

1. **Type Safety First**: Full TypeScript support with branded types
2. **Security by Default**: Strict server/client separation
3. **Runtime Awareness**: Adapts to different execution environments
4. **Performance Optimized**: Caching, lazy loading, minimal overhead
5. **Extensible**: Plugin-ready architecture for future enhancements

## Architecture Layers

### 1. Runtime Adapter Layer

The runtime adapter layer abstracts environment-specific behavior:

```
RuntimeAdapter (Interface)
├── ServerRuntimeAdapter
├── ClientRuntimeAdapter
└── EdgeRuntimeAdapter
```

**Purpose**: Allows swapping implementations for different runtimes without changing core logic.

### 2. Validation Layer

The validation layer handles schema validation:

```
validator.ts
├── validateEnv() - Validates against Zod schemas
├── validateClientVariableNames() - Ensures NEXT_PUBLIC_ prefix
└── Error collection and reporting
```

**Purpose**: Centralized validation logic with comprehensive error reporting.

### 3. Security Layer

The security layer enforces security policies:

```
security.ts
├── sanitizeEnvKey() - Prevents injection attacks
├── validateWindowEnvIntegrity() - Checks for tampering
├── createSecureEnvProxy() - Prevents server var access on client
└── Rate limiting
```

**Purpose**: Multi-layer security enforcement.

### 4. Configuration Layer

The configuration layer manages settings:

```
config/config-manager.ts
├── ConfigManager (Interface)
└── EnvConfigManager (Implementation)
```

**Purpose**: Centralized configuration with validation.

### 5. Error Handling Layer

The error handling layer provides graceful degradation:

```
error-boundary.ts
├── withErrorBoundary() - Wraps functions with error handling
└── safeExecute() - Safe execution with fallbacks

fallback-strategy.ts
├── FallbackStrategy (Interface)
├── DefaultFallbackStrategy
├── RetryFallbackStrategy
└── CustomFallbackStrategy
```

**Purpose**: Robust error handling and recovery mechanisms.

## Data Flow

### Server-Side Flow

```
createEnv()
  → ConfigManager.validateConfig()
  → RuntimeAdapter.createRuntimeAdapter()
  → RuntimeAdapter.validateServerEnv()
  → RuntimeAdapter.validateClientEnv()
  → createSecureEnvProxy()
  → Return merged env object
```

### Client-Side Flow

```
createEnv()
  → ConfigManager.validateConfig()
  → ClientRuntimeAdapter
  → createClientEnvProxy()
  → Proxy reads from window.__ENV (lazy)
  → createSecureEnvProxy()
  → Return secure proxy
```

### Script Injection Flow

```
PublicEnvScript (Server Component)
  → Read NEXT_PUBLIC_* from process.env
  → validateEnvValues()
  → generateEnvScript()
  → Inject into <script> tag
  → window.__ENV set before React hydration
```

## Module Dependencies

```
create-env.ts
  → config-manager.ts
  → runtime/index.ts
  → validator.ts
  → security.ts
  → client-env.ts

runtime/index.ts
  → runtime-adapter.ts
  → server-adapter.ts
  → client-adapter.ts
  → edge-adapter.ts

client-env.ts
  → validator.ts
  → security.ts
  → detector.ts

script/generator.ts
  → security.ts
```

## Design Patterns

### 1. Adapter Pattern

Runtime adapters abstract environment differences.

### 2. Proxy Pattern

Proxies provide lazy loading and security enforcement.

### 3. Factory Pattern

`createEnv()` acts as a factory for environment objects.

### 4. Strategy Pattern

Fallback strategies provide different error recovery approaches.

### 5. Singleton Pattern

Cached runtime detection and configuration.

## Security Architecture

### Multi-Layer Security

1. **Schema Validation**: Zod validates all values
2. **Key Sanitization**: Prevents injection attacks
3. **Prefix Enforcement**: NEXT_PUBLIC_ required for client vars
4. **Proxy Guards**: Runtime checks prevent server var access
5. **Integrity Checks**: Validates window.__ENV hasn't been tampered
6. **Rate Limiting**: Prevents abuse

### Security Boundaries

- Server variables never exposed to client
- Client variables validated before injection
- Window.__ENV frozen and non-configurable
- All keys sanitized

## Performance Optimizations

1. **Caching**: Runtime detection, keys, validation results
2. **Lazy Loading**: Client env loaded on first access
3. **Batch Validation**: All errors collected before throwing
4. **Optimized Iteration**: for...in loops instead of Object.entries
5. **Set Lookups**: O(1) server key checks
6. **Minimal Object Creation**: Reuse objects where possible

## Extension Points

The architecture is designed for future extensibility:

- Runtime adapters can be swapped
- Fallback strategies are pluggable
- Configuration is extensible
- Error handlers are configurable

## Testing Architecture

Testing utilities provided:

- `MockRuntimeAdapter` - Mock different runtimes
- `mockWindowEnv()` - Mock window.__ENV
- `mockProcessEnv()` - Mock process.env

## Future Enhancements

The architecture supports:

- Plugin system for transformations
- Middleware for validation hooks
- Observability hooks
- Multiple env instances with isolation
- Advanced caching strategies
