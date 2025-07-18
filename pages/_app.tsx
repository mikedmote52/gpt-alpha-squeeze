import '../styles/globals.css';
import type { AppProps } from 'next/app';
import { PortfolioProvider } from '../context/PortfolioContext';

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <PortfolioProvider>
      <Component {...pageProps} />
    </PortfolioProvider>
  );
}
