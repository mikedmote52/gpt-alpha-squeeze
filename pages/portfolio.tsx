import Head from 'next/head';
import Link from 'next/link';
import Holdings from '../components/Holdings';
import Recommendations from '../components/Recommendations';
import { usePortfolio } from '../context/PortfolioContext';
import { useSlack } from '../hooks/useSlack';

export default function Portfolio() {
  const { recommendations, addMove } = usePortfolio();
  const { sendMessage: sendSlack, loading: slackLoading } = useSlack();

  const handleApplyRebalance = async () => {
    if (recommendations.length === 0) {
      alert('No recommendations to apply');
      return;
    }

    try {
      const message = `🤖 AI Rebalance Applied\n\nRecommendations executed:\n${recommendations
        .map(rec => `• ${rec.action.toUpperCase()} ${rec.quantity} ${rec.symbol}`)
        .join('\n')}`;

      await sendSlack({ text: message });
      
      recommendations.forEach(rec => {
        addMove({
          symbol: rec.symbol,
          action: rec.action,
          quantity: rec.quantity,
        });
      });

      alert('Rebalance applied successfully! Slack notification sent.');
    } catch (error) {
      console.error('Error applying rebalance:', error);
      alert('Error applying rebalance. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Head>
        <title>Portfolio - Squeeze Alpha</title>
        <meta name="description" content="View your portfolio and AI recommendations" />
      </Head>

      <main className="container mx-auto px-4 py-8">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Portfolio</h1>
          <Link
            href="/"
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Back to Chat
          </Link>
        </header>

        <div className="grid gap-8">
          <Holdings />
          
          <Recommendations />

          {recommendations.length > 0 && (
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-semibold mb-4">Actions</h3>
              <button
                onClick={handleApplyRebalance}
                disabled={slackLoading}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {slackLoading ? 'Applying...' : 'Apply AI Rebalance'}
              </button>
              <p className="text-sm text-gray-600 mt-2">
                This will execute all current recommendations and send a notification to Slack.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
