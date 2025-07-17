import Alpaca from '@alpacahq/alpaca-trade-api';

let alpacaClient: Alpaca | null = null;

export function getAlpacaClient(): Alpaca {
  if (!alpacaClient) {
    if (!process.env.ALPACA_API_KEY || !process.env.ALPACA_SECRET_KEY) {
      throw new Error('Missing Alpaca API credentials');
    }

    alpacaClient = new Alpaca({
      keyId: process.env.ALPACA_API_KEY,
      secretKey: process.env.ALPACA_SECRET_KEY,
      paper: process.env.ALPACA_PAPER === 'true', // Use paper trading by default
      usePolygon: false,
    });
  }

  return alpacaClient;
}

export default getAlpacaClient;
