import Head from 'next/head';
import Link from 'next/link';
import ChatWidget from '../components/ChatWidget';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-100">
      <Head>
        <title>Squeeze Alpha - AI Trading Assistant</title>
        <meta name="description" content="AI-powered trading assistant with portfolio management" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="container mx-auto px-4 py-8">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Squeeze Alpha
          </h1>
          <p className="text-xl text-gray-600 mb-6">
            Your AI-powered trading assistant
          </p>
          <Link
            href="/portfolio"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            View Portfolio
          </Link>
        </header>

        <div className="max-w-4xl mx-auto">
          <ChatWidget />
        </div>
      </main>
    </div>
  );
}
