import React, { useState } from 'react';
import { Save, Upload, Globe, Palette, Bell } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import toast from 'react-hot-toast';

export const Settings: React.FC = () => {
  const [storeData, setStoreData] = useState({
    storeName: 'My Awesome Store',
    subdomain: 'mystore',
    description: 'Premium products for modern lifestyle',
    contactEmail: 'contact@mystore.com',
    phone: '+1 (555) 123-4567',
    address: '123 Business St, City, State 12345'
  });

  const handleSave = () => {
    toast.success('Settings saved successfully!');
  };

  const handleLogoUpload = () => {
    toast.success('Logo upload functionality would be implemented here');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setStoreData({
      ...storeData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Store Settings</h1>
        <p className="text-gray-600">Customize your store appearance and details</p>
      </div>

      <div className="space-y-8">
        {/* Store Information */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Globe className="h-5 w-5 mr-2" />
            Store Information
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Store Name"
              name="storeName"
              value={storeData.storeName}
              onChange={handleChange}
            />
            
            <Input
              label="Subdomain"
              name="subdomain"
              value={storeData.subdomain}
              onChange={handleChange}
            />
            
            <Input
              label="Contact Email"
              name="contactEmail"
              type="email"
              value={storeData.contactEmail}
              onChange={handleChange}
            />
            
            <Input
              label="Phone Number"
              name="phone"
              value={storeData.phone}
              onChange={handleChange}
            />
          </div>
          
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Store Description
            </label>
            <textarea
              name="description"
              value={storeData.description}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div className="mt-6">
            <Input
              label="Address"
              name="address"
              value={storeData.address}
              onChange={handleChange}
            />
          </div>
        </Card>

        {/* Branding */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Palette className="h-5 w-5 mr-2" />
            Branding
          </h2>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Store Logo
              </label>
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                  <Upload className="h-6 w-6 text-gray-400" />
                </div>
                <Button variant="outline" onClick={handleLogoUpload}>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Logo
                </Button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Primary Color
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    defaultValue="#3B82F6"
                    className="w-12 h-10 border border-gray-300 rounded-md cursor-pointer"
                  />
                  <Input value="#3B82F6" />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Secondary Color
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    defaultValue="#10B981"
                    className="w-12 h-10 border border-gray-300 rounded-md cursor-pointer"
                  />
                  <Input value="#10B981" />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Accent Color
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    defaultValue="#F59E0B"
                    className="w-12 h-10 border border-gray-300 rounded-md cursor-pointer"
                  />
                  <Input value="#F59E0B" />
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Notifications */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Bell className="h-5 w-5 mr-2" />
            Notifications
          </h2>
          
          <div className="space-y-4">
            {[
              { id: 'new_orders', label: 'New Orders', description: 'Get notified when you receive new orders' },
              { id: 'low_stock', label: 'Low Stock Alerts', description: 'Get alerted when products are running low' },
              { id: 'customer_messages', label: 'Customer Messages', description: 'Receive notifications for customer inquiries' },
              { id: 'marketing', label: 'Marketing Updates', description: 'Stay updated with marketing tips and features' }
            ].map((setting) => (
              <div key={setting.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium text-gray-900">{setting.label}</div>
                  <div className="text-sm text-gray-600">{setting.description}</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            ))}
          </div>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button onClick={handleSave} className="px-8">
            <Save className="h-4 w-4 mr-2" />
            Save Settings
          </Button>
        </div>
      </div>
    </div>
  );
};