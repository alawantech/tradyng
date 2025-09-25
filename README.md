# Tradyng

A comprehensive multi-store e-commerce platform built with React, TypeScript, and Firebase.

## 🚀 Features

### Core Platform
- **Multi-Store Architecture** - Multiple businesses can create their own stores
- **Custom Domains** - Each store gets its own subdomain (storename.tradyng.com)
- **Real-time Analytics** - Comprehensive dashboard with sales metrics and insights
- **Secure Payments** - Integrated payment processing with multiple gateways
- **Order Management** - Complete order lifecycle management system

### Store Management
- **Product Catalog** - Rich product management with images, variants, and inventory
- **Customer Management** - Customer profiles, order history, and communication tools
- **Inventory Tracking** - Real-time stock levels and low-stock alerts
- **Multi-Currency Support** - Localized pricing for different markets (Nigerian Naira focus)

### User Experience
- **Responsive Design** - Mobile-first approach with Tailwind CSS
- **Interactive Components** - Smooth animations with Framer Motion
- **Custom Branding** - Store owners can customize their store appearance
- **FAQ System** - Interactive dropdown FAQ sections

### Business Features
- **Subscription Plans** - Tiered pricing (Free, Business ₦9,500/mo, Pro ₦19,000/mo)
- **Free Setup Assistance** - Comprehensive onboarding and setup support
- **24/7 Support** - Dedicated customer support for all users
- **Analytics Dashboard** - Detailed business insights and reporting

## 🛠️ Tech Stack

### Frontend
- **React 18** - Modern React with hooks and functional components
- **TypeScript** - Type-safe development environment
- **Vite** - Fast build tool and development server
- **Tailwind CSS** - Utility-first CSS framework
- **Framer Motion** - Animation and interaction library

### Backend & Database
- **Firebase** - Authentication, Firestore database, and hosting
- **Firestore** - NoSQL database for scalable data storage
- **Firebase Auth** - Secure user authentication system
- **Firebase Storage** - File and image storage

### Development Tools
- **ESLint** - Code linting and quality enforcement
- **PostCSS** - CSS processing and optimization
- **React Hot Toast** - Toast notifications
- **Lucide React** - Modern icon library

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/alawantech/tradyng.git
   cd tradyng
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   # Add your Firebase configuration to .env
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Build for production**
   ```bash
   npm run build
   ```

## 🏗️ Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── layout/         # Navigation, footer, sidebar
│   ├── sections/       # Page sections (Features, Pricing)
│   └── ui/             # Basic UI elements
├── pages/              # Application pages
│   ├── auth/          # Authentication pages
│   ├── dashboard/     # Admin dashboard
│   ├── storefront/    # Customer-facing store
│   └── features/      # Features page
├── services/          # API and Firebase services
├── contexts/          # React contexts for state management
├── constants/         # Application constants and configuration
├── data/              # Static data and mock data
├── hooks/             # Custom React hooks
└── utils/             # Utility functions
```

## 🎯 Key Components

### Reusable Sections
- **FeaturesSection** - Showcases platform capabilities
- **PricingSection** - Interactive pricing plans with FAQ
- **Interactive FAQ** - Dropdown/accordion FAQ system

### Navigation
- **Smart Navigation** - Context-aware routing (homepage scroll vs page navigation)
- **Smooth Scrolling** - Enhanced user experience with smooth hash navigation

### Branding
- **Custom Logo** - Integrated Tradyng logo across all components
- **Consistent Theming** - Unified design system throughout the platform

## 💰 Pricing Plans

- **Free Plan** - Perfect for getting started
- **Business Plan** - ₦9,500/month - Full-featured store management
- **Pro Plan** - ₦19,000/month - Advanced features and priority support

## 🌍 Market Focus

Primarily designed for the Nigerian e-commerce market with:
- Nigerian Naira (₦) currency support
- Local payment gateway integration
- Region-specific features and compliance

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- **Live Demo**: [Coming Soon]
- **Documentation**: [Coming Soon]
- **Support**: [Contact Us]

## 📞 Contact

**Alawan Tech**
- Website: [Coming Soon]
- Email: [Contact Information]
- GitHub: [@alawantech](https://github.com/alawantech)

---

Built with ❤️ by [Alawan Tech](https://github.com/alawantech)