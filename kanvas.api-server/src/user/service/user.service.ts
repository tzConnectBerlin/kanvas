import { HttpException, HttpStatus, Injectable, Inject } from '@nestjs/common'
import { UserEntity, UserCart } from '../entity/user.entity'
import { NftService } from 'src/nft/service/nft.service'
import { PG_CONNECTION } from '../../constants'

interface CartMeta {
  id: number
  expires_at: number
}

@Injectable()
export class UserService {
  constructor(
    @Inject(PG_CONNECTION) private conn: any,
    private readonly nftService: NftService,
  ) {}

  async create(user: UserEntity): Promise<UserEntity> {
    // note: this implementation ignores user.roles here.
    const qryRes = await this.conn.query(
      `
INSERT INTO kanvas_user(
  user_name, address, signed_payload
)
VALUES ($1, $2, $3)
RETURNING id`,
      [user.name, user.address, user.signedPayload],
    )

    const res = Object.assign({}, user)
    res.id = qryRes.rows[0]['id']
    res.roles = []
    return res
  }

  async findByAddress(addr: string): Promise<UserEntity> {
    const qryRes = await this.conn.query(
      `
SELECT
  usr.id, usr.user_name, usr.address, usr.signed_payload, role.role_label
FROM kanvas_user usr
LEFT JOIN mtm_kanvas_user_user_role mtm
  ON mtm.kanvas_user_id = usr.id
LEFT JOIN user_role role
  ON mtm.user_role_id = role.id
WHERE address = $1
`,
      [addr],
    )
    if (qryRes.rows.length === 0) {
      throw new HttpException('User not registered', HttpStatus.BAD_REQUEST)
    }
    const res = {
      id: qryRes.rows[0]['id'],
      name: qryRes.rows[0]['user_name'],
      address: qryRes.rows[0]['address'],
      signedPayload: qryRes.rows[0]['signed_payload'],
      roles: qryRes.rows
        .map((row: any) => row['role_label'])
        .filter((roleLabels: any[]) => typeof roleLabels === 'string'),
    }

    return res
  }

  async getCart(user: UserEntity): Promise<UserCart> {
    const cartMeta = await this.getCartMeta(user)
    if (typeof cartMeta === 'undefined') {
      return {
        nfts: [],
        expires_at: undefined,
      }
    }

    const nftIds = await this.getCartNftIds(cartMeta.id)
    return {
      nfts: await this.nftService.findByIds(nftIds, 'nft_id', 'asc'),
      expires_at: cartMeta.expires_at,
    }
  }

  async checkoutCart(user: UserEntity) {
    const cartMeta = await this.getCartMeta(user)
    if (typeof cartMeta === 'undefined') {
      return {
        nfts: [],
        expires_at: undefined,
      }
    }

    const nftIds = await this.getCartNftIds(cartMeta.id)
    const tx = await this.conn.connect()
    tx.query(`BEGIN`)
    await tx.query(
      `
INSERT INTO mtm_kanvas_user_nft (
  kanvas_user_id, nft_id
)
SELECT $1, nft.id
FROM nft
WHERE nft.id = ANY($2)`,
      [user.id, nftIds],
    )
    await tx.query(
      `
DELETE FROM user_cart
WHERE user_id = $1`,
      [user.id],
    )
    tx.query(`COMMIT`)
  }

  async getCartNftIds(cartId: number): Promise<number[]> {
    const qryRes = await this.conn.query(
      `
SELECT nft_id
FROM mtm_user_cart_nft
WHERE user_cart_id = $1`,
      [cartId],
    )
    return qryRes.rows.map((row: any) => row['nft_id'])
  }

  async cartAdd(user: UserEntity, nftId: number): Promise<boolean> {
    const cartMeta = await this.touchCart(user)
    const tx = await this.conn.connect()
    tx.query('BEGIN')
    await tx.query(
      `
INSERT INTO mtm_user_cart_nft(
  user_cart_id, nft_id
)
VALUES ($1, $2)`,
      [cartMeta.id, nftId],
    )

    const qryRes = await tx.query(
      `
SELECT
  (SELECT count(1) FROM mtm_user_cart_nft WHERE nft_id = $1)
    + (SELECT count(1) FROM mtm_kanvas_user_nft WHERE nft_id = $1)
    AS editions_reserved,
  (SELECT nft.editions_size FROM nft WHERE id = $1) AS editions_total
      `,
      [nftId],
    )
    if (
      qryRes.rows[0]['editions_reserved'] > qryRes.rows[0]['editions_total']
    ) {
      tx.query('ROLLBACK')
      return false
    }
    tx.query('COMMIT')

    await this.resetCartExpiration(cartMeta.id)
    return true
  }

  async cartRemove(user: UserEntity, nftId: number): Promise<boolean> {
    const cartMeta = await this.touchCart(user)
    const qryRes = await this.conn.query(
      `
DELETE FROM mtm_user_cart_nft
WHERE user_cart_id = $1
  AND nft_id = $2`,
      [cartMeta.id, nftId],
    )
    if (qryRes.rowCount === 0) {
      return false
    }

    await this.resetCartExpiration(cartMeta.id)
    return true
  }

  async resetCartExpiration(cartId: number) {
    await this.conn.query(
      `
UPDATE user_cart
SET expires_at = now() + interval '1 hour'
WHERE id = $1
  `,
      [cartId],
    )
  }

  async touchCart(user: UserEntity): Promise<CartMeta> {
    const cartMeta = await this.getCartMeta(user)
    if (typeof cartMeta !== 'undefined') {
      return cartMeta
    }

    await this.conn.query(
      `
DELETE FROM user_cart
WHERE user_id = $1`,
      [user.id],
    )

    const qryRes = await this.conn.query(
      `
INSERT INTO user_cart (
  user_id
)
VALUES ($1)
RETURNING id, expires_at`,
      [user.id],
    )
    return {
      id: qryRes.rows[0]['id'],
      expires_at: qryRes.rows[0]['expires_at'],
    }
  }

  async getCartMeta(user: UserEntity): Promise<CartMeta | undefined> {
    const qryRes = await this.conn.query(
      `
SELECT id, expires_at
FROM user_cart
WHERE user_id = $1
  AND expires_at > now()
      `,
      [user.id],
    )
    if (qryRes.rows.length === 0) {
      return undefined
    }
    return <CartMeta>{
      id: qryRes.rows[0]['id'],
      expires_at: qryRes.rows[0]['expires_at'],
    }
  }
}
