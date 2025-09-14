export interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  images: string[];
  video?: string;
  category: string;
  stock: number;
}

export interface Order {
  id: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    price: number;
  }>;
  total: number;
  status: 'Pending' | 'Paid' | 'Processing' | 'Delivered' | 'Cancelled';
  paymentMethod: 'Manual' | 'Automatic';
  createdAt: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  totalOrders: number;
  totalSpent: number;
  joinedAt: string;
}

export interface Business {
  id: string;
  name: string;
  subdomain: string;
  plan: 'Free' | 'Basic' | 'Pro';
  owner: string;
  email: string;
  status: 'Active' | 'Suspended' | 'Pending';
  createdAt: string;
  revenue: number;
}

export const mockProducts: Product[] = [
  {
    id: '1',
    name: 'Premium Wireless Headphones',
    price: 299.99,
    description: 'High-quality wireless headphones with noise cancellation and premium sound quality. Perfect for music lovers and professionals.',
    images: [
      'https://images.pexels.com/photos/3394650/pexels-photo-3394650.jpeg?auto=compress&cs=tinysrgb&w=500',
      'https://images.pexels.com/photos/1649771/pexels-photo-1649771.jpeg?auto=compress&cs=tinysrgb&w=500'
    ],
    category: 'Electronics',
    stock: 25
  },
  {
    id: '2',
    name: 'Smart Fitness Watch',
    price: 199.99,
    description: 'Advanced fitness tracking with heart rate monitoring, GPS, and smart notifications. Track your health 24/7.',
    images: [
      'https://images.pexels.com/photos/437037/pexels-photo-437037.jpeg?auto=compress&cs=tinysrgb&w=500',
      'https://images.pexels.com/photos/393047/pexels-photo-393047.jpeg?auto=compress&cs=tinysrgb&w=500'
    ],
    category: 'Wearables',
    stock: 40
  },
  {
    id: '3',
    name: 'Organic Coffee Beans',
    price: 29.99,
    description: 'Premium organic coffee beans sourced directly from Colombian farms. Rich, smooth flavor perfect for your morning routine.',
    images: [
      'https://images.pexels.com/photos/1695052/pexels-photo-1695052.jpeg?auto=compress&cs=tinysrgb&w=500',
      'https://images.pexels.com/photos/894695/pexels-photo-894695.jpeg?auto=compress&cs=tinysrgb&w=500'
    ],
    category: 'Food & Beverage',
    stock: 100
  },
  {
    id: '4',
    name: 'Minimalist Desk Lamp',
    price: 79.99,
    description: 'Modern LED desk lamp with adjustable brightness and color temperature. Perfect for any workspace.',
    images: [
      'https://images.pexels.com/photos/1036936/pexels-photo-1036936.jpeg?auto=compress&cs=tinysrgb&w=500',
      'https://images.pexels.com/photos/1112598/pexels-photo-1112598.jpeg?auto=compress&cs=tinysrgb&w=500'
    ],
    category: 'Home & Office',
    stock: 15
  },
  {
    id: '5',
    name: 'Artisan Leather Wallet',
    price: 89.99,
    description: 'Handcrafted genuine leather wallet with RFID blocking technology. Elegant design meets practical functionality.',
    images: [
      'https://images.pexels.com/photos/5650026/pexels-photo-5650026.jpeg?auto=compress&cs=tinysrgb&w=500',
      'https://images.pexels.com/photos/5650019/pexels-photo-5650019.jpeg?auto=compress&cs=tinysrgb&w=500'
    ],
    category: 'Fashion',
    stock: 30
  },
  {
    id: '6',
    name: 'Bluetooth Speaker',
    price: 149.99,
    description: 'Portable wireless speaker with 360-degree sound and waterproof design. Perfect for outdoor adventures.',
    images: [
      'https://images.pexels.com/photos/1649771/pexels-photo-1649771.jpeg?auto=compress&cs=tinysrgb&w=500',
      'https://images.pexels.com/photos/3394650/pexels-photo-3394650.jpeg?auto=compress&cs=tinysrgb&w=500'
    ],
    category: 'Electronics',
    stock: 20
  }
];

