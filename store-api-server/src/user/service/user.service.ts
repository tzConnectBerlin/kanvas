import { HttpException, HttpStatus, Injectable, Inject } from '@nestjs/common'
import { UserEntity, ProfileEntity, UserCart } from '../entity/user.entity'
import { NftService } from '../../nft/service/nft.service'
import { PG_CONNECTION } from '../../constants'
import { Result, Err, Ok } from 'ts-results'

interface CartMeta {
  id: number
  expiresAt: number
}

@Injectable()
export class UserService {
  private cartExpirationMilliSecs: number = 30 * 60 * 1000 // 30 minutes

  constructor(
    @Inject(PG_CONNECTION) private conn: any,
    public readonly nftService: NftService,
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

    return { ...user, id: qryRes.rows[0]['id'] }
  }

  async findByAddress(addr: string): Promise<Result<UserEntity, string>> {
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
      return new Err(`no user found with address=${addr}`)
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

    return Ok(res)
  }

  async getProfile(address: string): Promise<Result<ProfileEntity, string>> {
    const userRes = await this.findByAddress(address)
    if (!userRes.ok) {
      return userRes
    }
    const user = userRes.val
    delete user.signedPayload

    const userNfts = await this.nftService.findNftsWithFilter({
      page: 1,
      pageSize: 1,
      orderBy: 'id',
      order: 'asc',
      firstRequestAt: undefined,
      categories: undefined,
      address: address,
    })

    return new Ok({
      user: user,
      nftCount: userNfts.numberOfPages,
    })
  }

  async getUserCartSession(
    userId: number,
  ): Promise<Result<string | undefined, string>> {
    const qryRes = await this.conn.query(
      `
SELECT cart_session
FROM kanvas_user
WHERE id = $1`,
      [userId],
    )
    if (qryRes.rowCount === 0) {
      return Err(
        `getUserCartSession err: user with id ${userId} does not exist`,
      )
    }
    return Ok(qryRes.rows[0]['cart_session'])
  }

  async ensureUserCartSession(
    userId: number,
    session: string,
  ): Promise<string> {
    await this.touchCart(session)

    // set user cart session to cookie session if:
    // - cookie session has a non-empty cart
    // - or, the user has no active cart session
    const qryRes = await this.conn.query(
      `
UPDATE kanvas_user AS update
SET cart_session = coalesce((
    SELECT session_id
    FROM cart_session AS cart
    JOIN mtm_cart_session_nft AS mtm
      on mtm.cart_session_id = cart.id
    WHERE session_id = $2
    LIMIT 1
  ), original.cart_session, $2)
FROM kanvas_user AS original
WHERE update.id = $1
  AND original.id = update.id
RETURNING 
  update.cart_session AS new_session,
  original.cart_session AS old_session`,
      [userId, session],
    )
    const oldSession = qryRes.rows[0]['old_session']
    const newSession = qryRes.rows[0]['new_session']
    if (oldSession !== newSession) {
      this.conn.query(
        `
DELETE FROM cart_session
WHERE session_id = $1
`,
        [oldSession],
      )
    }
    return newSession
  }

  async cartList(session: string): Promise<UserCart> {
    const cartMeta = await this.getCartMeta(session)
    if (typeof cartMeta === 'undefined') {
      return {
        nfts: [],
        expiresAt: undefined,
      }
    }

    const nftIds = await this.getCartNftIds(cartMeta.id)
    return {
      nfts: await this.nftService.findByIds(nftIds, 'nft_id', 'asc'),
      expiresAt: cartMeta.expiresAt,
    }
  }

  async cartCheckout(userId: number, session: string): Promise<boolean> {
    const cartMeta = await this.getCartMeta(session)
    if (typeof cartMeta === 'undefined') {
      return false
    }
    const nftIds = await this.getCartNftIds(cartMeta.id)
    if (nftIds.length === 0) {
      return false
    }
    const tx = await this.conn.connect()
    try {
      tx.query(`BEGIN`)
      await tx.query(
        `
INSERT INTO mtm_kanvas_user_nft (
  kanvas_user_id, nft_id
)
SELECT $1, nft.id
FROM nft
WHERE nft.id = ANY($2)`,
        [userId, nftIds],
      )
      await tx.query(
        `
DELETE FROM cart_session
WHERE session_id = $1`,
        [session],
      )
      tx.query(`COMMIT`)
    } catch (err: any) {
      tx.query(`ROLLBACK`)
      throw err
    } finally {
      tx.cleanup()
    }

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
    try {
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
  (SELECT reserved + owned FROM nft_editions_locked($1)) AS editions_locked,
  nft.editions_size
FROM nft
WHERE nft.id = $1`,
        [nftId],
      )
      if (qryRes.rows[0]['editions_locked'] > qryRes.rows[0]['editions_size']) {
        tx.query('ROLLBACK')
        return false
      }
      tx.query('COMMIT')
    } catch (err) {
      tx.query('ROLLBACK')
      throw err
    } finally {
      tx.release()
    }

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
    const expiresAt = this.newCartExpiration()
    await this.conn.query(
      `
UPDATE cart_session
SET expires_at = $2
WHERE id = $1
  `,
      [cartId, expiresAt.toUTCString()],
    )
  }

  async touchCart(session: string): Promise<CartMeta> {
    const cartMeta = await this.getCartMeta(session)
    if (typeof cartMeta !== 'undefined') {
      return cartMeta
    }

    const expiresAt = this.newCartExpiration()
    const qryRes = await this.conn.query(
      `
INSERT INTO cart_session (
  session_id, expires_at
)
VALUES ($1, $2)
RETURNING id, expires_at`,
      [session, expiresAt.toUTCString()],
    )
    return {
      id: qryRes.rows[0]['id'],
      expiresAt: qryRes.rows[0]['expires_at'],
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
      expiresAt: qryRes.rows[0]['expires_at'],
    }
  }

  async deleteExpiredCarts() {
    await this.conn.query(
      `
DELETE FROM cart_session
WHERE expires_at < now() AT TIME ZONE 'UTC'`,
    )
  }

  newCartExpiration(): Date {
    const expiresAt = new Date()
    expiresAt.setTime(expiresAt.getTime() + this.cartExpirationMilliSecs)
    return expiresAt
  }
}
