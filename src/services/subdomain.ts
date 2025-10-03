import { BusinessService } from './business';

export interface SubdomainInfo {
  isSubdomain: boolean;
  storeName?: string;
  businessId?: string;
  isCustomDomain?: boolean;
  originalDomain: string;
}

export class SubdomainService {
  private static MAIN_DOMAINS = [
    'localhost',
    'rady.ng',
    'www.rady.ng',
    'trady.ng',
    'www.trady.ng'
  ];

  // Check if current URL is a store subdomain
  static async detectSubdomain(): Promise<SubdomainInfo> {
    const hostname = window.location.hostname;
    const port = window.location.port;
    
    // For local development, check for store parameter or special ports
    if (hostname === 'localhost') {
      const params = new URLSearchParams(window.location.search);
      const storeParam = params.get('store');
      
      if (storeParam) {
        // For demo purposes, create a mock business for 'demo' store
        if (storeParam === 'demo') {
          return {
            isSubdomain: true,
            storeName: 'demo',
            businessId: 'demo-business-id',
            isCustomDomain: false,
            originalDomain: hostname + (port ? `:${port}` : '')
          };
        }
        
        try {
          // Try to find business by store name
          const business = await BusinessService.getBusinessBySubdomain(storeParam);
          if (business) {
            return {
              isSubdomain: true,
              storeName: storeParam,
              businessId: business.id,
              isCustomDomain: false,
              originalDomain: hostname + (port ? `:${port}` : '')
            };
          }
        } catch (error) {
          console.error('Error finding business by store name:', error);
        }
      }
      
      return {
        isSubdomain: false,
        originalDomain: hostname + (port ? `:${port}` : '')
      };
    }

    // Check if it's a subdomain of rady.ng or trady.ng
    if (hostname.endsWith('.rady.ng') || hostname.endsWith('.trady.ng')) {
      const subdomain = hostname.replace('.rady.ng', '').replace('.trady.ng', '');
      
      // Skip www and other system subdomains
      if (subdomain && subdomain !== 'www' && subdomain !== 'api' && subdomain !== 'admin') {
        try {
          // Try to find business by subdomain
          const business = await BusinessService.getBusinessBySubdomain(subdomain);
          if (business) {
            return {
              isSubdomain: true,
              storeName: subdomain,
              businessId: business.id,
              isCustomDomain: false,
              originalDomain: hostname
            };
          }
        } catch (error) {
          console.error('Error finding business by store name:', error);
        }
      }
    }

    // Check if it's a custom domain
    if (!this.MAIN_DOMAINS.includes(hostname)) {
      try {
        // Check if this domain is registered as a custom domain
        const business = await BusinessService.getBusinessByCustomDomain(hostname);
        if (business) {
          return {
            isSubdomain: true,
            storeName: business.subdomain,
            businessId: business.id,
            isCustomDomain: true,
            originalDomain: hostname
          };
        }
      } catch (error) {
        console.error('Error checking custom domain:', error);
      }
    }

    return {
      isSubdomain: false,
      originalDomain: hostname
    };
  }

  // Generate store URL for a given store name
  static generateStoreUrl(storeName: string, isProduction: boolean = false): string {
    if (isProduction) {
      return `https://${storeName}.rady.ng`;
    } else {
      // For development, use query parameter
      const currentPort = window.location.port;
      return `http://localhost${currentPort ? `:${currentPort}` : ''}?store=${storeName}`;
    }
  }

  // Check if we're currently on the main site (not a store)
  static isMainSite(): boolean {
    const hostname = window.location.hostname;
    
    // On localhost, check if there's no store parameter
    if (hostname === 'localhost') {
      const params = new URLSearchParams(window.location.search);
      return !params.get('store');
    }

    // Check if it's the main domain
    return this.MAIN_DOMAINS.includes(hostname) || hostname === 'rady.ng' || hostname === 'trady.ng';
  }

  // Get the dashboard URL (always main domain)
  static getDashboardUrl(): string {
    const isProduction = !window.location.hostname.includes('localhost');
    
    if (isProduction) {
      return 'https://rady.ng/dashboard';
    } else {
      const currentPort = window.location.port;
      return `http://localhost${currentPort ? `:${currentPort}` : ''}/dashboard`;
    }
  }
}