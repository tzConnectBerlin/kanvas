import { JwtService } from '@nestjs/jwt'
import { UserEntity } from 'src/user/entity/user.entity'
import { UserService } from 'src/user/service/user.service'
import { ITokenPayload } from 'src/interfaces/token.interface'
import { HttpException, HttpStatus, Injectable } from '@nestjs/common'

const bcrypt = require('bcrypt')

interface IAuthentication {
  id: number
  name: string
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

  private async validate(userData: UserEntity): Promise<UserEntity> {
    return await this.userService.findByAddress(userData.address)
  }

  public async login(userData: UserEntity): Promise<any | { status: number }> {
    const user = await this.validate(userData)

    if (
      user.signedPayload !== undefined &&
      userData.signedPayload !== undefined
    ) {
      await this.verifyPassword(userData.signedPayload, user.signedPayload)

      return this.getCookieWithJwtToken(
        {
          id: user.id,
          name: user.name,
          address: user.address,
          roles: user.roles,
        },
        user,
      )
    }
  }

  public async getLoggedUser(address: string): Promise<UserEntity> {
    const user: UserEntity = await this.userService.findByAddress(address)
    user.signedPayload = undefined

    return user
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
        name: user.name,
        maxAge: process.env.JWT_EXPIRATION_TIME,
        address: data.address,
      }
    } else {
      throw new Error('process.env.JWT_EXPIRATION_TIME not set')
    }
  }
}
