import {
  Logger,
  HttpException,
  HttpStatus,
  Injectable,
  Inject,
} from '@nestjs/common'
import { UserEntity } from '../entity/user.entity'
import { PG_CONNECTION, PG_UNIQUE_VIOLATION_ERRCODE } from 'src/db.module'

@Injectable()
export class UserService {
  constructor(@Inject(PG_CONNECTION) private conn: any) {}

  async create(user: UserEntity): Promise<UserEntity> {
    // note: this implementation ignores user.roles here.
    try {
      const [qryRes] = await this.conn`
INSERT INTO kanvas_user(
  user_name, address, signed_payload
)
VALUES (${user.name}, ${user.address}, ${user.signedPayload})
RETURNING id
`

      const res = Object.assign({}, user)
      res.id = qryRes['id']
      res.roles = []
      return res
    } catch (err: any) {
      if (err?.code === PG_UNIQUE_VIOLATION_ERRCODE) {
        throw new HttpException(
          'User with these credentials already exists',
          HttpStatus.BAD_REQUEST,
        )
      }

      Logger.error(
        'Error on creating user=' + JSON.stringify(user) + ', err: ' + err,
      )
      throw new HttpException(
        'Something went wrong',
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }
  }

  async findByAddress(addr: string): Promise<UserEntity> {
    const qryRes = await this.conn`
SELECT
  usr.id, usr.user_name, usr.address, usr.signed_payload, role.role_label
FROM kanvas_user usr
LEFT JOIN mtm_kanvas_user_user_role mtm
  ON mtm.kanvas_user_id = usr.id
LEFT JOIN user_role role
  ON mtm.user_role_id = role.id
WHERE address = ${addr}
`
    if (!qryRes.length) {
      throw new HttpException('User not registered', HttpStatus.BAD_REQUEST)
    }
    const res = {
      id: qryRes[0]['id'],
      name: qryRes[0]['user_name'],
      address: qryRes[0]['address'],
      signedPayload: qryRes[0]['signed_payload'],
      roles: qryRes
        .map((row: any) => row['role_label'])
        .filter((roleLabels: any[]) => typeof roleLabels === 'string'),
    }

    console.log('res => ' + JSON.stringify(res))

    return res
  }
}
