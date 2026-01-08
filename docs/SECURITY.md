# Security Policy

## Supported Versions

We release patches for security vulnerabilities. Which versions receive security updates depends on the severity of the vulnerability.

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |

## Security Features

next-env-guard implements multiple layers of security:

### 1. Server/Client Separation

- Server-side environment variables are **never** exposed to the client
- Runtime checks prevent accessing server variables on the client
- TypeScript types enforce separation at compile time

### 2. Input Sanitization

- All environment variable keys are sanitized
- Values are sanitized using JSON.stringify
- Protection against prototype pollution
- XSS prevention through proper escaping

### 3. Validation

- All values validated against Zod schemas
- Type checking prevents invalid data
- Comprehensive error messages for debugging

### 4. Runtime Protection

- Window.__ENV is frozen and non-configurable
- Integrity checks detect tampering
- Rate limiting prevents abuse

### 5. Key Security

- Keys must match strict patterns
- NEXT_PUBLIC_ prefix enforced for client variables
- Dangerous keys (__proto__, constructor, prototype) blocked

## Reporting a Vulnerability

If you discover a security vulnerability, please **do not** open a public issue. Instead, please report it via one of the following methods:

1. **Email**: Open a GitHub Security Advisory at https://github.com/ehoneahobed/next-env-guard/security/advisories/new
2. **GitHub Security Advisory**: Use GitHub's private vulnerability reporting

### What to Include

- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if you have one)

### Response Time

We aim to:
- Acknowledge receipt within 48 hours
- Provide initial assessment within 7 days
- Release a patch within 30 days (depending on severity)

## Security Best Practices

### For Users

1. **Never commit `.env` files** with sensitive data
2. **Use strong validation** in your Zod schemas
3. **Review client variables** - remember they're exposed to the browser
4. **Use namespaces** for multiple instances to avoid conflicts
5. **Keep dependencies updated**

### For Contributors

1. **Never log sensitive data** in error messages
2. **Sanitize all user inputs**
3. **Follow secure coding practices**
4. **Review security implications** of changes
5. **Add security tests** for new features

## Known Limitations

1. **Window.__ENV Access**: While we freeze and protect window.__ENV, it's still accessible via direct property access. This is by design for functionality, but developers should be aware.

2. **Rate Limiter Memory**: The rate limiter stores attempts in memory. For very long-running applications, this could accumulate. Consider implementing cleanup in future versions.

3. **Edge Runtime**: Edge Runtime has limited Node.js APIs. Some features may have limitations in Edge Runtime.

## Security Considerations

### Content Security Policy (CSP)

If you use a strict CSP, you may need to allow inline scripts for the PublicEnvScript component. Consider:

```html
<script-src 'self' 'unsafe-inline';>
```

However, the script is generated server-side and uses JSON.stringify, which is safe.

### XSS Prevention

All values are sanitized using JSON.stringify, which:
- Escapes all special characters
- Prevents code injection
- Handles Unicode correctly

### Prototype Pollution

We explicitly block dangerous keys:
- `__proto__`
- `constructor`
- `prototype`

## Security Updates

Security updates will be:
- Released as patch versions (0.1.x)
- Documented in CHANGELOG.md
- Tagged with security labels on GitHub

## Acknowledgments

We thank security researchers who responsibly disclose vulnerabilities.
