import { EmailService, StoreBranding } from '../services/emailService';

// Example: Custom store branding configurations
const techStoreBranding: StoreBranding = {
  storeName: "TechHub Electronics",
  storeUrl: "https://techhub.rady.ng",
  logoUrl: "https://techhub.rady.ng/logo.png",
  primaryColor: "#1E40AF", // Blue theme
  accentColor: "#10B981", // Green accents
  supportEmail: "support@techhub.rady.ng",
  phone: "+1 (555) 123-4567",
  whatsappNumber: "+15551234567", // WhatsApp for instant support
  address: "123 Tech Street, Silicon Valley, CA 94025",
  customFromName: "TechHub Team"
};

const fashionStoreBranding: StoreBranding = {
  storeName: "Bella Fashion Boutique",
  storeUrl: "https://bella.rady.ng",
  logoUrl: "https://bella.rady.ng/assets/logo.png",
  primaryColor: "#EC4899", // Pink theme
  accentColor: "#8B5CF6", // Purple accents
  supportEmail: "hello@bella.rady.ng",
  phone: "+1 (555) 987-6543",
  whatsappNumber: "+15559876543", // WhatsApp for fashion consultations
  address: "456 Fashion Ave, New York, NY 10001",
  customFromName: "Bella Fashion Team"
};

const restaurantBranding: StoreBranding = {
  storeName: "Mario's Italian Kitchen",
  storeUrl: "https://marios.rady.ng",
  logoUrl: "https://marios.rady.ng/logo.svg",
  primaryColor: "#DC2626", // Red theme
  accentColor: "#059669", // Green accents (Italian flag colors)
  supportEmail: "orders@marios.rady.ng",
  phone: "+1 (555) 456-7890",
  whatsappNumber: "+15554567890", // WhatsApp for order updates
  address: "789 Little Italy, Brooklyn, NY 11201",
  customFromName: "Mario's Kitchen"
};

// Example usage functions
export class CustomEmailExamples {
  
  // 1. Tech store OTP registration
  static async sendTechStoreOTP(customerEmail: string, otp: string) {
    return await EmailService.sendRegistrationOTP(
      customerEmail,
      otp,
      techStoreBranding,
      "🔐 Verify Your TechHub Account - Secure Access"
    );
  }

  // 2. Fashion store OTP with custom subject
  static async sendFashionStoreOTP(customerEmail: string, otp: string) {
    return await EmailService.sendRegistrationOTP(
      customerEmail,
      otp,
      fashionStoreBranding,
      "✨ Complete Your Bella Fashion Registration"
    );
  }

  // 3. Restaurant order confirmation
  static async sendRestaurantOrderConfirmation(order: any, customer: any) {
    return await EmailService.sendOrderPlacedConfirmation(
      order,
      customer,
      restaurantBranding,
      `🍝 Your Order is Confirmed #${order.id} - Mario's Kitchen`
    );
  }

  // 4. Tech store order notification to owner
  static async notifyTechStoreOwner(order: any, customer: any) {
    return await EmailService.sendOrderNotificationToOwner(
      order,
      customer,
      techStoreBranding,
      `💻 New Tech Order Alert #${order.id} - Review & Process`
    );
  }

  // 5. Fashion store with special promotional messaging
  static async sendFashionOrderApproval(order: any, customer: any, receiptPDF?: string) {
    return await EmailService.sendOrderApprovedWithReceipt(
      order,
      customer,
      fashionStoreBranding,
      `👗 Your Bella Fashion Order is Ready #${order.id}`,
      receiptPDF
    );
  }

  // 6. Restaurant delivery notification
  static async sendRestaurantDeliveryNotification(order: any, customer: any) {
    return await EmailService.sendOrderDeliveredNotification(
      order,
      customer,
      restaurantBranding,
      `🚚 Your Delicious Order Has Arrived! #${order.id}`
    );
  }
}

// Example of how to use different branding for different stores
export async function handleMultiStoreEmails() {
  const customer = { email: "customer@example.com", name: "John Doe" };
  const order = { id: "ORD-12345", total: 99.99, items: [] };
  const otp = "123456";

  // Send different styled emails based on store type
  console.log("Sending tech store OTP...");
  await CustomEmailExamples.sendTechStoreOTP(customer.email, otp);

  console.log("Sending fashion store order confirmation...");
  await CustomEmailExamples.sendFashionOrderConfirmation(order, customer);

  console.log("Sending restaurant delivery notification...");
  await CustomEmailExamples.sendRestaurantDeliveryNotification(order, customer);
}

// Helper function to create store branding from database
export function createStoreBrandingFromDB(storeData: any): StoreBranding {
  return {
    storeName: storeData.name || "My Store",
    storeUrl: storeData.customDomain || `https://${storeData.subdomain}.rady.ng`,
    logoUrl: storeData.logoUrl,
    primaryColor: storeData.settings?.primaryColor || "#3B82F6",
    accentColor: storeData.settings?.accentColor || "#10B981",
    supportEmail: storeData.contactEmail || storeData.email,
    phone: storeData.phone,
    address: storeData.address,
    customFromName: storeData.settings?.emailFromName || `${storeData.name} Team`
  };
}

// Example of dynamic branding based on store database
export async function sendCustomerOTPWithDynamicBranding(
  customerEmail: string, 
  otp: string, 
  storeId: string
) {
  // This would fetch from your database
  const storeData = {
    id: storeId,
    name: "Dynamic Store",
    subdomain: "mystore",
    email: "owner@mystore.com",
    contactEmail: "support@mystore.com",
    logoUrl: "https://mystore.rady.ng/logo.png",
    settings: {
      primaryColor: "#7C3AED",
      accentColor: "#F59E0B",
      emailFromName: "MyStore Support"
    }
  };

  const branding = createStoreBrandingFromDB(storeData);
  
  return await EmailService.sendRegistrationOTP(
    customerEmail,
    otp,
    branding,
    `Welcome to ${branding.storeName} - Verify Your Account`
  );
}