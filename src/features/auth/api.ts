import type { LoginRequest, RegisterRequest, AuthResponse, User } from '@/types';

const mockUser: User = {
  id: '1',
  name: 'علی محمدی',
  email: 'ali@example.com',
  avatar_url: undefined,
  preferred_language: 'fa',
  created_at: '2024-01-15T10:30:00Z',
};

const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mock-token';

function delay(ms: number = 800): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function loginApi(data: LoginRequest): Promise<AuthResponse> {
  await delay();
  if (data.email && data.password.length >= 6) {
    return {
      access_token: mockToken,
      token_type: 'bearer',
      user: { ...mockUser, email: data.email, name: mockUser.name },
    };
  }
  throw new Error('Invalid credentials');
}

export async function registerApi(data: RegisterRequest): Promise<AuthResponse> {
  await delay(1000);
  if (data.email && data.name && data.password.length >= 6) {
    return {
      access_token: mockToken,
      token_type: 'bearer',
      user: { ...mockUser, name: data.name, email: data.email },
    };
  }
  throw new Error('Registration failed');
}

export async function getMeApi(token: string): Promise<User> {
  await delay(300);
  if (token) {
    return mockUser;
  }
  throw new Error('Unauthorized');
}