import { Injectable } from '@nestjs/common';

/**
 * Mock implementation of tb-backend-service. Replace with HTTP client when real service is available.
 * Verifies token and returns user details so wallet service can trust the caller.
 */
@Injectable()
export class TbBackendService {
  private readonly MOCK_USERS: Map<
    string,
    { id: string; email: string; name: string; role?: string }
  > = new Map([
    ['mock-token-1', { id: 'user-ext-1', email: 'user1@example.com', name: 'User One' }],
    ['mock-token-2', { id: 'user-ext-2', email: 'user2@example.com', name: 'User Two' }],
    ['mock-admin-token', { id: 'admin-ext-1', email: 'admin@example.com', name: 'Admin', role: 'admin' }],
  ]);

  /**
   * Verify token and return user. In production: GET ${TB_BACKEND_URL}/auth/verify with Authorization: Bearer <token>.
   */
  async verifyToken(
    token: string,
  ): Promise<{ id: string; email?: string | null; name?: string | null; role?: string } | null> {
    if (!token) return null;
    const t = token.replace(/^Bearer\s+/i, '').trim();
    const user = this.MOCK_USERS.get(token) ?? this.MOCK_USERS.get(t);
    return user ?? null;
  }
}
