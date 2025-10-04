// EmailService - Mock implementation for frontend development
// In production, this should be replaced with backend API calls

export interface EmailTemplate {
  to: string;
  from: string;
  subject: string;
  html: string;
  text?: string;
  attachments?: Array<{
    content: string;
    filename: string;
    type: string;
    disposition: string;
  }>;
}

export interface StoreBranding {
  storeName: string;
  storeUrl?: string;
  logoUrl?: string;
  primaryColor?: string;
  accentColor?: string;
  supportEmail?: string;
  phone?: string;
  whatsappNumber?: string; // WhatsApp number for customer support
  address?: string;
  customFromName?: string; // e.g., "TechStore Team" instead of just "orders@..."
}

export interface OTPData {
  email: string;
  otp: string;
  expiresAt: Date;
  businessName?: string;
}

export class EmailService {
  // Mock email sending for development
  // In production, this should call your backend API endpoint
  static async sendEmail(emailData: EmailTemplate): Promise<boolean> {
    try {
      // Simulate email sending delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // In development, log the email details instead of actually sending
      console.log('📧 Mock Email Sent Successfully!');
      console.log('To:', emailData.to);
      console.log('Subject:', emailData.subject);
      console.log('Content Preview:', emailData.text?.substring(0, 100) + '...');
      
      // For OTP emails, extract and display the OTP code
      if (emailData.subject.includes('Verification') || emailData.subject.includes('OTP')) {
        const otpMatch = emailData.html.match(/\b\d{6}\b/);
        if (otpMatch) {
          console.log('🔐 OTP CODE:', otpMatch[0]);
          console.log('👆 Use this code for verification!');
          
          // Show a notification with the OTP code for development
          if (typeof window !== 'undefined') {
            // Also show browser alert for immediate visibility
            alert(`🔐 OTP CODE: ${otpMatch[0]}\n\n📧 Mock Email Sent!\nUse this code for verification.\n\n(In production, this would be sent via email)`);
            
            // Create a temporary notification element
            const notification = document.createElement('div');
            notification.style.cssText = `
              position: fixed;
              top: 20px;
              right: 20px;
              background: #10B981;
              color: white;
              padding: 16px 20px;
              border-radius: 8px;
              box-shadow: 0 10px 25px rgba(0,0,0,0.2);
              z-index: 10000;
              font-family: system-ui, -apple-system, sans-serif;
              font-weight: 500;
              max-width: 300px;
            `;
            notification.innerHTML = `
              <div style="font-size: 14px; margin-bottom: 8px;">📧 Mock Email Sent!</div>
              <div style="font-size: 18px; font-weight: bold; letter-spacing: 2px; background: rgba(255,255,255,0.2); padding: 8px; border-radius: 4px; text-align: center;">
                ${otpMatch[0]}
              </div>
              <div style="font-size: 12px; margin-top: 8px; opacity: 0.9;">Use this OTP code to verify</div>
            `;
            
            document.body.appendChild(notification);
            
            // Remove notification after 15 seconds (longer time)
            setTimeout(() => {
              if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
              }
            }, 15000);
          }
        }
      }
      
      return true;
    } catch (error) {
      console.error('Mock email service error:', error);
      return false;
    }
  }

  // 1. Send OTP email for customer registration (expires in 1 day)
  static async sendRegistrationOTP(
    email: string, 
    otp: string, 
    storeBranding: StoreBranding,
    customSubject?: string
  ): Promise<boolean> {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 1); // Expires in 1 day

    const subject = customSubject || `Verify Your Email - ${storeBranding.storeName}`;
    const fromEmail = `verification@rady.ng`;
    const fromName = storeBranding.customFromName || storeBranding.storeName;

    const emailData: EmailTemplate = {
      to: email,
      from: `${fromName} <${fromEmail}>`,
      subject: subject,
      html: this.generateOTPTemplate(email, otp, storeBranding, expiresAt),
      text: `Your verification code for ${storeBranding.storeName} is: ${otp}. This code expires in 24 hours.`
    };

    return this.sendEmail(emailData);
  }

  // 2. Send order notification to store owner
  static async sendOrderNotificationToOwner(
    order: any, 
    customer: any, 
    storeBranding: StoreBranding,
    customSubject?: string
  ): Promise<boolean> {
    const subject = customSubject || `🛒 New Order #${order.id} - ${storeBranding.storeName}`;
    const fromName = storeBranding.customFromName || `${storeBranding.storeName} Notifications`;

    const emailData: EmailTemplate = {
      to: storeBranding.supportEmail || 'owner@example.com',
      from: `${fromName} <notifications@rady.ng>`,
      subject: subject,
      html: this.generateOwnerOrderNotificationTemplate(order, customer, storeBranding),
    };

    return this.sendEmail(emailData);
  }

  // 3. Send order confirmation to customer when placed
  static async sendOrderPlacedConfirmation(
    order: any, 
    customer: any, 
    storeBranding: StoreBranding,
    customSubject?: string
  ): Promise<boolean> {
    const subject = customSubject || `Order Received #${order.id} - ${storeBranding.storeName}`;
    const fromName = storeBranding.customFromName || storeBranding.storeName;
    const fromEmail = storeBranding.storeUrl 
      ? `orders@${storeBranding.storeUrl.replace('https://', '').replace('http://', '')}`
      : 'orders@rady.ng';

    const emailData: EmailTemplate = {
      to: customer.email,
      from: `${fromName} <${fromEmail}>`,
      subject: subject,
      html: this.generateOrderPlacedTemplate(order, customer, storeBranding),
    };

    return this.sendEmail(emailData);
  }

  // 4. Send order approved notification with PDF receipt
  static async sendOrderApprovedWithReceipt(
    order: any, 
    customer: any, 
    storeBranding: StoreBranding,
    customSubject?: string,
    receiptPDF?: string
  ): Promise<boolean> {
    const subject = customSubject || `✅ Order Approved #${order.id} - ${storeBranding.storeName}`;
    const fromName = storeBranding.customFromName || storeBranding.storeName;
    const fromEmail = storeBranding.storeUrl 
      ? `orders@${storeBranding.storeUrl.replace('https://', '').replace('http://', '')}`
      : 'orders@rady.ng';

    const attachments = receiptPDF ? [{
      content: receiptPDF, // Base64 encoded PDF
      filename: `receipt-${order.id}.pdf`,
      type: 'application/pdf',
      disposition: 'attachment'
    }] : undefined;

    const emailData: EmailTemplate = {
      to: customer.email,
      from: `${fromName} <${fromEmail}>`,
      subject: subject,
      html: this.generateOrderApprovedTemplate(order, customer, storeBranding),
      attachments
    };

    return this.sendEmail(emailData);
  }

  // 5. Send order delivered notification
  static async sendOrderDeliveredNotification(
    order: any, 
    customer: any, 
    storeBranding: StoreBranding,
    customSubject?: string
  ): Promise<boolean> {
    const subject = customSubject || `📦 Order Delivered #${order.id} - ${storeBranding.storeName}`;
    const fromName = storeBranding.customFromName || storeBranding.storeName;
    const fromEmail = storeBranding.storeUrl 
      ? `orders@${storeBranding.storeUrl.replace('https://', '').replace('http://', '')}`
      : 'orders@rady.ng';

    const emailData: EmailTemplate = {
      to: customer.email,
      from: `${fromName} <${fromEmail}>`,
      subject: subject,
      html: this.generateOrderDeliveredTemplate(order, customer, storeBranding),
    };

    return this.sendEmail(emailData);
  }

  // 6. Send welcome email after successful registration
  static async sendWelcomeEmail(customer: any, business: any): Promise<boolean> {
    const emailData: EmailTemplate = {
      to: customer.email,
      from: `welcome@${business.subdomain}.rady.ng`,
      subject: `🎉 Welcome to ${business.name}!`,
      html: this.generateWelcomeTemplate(customer, business),
    };

    return this.sendEmail(emailData);
  }

  // Generate OTP verification template
  private static generateOTPTemplate(_email: string, otp: string, storeBranding: StoreBranding, expiresAt: Date): string {
    const primaryColor = storeBranding.primaryColor || '#3B82F6';
    const logoSection = storeBranding.logoUrl 
      ? `<img src="${storeBranding.logoUrl}" alt="${storeBranding.storeName}" style="max-height: 60px; margin-bottom: 20px;">` 
      : '';
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Email Verification - ${storeBranding.storeName}</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
        <div style="background: white; padding: 40px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            ${logoSection}
            <h1 style="color: ${primaryColor}; margin: 0; font-size: 28px;">Email Verification</h1>
            <p style="color: #666; margin-top: 10px;">Complete your registration for ${storeBranding.storeName}</p>
          </div>
          
          <div style="text-align: center; margin: 40px 0;">
            <p style="font-size: 18px; margin-bottom: 20px;">Your verification code is:</p>
            <div style="background: #f0f9ff; border: 2px dashed #3B82F6; padding: 20px; border-radius: 10px; margin: 20px 0;">
              <span style="font-size: 32px; font-weight: bold; color: #1d4ed8; letter-spacing: 4px;">${otp}</span>
            </div>
          </div>

          <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #92400e; text-align: center;">
              ⏰ This code expires on ${expiresAt.toLocaleDateString()} at ${expiresAt.toLocaleTimeString()}
            </p>
          </div>

          <div style="text-align: center; margin-top: 30px;">
            <p style="color: #666; font-size: 14px;">
              If you didn't request this verification, please ignore this email.
            </p>
          </div>

          <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="color: #666; font-size: 12px;">
              This email was sent by ${storeBranding.storeName} via Rady.ng Platform
            </p>
            ${storeBranding.supportEmail ? `<p style="color: #666; font-size: 12px;">📧 Email: ${storeBranding.supportEmail}</p>` : ''}
            ${storeBranding.whatsappNumber ? `
              <p style="color: #666; font-size: 12px;">
                💬 WhatsApp Support: 
                <a href="https://wa.me/${storeBranding.whatsappNumber.replace(/[^0-9]/g, '')}" 
                   style="color: #25D366; text-decoration: none; font-weight: bold;">
                  ${storeBranding.whatsappNumber}
                </a>
              </p>
            ` : ''}
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // Generate order placed confirmation template
  private static generateOrderPlacedTemplate(order: any, customer: any, business: any): string {
    const primaryColor = business.settings?.primaryColor || '#3B82F6';
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Order Received</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          ${business.logo ? `<img src="${business.logo}" alt="${business.name}" style="height: 60px; margin-bottom: 20px;">` : ''}
          <h1 style="color: ${primaryColor}; margin: 0;">${business.name}</h1>
        </div>
        
        <div style="background: #f0f9ff; padding: 25px; border-radius: 10px; margin-bottom: 30px; text-align: center;">
          <h2 style="color: ${primaryColor}; margin-top: 0;">🛒 Order Received!</h2>
          <p style="font-size: 18px; margin: 10px 0;"><strong>Order ID:</strong> #${order.id}</p>
          <p style="font-size: 16px; color: #666;">Thank you ${customer.name || customer.email}! We've received your order.</p>
        </div>

        <div style="background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
          <h3 style="color: ${primaryColor}; margin-top: 0;">Order Summary</h3>
          <table style="width: 100%; border-collapse: collapse;">
            ${order.items?.map((item: any) => `
              <tr style="border-bottom: 1px solid #f3f4f6;">
                <td style="padding: 12px 0; font-weight: 500;">${item.productName}</td>
                <td style="padding: 12px 0; text-align: center;">×${item.quantity}</td>
                <td style="padding: 12px 0; text-align: right; font-weight: 500;">${business.settings?.currency || 'NGN'} ${item.price?.toLocaleString()}</td>
              </tr>
            `).join('') || ''}
            <tr style="background: #f9fafb; font-weight: bold;">
              <td colspan="2" style="padding: 15px 0; text-align: right;">Total:</td>
              <td style="padding: 15px 0; text-align: right; color: ${primaryColor}; font-size: 18px;">
                ${business.settings?.currency || 'NGN'} ${order.total?.toLocaleString()}
              </td>
            </tr>
          </table>
        </div>

        <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
          <h3 style="color: #92400e; margin-top: 0;">⏳ What's Next?</h3>
          <p style="margin: 0; color: #92400e;">
            Your order is being reviewed by our team. You'll receive another email once your order is approved and processed.
          </p>
        </div>

        <div style="margin-bottom: 30px;">
          <h3 style="color: ${primaryColor};">Delivery Information</h3>
          <p><strong>Name:</strong> ${order.deliveryInfo?.name || customer.name}</p>
          <p><strong>Phone:</strong> ${order.deliveryInfo?.phone}</p>
          <p><strong>Address:</strong> ${order.deliveryInfo?.address}</p>
          <p><strong>City:</strong> ${order.deliveryInfo?.city}</p>
        </div>

        <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 14px;">
            Questions? Contact us at ${business.email}
            ${business.phone ? ` or call ${business.phone}` : ''}
          </p>
        </div>
      </body>
      </html>
    `;
  }

  // Generate order approved template
  private static generateOrderApprovedTemplate(order: any, customer: any, business: any): string {
    const primaryColor = business.settings?.primaryColor || '#3B82F6';
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Order Approved</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          ${business.logo ? `<img src="${business.logo}" alt="${business.name}" style="height: 60px; margin-bottom: 20px;">` : ''}
          <h1 style="color: ${primaryColor}; margin: 0;">${business.name}</h1>
        </div>
        
        <div style="background: #dcfce7; padding: 25px; border-radius: 10px; margin-bottom: 30px; text-align: center;">
          <h2 style="color: #16a34a; margin-top: 0;">✅ Order Approved!</h2>
          <p style="font-size: 18px; margin: 10px 0;"><strong>Order ID:</strong> #${order.id}</p>
          <p style="font-size: 16px; color: #166534;">Great news ${customer.name || customer.email}! Your order has been approved and is being prepared.</p>
        </div>

        <div style="background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
          <h3 style="color: ${primaryColor}; margin-top: 0;">Order Details</h3>
          <table style="width: 100%; border-collapse: collapse;">
            ${order.items?.map((item: any) => `
              <tr style="border-bottom: 1px solid #f3f4f6;">
                <td style="padding: 12px 0; font-weight: 500;">${item.productName}</td>
                <td style="padding: 12px 0; text-align: center;">×${item.quantity}</td>
                <td style="padding: 12px 0; text-align: right; font-weight: 500;">${business.settings?.currency || 'NGN'} ${item.price?.toLocaleString()}</td>
              </tr>
            `).join('') || ''}
            <tr style="background: #f9fafb; font-weight: bold;">
              <td colspan="2" style="padding: 15px 0; text-align: right;">Total Paid:</td>
              <td style="padding: 15px 0; text-align: right; color: #16a34a; font-size: 18px;">
                ${business.settings?.currency || 'NGN'} ${order.total?.toLocaleString()}
              </td>
            </tr>
          </table>
        </div>

        <div style="background: #e0f2fe; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
          <h3 style="color: #0369a1; margin-top: 0;">📋 What's Next?</h3>
          <p style="margin: 0; color: #0369a1;">
            Your order is now being prepared for delivery. We'll send you another notification once your items are ready to ship.
          </p>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <p style="color: #666; font-size: 14px; margin-bottom: 15px;">
            📎 Your receipt is attached to this email as a PDF
          </p>
          <a href="https://${business.subdomain}.rady.ng/orders/${order.id}" 
             style="background: ${primaryColor}; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
            View Order Details
          </a>
        </div>

        <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 14px;">
            Questions? Contact us at ${business.email}
            ${business.phone ? ` or call ${business.phone}` : ''}
          </p>
        </div>
      </body>
      </html>
    `;
  }

  // Generate order delivered template
  private static generateOrderDeliveredTemplate(order: any, customer: any, business: any): string {
    const primaryColor = business.settings?.primaryColor || '#3B82F6';
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Order Delivered</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          ${business.logo ? `<img src="${business.logo}" alt="${business.name}" style="height: 60px; margin-bottom: 20px;">` : ''}
          <h1 style="color: ${primaryColor}; margin: 0;">${business.name}</h1>
        </div>
        
        <div style="background: #dcfce7; padding: 30px; border-radius: 10px; margin-bottom: 30px; text-align: center;">
          <h2 style="color: #16a34a; margin-top: 0;">📦 Order Delivered!</h2>
          <p style="font-size: 18px; margin: 10px 0;"><strong>Order ID:</strong> #${order.id}</p>
          <p style="font-size: 16px; color: #166534;">Congratulations ${customer.name || customer.email}! Your order has been successfully delivered.</p>
        </div>

        <div style="background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
          <h3 style="color: ${primaryColor}; margin-top: 0;">Delivered Items</h3>
          ${order.items?.map((item: any) => `
            <div style="padding: 10px 0; border-bottom: 1px solid #f3f4f6;">
              <strong>${item.productName}</strong> × ${item.quantity}
            </div>
          `).join('') || ''}
        </div>

        <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
          <h3 style="color: #92400e; margin-top: 0;">💝 Thank You!</h3>
          <p style="margin: 0; color: #92400e;">
            We hope you're happy with your purchase! Your satisfaction is our priority.
          </p>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="https://${business.subdomain}.rady.ng" 
             style="background: ${primaryColor}; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin-right: 10px;">
            Shop Again
          </a>
          <a href="https://${business.subdomain}.rady.ng/review/${order.id}" 
             style="background: #f59e0b; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Leave Review
          </a>
        </div>

        <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 14px;">
            Need support? Contact us at ${business.email}
            ${business.phone ? ` or call ${business.phone}` : ''}
          </p>
        </div>
      </body>
      </html>
    `;
  }

  // Generate owner order notification template
  private static generateOwnerOrderNotificationTemplate(order: any, customer: any, business: any): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>New Order Notification</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #1d4ed8; color: white; padding: 20px; border-radius: 10px 10px 0 0; text-align: center;">
          <h2 style="margin: 0;">🎉 New Order Alert!</h2>
          <p style="margin: 10px 0 0 0;">You have received a new order</p>
        </div>
        
        <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e2e8f0;">
          <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="color: #1d4ed8; margin-top: 0;">Order Information</h3>
            <p><strong>Order ID:</strong> #${order.id}</p>
            <p><strong>Date:</strong> ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}</p>
            <p><strong>Total Amount:</strong> ${business.settings?.currency || 'NGN'} ${order.total?.toLocaleString()}</p>
            <p><strong>Payment Method:</strong> ${order.paymentMethod || 'Manual Payment'}</p>
          </div>

          <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="color: #1d4ed8; margin-top: 0;">Customer Details</h3>
            <p><strong>Name:</strong> ${customer.name || 'N/A'}</p>
            <p><strong>Email:</strong> ${customer.email}</p>
            <p><strong>Phone:</strong> ${order.deliveryInfo?.phone || 'N/A'}</p>
          </div>

          <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="color: #1d4ed8; margin-top: 0;">Delivery Address</h3>
            <p><strong>Name:</strong> ${order.deliveryInfo?.name || customer.name}</p>
            <p><strong>Address:</strong> ${order.deliveryInfo?.address}</p>
            <p><strong>City:</strong> ${order.deliveryInfo?.city}</p>
          </div>

          <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="color: #1d4ed8; margin-top: 0;">Order Items</h3>
            ${order.items?.map((item: any) => `
              <div style="padding: 8px 0; border-bottom: 1px solid #f1f5f9;">
                <strong>${item.productName}</strong><br>
                Quantity: ${item.quantity} × ${business.settings?.currency || 'NGN'} ${item.price?.toLocaleString()} = 
                <strong>${business.settings?.currency || 'NGN'} ${(item.price * item.quantity)?.toLocaleString()}</strong>
              </div>
            `).join('') || ''}
          </div>

          <div style="text-align: center; margin-top: 30px;">
            <a href="https://${business.subdomain}.rady.ng/dashboard/orders" 
               style="background: #16a34a; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin-right: 10px;">
              📋 View in Dashboard
            </a>
            <a href="https://${business.subdomain}.rady.ng/dashboard/orders/${order.id}/approve" 
               style="background: #dc2626; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              ✅ Approve Order
            </a>
          </div>

          <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin-top: 20px;">
            <p style="margin: 0; color: #92400e; text-align: center;">
              ⚡ Quick Action Required: This order is waiting for your approval
            </p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // Generate welcome email template
  private static generateWelcomeTemplate(customer: any, business: any): string {
    const primaryColor = business.settings?.primaryColor || '#3B82F6';
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Welcome</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          ${business.logo ? `<img src="${business.logo}" alt="${business.name}" style="height: 60px; margin-bottom: 20px;">` : ''}
          <h1 style="color: ${primaryColor};">🎉 Welcome to ${business.name}!</h1>
        </div>
        
        <p>Hello ${customer.name || 'there'}!</p>
        
        <p>Thank you for creating an account with ${business.name}. We're excited to have you as part of our community!</p>
        
        <p>${business.description || `Discover our amazing collection of products and enjoy a seamless shopping experience.`}</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://${business.subdomain}.rady.ng" 
             style="background: ${primaryColor}; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Start Shopping
          </a>
        </div>
        
        <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 14px;">
            Need help? Contact us at ${business.email}
            ${business.phone ? ` or call ${business.phone}` : ''}
          </p>
        </div>
      </body>
      </html>
    `;
  }
}