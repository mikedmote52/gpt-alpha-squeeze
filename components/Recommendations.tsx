import { usePortfolio } from '../context/PortfolioContext';

export default function Recommendations() {
  const { recommendations, clearRecommendations } = usePortfolio();

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold">AI Recommendations</h2>
        {recommendations.length > 0 && (
          <button
            onClick={clearRecommendations}
            className="text-sm text-red-600 hover:text-red-800"
          >
            Clear All
          </button>
        )}
      </div>
      
      {recommendations.length === 0 ? (
        <div className="text-gray-500 text-center py-8">
          No recommendations yet. Chat with Squeeze Alpha to get AI-powered trading suggestions.
        </div>
      ) : (
        <div className="space-y-4">
          {recommendations.map((rec) => (
            <div
              key={rec.id}
              className="border border-gray-200 rounded-lg p-4"
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-lg">{rec.symbol}</span>
                  <span className={`px-2 py-1 rounded text-sm font-medium ${
                    rec.action === 'buy' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {rec.action.toUpperCase()}
                  </span>
                </div>
                <span className="text-sm text-gray-500">
                  {new Date(rec.timestamp).toLocaleDateString()}
                </span>
              </div>
              <div className="mb-2">
                <span className="text-sm text-gray-600">Quantity: </span>
                <span className="font-medium">{rec.quantity}</span>
              </div>
              <div className="text-sm text-gray-700">
                {rec.reason}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
