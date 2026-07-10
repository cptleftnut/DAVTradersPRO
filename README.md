# DAVTradersPRO

Professional cryptocurrency trading platform with AI-powered insights.

## Features

- AI-powered trading insights (Gemini API)
- Binance exchange integration
- Stripe payment processing
- Real-time market data

## CI/CD Pipeline

This project uses GitHub Actions for continuous integration and deployment:

| Stage | Description |
|-------|-------------|
| **Security Audit** | `npm audit` + TruffleHog secret scanning |
| **Lint & Format** | ESLint + Prettier checks |
| **Unit Tests** | Matrix testing on Node.js 18 & 20 with coverage |
| **Build** | Optimized production build |
| **Docker** | Container image pushed to GHCR |
| **Release** | Automated releases on version tags |

## Quick Start

```bash
# Install dependencies
npm ci

# Copy environment variables
cp .env.example .env

# Start development server
npm run dev
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `GEMINI_API_KEY` | Google Gemini AI API key |
| `BINANCE_API_KEY` | Binance API key |
| `BINANCE_API_SECRET` | Binance API secret |
| `STRIPE_SECRET_KEY` | Stripe secret key |
| `APP_URL` | Application URL |

## Security

This project follows security best practices for financial applications:
- All secrets are injected via environment variables
- CI/CD pipeline includes automated secret scanning
- Dependencies are monitored by Dependabot
- High/critical CVEs block deployment

## License

Private — All rights reserved.
