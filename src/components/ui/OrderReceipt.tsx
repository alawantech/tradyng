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
  storeLogo?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
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
  storeEmail,
  storeLogo,
  primaryColor = '#3B82F6',
  secondaryColor = '#1E40AF',
  accentColor = '#F59E0B'
}) => {
  return (
    <Card
      className="max-w-lg mx-auto p-0 print:shadow-none rounded-2xl shadow-xl border"
      style={{
        borderColor: primaryColor,
        background: `linear-gradient(135deg, ${primaryColor}22 0%, #fff 100%)`
      }}
    >
      {/* Store Header */}
      <div
        className="rounded-t-2xl p-6 text-white text-center mb-0 border-b-4"
        style={{
          background: `linear-gradient(90deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
          borderColor: accentColor
        }}
      >
        <div className="flex items-center justify-center mb-2">
          <img src={storeLogo || logo} alt="Store Logo" className="h-14 w-14 object-contain mr-3 drop-shadow-lg" />
          <h1 className="text-3xl font-extrabold tracking-tight drop-shadow-lg">{storeName}</h1>
        </div>
        {storeAddress && (
          <p className="text-sm opacity-90">{storeAddress}</p>
        )}
        <div className="flex flex-col items-center text-sm gap-1 mt-2">
          {storeEmail && <span className="opacity-90">Email: {storeEmail}</span>}
          {storePhone && <span className="opacity-90">Phone: {storePhone}</span>}
        </div>
      </div>

      {/* Receipt Title & Order Info */}
      <div className="text-center py-6 px-8">
        <h2 className="text-2xl font-bold mb-2" style={{ color: primaryColor }}>Order Receipt</h2>
        <div className="flex justify-center gap-4 text-sm mb-2">
          <span className="px-3 py-1 rounded-full font-semibold shadow" style={{ background: `${primaryColor}22`, color: primaryColor }}>Order ID: {orderId}</span>
          <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full font-semibold shadow">Date: {createdAt}</span>
        </div>
      </div>

      {/* Customer Information */}
      <div className="px-8 pb-6">
        <div className="bg-white rounded-lg border p-4 mb-4 shadow-sm" style={{ borderColor: primaryColor }}>
          <p className="font-semibold mb-2" style={{ color: primaryColor }}>Customer Information</p>
          <div className="text-sm space-y-1">
            <p><span className="font-medium text-gray-700">Name:</span> {customerName}</p>
            <p><span className="font-medium text-gray-700">Email:</span> {customerEmail}</p>
            {customerPhone && (
              <p><span className="font-medium text-gray-700">Phone:</span> {customerPhone}</p>
            )}
            {customerAddress && (
              <p><span className="font-medium text-gray-700">Address:</span> {customerAddress}</p>
            )}
          </div>
        </div>
      </div>

      {/* Items */}
      <div className="px-8 pb-6">
        <div className="bg-white rounded-lg border p-4 shadow-sm" style={{ borderColor: primaryColor }}>
          <p className="font-semibold mb-3" style={{ color: primaryColor }}>Items</p>
          <ul className="divide-y" style={{ borderColor: primaryColor }}>
            {items.map((item, idx) => (
              <li key={idx} className="py-3 px-2 flex justify-between items-center">
                <div>
                  <span className="font-medium text-gray-900">{item.quantity}x {item.productName}</span>
                  <p className="text-xs text-gray-500">
                    {formatCurrency(item.price, currencyCode)} each
                  </p>
                </div>
                <span className="font-bold" style={{ color: primaryColor }}>
                  {formatCurrency(item.price * item.quantity, currencyCode)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Total & Payment */}
      <div className="px-8 pb-8">
        <div className="rounded-lg border p-4 shadow-sm mb-4 flex justify-between items-center" style={{ background: `${primaryColor}22`, borderColor: accentColor }}>
          <span className="text-lg font-bold" style={{ color: primaryColor }}>Total:</span>
          <span className="text-2xl font-extrabold" style={{ color: primaryColor }}>
            {formatCurrency(total, currencyCode)}
          </span>
        </div>
        <div className="bg-white rounded-lg border p-4 shadow-sm flex justify-between items-center" style={{ borderColor: primaryColor }}>
          <span className="font-semibold" style={{ color: primaryColor }}>Payment Method:</span>
          <span className="capitalize text-gray-900 font-bold">{paymentMethod}</span>
        </div>
      </div>

      {/* Print Button */}
      <div className="text-center pb-8">
        <button
          className="px-10 py-3 rounded-xl font-bold shadow-lg transition-colors print:hidden"
          style={{ background: `linear-gradient(90deg, ${primaryColor} 0%, ${secondaryColor} 100%)`, color: '#fff' }}
          onClick={() => window.print()}
        >
          Download / Print Receipt
        </button>
      </div>
    </Card>
  );
};
