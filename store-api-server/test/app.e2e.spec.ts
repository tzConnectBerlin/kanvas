import { Test, TestingModule } from '@nestjs/testing';
import { Logger, INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from 'src/app.module';
import { PaymentService, PaymentStatus } from 'src/payment/service/payment.service';
import { UserService } from 'src/user/service/user.service';

let anyTestFailed = false;
const skipOnPriorFail = (name: string, action: any) => {
  // Note: this will mark any test after a failed test as
  // succesful, not great, but it's the best that seems possible
  // with jest right now
  test(name, async () => {
    if (!anyTestFailed) {
      try {
        await action();
      } catch (error) {
        anyTestFailed = true;
        throw error;
      }
    }
  });
};

describe('AppController (e2e)', () => {
  let app: INestApplication;
  let paymentService: PaymentService;
  let userService: UserService;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    paymentService = await moduleFixture.get(PaymentService)
    userService = await moduleFixture.get(UserService)

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  skipOnPriorFail('should be defined', () => expect(app).toBeDefined());

  skipOnPriorFail('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });

  // Note:
  // - these tests expect responses related to a database that has been filled
  //   with data in store-api-server/script/populate-testdb.sql

  skipOnPriorFail(
    '/users/profile: not logged in and no userAddress provided => BAD REQUEST',
    async () => {
      const res = await request(app.getHttpServer()).get('/users/profile');
      expect(res.statusCode).toEqual(400);
    },
  );

  skipOnPriorFail(
    '/users/profile: non existing userAddress provided => BAD REQUEST',
    async () => {
      const res = await request(app.getHttpServer())
        .get('/users/profile')
        .query({ userAddress: 'nonsense address' });
      expect(res.statusCode).toEqual(400);
    },
  );

  skipOnPriorFail(
    '/users/profile: existing userAddress provided => OK',
    async () => {
      const res = await request(app.getHttpServer())
        .get('/users/profile')
        .query({ userAddress: 'addr' });
      expect(res.statusCode).toEqual(200);

      // cannot test this accurately because currently the testdb is populated
      // with now() timestamps
      expect(res.body.user?.createdAt).toBeGreaterThan(0);
      delete res.body.user?.createdAt;

      expect(res.body).toStrictEqual({
        nftCount: 0,
        user: {
          id: 1,
          userName: 'admin',
          userAddress: 'addr',
          profilePicture: null,
          roles: [],
        },
      });
    },
  );

  skipOnPriorFail(
    '/users/profile: no userAddress provided and logged in => OK, return profile of logged in user',
    async () => {
      const { bearer } = await loginUser(app, 'addr', 'admin');

      const res = await request(app.getHttpServer())
        .get('/users/profile')
        .set('authorization', bearer);
      expect(res.statusCode).toEqual(200);

      // cannot test this accurately because currently the testdb is populated
      // with now() timestamps
      expect(res.body.user?.createdAt).toBeGreaterThan(0);
      delete res.body.user?.createdAt;

      expect(res.body).toStrictEqual({
        nftCount: 0,
        user: {
          id: 1,
          userName: 'admin',
          userAddress: 'addr',
          profilePicture: null,
          roles: [],
        },
      });
    },
  );

  skipOnPriorFail(
    '/users/profile: userAddress provided and logged in => OK, return profile of provided userAddress',
    async () => {
      const { bearer } = await loginUser(app, 'addr', 'admin');

      const res = await request(app.getHttpServer())
        .get('/users/profile')
        .set('authorization', bearer)
        .query({ userAddress: 'tz1' });
      expect(res.statusCode).toEqual(200);

      // cannot test this accurately because currently the testdb is populated
      // with now() timestamps
      expect(res.body.user?.createdAt).toBeGreaterThan(0);
      delete res.body.user?.createdAt;

      expect(res.body).toStrictEqual({
        nftCount: 0,
        user: {
          id: 2,
          userName: 'test user',
          userAddress: 'tz1',
          profilePicture: null,
          roles: [],
        },
      });
    },
  );

  skipOnPriorFail(
    '/users/cart (cookie based), list lists in order of add (part 1)',
    async () => {
      const add1 = await request(app.getHttpServer()).post('/users/cart/add/4');
      expect(add1.statusCode).toEqual(201);

      const cookie = add1.headers['set-cookie'];

      const add2 = await request(app.getHttpServer())
        .post('/users/cart/add/12')
        .set('cookie', cookie);
      expect(add2.statusCode).toEqual(201);

      const list = await request(app.getHttpServer())
        .post('/users/cart/list')
        .set('cookie', cookie);
      expect(list.statusCode).toEqual(201);

      const idList = list.body.nfts.map((nft: any) => nft.id);
      expect(idList).toEqual([4, 12]);
    },
  );

  skipOnPriorFail(
    '/users/cart (cookie based), list lists in order of id (part 2)',
    async () => {
      const add1 = await request(app.getHttpServer()).post(
        '/users/cart/add/12',
      );
      expect(add1.statusCode).toEqual(201);

      const cookie = add1.headers['set-cookie'];

      const add2 = await request(app.getHttpServer())
        .post('/users/cart/add/4')
        .set('cookie', cookie);
      expect(add2.statusCode).toEqual(201);

      const list = await request(app.getHttpServer())
        .post('/users/cart/list')
        .set('cookie', cookie);
      expect(list.statusCode).toEqual(201);

      const idList = list.body.nfts.map((nft: any) => nft.id);
      expect(idList).toEqual([4, 12]);
    },
  );

  skipOnPriorFail(
    '/users/cart (cookie based to login and logout interactions)',
    async () => {
      const add1 = await request(app.getHttpServer()).post('/users/cart/add/4');
      expect(add1.statusCode).toEqual(201);

      const cookie = add1.headers['set-cookie'];

      const add2 = await request(app.getHttpServer())
        .post('/users/cart/add/12')
        .set('cookie', cookie);
      expect(add2.statusCode).toEqual(201);

      let list = await request(app.getHttpServer())
        .post('/users/cart/list')
        .set('cookie', cookie);
      expect(list.statusCode).toEqual(201);

      let idList = list.body.nfts.map((nft: any) => nft.id);
      expect(idList).toEqual([4, 12]);

      // now login. this should takeover the cart session of the cookie
      const { bearer } = await loginUser(app, 'addr', 'admin');
      const listLoggedIn = await request(app.getHttpServer())
        .post('/users/cart/list')
        .set('cookie', cookie)
        .set('authorization', bearer);
      expect(listLoggedIn.statusCode).toEqual(201);

      const idListLoggedIn = list.body.nfts.map((nft: any) => nft.id);
      expect(idListLoggedIn).toEqual(idList);

      const remove = await request(app.getHttpServer())
        .post('/users/cart/remove/4')
        .set('cookie', cookie)
        .set('authorization', bearer);
      expect(remove.statusCode).toEqual(204);

      list = await request(app.getHttpServer())
        .post('/users/cart/list')
        .set('cookie', cookie)
        .set('authorization', bearer);
      expect(list.statusCode).toEqual(201);

      idList = list.body.nfts.map((nft: any) => nft.id);
      expect(idList).toEqual([12]);

      // now logout, this should generate a new cookie session, giving a new cart
      // that is not attached to the logged in session
      const logout = await request(app.getHttpServer())
        .post('/auth/logout')
        .set('cookie', cookie)
        .set('authorization', bearer);

      expect(logout.statusCode).toEqual(201);

      const newCookie = logout.headers['set-cookie'];
      expect(newCookie).not.toEqual(cookie);

      list = await request(app.getHttpServer())
        .post('/users/cart/list')
        .set('cookie', newCookie);
      expect(list.statusCode).toEqual(201);

      idList = list.body.nfts.map((nft: any) => nft.id);
      expect(idList).toEqual([]);

      // now logging back in, gives back the session we had
      const newBearer = await loginUser(app, 'addr', 'admin');
      list = await request(app.getHttpServer())
        .post('/users/cart/list')
        .set('cookie', newCookie)
        .set('authorization', newBearer.bearer);
      expect(list.statusCode).toEqual(201);

      idList = list.body.nfts.map((nft: any) => nft.id);
      expect(idList).toEqual([12]);

      // test cleanup
      await request(app.getHttpServer())
        .post('/users/cart/remove/12')
        .set('cookie', cookie)
        .set('authorization', newBearer.bearer);
    },
  );

  skipOnPriorFail(
    '/users/cart (empty cookie based into login does *not* take over user session)',
    async () => {
      const { bearer } = await loginUser(app, 'addr', 'admin');

      const add1 = await request(app.getHttpServer())
        .post('/users/cart/add/4')
        .set('authorization', bearer);
      expect(add1.statusCode).toEqual(201);
      const cookie = add1.headers['set-cookie'];

      const logout = await request(app.getHttpServer())
        .post('/auth/logout')
        .set('cookie', cookie)
        .set('authorization', bearer);
      expect(logout.statusCode).toEqual(201);

      // Should not receive a new cookie, previous cookie is not
      // used and can be reused
      expect(logout.headers['set-cookie']).toBe(undefined);

      const add2 = await request(app.getHttpServer())
        .post('/users/cart/add/10')
        .set('cookie', cookie);
      expect(add2.statusCode).toEqual(201);

      await request(app.getHttpServer())
        .post('/users/cart/remove/10')
        .set('cookie', cookie);

      // now logging back in, gives back the session we had,
      // because the newCookie cart is empty
      const newBearer = await loginUser(app, 'addr', 'admin');
      const list = await request(app.getHttpServer())
        .post('/users/cart/list')
        .set('cookie', cookie)
        .set('authorization', newBearer.bearer);
      expect(list.statusCode).toEqual(201);

      const idList = list.body.nfts.map((nft: any) => nft.id);
      expect(idList).toEqual([4]);

      // test cleanup
      await request(app.getHttpServer())
        .post('/users/cart/remove/4')
        .set('cookie', cookie)
        .set('authorization', newBearer.bearer);
    },
  );

  skipOnPriorFail(
    '/users/cart (non-empty cookie based into login does take over user session)',
    async () => {
      const { bearer } = await loginUser(app, 'addr', 'admin');

      const add1 = await request(app.getHttpServer())
        .post('/users/cart/add/4')
        .set('authorization', bearer);
      expect(add1.statusCode).toEqual(201);
      const cookie = add1.headers['set-cookie'];

      const logout = await request(app.getHttpServer())
        .post('/auth/logout')
        .set('cookie', cookie)
        .set('authorization', bearer);
      expect(logout.statusCode).toEqual(201);

      // Should not receive a new cookie, previous cookie is not used and can
      // be reused
      expect(logout.headers['set-cookie']).toBe(undefined);

      const add2 = await request(app.getHttpServer())
        .post('/users/cart/add/10')
        .set('cookie', cookie);
      expect(add2.statusCode).toEqual(201);

      // now logging back in, user session is replaced with newCookie session
      const newBearer = await loginUser(app, 'addr', 'admin');
      const list = await request(app.getHttpServer())
        .post('/users/cart/list')
        .set('cookie', cookie)
        .set('authorization', newBearer.bearer);
      expect(list.statusCode).toEqual(201);

      const idList = list.body.nfts.map((nft: any) => nft.id);
      expect(idList).toEqual([10]);

      // test cleanup
      await request(app.getHttpServer())
        .post('/users/cart/remove/10')
        .set('cookie', cookie)
        .set('authorization', newBearer.bearer);
    },
  );

  skipOnPriorFail('/users/cart (BAD REQUEST on duplicate add)', async () => {
    const add1 = await request(app.getHttpServer()).post('/users/cart/add/4');
    expect(add1.statusCode).toEqual(201);
    const cookie = add1.headers['set-cookie'];

    const add2 = await request(app.getHttpServer())
      .post('/users/cart/add/4')
      .set('cookie', cookie);
    expect(add2.statusCode).toEqual(400);
  });

  skipOnPriorFail(
    '/users/cart (BAD REQUEST on remove of item not in cart)',
    async () => {
      const add1 = await request(app.getHttpServer()).post('/users/cart/add/4');
      expect(add1.statusCode).toEqual(201);
      const cookie = add1.headers['set-cookie'];

      const remove = await request(app.getHttpServer())
        .post('/users/cart/remove/5')
        .set('cookie', cookie);
      expect(remove.statusCode).toEqual(400);
    },
  );

  skipOnPriorFail('stripe payment: create a correct intent payment method', async () => {
    const { bearer } = await loginUser(app, 'addr', 'admin');

    // nft price: 43
    const add1 = await request(app.getHttpServer())
      .post('/users/cart/add/4')
      .set('authorization', bearer);
    expect(add1.statusCode).toEqual(201);

    // nft price: 104
    const add2 = await request(app.getHttpServer())
      .post('/users/cart/add/1')
      .set('authorization', bearer);
    expect(add2.statusCode).toEqual(201);

    const payment = await request(app.getHttpServer())
      .post('/payment/create-payment-intent')
      .set('authorization', bearer);

    expect(payment.statusCode).toEqual(201);
    expect(payment.body['amount']).toEqual(4400);

    const remove1 = await request(app.getHttpServer())
      .post('/users/cart/remove/4')
      .set('authorization', bearer);
    expect(remove1.statusCode).toEqual(204);

    // nft price: 104
    const remove2 = await request(app.getHttpServer())
      .post('/users/cart/remove/1')
      .set('authorization', bearer);
    expect(remove2 .statusCode).toEqual(204);
  });


  skipOnPriorFail('stripe payment: Payment status should change to succeeded if payment is successfull', async () => {
    const { bearer, id, address } = await loginUser(app, 'addr', 'admin');

    // nft price: 43 id: 4
    const add1 = await request(app.getHttpServer())
      .post('/users/cart/add/4')
      .set('authorization', bearer);
    expect(add1.statusCode).toEqual(201);

    // nft price: 43 id: 1
    const add2 = await request(app.getHttpServer())
      .post('/users/cart/add/1')
      .set('authorization', bearer);
    expect(add2.statusCode).toEqual(201);


    // Create one payment intent
    const payment = await request(app.getHttpServer())
      .post('/payment/create-payment-intent')
      .set('authorization', bearer);

    expect(payment.statusCode).toEqual(201);

    // Give webhook handler function success event
    const { payment_id } = await paymentService.getPaymentIdForLatestUserOrder(id)

    // reconstruct success event from stripe
    const constructedEvent = {
      type: 'payment_intent.succeeded',
      data: {
        object: {
          id: payment_id
        }
      }
    };

    // Calling success status
    await paymentService.webhookHandler(constructedEvent)

    // Check cart_session deleted
    const old_cart_session = await userService.getUserCartSession(id)
    expect(old_cart_session.val).toBeNull()

    // Check payment status changed to succeeded
    const { status } = await paymentService.getPaymentIdForLatestUserOrder(id)
    expect(status).toEqual(PaymentStatus.SUCCEEDED)

    // Check NFT ownership transfer
    const userNfts = await request(app.getHttpServer())
      .get(`/nfts?userAddress=addr&pageSize=12`)
    expect(userNfts.statusCode).toEqual(200)

    const nftList = userNfts.body.nfts.map((nft: any) => nft.id);
    expect(nftList).toContain(4)
    expect(nftList).toContain(1)


    const remove1 = await request(app.getHttpServer())
      .post('/users/cart/remove/4')
      .set('authorization', bearer);
    expect(remove1.statusCode).toEqual(204);

    // nft price: 104
    const remove2 = await request(app.getHttpServer())
      .post('/users/cart/remove/1')
      .set('authorization', bearer);
    expect(remove2 .statusCode).toEqual(204);
  });

  skipOnPriorFail('stripe payment: Payment status should change to cancel if payment is cancelled, nft should not be transferred', async () => {
    const { bearer, id, address } = await loginUser(app, 'addr', 'admin');

    // nft price: 43 id: 4
    const add1 = await request(app.getHttpServer())
      .post('/users/cart/add/4')
      .set('authorization', bearer);
    expect(add1.statusCode).toEqual(201);

    // nft price: 43 id: 4
    const add2 = await request(app.getHttpServer())
      .post('/users/cart/add/1')
      .set('authorization', bearer);
    expect(add1.statusCode).toEqual(201);


    // Create one payment intent
    const payment = await request(app.getHttpServer())
      .post('/payment/create-payment-intent')
      .set('authorization', bearer);

    expect(payment.statusCode).toEqual(201);

    // Give webhook handler function success event
    const { payment_id, order_id } = await paymentService.getPaymentIdForLatestUserOrder(id)

    // reconstruct success event from stripe
    const constructedEvent = {
      type: 'payment_intent.canceled',
      data: {
        object: {
          id: payment_id
        }
      }
    };

    // Calling success status
    await paymentService.webhookHandler(constructedEvent)

    // Check cart_session deleted
    const old_cart_session = await userService.getUserCartSession(id)
    expect(old_cart_session.val).toBeUndefined()
    expect(old_cart_session.ok).toEqual(false)

    // Check payment status changed to cancelled
    const { status } = await paymentService.getPaymentIdForLatestUserOrder(id)
    expect(status).toEqual(PaymentStatus.CANCELED)

    const userNfts = await request(app.getHttpServer())
      // Check that NFT has not been transfered
      .get(`/nfts?userAddress=addr&pageSize=12`)
    expect(userNfts.statusCode).toEqual(200)

    const nftList = userNfts.body.nfts.map((nft: any) => nft.id);
    expect(nftList.indexOf(4)).toEqual(-1)
    expect(nftList.indexOf(1)).toEqual(-1)


    const remove1 = await request(app.getHttpServer())
      .post('/users/cart/remove/4')
      .set('authorization', bearer);
    expect(remove1.statusCode).toEqual(204);

    // nft price: 104
    const remove2 = await request(app.getHttpServer())
      .post('/users/cart/remove/1')
      .set('authorization', bearer);
    expect(remove2 .statusCode).toEqual(204);
  });

  skipOnPriorFail('stripe payment: Payment status should change to failed if payment has failed, nft should not be transferred', async () => {
    const { bearer, id } = await loginUser(app, 'addr', 'admin');

    // nft price: 43 id: 4
    const add1 = await request(app.getHttpServer())
      .post('/users/cart/add/4')
      .set('authorization', bearer);
    expect(add1.statusCode).toEqual(201);

    // nft price: 43 id: 4
    const add2 = await request(app.getHttpServer())
      .post('/users/cart/add/1')
      .set('authorization', bearer);
    expect(add2.statusCode).toEqual(201);


    // Create one payment intent
    const payment = await request(app.getHttpServer())
      .post('/payment/create-payment-intent')
      .set('authorization', bearer);

    expect(payment.statusCode).toEqual(201);

    // Give webhook handler function success event
    const { payment_id, order_id } = await paymentService.getPaymentIdForLatestUserOrder(id)

    // reconstruct success event from stripe
    const constructedEvent = {
      type: 'payment_intent.failed',
      data: {
        object: {
          id: payment_id
        }
      }
    };

    // Calling success status
    await paymentService.webhookHandler(constructedEvent)

    // Check cart_session deleted
    const old_cart_session = await userService.getUserCartSession(id)
    expect(old_cart_session.val).toBeUndefined()
    expect(old_cart_session.ok).toEqual(false)

    // Check payment status changed to cancelled
    const { status } = await paymentService.getPaymentIdForLatestUserOrder(id)
    expect(status).toEqual(PaymentStatus.FAILED)

    const userNfts = await request(app.getHttpServer())
      // Check that NFT has not been transfered
      .get(`/nfts?userAddress=addr&pageSize=12`)
    expect(userNfts.statusCode).toEqual(200)

    const nftList = userNfts.body.nfts.map((nft: any) => nft.id);
    expect(nftList.indexOf(4)).toEqual(-1)
    expect(nftList.indexOf(1)).toEqual(-1)

    const remove1 = await request(app.getHttpServer())
      .post('/users/cart/remove/4')
      .set('authorization', bearer);
    expect(remove1.statusCode).toEqual(204);

    // nft price: 104
    const remove2 = await request(app.getHttpServer())
      .post('/users/cart/remove/1')
      .set('authorization', bearer);
    expect(remove2 .statusCode).toEqual(204);
  });

  skipOnPriorFail('stripe payment: Payment status should change to timeout if payment has expired, and in CREATED OR PROCESSING state', async () => {
    const { bearer, id, address } = await loginUser(app, 'addr', 'admin');

    // nft price: 43 id: 4
    const add1 = await request(app.getHttpServer())
      .post('/users/cart/add/4')
      .set('authorization', bearer);
    expect(add1.statusCode).toEqual(201);

    // Create one payment intent
    const payment = await request(app.getHttpServer())
      .post('/payment/create-payment-intent')
      .set('authorization', bearer);

    expect(payment.statusCode).toEqual(201);

    const { payment_id, order_id } = await paymentService.getPaymentIdForLatestUserOrder(id)

    // reconstruct success event from stripe
    const constructedEvent = {
      type: 'payment_intent.failed',
      data: {
        object: {
          id: payment_id
        }
      }
    };

    await paymentService.webhookHandler(constructedEvent)

    // Check failed payment don't get to timeout
    const failedStatus = await paymentService.getPaymentIdForLatestUserOrder(id)
    expect(failedStatus).toEqual(PaymentStatus.FAILED)

    await paymentService.deleteExpiredPayments()

    const stillFailedStatus = await paymentService.getPaymentIdForLatestUserOrder(id)
    expect(stillFailedStatus).toEqual(PaymentStatus.FAILED)

    // Check succeeded payment don't get to timeout

    const payment2 = await request(app.getHttpServer())
      .post('/payment/create-payment-intent')
      .set('authorization', bearer);

    expect(payment2.statusCode).toEqual(201);

    const payment2Data = await paymentService.getPaymentIdForLatestUserOrder(id)

    // reconstruct success event from stripe
    const constructedEvent2 = {
      type: 'payment_intent.succeeded',
      data: {
        object: {
          id: payment2Data.payment_id
        }
      }
    };

    await paymentService.webhookHandler(constructedEvent2)

    const successStatus = await paymentService.getPaymentIdForLatestUserOrder(id)
    expect(successStatus).toEqual(PaymentStatus.SUCCEEDED)

    await paymentService.deleteExpiredPayments()

    const stillSuccessStatus = await paymentService.getPaymentIdForLatestUserOrder(id)
    expect(stillSuccessStatus).toEqual(PaymentStatus.SUCCEEDED)


    // Check canceled payment don't get to timeout

    const payment3 = await request(app.getHttpServer())
      .post('/payment/create-payment-intent')
      .set('authorization', bearer);

    expect(payment3.statusCode).toEqual(201);

    const payment3Data = await paymentService.getPaymentIdForLatestUserOrder(id)

    // reconstruct success event from stripe
    const constructedEvent3 = {
      type: 'payment_intent.canceled',
      data: {
        object: {
          id: payment3Data.payment_id
        }
      }
    };

    await paymentService.webhookHandler(constructedEvent3)

    const canceledStatus = await paymentService.getPaymentIdForLatestUserOrder(id)
    expect(canceledStatus).toEqual(PaymentStatus.CANCELED)

    await paymentService.deleteExpiredPayments()

    const stillCanceledStatus = await paymentService.getPaymentIdForLatestUserOrder(id)
    expect(stillCanceledStatus).toEqual(PaymentStatus.CANCELED)

    // Check created payment get to timeout

    const payment4 = await request(app.getHttpServer())
      .post('/payment/create-payment-intent')
      .set('authorization', bearer);

    expect(payment4.statusCode).toEqual(201);

    const createdStatus = await paymentService.getPaymentIdForLatestUserOrder(id)
    expect(createdStatus).toEqual(PaymentStatus.CREATED)

    await paymentService.deleteExpiredPayments()

    const timedOutStatus = await paymentService.getPaymentIdForLatestUserOrder(id)
    expect(timedOutStatus).toEqual(PaymentStatus.TIMED_OUT)

    // Check processing payment get to timeout

    const payment5 = await request(app.getHttpServer())
      .post('/payment/create-payment-intent')
      .set('authorization', bearer);

    expect(payment5.statusCode).toEqual(201);

    const payment5Data = await paymentService.getPaymentIdForLatestUserOrder(id)

    // reconstruct success event from stripe
    const constructedEvent5 = {
      type: 'payment_intent.processing',
      data: {
        object: {
          id: payment5Data.payment_id
        }
      }
    };

    await paymentService.webhookHandler(constructedEvent5)

    const processingStatus = await paymentService.getPaymentIdForLatestUserOrder(id)
    expect(processingStatus).toEqual(PaymentStatus.PROCESSING)

    await paymentService.deleteExpiredPayments()

    const timedOutStatus2 = await paymentService.getPaymentIdForLatestUserOrder(id)
    expect(timedOutStatus2).toEqual(PaymentStatus.TIMED_OUT)


    const remove1 = await request(app.getHttpServer())
      .post('/users/cart/remove/4')
      .set('authorization', bearer);
    expect(remove1.statusCode).toEqual(204);
  });

  skipOnPriorFail('stripe payment: Payment status should not change from FAILED', async () => {
    const { bearer, id } = await loginUser(app, 'addr', 'admin');

    // nft price: 43 id: 4
    const add1 = await request(app.getHttpServer())
      .post('/users/cart/add/4')
      .set('authorization', bearer);
    expect(add1.statusCode).toEqual(201);

    // Create one payment intent
    const payment = await request(app.getHttpServer())
      .post('/payment/create-payment-intent')
      .set('authorization', bearer);

    expect(payment.statusCode).toEqual(201);

    // Give webhook handler function success event
    const { payment_id } = await paymentService.getPaymentIdForLatestUserOrder(id)

    // reconstruct success event from stripe
    const constructedEvent = {
      type: 'payment_intent.failed',
      data: {
        object: {
          id: payment_id
        }
      }
    };

    // Calling success status
    await paymentService.webhookHandler(constructedEvent)

    const failedStatus = await paymentService.getPaymentIdForLatestUserOrder(id)
    expect(failedStatus).toEqual(PaymentStatus.FAILED)

    // reconstruct success event from stripe
    const constructedEvent2 = {
      type: 'payment_intent.succeeded',
      data: {
        object: {
          id: payment_id
        }
      }
    };

    // Calling success status
    await paymentService.webhookHandler(constructedEvent2)

    const stillFailedStatus = await paymentService.getPaymentIdForLatestUserOrder(id)
    expect(stillFailedStatus).toEqual(PaymentStatus.FAILED)


    const remove1 = await request(app.getHttpServer())
      .post('/users/cart/remove/4')
      .set('authorization', bearer);
    expect(remove1.statusCode).toEqual(204);
  });


  skipOnPriorFail('stripe payment: Payment status should not change from SUCCEEDED', async () => {
    const { bearer, id } = await loginUser(app, 'addr', 'admin');

    // nft price: 43 id: 4
    const add1 = await request(app.getHttpServer())
      .post('/users/cart/add/4')
      .set('authorization', bearer);
    expect(add1.statusCode).toEqual(201);

    // Create one payment intent
    const payment = await request(app.getHttpServer())
      .post('/payment/create-payment-intent')
      .set('authorization', bearer);

    expect(payment.statusCode).toEqual(201);

    // Give webhook handler function success event
    const { payment_id } = await paymentService.getPaymentIdForLatestUserOrder(id)

    // reconstruct success event from stripe
    const constructedEvent = {
      type: 'payment_intent.succeeded',
      data: {
        object: {
          id: payment_id
        }
      }
    };

    // Calling success status
    await paymentService.webhookHandler(constructedEvent)

    const failedStatus = await paymentService.getPaymentIdForLatestUserOrder(id)
    expect(failedStatus).toEqual(PaymentStatus.SUCCEEDED)

    // reconstruct success event from stripe
    const constructedEvent2 = {
      type: 'payment_intent.failed',
      data: {
        object: {
          id: payment_id
        }
      }
    };

    // Calling success status
    await paymentService.webhookHandler(constructedEvent2)

    const stillFailedStatus = await paymentService.getPaymentIdForLatestUserOrder(id)
    expect(stillFailedStatus).toEqual(PaymentStatus.SUCCEEDED)


    const remove1 = await request(app.getHttpServer())
      .post('/users/cart/remove/4')
      .set('authorization', bearer);
    expect(remove1.statusCode).toEqual(204);

  });
});

async function loginUser(
  app: INestApplication,
  address: string,
  password: string,
): Promise<{ bearer: string, id: number, address: string }> {
  const login = await request(app.getHttpServer())
    .post('/auth/login')
    .send({ userAddress: address, signedPayload: password });
  expect(login.statusCode).toEqual(201);

  return { bearer: `Bearer ${login.body.token}`, id: login.body.id, address: address };
}
