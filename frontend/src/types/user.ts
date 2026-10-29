export interface User {
  id: number;
  name: string;
  email: string;
  created_at?: string;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}

export interface UpdateProfilePayload {
  name: string;
  email: string;
  password?: string;
}
