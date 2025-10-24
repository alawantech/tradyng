import React, { useState } from 'react';
import { Button } from '../../components/ui/Button';
import toast from 'react-hot-toast';

export const EmailTest: React.FC = () => {
  const [isTesting, setIsTesting] = useState(false);

  const testCustomerEmail = async () => {
    setIsTesting(true);
    try {
      const response = await fetch('https://sendpaymentreceiptnotification-rv5lqk7lxa-uc.a.run.app', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerEmail: 'abubakarlawan671@gmail.com',
          customerName: 'Test Customer',
          orderId: 'TEST-12345',
          businessName: 'Test Store',
          businessEmail: 'admin@teststore.com'
        })
      });

      const result = await response.json();
      console.log('Customer email result:', result);

      if (response.ok) {
        toast.success('Customer email sent successfully!');
      } else {
        throw new Error(result.error || 'Failed to send email');
      }
    } catch (error) {
      console.error('Customer email error:', error);
      toast.error('Failed to send customer email');
    } finally {
      setIsTesting(false);
    }
  };

  const testAdminEmail = async () => {
    setIsTesting(true);
    try {
      const response = await fetch('https://sendadminpaymentreceiptnotification-rv5lqk7lxa-uc.a.run.app', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          adminEmail: 'abubakarlawan671@gmail.com',
          customerName: 'Test Customer',
          customerEmail: 'customer@test.com',
          orderId: 'TEST-12345',
          businessName: 'Test Store',
          businessId: 'test-business-id'
        })
      });

      const result = await response.json();
      console.log('Admin email result:', result);

      if (response.ok) {
        toast.success('Admin email sent successfully!');
      } else {
        throw new Error(result.error || 'Failed to send email');
      }
    } catch (error) {
      console.error('Admin email error:', error);
      toast.error('Failed to send admin email');
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Email Function Test</h1>
      <div className="space-y-4">
        <Button
          onClick={testCustomerEmail}
          disabled={isTesting}
          className="w-full"
        >
          {isTesting ? 'Testing...' : 'Test Customer Email Notification'}
        </Button>
        <Button
          onClick={testAdminEmail}
          disabled={isTesting}
          variant="outline"
          className="w-full"
        >
          {isTesting ? 'Testing...' : 'Test Admin Email Notification'}
        </Button>
      </div>
    </div>
  );
};