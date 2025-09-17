// Currency configuration with Naira (NGN) as the default
export const DEFAULT_CURRENCY = 'NGN';

export interface Currency {
  code: string;
  name: string;
  symbol: string;
  country: string;
  flag: string;
}

export const CURRENCIES: Currency[] = [
  // Nigerian Naira (Default)
  { code: 'NGN', name: 'Nigerian Naira', symbol: '₦', country: 'Nigeria', flag: '🇳🇬' },
  
  // Major African currencies
  { code: 'GHS', name: 'Ghanaian Cedi', symbol: '₵', country: 'Ghana', flag: '🇬🇭' },
  { code: 'KES', name: 'Kenyan Shilling', symbol: 'KSh', country: 'Kenya', flag: '🇰🇪' },
  { code: 'ZAR', name: 'South African Rand', symbol: 'R', country: 'South Africa', flag: '🇿🇦' },
  { code: 'EGP', name: 'Egyptian Pound', symbol: '£', country: 'Egypt', flag: '🇪🇬' },
  { code: 'MAD', name: 'Moroccan Dirham', symbol: 'DH', country: 'Morocco', flag: '🇲🇦' },
  { code: 'TND', name: 'Tunisian Dinar', symbol: 'د.ت', country: 'Tunisia', flag: '🇹🇳' },
  { code: 'DZD', name: 'Algerian Dinar', symbol: 'د.ج', country: 'Algeria', flag: '🇩🇿' },
  { code: 'ETB', name: 'Ethiopian Birr', symbol: 'Br', country: 'Ethiopia', flag: '🇪🇹' },
  { code: 'UGX', name: 'Ugandan Shilling', symbol: 'USh', country: 'Uganda', flag: '🇺🇬' },
  { code: 'TZS', name: 'Tanzanian Shilling', symbol: 'TSh', country: 'Tanzania', flag: '🇹🇿' },
  { code: 'RWF', name: 'Rwandan Franc', symbol: 'RF', country: 'Rwanda', flag: '🇷🇼' },
  { code: 'XOF', name: 'West African CFA Franc', symbol: 'CFA', country: 'West Africa', flag: '🌍' },
  { code: 'XAF', name: 'Central African CFA Franc', symbol: 'FCFA', country: 'Central Africa', flag: '🌍' },
  
  // Major international currencies
  { code: 'USD', name: 'US Dollar', symbol: '$', country: 'United States', flag: '🇺🇸' },
  { code: 'EUR', name: 'Euro', symbol: '€', country: 'Europe', flag: '🇪🇺' },
  { code: 'GBP', name: 'British Pound', symbol: '£', country: 'United Kingdom', flag: '🇬🇧' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', country: 'Canada', flag: '🇨🇦' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', country: 'Australia', flag: '🇦🇺' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥', country: 'Japan', flag: '🇯🇵' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', country: 'China', flag: '🇨🇳' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹', country: 'India', flag: '🇮🇳' },
  
  // Asian currencies
  { code: 'KRW', name: 'South Korean Won', symbol: '₩', country: 'South Korea', flag: '🇰🇷' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', country: 'Singapore', flag: '🇸🇬' },
  { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$', country: 'Hong Kong', flag: '🇭🇰' },
  { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM', country: 'Malaysia', flag: '🇲🇾' },
  { code: 'THB', name: 'Thai Baht', symbol: '฿', country: 'Thailand', flag: '🇹🇭' },
  { code: 'PHP', name: 'Philippine Peso', symbol: '₱', country: 'Philippines', flag: '🇵🇭' },
  { code: 'IDR', name: 'Indonesian Rupiah', symbol: 'Rp', country: 'Indonesia', flag: '🇮🇩' },
  { code: 'VND', name: 'Vietnamese Dong', symbol: '₫', country: 'Vietnam', flag: '🇻🇳' },
  { code: 'PKR', name: 'Pakistani Rupee', symbol: '₨', country: 'Pakistan', flag: '🇵🇰' },
  { code: 'BDT', name: 'Bangladeshi Taka', symbol: '৳', country: 'Bangladesh', flag: '🇧🇩' },
  { code: 'LKR', name: 'Sri Lankan Rupee', symbol: '₨', country: 'Sri Lanka', flag: '🇱🇰' },
  
  // Middle Eastern currencies
  { code: 'SAR', name: 'Saudi Riyal', symbol: '﷼', country: 'Saudi Arabia', flag: '🇸🇦' },
  { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ', country: 'UAE', flag: '🇦🇪' },
  { code: 'QAR', name: 'Qatari Riyal', symbol: '﷼', country: 'Qatar', flag: '🇶🇦' },
  { code: 'KWD', name: 'Kuwaiti Dinar', symbol: 'د.ك', country: 'Kuwait', flag: '🇰🇼' },
  { code: 'BHD', name: 'Bahraini Dinar', symbol: '.د.ب', country: 'Bahrain', flag: '🇧🇭' },
  { code: 'OMR', name: 'Omani Rial', symbol: '﷼', country: 'Oman', flag: '🇴🇲' },
  { code: 'JOD', name: 'Jordanian Dinar', symbol: 'د.ا', country: 'Jordan', flag: '🇯🇴' },
  { code: 'ILS', name: 'Israeli Shekel', symbol: '₪', country: 'Israel', flag: '🇮🇱' },
  { code: 'TRY', name: 'Turkish Lira', symbol: '₺', country: 'Turkey', flag: '🇹🇷' },
  { code: 'IRR', name: 'Iranian Rial', symbol: '﷼', country: 'Iran', flag: '🇮🇷' },
  
  // Latin American currencies
  { code: 'BRL', name: 'Brazilian Real', symbol: 'R$', country: 'Brazil', flag: '🇧🇷' },
  { code: 'MXN', name: 'Mexican Peso', symbol: '$', country: 'Mexico', flag: '�🇽' },
  { code: 'ARS', name: 'Argentine Peso', symbol: '$', country: 'Argentina', flag: '🇦🇷' },
  { code: 'CLP', name: 'Chilean Peso', symbol: '$', country: 'Chile', flag: '🇨🇱' },
  { code: 'COP', name: 'Colombian Peso', symbol: '$', country: 'Colombia', flag: '🇨🇴' },
  { code: 'PEN', name: 'Peruvian Sol', symbol: 'S/', country: 'Peru', flag: '🇵🇪' },
  { code: 'UYU', name: 'Uruguayan Peso', symbol: '$U', country: 'Uruguay', flag: '🇺🇾' },
  { code: 'VES', name: 'Venezuelan Bolívar', symbol: 'Bs.S', country: 'Venezuela', flag: '🇻🇪' },
  
  // Eastern European & Russian currencies
  { code: 'RUB', name: 'Russian Ruble', symbol: '₽', country: 'Russia', flag: '🇷🇺' },
  { code: 'PLN', name: 'Polish Zloty', symbol: 'zł', country: 'Poland', flag: '🇵🇱' },
  { code: 'CZK', name: 'Czech Koruna', symbol: 'Kč', country: 'Czech Republic', flag: '🇨🇿' },
  { code: 'HUF', name: 'Hungarian Forint', symbol: 'Ft', country: 'Hungary', flag: '🇭🇺' },
  { code: 'RON', name: 'Romanian Leu', symbol: 'lei', country: 'Romania', flag: '🇷🇴' },
  { code: 'UAH', name: 'Ukrainian Hryvnia', symbol: '₴', country: 'Ukraine', flag: '🇺🇦' },
  
  // Other major currencies
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', country: 'Switzerland', flag: '🇨🇭' },
  { code: 'SEK', name: 'Swedish Krona', symbol: 'kr', country: 'Sweden', flag: '🇸🇪' },
  { code: 'NOK', name: 'Norwegian Krone', symbol: 'kr', country: 'Norway', flag: '🇳🇴' },
  { code: 'DKK', name: 'Danish Krone', symbol: 'kr', country: 'Denmark', flag: '🇩🇰' },
  { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$', country: 'New Zealand', flag: '�🇳🇿' }
];

export const getCurrencyByCode = (code: string): Currency | undefined => {
  return CURRENCIES.find(currency => currency.code === code);
};

export const formatCurrency = (amount: number, currencyCode: string): string => {
  const currency = getCurrencyByCode(currencyCode);
  if (!currency) {
    return `${amount} ${currencyCode}`;
  }

  // Format number with thousand separators
  const formattedAmount = amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  return `${currency.symbol}${formattedAmount}`;
};

export const getDefaultCurrency = (): Currency => {
  return getCurrencyByCode(DEFAULT_CURRENCY)!;
};

// Map countries to their default currencies
export const getDefaultCurrencyForCountry = (countryName: string): string => {
  const countryToCurrency: { [key: string]: string } = {
    // Africa
    'Algeria': 'DZD',
    'Angola': 'XAF', // Using Central African CFA Franc as closest
    'Benin': 'XOF',
    'Botswana': 'ZAR', // Using South African Rand as regional currency
    'Burkina Faso': 'XOF',
    'Burundi': 'KES', // Using Kenyan Shilling as regional currency
    'Cameroon': 'XAF',
    'Cape Verde': 'EUR', // Pegged to Euro
    'Central African Republic': 'XAF',
    'Chad': 'XAF',
    'Comoros': 'KES', // Using Kenyan Shilling as regional currency
    'Congo': 'XAF',
    'Democratic Republic of Congo': 'XAF',
    'Djibouti': 'ETB', // Using Ethiopian Birr as regional currency
    'Egypt': 'EGP',
    'Equatorial Guinea': 'XAF',
    'Eritrea': 'ETB', // Using Ethiopian Birr as regional currency
    'Ethiopia': 'ETB',
    'Gabon': 'XAF',
    'Gambia': 'XOF', // Using West African CFA as regional currency
    'Ghana': 'GHS',
    'Guinea': 'XOF', // Using West African CFA as regional currency
    'Guinea-Bissau': 'XOF',
    'Ivory Coast': 'XOF',
    'Kenya': 'KES',
    'Lesotho': 'ZAR',
    'Liberia': 'USD', // Uses US Dollar
    'Libya': 'TND', // Using Tunisian Dinar as closest
    'Madagascar': 'KES', // Using Kenyan Shilling as regional currency
    'Malawi': 'KES', // Using Kenyan Shilling as regional currency
    'Mali': 'XOF',
    'Mauritania': 'XOF', // Using West African CFA as regional currency
    'Mauritius': 'KES', // Using Kenyan Shilling as regional currency
    'Morocco': 'MAD',
    'Mozambique': 'ZAR', // Using South African Rand as regional currency
    'Namibia': 'ZAR',
    'Niger': 'XOF',
    'Nigeria': 'NGN',
    'Rwanda': 'RWF',
    'Sao Tome and Principe': 'XAF', // Using Central African CFA as regional currency
    'Senegal': 'XOF',
    'Seychelles': 'KES', // Using Kenyan Shilling as regional currency
    'Sierra Leone': 'XOF', // Using West African CFA as regional currency
    'Somalia': 'ETB', // Using Ethiopian Birr as regional currency
    'South Africa': 'ZAR',
    'South Sudan': 'ETB', // Using Ethiopian Birr as regional currency
    'Sudan': 'EGP', // Using Egyptian Pound as regional currency
    'Swaziland': 'ZAR',
    'Tanzania': 'TZS',
    'Togo': 'XOF',
    'Tunisia': 'TND',
    'Uganda': 'UGX',
    'Zambia': 'ZAR', // Using South African Rand as regional currency
    'Zimbabwe': 'USD', // Uses US Dollar
    
    // Asia
    'Afghanistan': 'PKR', // Using Pakistani Rupee as regional currency
    'Armenia': 'RUB', // Using Russian Ruble as regional currency
    'Azerbaijan': 'TRY', // Using Turkish Lira as regional currency
    'Bahrain': 'BHD',
    'Bangladesh': 'BDT',
    'Bhutan': 'INR', // Uses Indian Rupee
    'Brunei': 'SGD', // Uses Singapore Dollar
    'Cambodia': 'USD', // Commonly uses US Dollar
    'China': 'CNY',
    'Cyprus': 'EUR',
    'East Timor': 'USD', // Uses US Dollar
    'Georgia': 'TRY', // Using Turkish Lira as regional currency
    'Hong Kong': 'HKD',
    'India': 'INR',
    'Indonesia': 'IDR',
    'Iran': 'IRR',
    'Iraq': 'SAR', // Using Saudi Riyal as regional currency
    'Israel': 'ILS',
    'Japan': 'JPY',
    'Jordan': 'JOD',
    'Kazakhstan': 'RUB', // Using Russian Ruble as regional currency
    'Kuwait': 'KWD',
    'Kyrgyzstan': 'RUB', // Using Russian Ruble as regional currency
    'Laos': 'THB', // Using Thai Baht as regional currency
    'Lebanon': 'JOD', // Using Jordanian Dinar as regional currency
    'Macao': 'HKD', // Uses Hong Kong Dollar
    'Malaysia': 'MYR',
    'Maldives': 'INR', // Using Indian Rupee as regional currency
    'Mongolia': 'CNY', // Using Chinese Yuan as regional currency
    'Myanmar': 'THB', // Using Thai Baht as regional currency
    'Nepal': 'INR', // Using Indian Rupee as regional currency
    'North Korea': 'CNY', // Using Chinese Yuan as regional currency
    'Oman': 'OMR',
    'Pakistan': 'PKR',
    'Palestine': 'ILS', // Uses Israeli Shekel
    'Philippines': 'PHP',
    'Qatar': 'QAR',
    'Saudi Arabia': 'SAR',
    'Singapore': 'SGD',
    'South Korea': 'KRW',
    'Sri Lanka': 'LKR',
    'Syria': 'JOD', // Using Jordanian Dinar as regional currency
    'Taiwan': 'CNY', // Using Chinese Yuan
    'Tajikistan': 'RUB', // Using Russian Ruble as regional currency
    'Thailand': 'THB',
    'Turkey': 'TRY',
    'Turkmenistan': 'RUB', // Using Russian Ruble as regional currency
    'United Arab Emirates': 'AED',
    'Uzbekistan': 'RUB', // Using Russian Ruble as regional currency
    'Vietnam': 'VND',
    'Yemen': 'SAR', // Using Saudi Riyal as regional currency
    
    // Europe
    'Albania': 'EUR',
    'Andorra': 'EUR',
    'Austria': 'EUR',
    'Belarus': 'RUB', // Using Russian Ruble as regional currency
    'Belgium': 'EUR',
    'Bosnia and Herzegovina': 'EUR',
    'Bulgaria': 'EUR',
    'Croatia': 'EUR',
    'Czech Republic': 'CZK',
    'Denmark': 'DKK',
    'Estonia': 'EUR',
    'Finland': 'EUR',
    'France': 'EUR',
    'Germany': 'EUR',
    'Greece': 'EUR',
    'Hungary': 'HUF',
    'Iceland': 'EUR',
    'Ireland': 'EUR',
    'Italy': 'EUR',
    'Kosovo': 'EUR',
    'Latvia': 'EUR',
    'Liechtenstein': 'CHF', // Uses Swiss Franc
    'Lithuania': 'EUR',
    'Luxembourg': 'EUR',
    'Malta': 'EUR',
    'Moldova': 'RON', // Using Romanian Leu as regional currency
    'Monaco': 'EUR',
    'Montenegro': 'EUR',
    'Netherlands': 'EUR',
    'North Macedonia': 'EUR',
    'Norway': 'NOK',
    'Poland': 'PLN',
    'Portugal': 'EUR',
    'Romania': 'RON',
    'Russia': 'RUB',
    'San Marino': 'EUR',
    'Serbia': 'EUR',
    'Slovakia': 'EUR',
    'Slovenia': 'EUR',
    'Spain': 'EUR',
    'Sweden': 'SEK',
    'Switzerland': 'CHF',
    'Ukraine': 'UAH',
    'United Kingdom': 'GBP',
    'Vatican City': 'EUR',
    
    // North America
    'Canada': 'CAD',
    'Greenland': 'DKK', // Uses Danish Krone
    'Mexico': 'MXN',
    'United States': 'USD',
    
    // Central America & Caribbean
    'Antigua and Barbuda': 'USD', // Uses US Dollar
    'Bahamas': 'USD', // Uses US Dollar
    'Barbados': 'USD', // Uses US Dollar
    'Belize': 'USD', // Uses US Dollar
    'Costa Rica': 'USD', // Commonly uses US Dollar
    'Cuba': 'USD', // Commonly uses US Dollar
    'Dominica': 'USD', // Uses US Dollar
    'Dominican Republic': 'USD', // Uses US Dollar
    'El Salvador': 'USD', // Uses US Dollar
    'Grenada': 'USD', // Uses US Dollar
    'Guatemala': 'USD', // Uses US Dollar
    'Haiti': 'USD', // Uses US Dollar
    'Honduras': 'USD', // Uses US Dollar
    'Jamaica': 'USD', // Uses US Dollar
    'Nicaragua': 'USD', // Uses US Dollar
    'Panama': 'USD', // Uses US Dollar
    'Saint Kitts and Nevis': 'USD', // Uses US Dollar
    'Saint Lucia': 'USD', // Uses US Dollar
    'Saint Vincent and the Grenadines': 'USD', // Uses US Dollar
    'Trinidad and Tobago': 'USD', // Uses US Dollar
    
    // South America
    'Argentina': 'ARS',
    'Bolivia': 'PEN', // Using Peruvian Sol as regional currency
    'Brazil': 'BRL',
    'Chile': 'CLP',
    'Colombia': 'COP',
    'Ecuador': 'USD', // Uses US Dollar
    'French Guiana': 'EUR', // Uses Euro
    'Guyana': 'USD', // Uses US Dollar
    'Paraguay': 'BRL', // Using Brazilian Real as regional currency
    'Peru': 'PEN',
    'Suriname': 'USD', // Uses US Dollar
    'Uruguay': 'UYU',
    'Venezuela': 'VES',
    
    // Oceania
    'Australia': 'AUD',
    'Fiji': 'AUD', // Using Australian Dollar as regional currency
    'Kiribati': 'AUD', // Uses Australian Dollar
    'Marshall Islands': 'USD', // Uses US Dollar
    'Micronesia': 'USD', // Uses US Dollar
    'Nauru': 'AUD', // Uses Australian Dollar
    'New Zealand': 'NZD',
    'Palau': 'USD', // Uses US Dollar
    'Papua New Guinea': 'AUD', // Using Australian Dollar as regional currency
    'Samoa': 'NZD', // Using New Zealand Dollar as regional currency
    'Solomon Islands': 'AUD', // Using Australian Dollar as regional currency
    'Tonga': 'NZD', // Using New Zealand Dollar as regional currency
    'Tuvalu': 'AUD', // Uses Australian Dollar
    'Vanuatu': 'AUD', // Using Australian Dollar as regional currency
  };
  
  // Return mapped currency or intelligent default
  const mappedCurrency = countryToCurrency[countryName];
  if (mappedCurrency) {
    return mappedCurrency;
  }
  
  // Advanced fallback logic for unmapped countries
  const lowerCountry = countryName.toLowerCase();
  
  // African countries default to NGN (Nigerian Naira)
  if (lowerCountry.includes('africa') || 
      ['madagascar', 'comoros', 'mayotte', 'reunion'].some(term => lowerCountry.includes(term))) {
    return DEFAULT_CURRENCY; // NGN
  }
  
  // European countries default to EUR
  if (lowerCountry.includes('europe') || 
      ['kosovo', 'montenegro', 'macedonia'].some(term => lowerCountry.includes(term))) {
    return 'EUR';
  }
  
  // Asian countries - intelligent regional defaults
  if (lowerCountry.includes('asia') || lowerCountry.includes('stan')) {
    if (['afghanistan', 'pakistan', 'bangladesh'].some(term => lowerCountry.includes(term))) {
      return 'PKR'; // Pakistani Rupee region
    }
    if (['china', 'tibet', 'xinjiang', 'mongolia'].some(term => lowerCountry.includes(term))) {
      return 'CNY'; // Chinese Yuan region
    }
    if (['russia', 'siberia', 'caucasus'].some(term => lowerCountry.includes(term))) {
      return 'RUB'; // Russian Ruble region
    }
    return 'USD'; // General Asian fallback
  }
  
  // American countries default to USD
  if (lowerCountry.includes('america') || lowerCountry.includes('caribbean') || 
      lowerCountry.includes('island')) {
    return 'USD';
  }
  
  // Oceania countries default to AUD
  if (lowerCountry.includes('oceania') || lowerCountry.includes('pacific')) {
    return 'AUD';
  }
  
  // Final fallback: USD for unknown countries
  return 'USD';
};