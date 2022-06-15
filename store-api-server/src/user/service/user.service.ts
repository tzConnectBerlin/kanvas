import {
  HttpStatus,
  HttpException,
  Logger,
  Injectable,
  Inject,
} from '@nestjs/common';
import {
  UserEntity,
  ProfileEntity,
  UserCart,
  UserTotalPaid,
  NftOwnershipStatus,
} from '../entity/user.entity.js';
import { NftEntity } from '../../nft/entity/nft.entity.js';
import { NftService } from '../../nft/service/nft.service.js';
import { PaginationParams } from '../../nft/params.js';
import {
  PG_CONNECTION,
  PG_UNIQUE_VIOLATION_ERRCODE,
  MINTER_ADDRESS,
  NUM_TOP_BUYERS,
  CART_EXPIRATION_MILLI_SECS,
  CART_MAX_ITEMS,
} from '../../constants.js';
import { CurrencyService } from 'kanvas-api-lib';
import { Result } from 'ts-results';
import ts_results from 'ts-results';
const { Ok, Err } = ts_results;
import { S3Service } from '../../s3.service.js';
import { Cron, CronExpression } from '@nestjs/schedule';
import { assertEnv } from '../../utils.js';
import { DbPool, DbTransaction, withTransaction } from '../../db.module.js';

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const generate = require('meaningful-string');

const STATUS_PAYMENT_PROCESSING = 'payment processing';

interface CartMeta {
  id: number;
  expiresAt: number;
  orderId?: number;
}

@Injectable()
export class UserService {
  CART_EXPIRATION_MILLI_SECS = CART_EXPIRATION_MILLI_SECS;
  CART_EXPIRATION_AT_MINUTE_END = true;

  constructor(
    @Inject(PG_CONNECTION) private conn: DbPool,
    private readonly s3Service: S3Service,
    private readonly currencyService: CurrencyService,
    public readonly nftService: NftService,
  ) {}

  async create(user: UserEntity): Promise<UserEntity> {
    const qryRes = await this.conn.query(
      `
INSERT INTO kanvas_user(
  address, signed_payload
)
VALUES ($1, $2)
RETURNING id`,
      [user.userAddress, user.signedPayload],
    );

    return { ...user, id: qryRes.rows[0]['id'] };
  }

  async edit(userId: number, picture: string) {
    let profilePicture: string | undefined;
    const fileName = `profilePicture_${userId}`;
    const s3PathRes = await this.s3Service.uploadFile(picture, fileName);
    if (!s3PathRes.ok) {
      throw s3PathRes.val;
    }
    profilePicture = s3PathRes.val;
    await this.conn.query(
      `
UPDATE kanvas_user
SET
  picture_url = $2
WHERE id = $1
`,
      [userId, profilePicture],
    );
  }

  async findByAddress(addr: string): Promise<Result<UserEntity, string>> {
    const qryRes = await this.conn.query(
      `
SELECT
  usr.id,
  usr.address,
  usr.picture_url,
  usr.signed_payload,
  usr.created_at
FROM kanvas_user usr
WHERE address = $1
`,
      [addr],
    );
    if (qryRes.rows.length === 0) {
      return new Err(`no user found with address=${addr}`);
    }
    const res = {
      id: qryRes.rows[0]['id'],
      userAddress: qryRes.rows[0]['address'],
      createdAt: Math.floor(qryRes.rows[0]['created_at'].getTime() / 1000),
      profilePicture: qryRes.rows[0]['picture_url'],
      signedPayload: qryRes.rows[0]['signed_payload'],
    };

    return Ok(res);
  }

