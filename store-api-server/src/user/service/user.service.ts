import { Logger, Injectable, Inject } from '@nestjs/common';
import {
  UserEntity,
  ProfileEntity,
  UserCart,
  UserTotalPaid,
  NftOwnershipStatus,
} from '../entity/user.entity';
import { NftService } from '../../nft/service/nft.service';
import { MintService } from '../../nft/service/mint.service';
import {
  PG_CONNECTION,
  CART_EXPIRATION_MILLI_SECS,
  PG_UNIQUE_VIOLATION_ERRCODE,
  NUM_TOP_BUYERS,
} from '../../constants';
import { Result, Err, Ok } from 'ts-results';
import { S3Service } from '../../s3.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import { assertEnv } from 'src/utils';
const generate = require('meaningful-string');

interface CartMeta {
  id: number;
  expiresAt: number;
  orderId?: number;
}

@Injectable()
export class UserService {
  RANDOM_NAME_OPTIONS = {
    numberUpto: 20,
    joinBy: '_',
  };
  RANDOM_NAME_MAX_RETRIES = 5;

  constructor(
    @Inject(PG_CONNECTION) private conn: any,
    private readonly s3Service: S3Service,
    private readonly mintService: MintService,
    public readonly nftService: NftService,
  ) {}

  async create(user: UserEntity): Promise<UserEntity> {
    const generateRandomName = typeof user.userName === 'undefined';
    let lastErr = null;

    for (let i = 0; i < this.RANDOM_NAME_MAX_RETRIES; i++) {
      if (generateRandomName) {
        user.userName = generate.meaningful(this.RANDOM_NAME_OPTIONS);
      }

      // note: this implementation ignores user.roles here.
      try {
        const qryRes = await this.conn.query(
          `
INSERT INTO kanvas_user(
  user_name, address, signed_payload
)
VALUES ($1, $2, $3)
RETURNING id`,
          [user.userName, user.userAddress, user.signedPayload],
        );

        return { ...user, id: qryRes.rows[0]['id'] };
      } catch (err: any) {
        if (!generateRandomName || err?.code !== PG_UNIQUE_VIOLATION_ERRCODE) {
          throw err;
        }
        lastErr = err;
      }
    }
    throw lastErr;
  }

  async isNameAvailable(name: string): Promise<boolean> {
    const qryRes = await this.conn.query(
      `
SELECT 1
FROM kanvas_user
WHERE user_name = $1
    `,
      [name],
    );
    return qryRes.rowCount === 0;
  }

  async edit(
    userId: number,
    name: string | undefined,
    picture: string | undefined,
  ) {
    let profilePicture: string | undefined;
    if (typeof picture !== 'undefined') {
      const fileName = `profilePicture_${userId}`;
      const s3PathRes = await this.s3Service.uploadFile(picture, fileName);
      if (!s3PathRes.ok) {
        throw s3PathRes.val;
      }
      profilePicture = s3PathRes.val;
    }
    await this.conn.query(
      `
UPDATE kanvas_user
SET
  user_name = coalesce($2, user_name),
  picture_url = coalesce($3, picture_url)
WHERE id = $1
`,
      [userId, name, profilePicture],
    );
  }

  async findByAddress(addr: string): Promise<Result<UserEntity, string>> {
    const qryRes = await this.conn.query(
      `
SELECT
  usr.id,
  usr.user_name,
  usr.address,
  usr.picture_url,
  usr.signed_payload,
  created_at,
  role.role_label
FROM kanvas_user usr
LEFT JOIN mtm_kanvas_user_user_role mtm
  ON mtm.kanvas_user_id = usr.id
LEFT JOIN user_role role
  ON mtm.user_role_id = role.id
WHERE address = $1
`,
      [addr],
    );
    if (qryRes.rows.length === 0) {
      return new Err(`no user found with address=${addr}`);
    }
    const res = {
      id: qryRes.rows[0]['id'],
      userName: qryRes.rows[0]['user_name'],
      userAddress: qryRes.rows[0]['address'],
      createdAt: Math.floor(qryRes.rows[0]['created_at'].getTime() / 1000),
      profilePicture: qryRes.rows[0]['picture_url'],
      signedPayload: qryRes.rows[0]['signed_payload'],
      roles: qryRes.rows
        .map((row: any) => row['role_label'])
        .filter((roleLabels: any[]) => typeof roleLabels === 'string'),
    };

    return Ok(res);
  }

