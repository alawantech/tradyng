import React from 'react';
import { Card } from './Card';
import { formatCurrency, DEFAULT_CURRENCY } from '../../constants/currencies';
import logo from '../../assets/logo.png';

interface ReceiptItem {
  productName: string;
  quantity: number;
  price: number;
}

interface OrderReceiptProps {
  orderId: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  customerAddress?: string;
  items: ReceiptItem[];
  total: number;
  paymentMethod: string;
  createdAt: string;
  currencyCode?: string;
  storeName?: string;
  storeAddress?: string;
  storePhone?: string;
  storeEmail?: string;
}

export const OrderReceipt: React.FC<OrderReceiptProps> = ({
  orderId,
  customerName,
  customerEmail,
  customerPhone,
  customerAddress,
  items,
  total,
  paymentMethod,
  createdAt,
  currencyCode = DEFAULT_CURRENCY,
  storeName = "Trady.ng",
  storeAddress,
  storePhone,
  storeEmail
}) => {
  return (
    <Card className="max-w-lg mx-auto p-8 print:shadow-none">
      {/* Store Header */}
      <div className="text-center mb-8 border-b pb-6">
        <div className="flex items-center justify-center mb-4">
          <img src={logo} alt="Store Logo" className="h-12 w-12 object-contain mr-3" />
          <h1 className="text-2xl font-bold text-gray-900">{storeName}</h1>
        </div>
        {storeAddress && (
          <p className="text-sm text-gray-600">{storeAddress}</p>
        )}
        <div className="flex justify-center space-x-4 text-sm text-gray-600">
          {storePhone && <span>Phone: {storePhone}</span>}
          {storeEmail && <span>Email: {storeEmail}</span>}
        </div>
      </div>

      {/* Receipt Title */}
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-gray-900">Order Receipt</h2>
        <p className="text-gray-500">Order ID: {orderId}</p>
        <p className="text-gray-500">Date: {createdAt}</p>
      </div>

      {/* Customer Information */}
      <div className="mb-6 border-b pb-4">
        <p className="font-medium text-gray-900 mb-2">Customer:</p>
        <div className="text-sm space-y-1">
          <p><span className="font-medium">Name:</span> {customerName}</p>
          <p><span className="font-medium">Email:</span> {customerEmail}</p>
          {customerPhone && (
            <p><span className="font-medium">Phone:</span> {customerPhone}</p>
          )}
          {customerAddress && (
            <p><span className="font-medium">Address:</span> {customerAddress}</p>
          )}
        </div>
      </div>
      {/* Items */}
      <div className="mb-6">
        <p className="font-medium text-gray-900 mb-3">Items:</p>
        <ul className="divide-y divide-gray-200 border border-gray-200 rounded-lg">
          {items.map((item, idx) => (
            <li key={idx} className="py-3 px-4 flex justify-between items-center">
              <div>
                <span className="font-medium">{item.quantity}x {item.productName}</span>
                <p className="text-sm text-gray-500">
                  {formatCurrency(item.price, currencyCode)} each
                </p>
              </div>
              <span className="font-medium">
                {formatCurrency(item.price * item.quantity, currencyCode)}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Total */}
      <div className="mb-6 border-t pt-4">
        <div className="flex justify-between items-center text-lg font-bold">
          <span>Total:</span>
          <span className="text-blue-600">
            {formatCurrency(total, currencyCode)}
          </span>
        </div>
      </div>

      {/* Payment Method */}
      <div className="mb-8 border-t pt-4">
        <div className="flex justify-between items-center">
          <span className="font-medium text-gray-900">Payment Method:</span>
          <span className="capitalize">{paymentMethod}</span>
        </div>
      </div>

      {/* Print Button */}
      <div className="text-center">
        <button
          className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium transition-colors print:hidden"
          onClick={() => window.print()}
        >
          Download / Print Receipt
        </button>
      </div>
    </Card>
  );
};
