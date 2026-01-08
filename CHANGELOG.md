# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial release of next-env-guard
- Type-safe environment variable management with Zod validation
- Runtime client-side environment variable injection
- Server/client separation with security enforcement
- Support for App Router and Pages Router
- Namespace support for multiple env instances
- Runtime adapter pattern for different execution environments
- Error boundaries and fallback strategies
- Comprehensive security features (rate limiting, key sanitization, integrity checks)
- Testing utilities for mocking environments
- CLI validation tool

### Security
- XSS prevention through JSON.stringify sanitization
- Key sanitization to prevent injection attacks
- Rate limiting for validation attempts
- Window.__ENV integrity validation
- Protection against prototype pollution

## [0.0.1] - 2025-01-08

### Added
- Initial release

[Unreleased]: https://github.com/ehoneahobed/next-env-guard/compare/v0.0.1...HEAD
[0.0.1]: https://github.com/ehoneahobed/next-env-guard/releases/tag/v0.0.1
