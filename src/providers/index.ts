export type SocialProfile = {
  platform: string;
  status: 'not_configured' | 'not_checked' | 'found' | 'not_found' | 'error';
  found: boolean;
  profileUrl?: string;
  accountId?: string;
  note?: string;
};

/**
 * Provider adapters intentionally remain disabled by default.
 * Enable an adapter only when it uses an official API, explicit user consent,
 * and provider-approved account-linking or OAuth semantics.
 */
export const providers: SocialProfile[] = [
  { platform: 'facebook', status: 'not_configured', found: false, note: 'Requires an official consent-based integration.' },
  { platform: 'instagram', status: 'not_configured', found: false, note: 'Requires an official consent-based integration.' },
  { platform: 'telegram', status: 'not_configured', found: false, note: 'Requires an official consent-based integration.' },
  { platform: 'whatsapp', status: 'not_configured', found: false, note: 'Requires an official consent-based integration.' },
];
