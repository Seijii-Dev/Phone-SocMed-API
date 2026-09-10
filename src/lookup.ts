import { getCountryCallingCode, parsePhoneNumberWithError } from 'libphonenumber-js';
import type { CountryCode } from 'libphonenumber-js';

export type SocialMatch = {
  provider: string;
  status: 'not_configured' | 'not_checked' | 'found' | 'not_found' | 'error';
  profileUrl?: string;
  accountId?: string;
  note?: string;
};

export type LookupResult = {
  input: string;
  phone: {
    e164: string;
    countryCallingCode: string;
    nationalNumber: string;
    country?: string;
    isPossible: boolean;
    isValid: boolean;
    type?: string;
  };
  social: SocialMatch[];
  privacy: {
    message: string;
    searchedPublicly: boolean;
  };
};

const allowedCountries = new Set<CountryCode>(
  (process.env.ALLOWED_COUNTRIES ?? '').split(',').map((value) => value.trim().toUpperCase()).filter(Boolean) as CountryCode[],
);

export function normalizePhone(input: string, defaultCountry?: CountryCode) {
  const value = input.trim();
  if (!value || value.length > 64) throw new Error('A phone number is required and must be at most 64 characters.');
  const phone = parsePhoneNumberWithError(value, defaultCountry);
  if (!phone.isPossible()) throw new Error('The phone number is not possible for its region.');
  if (allowedCountries.size && phone.country && !allowedCountries.has(phone.country)) {
    throw new Error('Phone numbers from this region are not enabled.');
  }
  return phone;
}

function providerStatus(): SocialMatch[] {
  return [
    {
      provider: 'social-adapters',
      status: 'not_configured',
      note: 'No official social-platform adapter is configured. Phone-number metadata was processed locally.',
    },
  ];
}

export function lookupPhone(input: string, defaultCountry?: CountryCode): LookupResult {
  const phone = normalizePhone(input, defaultCountry);
  return {
    input,
    phone: {
      e164: phone.number,
      countryCallingCode: `+${phone.countryCallingCode}`,
      nationalNumber: phone.nationalNumber,
      country: phone.country,
      isPossible: phone.isPossible(),
      isValid: phone.isValid(),
      type: phone.getType(),
    },
    social: providerStatus(),
    privacy: {
      searchedPublicly: false,
      message: 'This endpoint does not reverse-search private accounts or scrape social platforms. Social matches require a configured, authorized provider integration.',
    },
  };
}

export function supportedRegions() {
  return {
    configured: [...allowedCountries],
    exampleCallingCode: getCountryCallingCode('US'),
  };
}