  async getProfile(
    address: string,
    pagination: PaginationParams,
    currency: string,
    loggedInUserId?: number,
  ): Promise<Result<ProfileEntity, string>> {
    const userRes = await this.findByAddress(address);
    if (!userRes.ok) {
      return userRes;
    }
    const user = userRes.val;
    delete user.signedPayload;

    let [owned, statuses] = await Promise.all([
      this.nftService.findNftsWithFilter(
        {
          firstRequestAt: undefined,
          categories: undefined,
          userAddress: address,
          availability: undefined,
          ...pagination,
        },
        currency,
      ),
      this.getNftOwnershipStatuses(address, loggedInUserId),
    ]);
    for (const nft of owned.nfts) {
      nft.ownerStatuses = statuses[nft.id].filter(
        (status: string) => status !== STATUS_PAYMENT_PROCESSING,
      );
    }

    const paymentPromisedNftIds = Object.keys(statuses)
      .filter((nftId: any) => {
        return statuses[nftId].includes(STATUS_PAYMENT_PROCESSING);
      })
      .map((nftId: string) => Number(nftId));
    let paymentPromisedNfts = await this.nftService.findByIds(
      paymentPromisedNftIds,
      'nft_id',
      'asc',
      currency,
    );
    for (const nft of paymentPromisedNfts) {
      nft.ownerStatuses = statuses[nft.id].filter(
        (status: string) => status === STATUS_PAYMENT_PROCESSING,
      );
    }

    return new Ok({
      user: user,
      collection: owned,
      pendingOwnership: paymentPromisedNfts,
    });
  }

  async getNftOwnershipStatuses(
    address: string,
    loggedInUserId?: number,
  ): Promise<{ [key: number]: string[] }> {
    const qryRes = await this.conn.query(
      `
SELECT
  idx_assets_nat AS nft_id,
  'owned' AS owner_status,
  assets_nat AS num_editions
FROM onchain_kanvas."storage.ledger_live" AS ledger_now
WHERE ledger_now.idx_assets_address = $2

UNION ALL

SELECT
  nft_id,
  'pending' AS owner_status,
  purchased_editions_pending_transfer(nft_id, $2, $1) as num_editions
FROM (
  SELECT DISTINCT
    nfts_purchased.nft_id
  FROM kanvas_user
  JOIN mtm_kanvas_user_nft AS nfts_purchased
    ON nfts_purchased.kanvas_user_id = kanvas_user.id
  WHERE kanvas_user.address = $2
) q

UNION ALL

SELECT
  mtm.nft_id,
  $4 AS owner_status,
  count(1) AS num_editions
FROM nft_order
JOIN kanvas_user AS usr
  ON usr.id = nft_order.user_id
JOIN payment
  ON payment.nft_order_id = nft_order.id
JOIN mtm_nft_order_nft AS mtm
  ON mtm.nft_order_id = nft_order.id
WHERE usr.id = $3
  AND usr.address = $2
  AND payment.status IN ('promised', 'processing')
GROUP BY 1, 2

ORDER BY 1
`,
      [MINTER_ADDRESS, address, loggedInUserId, STATUS_PAYMENT_PROCESSING],
    );

    const ownerStatuses: any = {};
    for (const row of qryRes.rows) {
      ownerStatuses[row.nft_id] = [
        ...(ownerStatuses[row.nft_id] || []),
        ...Array(Number(row.num_editions)).fill(row.owner_status),
      ];
    }
    return ownerStatuses;
  }

