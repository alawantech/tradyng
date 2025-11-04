import React, { useState } from 'react';
import { X, Send } from 'lucide-react';
import { Button } from '../ui/Button';

interface SendReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  businessName: string;
  businessId: string;
  onSendReminder: (businessId: string, message: string) => Promise<void>;
}

export const SendReminderModal: React.FC<SendReminderModalProps> = ({
  isOpen,
  onClose,
  businessName,
  businessId,
  onSendReminder
}) => {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  if (!isOpen) return null;

  const handleSend = async () => {
    if (!message.trim()) return;
    
    setSending(true);
    try {
      await onSendReminder(businessId, message);
      setMessage('');
      onClose();
    } finally {
      setSending(false);
    }
  };

  const quickTemplates = [
    {
      label: 'Trial Expiring Soon',
      message: `Hi ${businessName}!\n\nYour free trial is expiring soon. We noticed you haven't upgraded yet.\n\nUpgrade now to:\n✓ Keep your store active\n✓ Retain all your products and customers\n✓ Continue receiving orders\n\nDon't lose everything you've built! Click the upgrade button below.`
    },
    {
      label: 'Special Discount Offer',
      message: `Hello ${businessName}!\n\nWe're offering a special 20% discount on all annual plans for a limited time.\n\nThis is a great opportunity to save on your subscription while keeping your store running smoothly.\n\nUse code: SAVE20 at checkout!`
    },
    {
      label: 'Payment Reminder',
      message: `Hi ${businessName},\n\nWe noticed your trial has expired. Your store will be deleted soon unless you upgrade.\n\nUpgrade now to avoid losing your data:\n• All products and inventory\n• Customer information\n• Order history\n• Store settings\n\nTake action today!`
    }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Send Reminder Email</h2>
            <p className="text-sm text-gray-600 mt-1">To: {businessName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={sending}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* Quick Templates */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quick Templates (Click to use)
            </label>
            <div className="grid grid-cols-1 gap-2">
              {quickTemplates.map((template) => (
                <button
                  key={template.label}
                  onClick={() => setMessage(template.message)}
                  className="text-left p-3 border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-indigo-500 transition-colors"
                  disabled={sending}
                >
                  <span className="text-sm font-medium text-indigo-600">{template.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Message */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Custom Message *
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your custom message here..."
              rows={10}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              disabled={sending}
            />
            <p className="text-sm text-gray-500 mt-2">
              The message will be sent as a nicely formatted email to the store owner.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t bg-gray-50">
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={sending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSend}
            disabled={!message.trim() || sending}
            className="flex items-center space-x-2"
          >
            <Send className="h-4 w-4" />
            <span>{sending ? 'Sending...' : 'Send Reminder'}</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
