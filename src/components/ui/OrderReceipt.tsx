import React from 'react';
import { Card } from './Card';
import { formatCurrency, DEFAULT_CURRENCY } from '../../constants/currencies';

interface ReceiptItem {
  productName: string;
  quantity: number;
  price: number;
}

interface OrderReceiptProps {
  orderId: string;
  customerName: string;
  customerEmail: string;
  items: ReceiptItem[];
  total: number;
  paymentMethod: string;
  createdAt: string;
  currencyCode?: string;
}

export const OrderReceipt: React.FC<OrderReceiptProps> = ({
  orderId,
  customerName,
  customerEmail,
  items,
  total,
  paymentMethod,
  createdAt,
  currencyCode = DEFAULT_CURRENCY
}) => {
  return (
    <Card className="max-w-lg mx-auto p-8">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Order Receipt</h2>
        <p className="text-gray-500">Order ID: {orderId}</p>
        <p className="text-gray-500">Date: {createdAt}</p>
      </div>
      <div className="mb-4">
        <p className="font-medium text-gray-900">Customer:</p>
        <p>{customerName}</p>
        <p>{customerEmail}</p>
      </div>
      <div className="mb-4">
        <p className="font-medium text-gray-900 mb-2">Items:</p>
        <ul className="divide-y divide-gray-200">
          {items.map((item, idx) => (
            <li key={idx} className="py-2 flex justify-between">
              <span>{item.quantity}x {item.productName}</span>
              <span>{formatCurrency(item.price * item.quantity, currencyCode)}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="mb-4 flex justify-between font-bold text-lg">
        <span>Total:</span>
        <span>{formatCurrency(total, currencyCode)}</span>
      </div>
      <div className="mb-4">
        <span className="font-medium text-gray-900">Payment Method:</span> {paymentMethod}
      </div>
      <div className="text-center mt-8">
        <button
          className="btn-primary px-6 py-2 rounded-lg font-medium"
          onClick={() => window.print()}
        >
          Download / Print Receipt
        </button>
      </div>
    </Card>
  );
};
