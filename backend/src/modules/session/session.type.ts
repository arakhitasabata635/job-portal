export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
}

/* ================================
   session entity
================================ */
export interface SessionEntity {
  session_id: string;
  user_id: string;
  token_hash: string;
  device_info: string;
  ip_address: string | null;
  created_at: Date;
  expires_at: Date;
}
