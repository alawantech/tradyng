// Utility functions for WhatsApp integration
export interface WhatsAppConfig {
  number: string;
  formattedNumber: string;
  whatsappUrl: string;
  country?: string;
}

// African country configurations
const AFRICAN_COUNTRIES = {
  // West Africa
  '234': { name: 'Nigeria', digits: 10, localPrefix: '0', format: '+234 XXX XXX XXXX' },
  '227': { name: 'Niger', digits: 8, localPrefix: null, format: '+227 XX XX XX XX' },
  '223': { name: 'Mali', digits: 8, localPrefix: null, format: '+223 XX XX XX XX' },
  '228': { name: 'Togo', digits: 8, localPrefix: null, format: '+228 XX XX XX XX' },
  '237': { name: 'Cameroon', digits: 8, localPrefix: null, format: '+237 XX XX XX XX' },
  '226': { name: 'Burkina Faso', digits: 8, localPrefix: null, format: '+226 XX XX XX XX' },
  '221': { name: 'Senegal', digits: 9, localPrefix: null, format: '+221 XXX XX XX XX' },
  '225': { name: 'Ivory Coast', digits: 8, localPrefix: null, format: '+225 XX XX XX XX' },
  '233': { name: 'Ghana', digits: 9, localPrefix: null, format: '+233 XXX XXX XXX' },
  '224': { name: 'Guinea', digits: 9, localPrefix: null, format: '+224 XXX XX XX XX' },
  '220': { name: 'Gambia', digits: 7, localPrefix: null, format: '+220 XXX XXXX' },
  '240': { name: 'Equatorial Guinea', digits: 9, localPrefix: null, format: '+240 XXX XXX XXX' },

  // East Africa
  '254': { name: 'Kenya', digits: 9, localPrefix: null, format: '+254 XXX XXX XXX' },
  '256': { name: 'Uganda', digits: 9, localPrefix: null, format: '+256 XXX XXX XXX' },
  '255': { name: 'Tanzania', digits: 9, localPrefix: null, format: '+255 XXX XXX XXX' },
  '250': { name: 'Rwanda', digits: 9, localPrefix: null, format: '+250 XXX XXX XXX' },
  '251': { name: 'Ethiopia', digits: 9, localPrefix: null, format: '+251 XXX XXX XXX' },
  '252': { name: 'Somalia', digits: 8, localPrefix: null, format: '+252 XX XXX XXX' },
  '257': { name: 'Burundi', digits: 8, localPrefix: null, format: '+257 XX XX XX XX' },

  // Southern Africa
  '27': { name: 'South Africa', digits: 9, localPrefix: '0', format: '+27 XX XXX XXXX' },
  '260': { name: 'Zambia', digits: 9, localPrefix: null, format: '+260 XXX XXX XXX' },
  '263': { name: 'Zimbabwe', digits: 9, localPrefix: null, format: '+263 XX XXX XXX' },
  '265': { name: 'Malawi', digits: 9, localPrefix: null, format: '+265 XXX XX XX XX' },
  '267': { name: 'Botswana', digits: 8, localPrefix: null, format: '+267 XX XXX XXX' },
  '268': { name: 'Eswatini', digits: 8, localPrefix: null, format: '+268 XX XX XXXX' },
  '269': { name: 'Comoros', digits: 7, localPrefix: null, format: '+269 XX XX XX' },

  // North Africa
  '20': { name: 'Egypt', digits: 10, localPrefix: '0', format: '+20 XXX XXX XXXX' },
  '212': { name: 'Morocco', digits: 9, localPrefix: '0', format: '+212 XXX XXX XXX' },
  '213': { name: 'Algeria', digits: 9, localPrefix: '0', format: '+213 XXX XXX XXX' },
  '216': { name: 'Tunisia', digits: 8, localPrefix: null, format: '+216 XX XXX XXX' },
  '218': { name: 'Libya', digits: 9, localPrefix: '0', format: '+218 XXX XXX XXX' },

  // Central Africa
  '235': { name: 'Chad', digits: 8, localPrefix: null, format: '+235 XX XX XX XX' },
  '236': { name: 'Central African Republic', digits: 8, localPrefix: null, format: '+236 XX XX XX XX' },
  '238': { name: 'Cape Verde', digits: 7, localPrefix: null, format: '+238 XXX XXXX' },
  '239': { name: 'São Tomé and Príncipe', digits: 7, localPrefix: null, format: '+239 XX XXXX' },
  '241': { name: 'Gabon', digits: 7, localPrefix: null, format: '+241 XX XX XX' },
  '242': { name: 'Republic of the Congo', digits: 9, localPrefix: null, format: '+242 XX XXX XXX' },
  '243': { name: 'Democratic Republic of the Congo', digits: 9, localPrefix: null, format: '+243 XXX XXX XXX' },
};

