// Order Confirmation Dialog Component
// Shows trade details and gets user confirmation before execution

import React, { useState } from 'react';
import { AIRecommendation } from '../types/recommendations';

interface OrderConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (orderDetails: OrderDetails) => void;
  recommendation: AIRecommendation;
  currentPrice?: number;
  buyingPower?: number;
}

interface OrderDetails {
  symbol: string;
  action: 'BUY' | 'SELL';
  quantity: number;
  dollarAmount: number;
  orderType: 'market' | 'limit';
  limitPrice?: number;
  stopLoss?: number;
  takeProfit?: number;
  timeInForce: 'day' | 'gtc';
}

const OrderConfirmationDialog: React.FC<OrderConfirmationDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  recommendation,
  currentPrice,
  buyingPower = 0
}) => {
  const [orderDetails, setOrderDetails] = useState<OrderDetails>({
    symbol: recommendation.symbol,
    action: recommendation.action as 'BUY' | 'SELL',
    quantity: recommendation.positionSizing.suggestedShares,
    dollarAmount: recommendation.positionSizing.suggestedDollarAmount,
    orderType: 'market',
    stopLoss: recommendation.stopLoss,
    takeProfit: recommendation.priceTarget,
    timeInForce: 'day'
  });

  const [useStopLoss, setUseStopLoss] = useState(recommendation.action === 'BUY');
  const [useTakeProfit, setUseTakeProfit] = useState(recommendation.action === 'BUY');

  const price = (currentPrice && !isNaN(parseFloat(currentPrice.toString()))) ? parseFloat(currentPrice.toString()) : 0;
  const estimatedCost = orderDetails.quantity * price;
  const riskAmount = orderDetails.stopLoss ? 
    (price - orderDetails.stopLoss) * orderDetails.quantity : 0;
  const potentialGain = orderDetails.takeProfit ? 
    (orderDetails.takeProfit - price) * orderDetails.quantity : 0;

  const handleQuantityChange = (quantity: number) => {
    setOrderDetails(prev => ({
      ...prev,
      quantity: Math.max(1, quantity),
      dollarAmount: quantity * price
    }));
  };

  const handleDollarAmountChange = (dollarAmount: number) => {
    const newQuantity = Math.floor(dollarAmount / price);
    setOrderDetails(prev => ({
      ...prev,
      quantity: newQuantity,
      dollarAmount
    }));
  };

  const handleConfirm = () => {
    const finalOrderDetails = {
      ...orderDetails,
      stopLoss: useStopLoss ? orderDetails.stopLoss : undefined,
      takeProfit: useTakeProfit ? orderDetails.takeProfit : undefined
    };
    onConfirm(finalOrderDetails);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Confirm Trade Execution</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* AI Recommendation Context */}
        <div className="bg-blue-50 p-4 rounded-lg mb-6">
          <h3 className="font-semibold text-blue-900 mb-3">💡 AI Position Sizing Recommendation</h3>
          <div className="space-y-3">
            <div className="bg-white p-3 rounded border-l-4 border-blue-500">
              <p className="text-gray-800 text-sm leading-relaxed">{recommendation.reasoning}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-3 rounded">
                <p className="text-xs text-gray-600">Recommended Position Size</p>
                <p className="text-lg font-bold text-blue-900">
                  {recommendation.positionSizing.suggestedShares} shares
                </p>
                <p className="text-xs text-gray-600">
                  ${recommendation.positionSizing.suggestedDollarAmount.toFixed(0)} ({recommendation.positionSizing.percentOfPortfolio.toFixed(1)}% of portfolio)
                </p>
              </div>
              
              <div className="bg-white p-3 rounded">
                <p className="text-xs text-gray-600">Risk Amount</p>
                <p className="text-lg font-bold text-red-600">
                  ${recommendation.positionSizing.riskAmount.toFixed(0)}
                </p>
                <p className="text-xs text-gray-600">
                  8% stop-loss risk
                </p>
              </div>
            </div>
            
            <div className="text-xs text-blue-700 bg-blue-100 p-2 rounded">
              💡 You can adjust these amounts below. The AI recommendation is based on your current portfolio allocation, position performance, and risk management principles.
            </div>
          </div>
        </div>

        {/* Order Details */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          {/* Left Column */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Order Details</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Symbol</label>
                <div className="text-lg font-bold text-gray-900">{orderDetails.symbol}</div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Action</label>
                <span className={`px-3 py-1 rounded-full text-sm font-bold text-white ${
                  orderDetails.action === 'BUY' ? 'bg-green-500' : 'bg-red-500'
                }`}>
                  {orderDetails.action}
                </span>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Order Type</label>
                <select
                  value={orderDetails.orderType}
                  onChange={(e) => setOrderDetails(prev => ({ ...prev, orderType: e.target.value as 'market' | 'limit' }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="market">Market Order</option>
                  <option value="limit">Limit Order</option>
                </select>
              </div>

              {orderDetails.orderType === 'limit' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Limit Price</label>
                  <input
                    type="number"
                    step="0.01"
                    value={orderDetails.limitPrice || price}
                    onChange={(e) => setOrderDetails(prev => ({ ...prev, limitPrice: parseFloat(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Time in Force</label>
                <select
                  value={orderDetails.timeInForce}
                  onChange={(e) => setOrderDetails(prev => ({ ...prev, timeInForce: e.target.value as 'day' | 'gtc' }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="day">Day</option>
                  <option value="gtc">Good Till Canceled</option>
                </select>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Position Sizing</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                <input
                  type="number"
                  min="1"
                  value={orderDetails.quantity}
                  onChange={(e) => handleQuantityChange(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Dollar Amount</label>
                <input
                  type="number"
                  min="1"
                  value={orderDetails.dollarAmount}
                  onChange={(e) => handleDollarAmountChange(parseFloat(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Current Price</label>
                <div className="text-lg font-bold text-gray-900">${price.toFixed(2)}</div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Cost</label>
                <div className="text-lg font-bold text-gray-900">${estimatedCost.toFixed(2)}</div>
              </div>

              {orderDetails.action === 'BUY' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Buying Power</label>
                  <div className={`text-lg font-bold ${estimatedCost > buyingPower ? 'text-red-600' : 'text-green-600'}`}>
                    ${buyingPower.toFixed(2)}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Risk Management */}
        <div className="mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">Risk Management</h3>
          
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="useStopLoss"
                checked={useStopLoss}
                onChange={(e) => setUseStopLoss(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="useStopLoss" className="text-sm font-medium text-gray-700">
                Use Stop Loss
              </label>
              {useStopLoss && (
                <input
                  type="number"
                  step="0.01"
                  value={orderDetails.stopLoss || 0}
                  onChange={(e) => setOrderDetails(prev => ({ ...prev, stopLoss: parseFloat(e.target.value) }))}
                  className="px-3 py-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Stop loss price"
                />
              )}
            </div>

            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="useTakeProfit"
                checked={useTakeProfit}
                onChange={(e) => setUseTakeProfit(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="useTakeProfit" className="text-sm font-medium text-gray-700">
                Use Take Profit
              </label>
              {useTakeProfit && (
                <input
                  type="number"
                  step="0.01"
                  value={orderDetails.takeProfit || 0}
                  onChange={(e) => setOrderDetails(prev => ({ ...prev, takeProfit: parseFloat(e.target.value) }))}
                  className="px-3 py-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Take profit price"
                />
              )}
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <h3 className="font-semibold text-gray-900 mb-3">Order Summary</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Estimated Cost:</span>
              <span className="font-bold text-gray-900 ml-2">${estimatedCost.toFixed(2)}</span>
            </div>
            <div>
              <span className="text-gray-600">Risk Amount:</span>
              <span className="font-bold text-red-600 ml-2">${riskAmount.toFixed(2)}</span>
            </div>
            <div>
              <span className="text-gray-600">Potential Gain:</span>
              <span className="font-bold text-green-600 ml-2">${potentialGain.toFixed(2)}</span>
            </div>
            <div>
              <span className="text-gray-600">Risk/Reward Ratio:</span>
              <span className="font-bold text-gray-900 ml-2">
                {riskAmount > 0 ? `1:${(potentialGain / riskAmount).toFixed(2)}` : 'N/A'}
              </span>
            </div>
          </div>
        </div>

        {/* Error Warning */}
        {orderDetails.action === 'BUY' && estimatedCost > buyingPower && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Insufficient Buying Power</h3>
                <p className="text-sm text-red-700 mt-1">
                  You need ${(estimatedCost - buyingPower).toFixed(2)} more buying power to place this order.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={orderDetails.action === 'BUY' && estimatedCost > buyingPower}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Execute Trade
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmationDialog;