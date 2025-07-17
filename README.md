# gpt-alpha-squeeze Backend

A Next.js + Tailwind PWA that provides short squeeze analysis and portfolio management through AI-powered insights.

## Features

- **Chat with Squeeze Alpha** - GPT-4 powered analysis via `/api/chat` endpoint
- **Live Alpaca Portfolio Management** - Real-time portfolio tracking via `/api/alpaca/*` endpoints  
- **Real-time Market Screening** - Live quotes & short-interest data to recommend squeeze opportunities
- **Portfolio Optimization** - AI-powered suggestions for your current holdings via `/api/alpaca/optimize`

## API Endpoints

### Market Data & Analysis
- `POST /api/chat` - Chat with Squeeze Alpha AI analyst
- `POST /api/alpaca/optimize` - Get portfolio optimization suggestions

### Alpaca Trading
- `GET /api/alpaca/positions` - Get current positions
- `POST /api/alpaca/order` - Create new orders

## Key Files

- **lib/marketData.ts** - `getQuote()` and `getShortStats()` calling Alpaca data APIs
- **lib/screener.ts** - `screenSqueezers()` to score & rank tickers  
- **pages/api/alpaca/client.ts** - Alpaca SDK client instance
- **pages/api/alpaca/positions.ts** - GET endpoint calls `alpaca.getPositions()`
- **pages/api/alpaca/order.ts** - POST endpoint creates new Alpaca orders
- **pages/api/alpaca/optimize.ts** - POST endpoint with portfolio optimization logic
- **pages/api/chat.ts** - POST endpoint integrating market data with GPT-4 analysis

## Getting Started

1. **Install dependencies**
   ```bash
   npm install axios @alpacahq/alpaca-trade-api openai
   ```

2. **Set environment variables**
   ```bash
   APCA_API_KEY_ID=your_alpaca_key
   APCA_API_SECRET_KEY=your_alpaca_secret  
   ALPACA_API_URL=https://paper-api.alpaca.markets
   OPENAI_API_KEY=your_openai_key
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Test endpoints**
   ```bash
   # Test positions
   curl http://localhost:3000/api/alpaca/positions
   
   # Test order creation
   curl -X POST http://localhost:3000/api/alpaca/order \
     -H "Content-Type: application/json" \
     -d '{"symbol":"AAPL","qty":1,"side":"buy","type":"market","time_in_force":"day"}'
   
   # Test portfolio optimization  
   curl -X POST http://localhost:3000/api/alpaca/optimize
   
   # Test AI chat
   curl -X POST http://localhost:3000/api/chat \
     -H "Content-Type: application/json" \
     -d '{"watchlist":["LIXT"],"messages":[{"role":"user","content":"Analyze LIXT"}]}'
   ```

## Testing

Run the complete smoke test suite:
```bash
./scripts/smoke-test.sh
```

## Deployment

This project includes GitHub Actions CI/CD that automatically runs smoke tests on every push.
