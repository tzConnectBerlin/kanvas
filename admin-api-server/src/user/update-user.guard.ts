import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Role } from 'src/role/role';

@Injectable()
export class UpdateUserGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const isAdmin = request.user.roles?.includes(Role.Admin);
    const isSelf = request.params.id === request.user.id;
    return isAdmin || isSelf;
  }
}
