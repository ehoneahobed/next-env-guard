/**
 * Observability hooks for production monitoring.
 * These hooks allow integration with logging, telemetry, and error reporting services.
 * 
 * @public
 */

// Types imported for JSDoc only - not used at runtime

/**
 * Logger interface for custom logging implementations.
 */
export interface EnvLogger {
  /**
   * Logs an error.
   */
  error(message: string, error?: Error, context?: Record<string, unknown>): void;

  /**
   * Logs a warning.
   */
  warn(message: string, context?: Record<string, unknown>): void;

  /**
   * Logs an info message.
   */
  info(message: string, context?: Record<string, unknown>): void;

  /**
   * Logs a debug message.
   */
  debug(message: string, context?: Record<string, unknown>): void;
}

/**
 * Telemetry interface for custom telemetry implementations.
 */
export interface EnvTelemetry {
  /**
   * Tracks a metric.
   */
  trackMetric(name: string, value: number, tags?: Record<string, string>): void;

  /**
   * Tracks an event.
   */
  trackEvent(name: string, properties?: Record<string, unknown>): void;
}

/**
 * Error reporter interface for custom error reporting implementations.
 */
export interface EnvErrorReporter {
  /**
   * Reports an error.
   */
  reportError(error: Error, context?: Record<string, unknown>): void;
}

/**
 * Global observability hooks.
 */
class ObservabilityHooks {
  private logger: EnvLogger | null = null;
  private telemetry: EnvTelemetry | null = null;
  private errorReporter: EnvErrorReporter | null = null;

  /**
   * Sets a custom logger.
   */
  setLogger(logger: EnvLogger): void {
    this.logger = logger;
  }

  /**
   * Sets a custom telemetry implementation.
   */
  setTelemetry(telemetry: EnvTelemetry): void {
    this.telemetry = telemetry;
  }

  /**
   * Sets a custom error reporter.
   */
  setErrorReporter(reporter: EnvErrorReporter): void {
    this.errorReporter = reporter;
  }

  /**
   * Logs an error using the configured logger.
   */
  logError(message: string, error?: Error, context?: Record<string, unknown>): void {
    if (this.logger) {
      this.logger.error(message, error, context);
    } else if (process.env.NODE_ENV === 'development') {
      console.error(message, error, context);
    }
  }

  /**
   * Logs a warning using the configured logger.
   */
  logWarn(message: string, context?: Record<string, unknown>): void {
    if (this.logger) {
      this.logger.warn(message, context);
    } else if (process.env.NODE_ENV === 'development') {
      console.warn(message, context);
    }
  }

  /**
   * Logs an info message using the configured logger.
   */
  logInfo(message: string, context?: Record<string, unknown>): void {
    if (this.logger) {
      this.logger.info(message, context);
    }
  }

  /**
   * Tracks a metric using the configured telemetry.
   */
  trackMetric(name: string, value: number, tags?: Record<string, string>): void {
    if (this.telemetry) {
      this.telemetry.trackMetric(name, value, tags);
    }
  }

  /**
   * Tracks an event using the configured telemetry.
   */
  trackEvent(name: string, properties?: Record<string, unknown>): void {
    if (this.telemetry) {
      this.telemetry.trackEvent(name, properties);
    }
  }

  /**
   * Reports an error using the configured error reporter.
   */
  reportError(error: Error, context?: Record<string, unknown>): void {
    if (this.errorReporter) {
      this.errorReporter.reportError(error, context);
    }
  }

  /**
   * Clears all hooks.
   */
  clear(): void {
    this.logger = null;
    this.telemetry = null;
    this.errorReporter = null;
  }
}

/**
 * Global observability hooks instance.
 */
export const observabilityHooks = new ObservabilityHooks();

/**
 * Sets up observability hooks for production monitoring.
 * 
 * @example
 * ```typescript
 * import { setupObservability } from 'next-env-guard/core/hooks';
 * 
 * setupObservability({
 *   logger: {
 *     error: (msg, err, ctx) => console.error(msg, err, ctx),
 *     warn: (msg, ctx) => console.warn(msg, ctx),
 *     info: (msg, ctx) => console.info(msg, ctx),
 *     debug: (msg, ctx) => console.debug(msg, ctx),
 *   },
 *   telemetry: {
 *     trackMetric: (name, value, tags) => {
 *       // Send to your telemetry service
 *     },
 *     trackEvent: (name, props) => {
 *       // Send to your telemetry service
 *     },
 *   },
 *   errorReporter: {
 *     reportError: (error, context) => {
 *       // Send to your error reporting service
 *     },
 *   },
 * });
 * ```
 */
export function setupObservability(config: {
  logger?: EnvLogger;
  telemetry?: EnvTelemetry;
  errorReporter?: EnvErrorReporter;
}): void {
  if (config.logger) {
    observabilityHooks.setLogger(config.logger);
  }
  if (config.telemetry) {
    observabilityHooks.setTelemetry(config.telemetry);
  }
  if (config.errorReporter) {
    observabilityHooks.setErrorReporter(config.errorReporter);
  }
}
