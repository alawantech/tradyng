# Firestore Database Structure for Trady.ng

## Collections Overview
  - shippingAddress: {
    street: string
    city: string
    state: string
    zipCode?: string
    country: string
  } **users** (Main Users Collection)
```
users/{userId}
  - email: string
  - displayName: string
  - createdAt: timestamp
  - lastLogin: timestamp
  - role: 'business_owner' | 'customer' | 'admin'
  - profileImage?: string
  - phone?: string
```

### 2. **businesses** (Store/Business Information)
```
businesses/{businessId}
  - name: string (e.g., "Tech Gadgets Plus")
  - subdomain: string (e.g., "techgadgets" for techgadgets.trady.ng)
  - customDomain?: string (e.g., "mystore.com")
  - ownerId: string (reference to users/{userId})
  - email: string
  - phone?: string
  - address?: string
  - description?: string
  - logo?: string (storage URL)
  - plan: 'free' | 'business' | 'pro'
  - status: 'active' | 'suspended' | 'pending'
  - createdAt: timestamp
  - updatedAt: timestamp
  - settings: {
    currency: string (default: "USD")
    primaryColor: string
    secondaryColor: string
    accentColor: string
    enableNotifications: boolean
  }
  - revenue: number (total revenue)
  - totalOrders: number
  - totalProducts: number
```

### 3. **products** (Products for each business)
```
businesses/{businessId}/products/{productId}
  - name: string
  - description: string
  - price: number
  - category: string
  - stock: number
  - images: string[] (array of storage URLs)
  - video?: string (storage URL)
  - isActive: boolean
  - createdAt: timestamp
  - updatedAt: timestamp
  - tags?: string[]
  - weight?: number
  - dimensions?: {
    length: number
    width: number
    height: number
  }
```

### 4. **orders** (Orders for each business)
```
businesses/{businessId}/orders/{orderId}
  - orderId: string (professional ID like TRD-250924-001)
  - customerId: string (reference to customers/{customerId})
  - customerName: string
  - customerEmail: string
  - customerPhone?: string
  - shippingAddress?: {
    street: string
    city?: string
    state?: string
    zipCode?: string
    country: string
  }
  - items: [{
    productId: string
    productName: string
    quantity: number
    price: number
    total: number
  }]
  - subtotal: number
  - tax: number
  - shipping: number
  - total: number
  - status: 'pending' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'
  - paymentMethod: 'manual' | 'automatic'
  - paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded'
  - paymentId?: string (from payment provider)
  - createdAt: timestamp
  - updatedAt: timestamp
  - notes?: string
  - trackingNumber?: string
```

### 5. **customers** (Customers for each business)
```
businesses/{businessId}/customers/{customerId}
  - name: string
  - email: string
  - phone?: string
  - address?: {
    street: string
    city?: string
    state?: string
    zipCode?: string
    country: string
  }
  - totalOrders: number
  - totalSpent: number
  - firstOrderAt: timestamp
  - lastOrderAt: timestamp
  - createdAt: timestamp
  - notes?: string
  - tags?: string[]
```

### 7. **counters** (Order numbering system)
```
businesses/{businessId}/counters/orders-{YYYY-MM-DD}
  - currentNumber: number
  - lastUpdated: timestamp
  - date: string (YYYY-MM-DD)
```

### 8. **subscriptions** (Business subscription plans)
```
subscriptions/{subscriptionId}
  - businessId: string
  - plan: 'free' | 'business' | 'pro'
  - status: 'active' | 'cancelled' | 'past_due' | 'trialing'
  - currentPeriodStart: timestamp
  - currentPeriodEnd: timestamp
  - cancelAtPeriodEnd: boolean
  - stripeCustomerId?: string
  - stripeSubscriptionId?: string
  - createdAt: timestamp
  - updatedAt: timestamp
```

### 7. **receipts** (Order receipts)
```
businesses/{businessId}/receipts/{receiptId}
  - orderId: string
  - receiptNumber: string
  - customerName: string
  - customerEmail: string
  - items: [{
    productName: string
    quantity: number
    price: number
    total: number
  }]
  - subtotal: number
  - tax: number
  - total: number
  - paymentMethod: string
  - issuedAt: timestamp
  - businessInfo: {
    name: string
    address?: string
    phone?: string
    email?: string
  }
```

### 8. **analytics** (Business analytics data)
```
businesses/{businessId}/analytics/{date}
  - date: string (YYYY-MM-DD)
  - revenue: number
  - orders: number
  - newCustomers: number
  - pageViews: number
  - conversionRate: number
  - topProducts: [{
    productId: string
    productName: string
    sales: number
    revenue: number
  }]
```

### 9. **domains** (Custom domain mapping)
```
domains/{domain}
  - businessId: string
  - isActive: boolean
  - verificationStatus: 'pending' | 'verified' | 'failed'
  - createdAt: timestamp
  - updatedAt: timestamp
```

### 10. **notifications** (System notifications)
```
businesses/{businessId}/notifications/{notificationId}
  - type: 'new_order' | 'low_stock' | 'customer_message' | 'system_update'
  - title: string
  - message: string
  - isRead: boolean
  - createdAt: timestamp
  - data?: any (additional notification data)
```

## Security Rules Structure

### Key Rules:
1. **Business owners** can only access their own business data
2. **Customers** can view products but cannot modify business data
3. **Admins** have access to all businesses for platform management
4. **Public access** to storefront products based on subdomain/domain
5. **Order creation** allowed for business owners and automated systems

## Subdomain/Domain Routing Logic:

1. **Extract subdomain/domain** from request
2. **Query businesses collection** where `subdomain === extractedSubdomain` OR `customDomain === extractedDomain`
3. **Load business data** and associated products
4. **Render storefront** with business branding and products

This structure supports:
- Multi-tenancy (multiple businesses)
- Subdomain routing (business.trady.ng)
- Custom domain support
- Complete e-commerce functionality
- Analytics and reporting
- Receipt generation
- Customer management
- Subscription billing