import { JwtService } from '@nestjs/jwt'
import { UserEntity } from 'src/user/entity/user.entity'
import { UserService } from 'src/user/service/user.service'
import { ITokenPayload } from 'src/interfaces/token.interface'
import { HttpException, HttpStatus, Injectable } from '@nestjs/common'
import { Result, Ok } from 'ts-results'

const bcrypt = require('bcrypt')

interface IAuthentication {
  id: number
  userName: string
  token: string
  maxAge: string
  address: string
}

@Injectable()
export class AuthenticationService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  private async validate(
    userData: UserEntity,
  ): Promise<Result<UserEntity, string>> {
    return await this.userService.findByAddress(userData.address)
  }

  public async login(userData: UserEntity): Promise<any | { status: number }> {
    const userRes = await this.validate(userData)
    if (!userRes.ok) {
      throw new HttpException('User not registered', HttpStatus.BAD_REQUEST)
    }
    const user = userRes.val

    if (
      user.signedPayload !== undefined &&
      userData.signedPayload !== undefined
    ) {
      await this.verifyPassword(userData.signedPayload, user.signedPayload)

      return this.getCookieWithJwtToken(
        {
          id: user.id,
          userName: user.userName,
          address: user.address,
          roles: user.roles,
        },
        user,
      )
    }
  }

  public async getLoggedUser(
    address: string,
  ): Promise<Result<UserEntity, string>> {
    const userRes = await this.userService.findByAddress(address)
    if (userRes.ok) {
      delete userRes.val.signedPayload
    }

    return userRes
  }

  public async isUserAttachedToCookieSession(
    userId: number,
    cookieSession: string,
  ): Promise<Result<boolean, string>> {
    let isAttached = false

    const cartSessionRes = await this.userService.getUserCartSession(userId)
    if (!cartSessionRes.ok) {
      return cartSessionRes
    }
    if (cartSessionRes.ok) {
      isAttached ||= cartSessionRes.val === cookieSession
    }

    return Ok(isAttached)
  }

  public async register(user: UserEntity): Promise<any> {
    const hashedSignedDartPayload: string = await bcrypt.hash(
      user.signedPayload,
      10,
    )
    const createdUser = await this.userService.create({
      ...user,
      signedPayload: hashedSignedDartPayload,
    })

    createdUser.signedPayload = undefined

    return createdUser
  }

  private async verifyPassword(
    signedDartPayload: string,
    hashedSignedDartPayload: string,
  ) {
    const isSignedDartPayloadMatching = await bcrypt.compare(
      signedDartPayload,
      hashedSignedDartPayload,
    )
    if (!isSignedDartPayloadMatching) {
      throw new HttpException(
        'Wrong credentials provided',
        HttpStatus.UNAUTHORIZED,
      )
    }
  }

  public getCookieWithJwtToken(
    data: ITokenPayload,
    user: UserEntity,
  ): IAuthentication {
    const payload: ITokenPayload = data
    const token = this.jwtService.sign(payload)

    if (typeof process.env.JWT_EXPIRATION_TIME == 'string') {
      return {
        token: token,
        id: user.id,
        userName: user.userName,
        maxAge: process.env.JWT_EXPIRATION_TIME,
        address: data.address,
      }
    } else {
      throw new Error('process.env.JWT_EXPIRATION_TIME not set')
    }
  }
}
