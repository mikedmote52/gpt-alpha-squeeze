import Alpaca from '@alpacahq/alpaca-trade-api';

export default new Alpaca({
  keyId: process.env.ALPACA_KEY_ID!,
  secretKey: process.env.ALPACA_SECRET_KEY!,
  paper: true,
  baseUrl: process.env.ALPACA_API_URL || 'https://paper-api.alpaca.markets',
});
