import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthGuard, USER_REQUEST_KEY } from './auth.guard';

export interface RequestUser {
  id: string;
  email?: string | null;
  name?: string | null;
  role?: string;
}

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): RequestUser => {
    const request = ctx.switchToHttp().getRequest();
    const user = request[USER_REQUEST_KEY];
    if (!user) {
      throw new Error('AuthGuard must be used to have CurrentUser');
    }
    return user;
  },
);