  async getProfile(address: string): Promise<Result<ProfileEntity, string>> {
    const userRes = await this.findByAddress(address);
    if (!userRes.ok) {
      return userRes;
    }
    const user = userRes.val;
    delete user.signedPayload;

    const userNfts = await this.nftService.findNftsWithFilter({
      page: 1,
      pageSize: 1,
      orderBy: 'id',
      orderDirection: 'asc',
      firstRequestAt: undefined,
      categories: undefined,
      userAddress: address,
      availability: undefined,
    });

    return new Ok({
      user: user,
      nftCount: userNfts.numberOfPages,
    });
  }

  async getNftOwnershipStatuses(
    user: UserEntity,
    nftIds: number[],
  ): Promise<NftOwnershipStatus[]> {
    const statuses = await this.nftService.getNftOwnerStatus(
      user.userAddress,
      nftIds,
    );
    return Object.keys(statuses).map((nftId: any) => {
      return {
        nftId: nftId,
        ownerStatuses: statuses[nftId],
      };
    });
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
    );
    if (qryRes.rowCount === 0) {
      return Err(
        `getUserCartSession err: user with id ${userId} does not exist`,
      );
    }
    return Ok(qryRes.rows[0]['cart_session']);
  }

  async getTopBuyers(): Promise<UserTotalPaid[]> {
    const qryRes = await this.conn.query(
      `
SELECT
  usr.id AS user_id,
  usr.user_name,
  usr.picture_url AS profile_pic_url,
  SUM(nft.price) AS total_paid
FROM mtm_kanvas_user_nft AS mtm
JOIN nft
  ON nft.id = mtm.nft_id
join kanvas_user AS usr
  ON usr.id = mtm.kanvas_user_id
GROUP BY 1, 2, 3
ORDER BY 4 DESC
LIMIT $1
      `,
      [NUM_TOP_BUYERS],
    );

    return qryRes.rows.map(
      (row: any) =>
        <UserTotalPaid>{
          userId: row['user_id'],
          userName: row['user_name'],
          userPicture: row['profile_pic_url'],
          totalPaid: row['total_paid'],
        },
    );
  }

  async ensureUserCartSession(
    userId: number,
    session: string,
  ): Promise<string> {
    await this.touchCart(session);

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
    );
    const oldSession = qryRes.rows[0]['old_session'];
    const newSession = qryRes.rows[0]['new_session'];
    if (oldSession !== newSession) {
      this.conn.query(
        `
DELETE FROM cart_session
WHERE session_id = $1
`,
        [oldSession],
      );
    }
    return newSession;
  }

  async cartList(session: string): Promise<UserCart> {
    const cartMeta = await this.getCartMeta(session);
    if (typeof cartMeta === 'undefined') {
      return {
        nfts: [],
        expiresAt: undefined,
      };
    }

    const nftIds = await this.getCartNftIds(cartMeta.id);
    if (nftIds.length === 0) {
      return {
        nfts: [],
        expiresAt: undefined,
      };
    }
    return {
      nfts: await this.nftService.findByIds(nftIds, 'nft_id', 'asc'),
      expiresAt: cartMeta.expiresAt,
    };
  }

  async getCartNftIds(cartId: number): Promise<number[]> {
    const qryRes = await this.conn.query(
      `
SELECT nft_id
FROM mtm_cart_session_nft
WHERE cart_session_id = $1`,
      [cartId],
    );
    return qryRes.rows.map((row: any) => row['nft_id']);
  }

  async cartAdd(session: string, nftId: number): Promise<Result<null, string>> {
    const cartMeta = await this.touchCart(session);

    const dbTx = await this.conn.connect();
    try {
      await dbTx.query('BEGIN');
      await dbTx.query(
        `
INSERT INTO mtm_cart_session_nft(
  cart_session_id, nft_id
)
VALUES ($1, $2)`,
        [cartMeta.id, nftId],
      );

      const qryRes = await dbTx.query(
        `
SELECT
  (SELECT reserved + owned FROM nft_editions_locked($1)) AS editions_locked,
  nft.editions_size,
  nft.launch_at
FROM nft
WHERE nft.id = $1`,
        [nftId],
      );
      if (qryRes.rows[0]['editions_locked'] > qryRes.rows[0]['editions_size']) {
        dbTx.query('ROLLBACK');
        return Err('All editions of this nft have been reserved/bought');
      }
      if (qryRes.rows[0]['launch_at'] > new Date()) {
        return Err('This nft is not yet for sale');
      }

      await dbTx.query('COMMIT');
    } catch (err) {
      await dbTx.query('ROLLBACK');
      throw err;
    } finally {
      dbTx.release();
    }

    await this.resetCartExpiration(cartMeta.id);
    return Ok(null);
  }

  async cartRemove(session: string, nftId: number): Promise<boolean> {
    const cartMeta = await this.touchCart(session);

    const qryRes = await this.conn.query(
      `
DELETE FROM mtm_cart_session_nft
WHERE cart_session_id = $1
  AND nft_id = $2`,
      [cartMeta.id, nftId],
    );
    if (qryRes.rowCount === 0) {
      return false;
    }

    await this.resetCartExpiration(cartMeta.id);
    return true;
  }

  async resetCartExpiration(cartId: number) {
    const expiresAt = this.newCartExpiration();
    await this.conn.query(
      `
UPDATE cart_session
SET expires_at = $2
WHERE id = $1
  `,
      [cartId, expiresAt.toUTCString()],
    );
  }

  async touchCart(session: string): Promise<CartMeta> {
    const cartMeta = await this.getCartMeta(session);
    if (typeof cartMeta !== 'undefined') {
      return cartMeta;
    }

    const expiresAt = this.newCartExpiration();
    const qryRes = await this.conn.query(
      `
INSERT INTO cart_session (
  session_id, expires_at
)
VALUES ($1, $2)
RETURNING id, expires_at`,
      [session, expiresAt.toUTCString()],
    );
    return {
      id: qryRes.rows[0]['id'],
      expiresAt: qryRes.rows[0]['expires_at'],
    };
  }

  async deleteCartSession(orderId: number) {
    await this.conn.query(
      `
      DELETE FROM
      cart_session
      WHERE order_id = $1
    `,
      [orderId],
    );
  }

  async getCartMeta(session: string): Promise<CartMeta | undefined> {
    const qryRes = await this.conn.query(
      `
SELECT id, expires_at, order_id
FROM cart_session
WHERE session_id = $1
ORDER BY expires_at DESC
      `,
      [session],
    );
    if (qryRes.rows.length === 0) {
      return undefined;
    }
    return <CartMeta>{
      id: qryRes.rows[0]['id'],
      expiresAt: qryRes.rows[0]['expires_at'],
      orderId: qryRes.rows[0]['order_id'],
    };
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async deleteExpiredCarts() {
    const deletedSessions = await this.conn.query(
      `
DELETE FROM cart_session AS sess
WHERE expires_at < now() AT TIME ZONE 'UTC'
  AND (
    sess.order_id IS NULL OR (SELECT status FROM payment where payment.nft_order_id = sess.order_id) NOT IN ('processing')
  )
RETURNING session_id`,
    );
    if (deletedSessions.rows.length === 0) {
      return;
    }

    Logger.warn(
      `deleted following expired cart sessions: ${deletedSessions.rows.map(
        (row: any) => row.session_id,
      )}`,
    );
  }

  newCartExpiration(): Date {
    const expiresAt = new Date();

    expiresAt.setTime(
      expiresAt.getTime() + Number(assertEnv('CART_EXPIRATION_MILLI_SECS')),
    );
    return expiresAt;
  }

  async getCartSession(
    cookieSession: any,
    user: UserEntity | undefined,
  ): Promise<string> {
    if (typeof user === 'undefined') {
      return cookieSession.uuid;
    }
    return await this.ensureUserCartSession(user.id, cookieSession.uuid);
  }
}
