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
          margin: 1,
          filename: `receipt-${orderId}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true },
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
    <div ref={receiptRef} className="max-w-2xl mx-auto bg-white shadow-2xl rounded-3xl overflow-hidden border-2" style={{ borderColor: primaryColor }}>
      {/* Store Header */}
      <div
        className="relative p-8 text-white text-center"
        style={{
          background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`
        }}
      >
        {/* Decorative background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-4 left-4 w-16 h-16 border-2 rounded-full" style={{ borderColor: accentColor }}></div>
          <div className="absolute top-8 right-8 w-8 h-8 border-2 rounded-full" style={{ borderColor: accentColor }}></div>
          <div className="absolute bottom-4 left-1/4 w-12 h-12 border-2 rounded-full" style={{ borderColor: accentColor }}></div>
        </div>

        <div className="relative z-10">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-white rounded-full p-3 shadow-lg mr-4">
              <img src={storeLogo || logo} alt="Store Logo" className="h-16 w-16 object-contain" />
            </div>
            <div>
              <h1 className="text-4xl font-bold tracking-tight">{storeName}</h1>
            </div>
          </div>

          {storeAddress && (
            <p className="text-lg font-medium mb-2">{storeAddress}</p>
          )}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-sm">
            {storeEmail && <span className="flex items-center"><span className="mr-2">📧</span>{storeEmail}</span>}
            {storePhone && <span className="flex items-center"><span className="mr-2">📞</span>{storeCountry === 'Nigeria' ? '+' : ''}{storePhone}</span>}
          </div>
        </div>
      </div>

      {/* Receipt Header */}
      <div className="bg-gray-50 px-8 py-6 border-b-2" style={{ borderColor: primaryColor }}>
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-2" style={{ color: primaryColor }}>Order Receipt</h2>
          <p className="text-gray-600 mb-4">Thank you for your business!</p>
        </div>

        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <div className="bg-white px-4 py-2 rounded-lg shadow-sm border" style={{ borderColor: primaryColor }}>
            <span className="text-sm font-semibold text-gray-600">Order ID:</span>
            <span className="ml-2 font-bold" style={{ color: primaryColor }}>{orderId}</span>
          </div>
          <div className="bg-white px-4 py-2 rounded-lg shadow-sm border" style={{ borderColor: primaryColor }}>
            <span className="text-sm font-semibold text-gray-600">Date:</span>
            <span className="ml-2 font-bold text-gray-800">{createdAt}</span>
          </div>
        </div>
      </div>

      {/* Customer Information */}
      <div className="px-8 py-6 bg-white">
        <div className="bg-gradient-to-r from-gray-50 to-white p-6 rounded-xl border-2 shadow-sm" style={{ borderColor: primaryColor }}>
          <h3 className="text-xl font-bold mb-4 flex items-center" style={{ color: primaryColor }}>
            <span className="mr-2">👤</span>Customer Information
          </h3>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="flex items-center">
                  <span className="font-semibold text-gray-700 w-16">Name:</span>
                  <span className="text-gray-900">{customerName}</span>
                </p>
                <p className="flex items-center">
                  <span className="font-semibold text-gray-700 w-16">Email:</span>
                  <span className="text-gray-900">{customerEmail}</span>
                </p>
              </div>
              <div className="space-y-2">
                {customerPhone && (
                  <p className="flex items-center">
                    <span className="font-semibold text-gray-700 w-16">Phone:</span>
                    <span className="text-gray-900">{customerPhone}</span>
                  </p>
                )}
              </div>
            </div>
            {customerAddress && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="flex items-start">
                  <span className="font-semibold text-gray-700 w-20 flex-shrink-0">Address:</span>
                  <span className="text-gray-900 ml-2 break-words">{customerAddress}</span>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Items */}
      <div className="px-8 py-6 bg-gray-50">
        <div className="bg-white p-6 rounded-xl border-2 shadow-sm" style={{ borderColor: primaryColor }}>
          <h3 className="text-xl font-bold mb-4 flex items-center" style={{ color: primaryColor }}>
            <span className="mr-2">🛒</span>Order Items
          </h3>
          <div className="space-y-3">
            {items.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg border" style={{ borderColor: `${primaryColor}30` }}>
                <div className="flex-1">
                  <div className="font-semibold text-gray-900 text-lg">{item.productName}</div>
                  <div className="text-sm text-gray-600 mt-1">
                    Quantity: <span className="font-medium">{item.quantity}</span> × {formatCurrency(item.price, currencyCode)} each
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold" style={{ color: primaryColor }}>
                    {formatCurrency(item.price * item.quantity, currencyCode)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Total & Payment */}
      <div className="px-8 py-6 bg-white">
        <div className="space-y-4">
          {/* Total Amount */}
          <div className="bg-gradient-to-r p-6 rounded-xl shadow-lg border-2" style={{ background: `linear-gradient(135deg, ${primaryColor}10 0%, ${secondaryColor}10 100%)`, borderColor: primaryColor }}>
            <div className="flex justify-between items-center">
              <span className="text-2xl font-bold" style={{ color: primaryColor }}>Total Amount:</span>
              <span className="text-4xl font-extrabold" style={{ color: primaryColor }}>
                {formatCurrency(total, currencyCode)}
              </span>
            </div>
          </div>

          {/* Payment Method */}
          <div className="bg-gray-50 p-4 rounded-xl border-2 shadow-sm" style={{ borderColor: primaryColor }}>
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold flex items-center" style={{ color: primaryColor }}>
                <span className="mr-2">💳</span>Payment Method:
              </span>
              <span className="text-lg font-bold text-gray-900 capitalize bg-white px-4 py-2 rounded-lg shadow-sm">
                {paymentMethod}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-900 text-white px-8 py-6 text-center">
        <p className="text-lg font-medium mb-2">Thank you for choosing {storeName}!</p>
        <p className="text-sm opacity-75">We appreciate your business and hope to serve you again soon.</p>

        {/* Print Button */}
        <div className="mt-6">
          <button
            className="px-8 py-3 rounded-xl font-bold shadow-lg transition-all duration-300 hover:scale-105 print:hidden flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: `linear-gradient(90deg, ${primaryColor} 0%, ${secondaryColor} 100%)`, color: '#fff' }}
            onClick={downloadPDF}
            disabled={isDownloading}
            title="Download Receipt as PDF"
          >
            {isDownloading ? (
              <>
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Downloading...</span>
              </>
            ) : (
              <>
                <span className="print:hidden">📄</span>
                <span>Download</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
