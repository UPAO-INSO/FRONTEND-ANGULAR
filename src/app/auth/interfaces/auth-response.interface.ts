import { User } from './user.interfaces';

export interface AuthResponse {
  user: User;
  tokens: Tokens;
}

export interface Tokens {
  accessToken: string;
  refreshToken: string;
}