  async getUserCartSession(
    userId: number,
    dbTx: DbTransaction | DbPool = this.conn,
  ): Promise<Result<string | undefined, string>> {
    const qryRes = await dbTx.query(
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

  async getTopBuyers(currency: string): Promise<UserTotalPaid[]> {
    const qryRes = await this.conn.query(
      `
SELECT
  usr.id AS user_id,
  usr.address AS user_address,
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
          userAddress: row['user_address'],
          userPicture: row['profile_pic_url'],
          totalPaid: this.currencyService.convertToCurrency(
            row['total_paid'],
            currency,
          ),
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

  async cartList(
    session: string,
    currency: string,
    inBaseUnit: boolean = false,
    dbTx: DbTransaction | DbPool = this.conn,
  ): Promise<UserCart> {
    const cartMeta = await this.getCartMeta(session, dbTx);
    if (typeof cartMeta === 'undefined') {
      return {
        nfts: [],
        expiresAt: undefined,
      };
    }

    const nftIds = await this.getCartNftIds(cartMeta.id, dbTx);
    if (nftIds.length === 0) {
      return {
        nfts: [],
        expiresAt: undefined,
      };
    }
    return {
      nfts: await this.nftService.findByIds(
        nftIds,
        'nft_id',
        'asc',
        currency,
        inBaseUnit,
      ),
      expiresAt: cartMeta.expiresAt,
    };
  }

  async getCartNftIds(
    cartId: number,
    dbTx: DbTransaction | DbPool = this.conn,
  ): Promise<number[]> {
    const qryRes = await dbTx.query(
      `
SELECT nft_id
FROM mtm_cart_session_nft
WHERE cart_session_id = $1`,
      [cartId],
    );
    return qryRes.rows.map((row: any) => row['nft_id']);
  }

  async cartAdd(session: string, nftId: number) {
    const cartMeta = await this.touchCart(session);

    return await withTransaction(this.conn, async (dbTx: DbTransaction) => {
      const cartSizeQryResp = await dbTx.query(
        `
SELECT
  count(1) AS cart_size
FROM mtm_cart_session_nft
WHERE cart_session_id = $1
        `,
        [cartMeta.id],
      );

      if (cartSizeQryResp.rows[0]['cart_size'] >= CART_MAX_ITEMS) {
        throw new HttpException('cart is full', HttpStatus.BAD_REQUEST);
      }

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
  nft.onsale_from
FROM nft
WHERE nft.id = $1`,
        [nftId],
      );
      if (qryRes.rows[0]['editions_locked'] > qryRes.rows[0]['editions_size']) {
        throw new HttpException(
          'All editions of this nft have been reserved/bought',
          HttpStatus.BAD_REQUEST,
        );
      }
      if (qryRes.rows[0]['onsale_from'] > new Date()) {
        throw new HttpException(
          'This nft is not yet for sale',
          HttpStatus.BAD_REQUEST,
        );
      }

      await this.resetCartExpiration(cartMeta.id, dbTx);
    });
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

  async resetCartExpiration(
    cartId: number,
    dbTx: DbTransaction | DbPool = this.conn,
  ) {
    await dbTx.query(
      `
UPDATE cart_session
SET expires_at = $2
WHERE id = $1
  `,
      [cartId, this.newCartExpiration()],
    );
  }

  async touchCart(session: string): Promise<CartMeta> {
    const cartMeta = await this.getCartMeta(session);
    if (typeof cartMeta !== 'undefined') {
      return cartMeta;
    }

    const expiresAt = this.newCartExpiration();

    try {
      const qryRes = await this.conn.query(
        `
INSERT INTO cart_session (
  session_id, expires_at
)
VALUES ($1, $2)
RETURNING id, expires_at`,
        [session, expiresAt],
      );
      return {
        id: qryRes.rows[0]['id'],
        expiresAt: qryRes.rows[0]['expires_at'],
      };
    } catch (err: any) {
      if (err?.code === PG_UNIQUE_VIOLATION_ERRCODE) {
        const cartMeta = await this.getCartMeta(session);
        if (typeof cartMeta !== 'undefined') {
          return cartMeta;
        }
      }
      throw err;
    }
  }

  async dropCartByOrderId(
    orderId: number,
    dbTx: DbTransaction | DbPool = this.conn,
  ) {
    await dbTx.query(
      `
      DELETE FROM
      cart_session
      WHERE order_id = $1
    `,
      [orderId],
    );
  }

  async getCartMeta(
    session: string,
    dbTx: DbTransaction | DbPool = this.conn,
  ): Promise<CartMeta | undefined> {
    const qryRes = await dbTx.query(
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
WHERE expires_at <= now() AT TIME ZONE 'UTC'
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

  newCartExpiration(): string {
    const d = new Date();

    d.setTime(d.getTime() + this.CART_EXPIRATION_MILLI_SECS);
    if (this.CART_EXPIRATION_AT_MINUTE_END) {
      d.setTime(d.setSeconds(0, 0));
    }
    return d.toISOString();
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
