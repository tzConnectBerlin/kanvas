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

  async getUserCartSession(user_id: number): Promise<string | undefined> {
    const qryRes = await this.conn.query(
      `
SELECT cart_session
FROM kanvas_user
WHERE id = $1`,
      [user_id],
    )
    return qryRes.rows[0]['cart_session']
  }

  async ensureUserCartSession(
    user_id: number,
    session: string,
  ): Promise<string> {
    await this.touchCart(session)

    const qryRes = await this.conn.query(
      `
UPDATE kanvas_user
SET cart_session = coalesce(cart_session, $2)
WHERE id = $1
RETURNING cart_session`,
      [user_id, session],
    )
    return qryRes.rows[0]['cart_session']
  }

  async cartList(session: string): Promise<UserCart> {
    const cartMeta = await this.getCartMeta(session)
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

  async cartCheckout(user_id: number, session: string): Promise<boolean> {
    const cartMeta = await this.getCartMeta(session)
    if (typeof cartMeta === 'undefined') {
      return false
    }
    const nftIds = await this.getCartNftIds(cartMeta.id)
    if (nftIds.length === 0) {
      return false
    }
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
      [user_id, nftIds],
    )
    await tx.query(
      `
DELETE FROM cart_session
WHERE session_id = $1`,
      [session],
    )
    tx.query(`COMMIT`)
    return true
  }

  async getCartNftIds(cartId: number): Promise<number[]> {
    const qryRes = await this.conn.query(
      `
SELECT nft_id
FROM mtm_cart_session_nft
WHERE cart_session_id = $1`,
      [cartId],
    )
    return qryRes.rows.map((row: any) => row['nft_id'])
  }

  async cartAdd(session: string, nftId: number): Promise<boolean> {
    const cartMeta = await this.touchCart(session)
    const tx = await this.conn.connect()
    tx.query('BEGIN')
    await tx.query(
      `
INSERT INTO mtm_cart_session_nft(
  cart_session_id, nft_id
)
VALUES ($1, $2)`,
      [cartMeta.id, nftId],
    )

    const qryRes = await tx.query(
      `
SELECT
  (SELECT count(1) FROM mtm_cart_session_nft WHERE nft_id = $1)
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

  async cartRemove(session: string, nftId: number): Promise<boolean> {
    const cartMeta = await this.touchCart(session)
    const qryRes = await this.conn.query(
      `
DELETE FROM mtm_cart_session_nft
WHERE cart_session_id = $1
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
UPDATE cart_session
SET expires_at = now() + interval '1 hour'
WHERE id = $1
  `,
      [cartId],
    )
  }

  async touchCart(session: string): Promise<CartMeta> {
    const cartMeta = await this.getCartMeta(session)
    if (typeof cartMeta !== 'undefined') {
      return cartMeta
    }

    const qryRes = await this.conn.query(
      `
INSERT INTO cart_session (
  session_id
)
VALUES ($1)
RETURNING id, expires_at`,
      [session],
    )
    return {
      id: qryRes.rows[0]['id'],
      expires_at: qryRes.rows[0]['expires_at'],
    }
  }

  async getCartMeta(session: string): Promise<CartMeta | undefined> {
    // TODO: might want to do this deleteExpiredCarts() in a garbage collector
    // (at eg an interval of 30 seconds), instead of at every cart access
    // because it might result in excessive database load
    this.deleteExpiredCarts()

    const qryRes = await this.conn.query(
      `
SELECT id, expires_at
FROM cart_session
WHERE session_id = $1
      `,
      [session],
    )
    if (qryRes.rows.length === 0) {
      return undefined
    }
    return <CartMeta>{
      id: qryRes.rows[0]['id'],
      expires_at: qryRes.rows[0]['expires_at'],
    }
  }

  async deleteExpiredCarts() {
    await this.conn.query(
      `
DELETE FROM cart_session
WHERE expires_at < now()`,
    )
  }
}
