export interface Country {
  name: string;
  code: string;
  flag: string;
}

export interface State {
  name: string;
  code: string;
}

export interface CountryWithStates extends Country {
  states: State[];
}

// Nigerian states
export const nigerianStates: State[] = [
  { name: 'Abia', code: 'AB' },
  { name: 'Adamawa', code: 'AD' },
  { name: 'Akwa Ibom', code: 'AK' },
  { name: 'Anambra', code: 'AN' },
  { name: 'Bauchi', code: 'BA' },
  { name: 'Bayelsa', code: 'BY' },
  { name: 'Benue', code: 'BE' },
  { name: 'Borno', code: 'BO' },
  { name: 'Cross River', code: 'CR' },
  { name: 'Delta', code: 'DE' },
  { name: 'Ebonyi', code: 'EB' },
  { name: 'Edo', code: 'ED' },
  { name: 'Ekiti', code: 'EK' },
  { name: 'Enugu', code: 'EN' },
  { name: 'Federal Capital Territory', code: 'FC' },
  { name: 'Gombe', code: 'GO' },
  { name: 'Imo', code: 'IM' },
  { name: 'Jigawa', code: 'JI' },
  { name: 'Kaduna', code: 'KD' },
  { name: 'Kano', code: 'KN' },
  { name: 'Katsina', code: 'KT' },
  { name: 'Kebbi', code: 'KE' },
  { name: 'Kogi', code: 'KG' },
  { name: 'Kwara', code: 'KW' },
  { name: 'Lagos', code: 'LA' },
  { name: 'Nasarawa', code: 'NA' },
  { name: 'Niger', code: 'NI' },
  { name: 'Ogun', code: 'OG' },
  { name: 'Ondo', code: 'ON' },
  { name: 'Osun', code: 'OS' },
  { name: 'Oyo', code: 'OY' },
  { name: 'Plateau', code: 'PL' },
  { name: 'Rivers', code: 'RI' },
  { name: 'Sokoto', code: 'SO' },
  { name: 'Taraba', code: 'TA' },
  { name: 'Yobe', code: 'YO' },
  { name: 'Zamfara', code: 'ZA' }
];

// Popular countries with their states (you can expand this)
export const countriesWithStates: CountryWithStates[] = [
  {
    name: 'Nigeria',
    code: 'NG',
    flag: '🇳🇬',
    states: nigerianStates
  },
  {
    name: 'United States',
    code: 'US',
    flag: '🇺🇸',
    states: [
      { name: 'Alabama', code: 'AL' },
      { name: 'Alaska', code: 'AK' },
      { name: 'Arizona', code: 'AZ' },
      { name: 'Arkansas', code: 'AR' },
      { name: 'California', code: 'CA' },
      { name: 'Colorado', code: 'CO' },
      { name: 'Connecticut', code: 'CT' },
      { name: 'Delaware', code: 'DE' },
      { name: 'Florida', code: 'FL' },
      { name: 'Georgia', code: 'GA' },
      { name: 'Hawaii', code: 'HI' },
      { name: 'Idaho', code: 'ID' },
      { name: 'Illinois', code: 'IL' },
      { name: 'Indiana', code: 'IN' },
      { name: 'Iowa', code: 'IA' },
      { name: 'Kansas', code: 'KS' },
      { name: 'Kentucky', code: 'KY' },
      { name: 'Louisiana', code: 'LA' },
      { name: 'Maine', code: 'ME' },
      { name: 'Maryland', code: 'MD' },
      { name: 'Massachusetts', code: 'MA' },
      { name: 'Michigan', code: 'MI' },
      { name: 'Minnesota', code: 'MN' },
      { name: 'Mississippi', code: 'MS' },
      { name: 'Missouri', code: 'MO' },
      { name: 'Montana', code: 'MT' },
      { name: 'Nebraska', code: 'NE' },
      { name: 'Nevada', code: 'NV' },
      { name: 'New Hampshire', code: 'NH' },
      { name: 'New Jersey', code: 'NJ' },
      { name: 'New Mexico', code: 'NM' },
      { name: 'New York', code: 'NY' },
      { name: 'North Carolina', code: 'NC' },
      { name: 'North Dakota', code: 'ND' },
      { name: 'Ohio', code: 'OH' },
      { name: 'Oklahoma', code: 'OK' },
      { name: 'Oregon', code: 'OR' },
      { name: 'Pennsylvania', code: 'PA' },
      { name: 'Rhode Island', code: 'RI' },
      { name: 'South Carolina', code: 'SC' },
      { name: 'South Dakota', code: 'SD' },
      { name: 'Tennessee', code: 'TN' },
      { name: 'Texas', code: 'TX' },
      { name: 'Utah', code: 'UT' },
      { name: 'Vermont', code: 'VT' },
      { name: 'Virginia', code: 'VA' },
      { name: 'Washington', code: 'WA' },
      { name: 'West Virginia', code: 'WV' },
      { name: 'Wisconsin', code: 'WI' },
      { name: 'Wyoming', code: 'WY' }
    ]
  },
  {
    name: 'United Kingdom',
    code: 'GB',
    flag: '🇬🇧',
    states: [
      { name: 'England', code: 'ENG' },
      { name: 'Scotland', code: 'SCT' },
      { name: 'Wales', code: 'WLS' },
      { name: 'Northern Ireland', code: 'NIR' }
    ]
  },
  {
    name: 'Canada',
    code: 'CA',
    flag: '🇨🇦',
    states: [
      { name: 'Alberta', code: 'AB' },
      { name: 'British Columbia', code: 'BC' },
      { name: 'Manitoba', code: 'MB' },
      { name: 'New Brunswick', code: 'NB' },
      { name: 'Newfoundland and Labrador', code: 'NL' },
      { name: 'Northwest Territories', code: 'NT' },
      { name: 'Nova Scotia', code: 'NS' },
      { name: 'Nunavut', code: 'NU' },
      { name: 'Ontario', code: 'ON' },
      { name: 'Prince Edward Island', code: 'PE' },
      { name: 'Quebec', code: 'QC' },
      { name: 'Saskatchewan', code: 'SK' },
      { name: 'Yukon', code: 'YT' }
    ]
  }
];

// Service to fetch all countries from REST Countries API
export class CountryService {
  private static readonly API_BASE = 'https://restcountries.com/v3.1';

  static async getAllCountries(): Promise<Country[]> {
    try {
      const response = await fetch(`${this.API_BASE}/all?fields=name,cca2,flag`);
      if (!response.ok) throw new Error('Failed to fetch countries');
      
      const data = await response.json();
      return data
        .map((country: any) => ({
          name: country.name.common,
          code: country.cca2,
          flag: country.flag
        }))
        .sort((a: Country, b: Country) => a.name.localeCompare(b.name));
    } catch (error) {
      console.error('Error fetching countries:', error);
      // Fallback to predefined countries
      return countriesWithStates.map(({ states, ...country }) => country);
    }
  }

  static getStatesByCountryCode(countryCode: string): State[] {
    const country = countriesWithStates.find(c => c.code === countryCode);
    return country?.states || [];
  }

  static async getCountryByCode(code: string): Promise<Country | null> {
    try {
      const response = await fetch(`${this.API_BASE}/alpha/${code}?fields=name,cca2,flag`);
      if (!response.ok) return null;
      
      const data = await response.json();
      return {
        name: data.name.common,
        code: data.cca2,
        flag: data.flag
      };
    } catch (error) {
      console.error('Error fetching country:', error);
      return null;
    }
  }
}