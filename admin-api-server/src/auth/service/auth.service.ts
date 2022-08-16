import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UserEntity } from '../../user/entities/user.entity.js';
import { UserService } from '../../user/service/user.service.js';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UserService,
    private jwtService: JwtService,
  ) {}

  async validatePassword(
    receivedPassword: string,
    storedPasswordHash: string,
  ): Promise<boolean> {
    return bcrypt.compare(receivedPassword, storedPasswordHash);
  }

  async validateUser(email: string, pass: string): Promise<UserEntity | null> {
    const user = await this.usersService.findOneByEmail(email);
    if (typeof user !== 'undefined') {
      const hasValidPassword = await this.validatePassword(
        pass,
        user.password!,
      );
      if (hasValidPassword) {
        return user;
      }
    }
    return null;
  }

  async login(user: UserEntity) {
    const payload = {
      userName: user.userName,
      email: user.email,
      sub: user.id,
      scope: user.roles,
    };
    return {
      accessToken: this.jwtService.sign(payload),
    };
  }
}
