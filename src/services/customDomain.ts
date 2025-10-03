import { db } from '../config/firebase';
import { doc, updateDoc } from 'firebase/firestore';

export interface CustomDomain {
  domain: string;
  businessId: string;
  status: 'pending' | 'verified' | 'failed';
  verifiedAt?: Date;
  createdAt: Date;
}

export class CustomDomainService {
  // Add custom domain to a business
  static async addCustomDomain(businessId: string, domain: string): Promise<void> {
    try {
      // Clean the domain (remove protocol, www, etc.)
      const cleanDomain = this.cleanDomain(domain);
      
      // Update business with custom domain
      const businessRef = doc(db, 'businesses', businessId);
      await updateDoc(businessRef, {
        customDomain: cleanDomain,
        updatedAt: new Date()
      });
      
      // You could also store in a separate collection for better management
      // const domainRef = doc(db, 'domains', cleanDomain);
      // await setDoc(domainRef, {
      //   businessId,
      //   domain: cleanDomain,
      //   status: 'pending',
      //   createdAt: new Date()
      // });
      
    } catch (error) {
      console.error('Error adding custom domain:', error);
      throw error;
    }
  }
  
  // Remove custom domain from a business
  static async removeCustomDomain(businessId: string): Promise<void> {
    try {
      const businessRef = doc(db, 'businesses', businessId);
      await updateDoc(businessRef, {
        customDomain: null,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error removing custom domain:', error);
      throw error;
    }
  }
  
  // Verify domain ownership (simplified version)
  static async verifyDomain(domain: string): Promise<boolean> {
    try {
      // In a real implementation, you would:
      // 1. Check if DNS records are properly set
      // 2. Verify the domain points to your servers
      // 3. Check SSL certificate status
      
      // For now, we'll just simulate verification
      const cleanDomain = this.cleanDomain(domain);
      
      // Simple check: try to resolve the domain
      const response = await fetch(`https://${cleanDomain}`, {
        method: 'HEAD',
        mode: 'no-cors'
      }).catch(() => null);
      
      return response !== null;
    } catch (error) {
      console.error('Error verifying domain:', error);
      return false;
    }
  }
  
  // Clean domain name (remove protocol, www, trailing slashes)
  private static cleanDomain(domain: string): string {
    return domain
      .replace(/^https?:\/\//, '') // Remove protocol
      .replace(/^www\./, '')       // Remove www
      .replace(/\/$/, '')          // Remove trailing slash
      .toLowerCase();
  }
  
  // Get instructions for setting up custom domain
  static getDomainInstructions(domain: string) {
    const cleanDomain = this.cleanDomain(domain);
    
    return {
      domain: cleanDomain,
      instructions: [
        {
          type: 'CNAME',
          name: 'www',
          value: 'cname.vercel-dns.com',
          description: 'Add this CNAME record for www subdomain'
        },
        {
          type: 'A',
          name: '@',
          value: '76.76.19.61',
          description: 'Add this A record for the root domain'
        },
        {
          type: 'CNAME',
          name: '*',
          value: 'cname.vercel-dns.com',
          description: 'Add this wildcard CNAME for subdomain support (for stores like store.yourdomain.com)'
        }
      ],
      note: 'DNS changes can take up to 24-48 hours to propagate worldwide.'
    };
  }
}