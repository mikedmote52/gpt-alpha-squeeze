// Order Status Notification Component
// Shows execution status and handles success/error states

import React, { useState, useEffect } from 'react';

interface OrderStatusNotificationProps {
  isVisible: boolean;
  onClose: () => void;
  status: 'pending' | 'success' | 'error';
  message: string;
  orderDetails?: {
    symbol: string;
    action: string;
    quantity: number;
    orderId?: string;
    estimatedCost?: number;
  };
  autoHide?: boolean;
  autoHideDelay?: number;
}

const OrderStatusNotification: React.FC<OrderStatusNotificationProps> = ({
  isVisible,
  onClose,
  status,
  message,
  orderDetails,
  autoHide = true,
  autoHideDelay = 5000
}) => {
  const [timeLeft, setTimeLeft] = useState(autoHideDelay / 1000);

  useEffect(() => {
    if (isVisible && autoHide && status !== 'pending') {
      const timer = setTimeout(() => {
        onClose();
      }, autoHideDelay);

      // Countdown timer
      const countdownTimer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(countdownTimer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        clearTimeout(timer);
        clearInterval(countdownTimer);
      };
    }
  }, [isVisible, autoHide, status, autoHideDelay, onClose]);

  useEffect(() => {
    if (isVisible) {
      setTimeLeft(autoHideDelay / 1000);
    }
  }, [isVisible, autoHideDelay]);

  if (!isVisible) return null;

  const getStatusIcon = () => {
    switch (status) {
      case 'pending':
        return (
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        );
      case 'success':
        return (
          <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      case 'error':
        return (
          <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
      default:
        return null;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'pending':
        return 'bg-blue-50 border-blue-200';
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getTextColor = () => {
    switch (status) {
      case 'pending':
        return 'text-blue-800';
      case 'success':
        return 'text-green-800';
      case 'error':
        return 'text-red-800';
      default:
        return 'text-gray-800';
    }
  };

  const getStatusTitle = () => {
    switch (status) {
      case 'pending':
        return 'Executing Trade...';
      case 'success':
        return 'Trade Executed Successfully';
      case 'error':
        return 'Trade Execution Failed';
      default:
        return 'Trade Status';
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 w-96 animate-slide-in">
      <div className={`${getStatusColor()} border rounded-lg shadow-lg p-4`}>
        <div className="flex items-start">
          <div className="flex-shrink-0">
            {getStatusIcon()}
          </div>
          <div className="ml-3 flex-1">
            <h3 className={`text-sm font-medium ${getTextColor()}`}>
              {getStatusTitle()}
            </h3>
            <p className={`text-sm ${getTextColor()} mt-1`}>
              {message}
            </p>
            
            {orderDetails && (
              <div className="mt-3 space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Symbol:</span>
                  <span className="font-medium">{orderDetails.symbol}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Action:</span>
                  <span className="font-medium">{orderDetails.action}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Quantity:</span>
                  <span className="font-medium">{orderDetails.quantity}</span>
                </div>
                {orderDetails.estimatedCost && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Cost:</span>
                    <span className="font-medium">${orderDetails.estimatedCost.toFixed(2)}</span>
                  </div>
                )}
                {orderDetails.orderId && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Order ID:</span>
                    <span className="font-medium text-xs">{orderDetails.orderId.slice(0, 8)}...</span>
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="ml-3 flex-shrink-0">
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 focus:outline-none"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* Auto-hide countdown */}
        {autoHide && status !== 'pending' && timeLeft > 0 && (
          <div className="mt-3 flex items-center text-xs text-gray-500">
            <div className="flex-1 bg-gray-200 rounded-full h-1">
              <div 
                className="bg-blue-600 h-1 rounded-full transition-all duration-1000"
                style={{ width: `${(timeLeft / (autoHideDelay / 1000)) * 100}%` }}
              />
            </div>
            <span className="ml-2">Auto-close in {timeLeft}s</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderStatusNotification;