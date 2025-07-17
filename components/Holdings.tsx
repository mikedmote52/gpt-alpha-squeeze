import { useEffect } from 'react';
import { useAlpaca } from '../hooks/useAlpaca';

export default function Holdings() {
  const { positions, loading, error, fetchPositions } = useAlpaca();

  useEffect(() => {
    fetchPositions();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-semibold mb-4">Current Holdings</h2>
        <div className="text-center py-8">Loading positions...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-semibold mb-4">Current Holdings</h2>
        <div className="text-red-600 text-center py-8">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-semibold mb-4">Current Holdings</h2>
      
      {positions.length === 0 ? (
        <div className="text-gray-500 text-center py-8">
          No positions found
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 px-4">Symbol</th>
                <th className="text-right py-2 px-4">Quantity</th>
                <th className="text-right py-2 px-4">Market Value</th>
                <th className="text-right py-2 px-4">Cost Basis</th>
                <th className="text-right py-2 px-4">P&L</th>
                <th className="text-right py-2 px-4">P&L %</th>
              </tr>
            </thead>
            <tbody>
              {positions.map((position) => (
                <tr key={position.symbol} className="border-b border-gray-100">
                  <td className="py-2 px-4 font-semibold">{position.symbol}</td>
                  <td className="text-right py-2 px-4">{position.qty}</td>
                  <td className="text-right py-2 px-4">
                    ${parseFloat(position.market_value).toFixed(2)}
                  </td>
                  <td className="text-right py-2 px-4">
                    ${parseFloat(position.cost_basis).toFixed(2)}
                  </td>
                  <td className={`text-right py-2 px-4 ${
                    parseFloat(position.unrealized_pl) >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    ${parseFloat(position.unrealized_pl).toFixed(2)}
                  </td>
                  <td className={`text-right py-2 px-4 ${
                    parseFloat(position.unrealized_plpc) >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {(parseFloat(position.unrealized_plpc) * 100).toFixed(2)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