/**
 * Detects country from phone number and returns country info
 */
function detectAfricanCountry(phoneNumber: string): { countryCode: string; config: any } | null {
  // Check if it starts with + followed by country code
  if (phoneNumber.startsWith('+')) {
    for (const [code, config] of Object.entries(AFRICAN_COUNTRIES)) {
      if (phoneNumber.startsWith(`+${code}`)) {
        return { countryCode: code, config };
      }
    }
  }

  // Check if it starts with country code without +
  for (const [code, config] of Object.entries(AFRICAN_COUNTRIES)) {
    if (phoneNumber.startsWith(code)) {
      return { countryCode: code, config };
    }
  }

  return null;
}

/**
 * Formats and validates WhatsApp phone numbers for different countries
 * Handles African countries, Nigerian numbers, and international formats
 */
export function formatWhatsAppNumber(phoneNumber: string): WhatsAppConfig | null {
  if (!phoneNumber) return null;

  // Remove all non-digit characters except + at the beginning
  let cleaned = phoneNumber.replace(/[^\d+]/g, '');
  let countryInfo = detectAfricanCountry(cleaned);
  let country = countryInfo?.config?.name || 'Unknown';

  // Handle different number formats based on detected country or patterns
  if (countryInfo) {
    const { countryCode, config } = countryInfo;

    // If number starts with country code but no +, add +
    if (cleaned.startsWith(countryCode) && !cleaned.startsWith(`+${countryCode}`)) {
      cleaned = '+' + cleaned;
    }

    // Handle local prefix removal (like 0 in Nigeria, South Africa, etc.)
    if (config.localPrefix && cleaned.startsWith(`+${countryCode}${config.localPrefix}`)) {
      // Remove the local prefix
      cleaned = `+${countryCode}` + cleaned.substring(countryCode.length + config.localPrefix.length + 1);
    }

  } else {
    // Handle Nigerian number formats (fallback for when country detection fails)
    if (cleaned.startsWith('0') && cleaned.length === 11) {
      // Nigerian number starting with 0 (e.g., 08123456789)
      cleaned = '+234' + cleaned.substring(1);
      country = 'Nigeria';
    } else if (cleaned.startsWith('234') && !cleaned.startsWith('+234')) {
      // Nigerian number with 234 but no + (e.g., 2348123456789)
      cleaned = '+' + cleaned;
      country = 'Nigeria';
    } else if (!cleaned.startsWith('+') && cleaned.length === 10 && cleaned.startsWith('8')) {
      // Nigerian number without country code (e.g., 8123456789)
      cleaned = '+234' + cleaned;
      country = 'Nigeria';
    } else if (!cleaned.startsWith('+') && cleaned.length >= 10) {
      // International number without + - assume it's valid and add +
      cleaned = '+' + cleaned;
    }

    // Try to detect country again after Nigerian processing
    countryInfo = detectAfricanCountry(cleaned);
    if (countryInfo) {
      country = countryInfo.config.name;
    }
  }

  // Validate the final format - allow 7-15 digits after +
  const phoneRegex = /^\+\d{7,15}$/;
  if (!phoneRegex.test(cleaned)) {
    console.warn('Invalid phone number format:', phoneNumber, '->', cleaned);
    return null;
  }

  // Extract just the digits for WhatsApp URL
  const digitsOnly = cleaned.replace(/\D/g, '');

  // Format for display based on country
  let formatted = cleaned;

  if (countryInfo) {
    const { countryCode } = countryInfo;
    const localNumber = cleaned.substring(countryCode.length + 1); // Remove + and country code

    // Apply country-specific formatting
    switch (countryCode) {
      case '234': // Nigeria: +234 812 345 6789
        if (localNumber.length === 10) {
          formatted = `+234 ${localNumber.substring(0, 3)} ${localNumber.substring(3, 6)} ${localNumber.substring(6)}`;
        }
        break;

      case '233': // Ghana: +233 XXX XXX XXX
        if (localNumber.length === 9) {
          formatted = `+233 ${localNumber.substring(0, 3)} ${localNumber.substring(3, 6)} ${localNumber.substring(6)}`;
        }
        break;

      case '254': // Kenya: +254 XXX XXX XXX
      case '256': // Uganda: +254 XXX XXX XXX
      case '255': // Tanzania: +254 XXX XXX XXX
      case '250': // Rwanda: +254 XXX XXX XXX
      case '251': // Ethiopia: +254 XXX XXX XXX
        if (localNumber.length === 9) {
          formatted = `+${countryCode} ${localNumber.substring(0, 3)} ${localNumber.substring(3, 6)} ${localNumber.substring(6)}`;
        }
        break;

      case '27': // South Africa: +27 XX XXX XXXX
        if (localNumber.length === 9) {
          formatted = `+27 ${localNumber.substring(0, 2)} ${localNumber.substring(2, 5)} ${localNumber.substring(5)}`;
        }
        break;

      case '20': // Egypt: +20 XXX XXX XXXX
        if (localNumber.length === 10) {
          formatted = `+20 ${localNumber.substring(0, 3)} ${localNumber.substring(3, 6)} ${localNumber.substring(6)}`;
        }
        break;

      case '212': // Morocco: +212 XXX XXX XXX
      case '213': // Algeria: +212 XXX XXX XXX
        if (localNumber.length === 9) {
          formatted = `+${countryCode} ${localNumber.substring(0, 3)} ${localNumber.substring(3, 6)} ${localNumber.substring(6)}`;
        }
        break;

      // Default 8-digit African countries: +XXX XX XX XX XX
      case '227': // Niger
      case '223': // Mali
      case '228': // Togo
      case '237': // Cameroon
      case '226': // Burkina Faso
      case '221': // Senegal
      case '225': // Ivory Coast
      case '235': // Chad
      case '236': // Central African Republic
        if (localNumber.length === 8) {
          formatted = `+${countryCode} ${localNumber.substring(0, 2)} ${localNumber.substring(2, 4)} ${localNumber.substring(4, 6)} ${localNumber.substring(6)}`;
        }
        break;

      default:
        // Generic formatting for other countries
        const countryCodeDigits = countryCode.length;
        const remaining = cleaned.substring(countryCodeDigits + 1);
        formatted = `+${countryCode} ${remaining.replace(/(\d{3})(?=\d)/g, '$1 ')}`;
    }
  } else if (cleaned.startsWith('+1')) {
    // US format: +1 (555) 123-4567
    const areaCode = cleaned.substring(2, 5);
    const firstPart = cleaned.substring(5, 8);
    const secondPart = cleaned.substring(8);
    formatted = `+1 (${areaCode}) ${firstPart}-${secondPart}`;
  } else {
    // Generic international format with spaces
    const countryCode = cleaned.match(/^\+(\d{1,4})/)?.[1] || '';
    const remaining = cleaned.substring(countryCode.length + 1);
    formatted = `+${countryCode} ${remaining.replace(/(\d{3})(?=\d)/g, '$1 ')}`;
  }

  return {
    number: cleaned,
    formattedNumber: formatted.trim(),
    whatsappUrl: `https://wa.me/${digitsOnly}`,
    country
  };
}

/**
 * Gets WhatsApp configuration for a business
 * Prioritizes whatsapp field over phone field
 */
export function getBusinessWhatsAppConfig(business: any): WhatsAppConfig | null {
  if (!business) return null;

  // Prefer whatsapp field if available
  const whatsappNumber = business.whatsapp || business.phone;

  if (!whatsappNumber) return null;

  return formatWhatsAppNumber(whatsappNumber);
}