export const mockOrders: Order[] = [
  {
    id: 'ORD-001',
    customerId: 'CUST-001',
    customerName: 'John Smith',
    customerEmail: 'john@example.com',
    items: [
      { productId: '1', productName: 'Premium Wireless Headphones', quantity: 1, price: 299.99 },
      { productId: '3', productName: 'Organic Coffee Beans', quantity: 2, price: 29.99 }
    ],
    total: 359.97,
    status: 'Delivered',
    paymentMethod: 'Automatic',
    createdAt: '2024-01-15'
  },
  {
    id: 'ORD-002',
    customerId: 'CUST-002',
    customerName: 'Sarah Johnson',
    customerEmail: 'sarah@example.com',
    items: [
      { productId: '2', productName: 'Smart Fitness Watch', quantity: 1, price: 199.99 }
    ],
    total: 199.99,
    status: 'Processing',
    paymentMethod: 'Manual',
    createdAt: '2024-01-16'
  },
  {
    id: 'ORD-003',
    customerId: 'CUST-003',
    customerName: 'Mike Davis',
    customerEmail: 'mike@example.com',
    items: [
      { productId: '4', productName: 'Minimalist Desk Lamp', quantity: 1, price: 79.99 },
      { productId: '5', productName: 'Artisan Leather Wallet', quantity: 1, price: 89.99 }
    ],
    total: 169.98,
    status: 'Pending',
    paymentMethod: 'Manual',
    createdAt: '2024-01-17'
  }
];

export const mockCustomers: Customer[] = [
  {
    id: 'CUST-001',
    name: 'John Smith',
    email: 'john@example.com',
    phone: '+1 (555) 123-4567',
    totalOrders: 5,
    totalSpent: 1299.95,
    joinedAt: '2023-12-01'
  },
  {
    id: 'CUST-002',
    name: 'Sarah Johnson',
    email: 'sarah@example.com',
    phone: '+1 (555) 234-5678',
    totalOrders: 3,
    totalSpent: 599.97,
    joinedAt: '2023-12-15'
  },
  {
    id: 'CUST-003',
    name: 'Mike Davis',
    email: 'mike@example.com',
    phone: '+1 (555) 345-6789',
    totalOrders: 2,
    totalSpent: 349.98,
    joinedAt: '2024-01-01'
  },
  {
    id: 'CUST-004',
    name: 'Emily Wilson',
    email: 'emily@example.com',
    phone: '+1 (555) 456-7890',
    totalOrders: 7,
    totalSpent: 2199.93,
    joinedAt: '2023-11-20'
  }
];

export const mockBusinesses: Business[] = [
  {
    id: 'BIZ-001',
    name: 'Tech Gadgets Plus',
    subdomain: 'techgadgets',
    plan: 'Pro',
    owner: 'Alex Thompson',
    email: 'alex@techgadgets.com',
    status: 'Active',
    createdAt: '2023-11-01',
    revenue: 15750.00
  },
  {
    id: 'BIZ-002',
    name: 'Fashion Forward',
    subdomain: 'fashionforward',
    plan: 'Basic',
    owner: 'Maria Garcia',
    email: 'maria@fashionforward.com',
    status: 'Active',
    createdAt: '2023-12-05',
    revenue: 8940.50
  },
  {
    id: 'BIZ-003',
    name: 'Home Essentials',
    subdomain: 'homeessentials',
    plan: 'Free',
    owner: 'David Chen',
    email: 'david@homeessentials.com',
    status: 'Pending',
    createdAt: '2024-01-10',
    revenue: 1250.00
  }
];

export const salesData = [
  { name: 'Jan', sales: 4000, revenue: 2400 },
  { name: 'Feb', sales: 3000, revenue: 1398 },
  { name: 'Mar', sales: 2000, revenue: 9800 },
  { name: 'Apr', sales: 2780, revenue: 3908 },
  { name: 'May', sales: 1890, revenue: 4800 },
  { name: 'Jun', sales: 2390, revenue: 3800 },
  { name: 'Jul', sales: 3490, revenue: 4300 }
];