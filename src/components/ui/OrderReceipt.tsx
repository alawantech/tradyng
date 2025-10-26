import React, { useState } from 'react';
import { formatCurrency, DEFAULT_CURRENCY } from '../../constants/currencies';
import logo from '../../assets/logo.png';
import html2pdf from 'html2pdf.js';

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
  storeCountry?: string;
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
  storeName = "Rady.ng",
  storeAddress,
  storePhone,
  storeEmail,
  storeLogo,
  storeCountry,
  primaryColor = '#3B82F6',
  secondaryColor = '#1E40AF',
  accentColor = '#F59E0B'
}) => {
  const receiptRef = React.useRef<HTMLDivElement>(null);

  const [isDownloading, setIsDownloading] = useState(false);

  const downloadPDF = async () => {
    setIsDownloading(true);
    try {
      if (receiptRef.current) {
        const opt = {
          margin: 0.3,
          filename: `receipt-${orderId}.pdf`,
          image: { type: 'jpeg', quality: 0.95 },
          html2canvas: { scale: 1.2, useCORS: true },
          jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
        };
        await html2pdf().set(opt).from(receiptRef.current).save();
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div ref={receiptRef} className="max-w-md mx-auto bg-white shadow-2xl rounded-2xl overflow-hidden border-2" style={{ borderColor: primaryColor }}>
      {/* Store Header */}
      <div
        className="relative p-4 text-white text-center"
        style={{
          background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`
        }}
      >
        <div className="relative z-10">
          <div className="flex items-center justify-center mb-2">
            <div className="bg-white rounded-full p-2 shadow-lg mr-3">
              <img src={storeLogo || logo} alt="Store Logo" className="h-10 w-10 object-contain" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{storeName}</h1>
            </div>
          </div>

          {storeAddress && (
            <p className="text-sm font-medium mb-1">{storeAddress}</p>
          )}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 text-xs">
            {storeEmail && <span className="flex items-center"><span className="mr-1">📧</span>{storeEmail}</span>}
            {storePhone && <span className="flex items-center"><span className="mr-1">📞</span>{storeCountry === 'Nigeria' ? '+' : ''}{storePhone}</span>}
          </div>
        </div>
      </div>

      {/* Receipt Header */}
      <div className="bg-gray-50 px-4 py-3 border-b-2" style={{ borderColor: primaryColor }}>
        <div className="text-center">
          <h2 className="text-xl font-bold mb-1" style={{ color: primaryColor }}>Order Receipt</h2>
          <p className="text-gray-600 text-sm mb-2">Thank you for your business!</p>
        </div>

        <div className="flex flex-col sm:flex-row justify-center gap-2">
          <div className="bg-white px-3 py-1 rounded border text-xs" style={{ borderColor: primaryColor }}>
            <span className="font-semibold text-gray-600">Order ID:</span>
            <span className="ml-1 font-bold" style={{ color: primaryColor }}>{orderId}</span>
          </div>
          <div className="bg-white px-3 py-1 rounded border text-xs" style={{ borderColor: primaryColor }}>
            <span className="font-semibold text-gray-600">Date:</span>
            <span className="ml-1 font-bold text-gray-800">{createdAt}</span>
          </div>
        </div>
      </div>

      {/* Customer Information */}
      <div className="px-4 py-3 bg-white">
        <div className="bg-gradient-to-r from-gray-50 to-white p-3 rounded-lg border-2 shadow-sm" style={{ borderColor: primaryColor }}>
          <h3 className="text-lg font-bold mb-2 flex items-center" style={{ color: primaryColor }}>
            <span className="mr-1">👤</span>Customer Information
          </h3>
          <div className="space-y-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div className="space-y-1">
                <p className="flex items-center text-sm">
                  <span className="font-semibold text-gray-700 w-14">Name:</span>
                  <span className="text-gray-900">{customerName}</span>
                </p>
                <p className="flex items-center text-sm">
                  <span className="font-semibold text-gray-700 w-14">Email:</span>
                  <span className="text-gray-900">{customerEmail}</span>
                </p>
              </div>
              <div className="space-y-1">
                {customerPhone && (
                  <p className="flex items-center text-sm">
                    <span className="font-semibold text-gray-700 w-14">Phone:</span>
                    <span className="text-gray-900">{customerPhone}</span>
                  </p>
                )}
              </div>
            </div>
            {customerAddress && (
              <div className="mt-2 pt-2 border-t border-gray-200">
                <p className="flex items-start text-sm">
                  <span className="font-semibold text-gray-700 w-16 flex-shrink-0">Address:</span>
                  <span className="text-gray-900 ml-1 break-words">{customerAddress}</span>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Items */}
      <div className="px-4 py-3 bg-gray-50">
        <div className="bg-white p-3 rounded-lg border-2 shadow-sm" style={{ borderColor: primaryColor }}>
          <h3 className="text-lg font-bold mb-2 flex items-center" style={{ color: primaryColor }}>
            <span className="mr-1">🛒</span>Order Items
          </h3>
          <div className="space-y-2">
            {items.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center p-2 bg-gray-50 rounded border" style={{ borderColor: `${primaryColor}30` }}>
                <div className="flex-1">
                  <div className="font-semibold text-gray-900 text-sm">{item.productName}</div>
                  <div className="text-xs text-gray-600 mt-0.5">
                    Qty: <span className="font-medium">{item.quantity}</span> × {formatCurrency(item.price, currencyCode)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold" style={{ color: primaryColor }}>
                    {formatCurrency(item.price * item.quantity, currencyCode)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Total & Payment */}
      <div className="px-4 py-3 bg-white">
        <div className="space-y-2">
          {/* Total Amount */}
          <div className="bg-gradient-to-r p-3 rounded-lg shadow border-2" style={{ background: `linear-gradient(135deg, ${primaryColor}10 0%, ${secondaryColor}10 100%)`, borderColor: primaryColor }}>
            <div className="flex justify-between items-center">
              <span className="text-lg font-bold" style={{ color: primaryColor }}>Total Amount:</span>
              <span className="text-2xl font-extrabold" style={{ color: primaryColor }}>
                {formatCurrency(total, currencyCode)}
              </span>
            </div>
          </div>

          {/* Payment Method */}
          <div className="bg-gray-50 p-2 rounded-lg border-2 shadow-sm" style={{ borderColor: primaryColor }}>
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold flex items-center" style={{ color: primaryColor }}>
                <span className="mr-1">💳</span>Payment Method:
              </span>
              <span className="text-sm font-bold text-gray-900 capitalize bg-white px-2 py-1 rounded shadow-sm">
                {paymentMethod}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-900 text-white px-4 py-3 text-center">
        <p className="text-sm font-medium mb-1">Thank you for choosing {storeName}!</p>
        <p className="text-xs opacity-75">We appreciate your business and hope to serve you again soon.</p>

        {/* Print Button */}
        <div className="mt-3 print:hidden">
          <button
            className="px-6 py-2 rounded-lg font-bold shadow-lg transition-all duration-300 hover:scale-105 flex items-center justify-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            style={{ background: `linear-gradient(90deg, ${primaryColor} 0%, ${secondaryColor} 100%)`, color: '#fff' }}
            onClick={downloadPDF}
            disabled={isDownloading}
            title="Download Receipt as PDF"
          >
            {isDownloading ? (
              <>
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Downloading...</span>
              </>
            ) : (
              <>
                <span>📄</span>
                <span>Download</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
