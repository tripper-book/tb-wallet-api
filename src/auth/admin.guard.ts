import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard, USER_REQUEST_KEY } from './auth.guard';

@Injectable()
export class AdminGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request[USER_REQUEST_KEY];
    if (!user) {
      throw new UnauthorizedException('Authentication required');
    }
    if (user.role !== 'admin') {
      throw new UnauthorizedException('Admin access required');
    }
    return true;
  }
}
