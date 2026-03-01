import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { RequestUser } from './current-user.decorator';
import { TbBackendService } from './tb-backend.service';

export const USER_REQUEST_KEY = 'user';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly tbBackend: TbBackendService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const auth = request.headers.authorization;
    const token = auth?.startsWith('Bearer ') ? auth.slice(7) : auth ?? '';

    const user = await this.tbBackend.verifyToken(token);
    if (!user) {
      throw new UnauthorizedException('Invalid or missing token');
    }
    (request as Request & { [USER_REQUEST_KEY]: RequestUser })[USER_REQUEST_KEY] = {
      id: user.id,
      email: user.email ?? null,
      name: user.name ?? null,
      role: user.role ?? undefined,
    };
    return true;
  }
}
