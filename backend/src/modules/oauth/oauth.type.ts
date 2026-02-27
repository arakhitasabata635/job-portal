export interface OauthEntity {
  id: string;
  user_id: string;
  provider: 'google';
  provider_user_id: string;
  created_at: Date;
}

export interface GooglePayload {
  sub: string;
  email: string;
  email_verified: boolean;
  name: string | null;
}
