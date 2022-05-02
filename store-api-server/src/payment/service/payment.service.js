"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
exports.__esModule = true;
exports.PaymentService = exports.PaymentProvider = exports.PaymentStatus = void 0;
var common_1 = require("@nestjs/common");
var constants_1 = require("../../constants");
var ts_results_1 = require("ts-results");
var schedule_1 = require("@nestjs/schedule");
var utils_1 = require("../../utils");
var db_module_1 = require("../../db.module");
var uuid_1 = require("uuid");
var kanvas_api_lib_1 = require("kanvas-api-lib");
var PaymentStatus;
(function (PaymentStatus) {
    PaymentStatus["CREATED"] = "created";
    PaymentStatus["PROCESSING"] = "processing";
    PaymentStatus["CANCELED"] = "canceled";
    PaymentStatus["TIMED_OUT"] = "timedOut";
    PaymentStatus["SUCCEEDED"] = "succeeded";
    PaymentStatus["FAILED"] = "failed";
})(PaymentStatus = exports.PaymentStatus || (exports.PaymentStatus = {}));
var PaymentProvider;
(function (PaymentProvider) {
    PaymentProvider["TEZPAY"] = "tezpay";
    PaymentProvider["STRIPE"] = "stripe";
    PaymentProvider["TEST"] = "test_provider";
})(PaymentProvider = exports.PaymentProvider || (exports.PaymentProvider = {}));
var PaymentService = /** @class */ (function () {
    function PaymentService(conn, mintService, userService, nftService, currencyService) {
        this.conn = conn;
        this.mintService = mintService;
        this.userService = userService;
        this.nftService = nftService;
        this.currencyService = currencyService;
        _PaymentService_instances.add(this);
        this.stripe = process.env.STRIPE_SECRET
            ? require('stripe')(process.env.STRIPE_SECRET)
            : undefined;
        this.FINAL_STATES = [
            PaymentStatus.FAILED,
            PaymentStatus.SUCCEEDED,
            PaymentStatus.CANCELED,
            PaymentStatus.TIMED_OUT,
        ];
        this.tezpay = 0; // new Tezpay();
    }
    PaymentService.prototype.webhookHandler = function (constructedEvent) {
        return __awaiter(this, void 0, void 0, function () {
            var paymentStatus;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        switch (constructedEvent.type) {
                            case 'payment_intent.succeeded':
                                paymentStatus = PaymentStatus.SUCCEEDED;
                                break;
                            case 'payment_intent.processing':
                                paymentStatus = PaymentStatus.PROCESSING;
                                break;
                            case 'payment_intent.canceled':
                                paymentStatus = PaymentStatus.CANCELED;
                                break;
                            case 'payment_intent.payment_failed':
                                paymentStatus = PaymentStatus.FAILED;
                                break;
                            case 'payment_intent.created':
                                paymentStatus = PaymentStatus.CREATED;
                                break;
                            default:
                                common_1.Logger.error("Unhandled event type ".concat(constructedEvent.type));
                                throw (0, ts_results_1.Err)('Unknown stripe webhook event');
                        }
                        return [4 /*yield*/, __classPrivateFieldGet(this, _PaymentService_instances, "m", _PaymentService_updatePaymentStatus).call(this, constructedEvent.data.object.id, paymentStatus)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    PaymentService.prototype.createPayment = function (userId, paymentProvider, currency) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, db_module_1.withTransaction)(this.conn, function (dbTx) { return __awaiter(_this, void 0, void 0, function () {
                            var preparedOrder, paymentIntent;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, __classPrivateFieldGet(this, _PaymentService_instances, "m", _PaymentService_createOrder).call(this, dbTx, userId, paymentProvider)];
                                    case 1:
                                        preparedOrder = _a.sent();
                                        return [4 /*yield*/, __classPrivateFieldGet(this, _PaymentService_instances, "m", _PaymentService_createPaymentIntent).call(this, preparedOrder.baseUnitAmount, paymentProvider, currency)];
                                    case 2:
                                        paymentIntent = _a.sent();
                                        return [4 /*yield*/, __classPrivateFieldGet(this, _PaymentService_instances, "m", _PaymentService_registerPayment).call(this, dbTx, paymentProvider, paymentIntent.id, preparedOrder.nftOrder.id)];
                                    case 3:
                                        _a.sent();
                                        return [2 /*return*/, paymentIntent];
                                }
                            });
                        }); })["catch"](function (err) {
                            common_1.Logger.error("Err on creating nft order (userId=".concat(userId, ", err: ").concat(err));
                            throw err;
                        })];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    PaymentService.prototype.deleteExpiredPayments = function () {
        return __awaiter(this, void 0, void 0, function () {
            var cancelOrderIds, _loop_1, this_1, _i, _a, row;
            var _this = this;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.conn.query("\nSELECT\n  nft_order_id,\n  expires_at\nFROM payment\nWHERE expires_at < now() AT TIME ZONE 'UTC'\n  AND status = ANY($1)\n    ", [[PaymentStatus.CREATED, PaymentStatus.PROCESSING]])];
                    case 1:
                        cancelOrderIds = _b.sent();
                        _loop_1 = function (row) {
                            return __generator(this, function (_c) {
                                switch (_c.label) {
                                    case 0: return [4 /*yield*/, (0, db_module_1.withTransaction)(this_1.conn, function (dbTx) { return __awaiter(_this, void 0, void 0, function () {
                                            return __generator(this, function (_a) {
                                                switch (_a.label) {
                                                    case 0: return [4 /*yield*/, this.cancelNftOrderId(dbTx, Number(row['nft_order_id']), PaymentStatus.TIMED_OUT)];
                                                    case 1:
                                                        _a.sent();
                                                        common_1.Logger.warn("canceled following expired order session: ".concat(row['payment_id']));
                                                        return [2 /*return*/];
                                                }
                                            });
                                        }); })];
                                    case 1:
                                        _c.sent();
                                        return [2 /*return*/];
                                }
                            });
                        };
                        this_1 = this;
                        _i = 0, _a = cancelOrderIds.rows;
                        _b.label = 2;
                    case 2:
                        if (!(_i < _a.length)) return [3 /*break*/, 5];
                        row = _a[_i];
                        return [5 /*yield**/, _loop_1(row)];
                    case 3:
                        _b.sent();
                        _b.label = 4;
                    case 4:
                        _i++;
                        return [3 /*break*/, 2];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    PaymentService.prototype.checkPendingTezpays = function () {
        return __awaiter(this, void 0, void 0, function () {
            var pendingPaymentIds, _i, _a, row, paymentId, paymentStatus;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.conn.query("\nSELECT\n  payment_id\nFROM payment\nWHERE provider = $1\n  AND status = $2\n    ", [PaymentProvider.TEZPAY, PaymentStatus.CREATED])];
                    case 1:
                        pendingPaymentIds = _b.sent();
                        for (_i = 0, _a = pendingPaymentIds.rows; _i < _a.length; _i++) {
                            row = _a[_i];
                            paymentId = row['payment_id'];
                            paymentStatus = this.tezpay.get_payment(row['payment_id'], 3);
                            // TODO \/  \/   filler code
                            if (paymentStatus === 'done') {
                                __classPrivateFieldGet(this, _PaymentService_instances, "m", _PaymentService_updatePaymentStatus).call(this, paymentId, PaymentStatus.SUCCEEDED);
                            }
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    PaymentService.prototype.cancelNftOrderId = function (dbTx, orderId, newStatus) {
        if (newStatus === void 0) { newStatus = PaymentStatus.CANCELED; }
        return __awaiter(this, void 0, void 0, function () {
            var payment, provider, paymentId, _a, err_1;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, dbTx.query("\nUPDATE payment\nSET status = $2\nWHERE nft_order_id = $1\nAND status = ANY($3)\nRETURNING payment_id, provider\n      ", [
                            orderId,
                            newStatus,
                            [
                                PaymentStatus.CREATED,
                                PaymentStatus.PROCESSING,
                                PaymentStatus.TIMED_OUT,
                            ],
                        ])];
                    case 1:
                        payment = _b.sent();
                        if (payment.rowCount === 0) {
                            throw (0, ts_results_1.Err)("paymentIntentCancel failed (orderId=".concat(orderId, "), err: no payment exists with matching orderId and cancellable status"));
                        }
                        provider = payment.rows[0]['provider'];
                        paymentId = payment.rows[0]['payment_id'];
                        _b.label = 2;
                    case 2:
                        _b.trys.push([2, 7, , 8]);
                        _a = provider;
                        switch (_a) {
                            case PaymentProvider.STRIPE: return [3 /*break*/, 3];
                            case PaymentProvider.TEZPAY: return [3 /*break*/, 5];
                        }
                        return [3 /*break*/, 6];
                    case 3: return [4 /*yield*/, this.stripe.paymentIntents.cancel(paymentId)];
                    case 4:
                        _b.sent();
                        return [3 /*break*/, 6];
                    case 5: 
                    //await this.tezpay.cancel(paymentId);
                    return [3 /*break*/, 6];
                    case 6: return [3 /*break*/, 8];
                    case 7:
                        err_1 = _b.sent();
                        throw (0, ts_results_1.Err)("Err on canceling nft order (orderId=".concat(orderId, ", provider=").concat(provider, "), err: ").concat(err_1));
                    case 8: return [2 /*return*/];
                }
            });
        });
    };
    PaymentService.prototype.getPaymentOrderId = function (paymentId) {
        return __awaiter(this, void 0, void 0, function () {
            var qryRes;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.conn.query("\nSELECT nft_order_id\nFROM payment\nWHERE payment_id = $1\n      ", [paymentId])];
                    case 1:
                        qryRes = _a.sent();
                        return [2 /*return*/, qryRes.rows[0]['nft_order_id']];
                }
            });
        });
    };
    PaymentService.prototype.getOrderUserAddress = function (orderId) {
        return __awaiter(this, void 0, void 0, function () {
            var qryRes;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.conn.query("\nSELECT address\nFROM nft_order\nJOIN kanvas_user\n  ON kanvas_user.id = nft_order.user_id\nWHERE nft_order.id = $1\n      ", [orderId])];
                    case 1:
                        qryRes = _a.sent();
                        return [2 /*return*/, qryRes.rows[0]['address']];
                }
            });
        });
    };
    PaymentService.prototype.orderCheckout = function (orderId) {
        return __awaiter(this, void 0, void 0, function () {
            var userAddress;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getOrderUserAddress(orderId)];
                    case 1:
                        userAddress = _a.sent();
                        return [4 /*yield*/, (0, db_module_1.withTransaction)(this.conn, function (dbTx) { return __awaiter(_this, void 0, void 0, function () {
                                var nftIds, nfts;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0: return [4 /*yield*/, __classPrivateFieldGet(this, _PaymentService_instances, "m", _PaymentService_assignOrderNftsToUser).call(this, dbTx, orderId)];
                                        case 1:
                                            nftIds = _a.sent();
                                            if (nftIds.length === 0) {
                                                return [2 /*return*/, false];
                                            }
                                            return [4 /*yield*/, this.nftService.findByIds(nftIds)];
                                        case 2:
                                            nfts = _a.sent();
                                            // Don't await results of the transfers. Finish the checkout, any issues
                                            // should be solved asynchronously to the checkout process itself.
                                            this.mintService.transfer_nfts(nfts, userAddress);
                                            return [2 /*return*/, true];
                                    }
                                });
                            }); })["catch"](function (err) {
                                common_1.Logger.error("failed to checkout order (orderId=".concat(orderId, "), err: ").concat(err));
                                throw err;
                            })];
                    case 2: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    // Test functions
    PaymentService.prototype.getPaymentForLatestUserOrder = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            var qryRes;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.conn.query("\nSELECT payment_id, status, nft_order.id as order_id\nFROM payment\nJOIN nft_order\nON nft_order.id = payment.nft_order_id\nWHERE nft_order_id = (\n  SELECT nft_order.id as order_id\n  FROM nft_order\n  WHERE user_id = $1\n  ORDER BY nft_order.id DESC\n  LIMIT 1\n)\nORDER BY payment.id DESC\n      ", [userId])];
                    case 1:
                        qryRes = _a.sent();
                        return [2 /*return*/, {
                                paymentId: qryRes.rows[0]['payment_id'],
                                orderId: qryRes.rows[0]['order_id'],
                                status: qryRes.rows[0]['status']
                            }];
                }
            });
        });
    };
    var _PaymentService_instances, _PaymentService_createOrder, _PaymentService_registerOrder, _PaymentService_createPaymentIntent, _PaymentService_createStripePaymentIntent, _PaymentService_createTezPaymentIntent, _PaymentService_registerPayment, _PaymentService_newPaymentExpiration, _PaymentService_updatePaymentStatus, _PaymentService_nftOrderHasPaymentEntry, _PaymentService_assignOrderNftsToUser;
    _PaymentService_instances = new WeakSet(), _PaymentService_createOrder = function _PaymentService_createOrder(dbTx, userId, provider) {
        return __awaiter(this, void 0, void 0, function () {
            var cartSessionRes, cartSession, nftOrder, cartList, baseUnitAmount;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.userService.getUserCartSession(userId, dbTx)];
                    case 1:
                        cartSessionRes = _a.sent();
                        if (!cartSessionRes.ok || typeof cartSessionRes.val !== 'string') {
                            throw cartSessionRes.val;
                        }
                        cartSession = cartSessionRes.val;
                        return [4 /*yield*/, __classPrivateFieldGet(this, _PaymentService_instances, "m", _PaymentService_registerOrder).call(this, dbTx, cartSession, userId, provider)];
                    case 2:
                        nftOrder = _a.sent();
                        return [4 /*yield*/, this.userService.cartList(cartSession, kanvas_api_lib_1.BASE_CURRENCY, true, dbTx)];
                    case 3:
                        cartList = _a.sent();
                        baseUnitAmount = cartList.nfts.reduce(function (sum, nft) { return sum + Number(nft.price); }, 0);
                        return [2 /*return*/, { baseUnitAmount: baseUnitAmount, nftOrder: nftOrder }];
                }
            });
        });
    }, _PaymentService_registerOrder = function _PaymentService_registerOrder(dbTx, session, userId, provider) {
        return __awaiter(this, void 0, void 0, function () {
            var cartMeta, _a, orderAt, orderQryRes, nftOrderId, err_2;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.userService.getCartMeta(session, dbTx)];
                    case 1:
                        cartMeta = _b.sent();
                        if (typeof cartMeta === 'undefined') {
                            throw (0, ts_results_1.Err)("registerOrder err: cart should not be empty");
                        }
                        _b.label = 2;
                    case 2:
                        _b.trys.push([2, 10, , 11]);
                        _a = typeof cartMeta.orderId !== 'undefined';
                        if (!_a) return [3 /*break*/, 4];
                        return [4 /*yield*/, __classPrivateFieldGet(this, _PaymentService_instances, "m", _PaymentService_nftOrderHasPaymentEntry).call(this, cartMeta.orderId, dbTx)];
                    case 3:
                        _a = (_b.sent());
                        _b.label = 4;
                    case 4:
                        if (!_a) return [3 /*break*/, 6];
                        return [4 /*yield*/, this.cancelNftOrderId(dbTx, cartMeta.orderId)];
                    case 5:
                        _b.sent();
                        _b.label = 6;
                    case 6:
                        orderAt = new Date();
                        return [4 /*yield*/, dbTx.query("\nINSERT INTO nft_order (\n  user_id, order_at\n)\nVALUES ($1, $2)\nRETURNING id", [userId, orderAt.toUTCString()])];
                    case 7:
                        orderQryRes = _b.sent();
                        nftOrderId = orderQryRes.rows[0]['id'];
                        return [4 /*yield*/, dbTx.query("\nINSERT INTO mtm_nft_order_nft (\n  nft_order_id, nft_id\n)\nSELECT $1, nft_id\nFROM mtm_cart_session_nft\nWHERE cart_session_id = $2\n        ", [nftOrderId, cartMeta.id])];
                    case 8:
                        _b.sent();
                        return [4 /*yield*/, dbTx.query("\nUPDATE cart_session\nSET order_id = $1\nWHERE id = $2\n        ", [nftOrderId, cartMeta.id])];
                    case 9:
                        _b.sent();
                        return [2 /*return*/, {
                                id: nftOrderId,
                                orderAt: Math.floor(orderAt.getTime() / 1000),
                                userId: userId
                            }];
                    case 10:
                        err_2 = _b.sent();
                        common_1.Logger.error("Err on creating order in db (provider=".concat(provider, ", cartSessionId=").concat(cartMeta.id, ", err: ").concat(err_2));
                        throw err_2;
                    case 11: return [2 /*return*/];
                }
            });
        });
    }, _PaymentService_createPaymentIntent = function _PaymentService_createPaymentIntent(baseUnitAmount, paymentProvider, currency) {
        return __awaiter(this, void 0, void 0, function () {
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = paymentProvider;
                        switch (_a) {
                            case PaymentProvider.TEZPAY: return [3 /*break*/, 1];
                            case PaymentProvider.STRIPE: return [3 /*break*/, 3];
                            case PaymentProvider.TEST: return [3 /*break*/, 5];
                        }
                        return [3 /*break*/, 6];
                    case 1: return [4 /*yield*/, __classPrivateFieldGet(this, _PaymentService_instances, "m", _PaymentService_createTezPaymentIntent).call(this, baseUnitAmount)];
                    case 2: return [2 /*return*/, _b.sent()];
                    case 3: return [4 /*yield*/, __classPrivateFieldGet(this, _PaymentService_instances, "m", _PaymentService_createStripePaymentIntent).call(this, baseUnitAmount, currency)];
                    case 4: return [2 /*return*/, _b.sent()];
                    case 5: return [2 /*return*/, {
                            amount: this.currencyService.convertToCurrency(baseUnitAmount, currency),
                            currency: currency,
                            clientSecret: '..',
                            id: "stripe_test_id".concat(new Date().getTime().toString())
                        }];
                    case 6: return [2 /*return*/];
                }
            });
        });
    }, _PaymentService_createStripePaymentIntent = function _PaymentService_createStripePaymentIntent(baseUnitAmount, currency) {
        return __awaiter(this, void 0, void 0, function () {
            var amount, paymentIntent, decimals;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        amount = this.currencyService.convertToCurrency(baseUnitAmount, currency, true);
                        return [4 /*yield*/, this.stripe.paymentIntents.create({
                                amount: amount,
                                currency: currency,
                                automatic_payment_methods: {
                                    enabled: false
                                }
                            })];
                    case 1:
                        paymentIntent = _a.sent();
                        decimals = kanvas_api_lib_1.SUPPORTED_CURRENCIES[currency];
                        return [2 /*return*/, {
                                amount: (Number(amount) * Math.pow(10, -decimals)).toFixed(decimals),
                                currency: currency,
                                clientSecret: paymentIntent.client_secret,
                                id: paymentIntent.id
                            }];
                }
            });
        });
    }, _PaymentService_createTezPaymentIntent = function _PaymentService_createTezPaymentIntent(baseUnitAmount) {
        return __awaiter(this, void 0, void 0, function () {
            var id, amount, tezpayIntent;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        id = (0, uuid_1.v4)();
                        amount = this.currencyService.convertToCurrency(baseUnitAmount, 'XTZ', true);
                        return [4 /*yield*/, this.tezpay.init_payment({
                                external_id: id,
                                tez_amount: amount
                            })];
                    case 1:
                        tezpayIntent = _a.sent();
                        return [2 /*return*/, {
                                amount: amount,
                                currency: 'XTZ',
                                clientSecret: tezpayIntent.message,
                                id: id
                            }];
                }
            });
        });
    }, _PaymentService_registerPayment = function _PaymentService_registerPayment(dbTx, provider, paymentId, nftOrderId) {
        return __awaiter(this, void 0, void 0, function () {
            var expireAt, err_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        expireAt = __classPrivateFieldGet(this, _PaymentService_instances, "m", _PaymentService_newPaymentExpiration).call(this);
                        return [4 /*yield*/, dbTx.query("\nINSERT INTO payment (\n  payment_id, status, nft_order_id, provider, expires_at\n)\nVALUES ($1, $2, $3, $4, $5)\nRETURNING id", [
                                paymentId,
                                PaymentStatus.CREATED,
                                nftOrderId,
                                provider,
                                expireAt.toUTCString(),
                            ])];
                    case 1:
                        _a.sent();
                        return [3 /*break*/, 3];
                    case 2:
                        err_3 = _a.sent();
                        common_1.Logger.error("Err on storing payment intent in db (provider=".concat(provider, ", paymentId=").concat(paymentId, ", nftOrderId=").concat(nftOrderId, "), err: ").concat(err_3));
                        throw err_3;
                    case 3: return [2 /*return*/];
                }
            });
        });
    }, _PaymentService_newPaymentExpiration = function _PaymentService_newPaymentExpiration() {
        var expiresAt = new Date();
        expiresAt.setTime(expiresAt.getTime() + Number((0, utils_1.assertEnv)('ORDER_EXPIRATION_MILLI_SECS')));
        return expiresAt;
    }, _PaymentService_updatePaymentStatus = function _PaymentService_updatePaymentStatus(paymentId, newStatus) {
        return __awaiter(this, void 0, void 0, function () {
            var previousStatus, orderId;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, db_module_1.withTransaction)(this.conn, function (dbTx) { return __awaiter(_this, void 0, void 0, function () {
                            var qryPrevStatus;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, dbTx.query("\nSELECT status\nFROM payment\nWHERE payment_id = $1\n        ", [paymentId])];
                                    case 1:
                                        qryPrevStatus = _a.sent();
                                        return [4 /*yield*/, dbTx.query("\nUPDATE payment\nSET status = $1\nWHERE payment_id = $2\n  AND NOT status = ANY($3)\n        ", [newStatus, paymentId, this.FINAL_STATES])];
                                    case 2:
                                        _a.sent();
                                        return [2 /*return*/, qryPrevStatus.rows[0]
                                                ? qryPrevStatus.rows[0]['status']
                                                : undefined];
                                }
                            });
                        }); })["catch"](function (err) {
                            common_1.Logger.error("Err on updating payment status in db (paymentId=".concat(paymentId, ", newStatus=").concat(newStatus, "), err: ").concat(err));
                            throw err;
                        })];
                    case 1:
                        previousStatus = _a.sent();
                        if (!(newStatus === PaymentStatus.SUCCEEDED &&
                            !this.FINAL_STATES.includes(previousStatus))) return [3 /*break*/, 5];
                        return [4 /*yield*/, this.getPaymentOrderId(paymentId)];
                    case 2:
                        orderId = _a.sent();
                        return [4 /*yield*/, this.orderCheckout(orderId)];
                    case 3:
                        _a.sent();
                        return [4 /*yield*/, this.userService.deleteCartSession(orderId)];
                    case 4:
                        _a.sent();
                        _a.label = 5;
                    case 5: return [2 /*return*/];
                }
            });
        });
    }, _PaymentService_nftOrderHasPaymentEntry = function _PaymentService_nftOrderHasPaymentEntry(orderId, dbTx) {
        if (dbTx === void 0) { dbTx = this.conn; }
        return __awaiter(this, void 0, void 0, function () {
            var qryRes;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, dbTx.query("\nSELECT 1\nFROM payment\nWHERE nft_order_id = $1\n  AND NOT status = ANY($2)\n      ", [orderId, this.FINAL_STATES])];
                    case 1:
                        qryRes = _a.sent();
                        return [2 /*return*/, qryRes.rowCount === 1];
                }
            });
        });
    }, _PaymentService_assignOrderNftsToUser = function _PaymentService_assignOrderNftsToUser(dbTx, orderId) {
        return __awaiter(this, void 0, void 0, function () {
            var nftIds;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, dbTx.query("\nINSERT INTO mtm_kanvas_user_nft (\n  kanvas_user_id, nft_id\n)\nSELECT nft_order.user_id, mtm.nft_id\nFROM mtm_nft_order_nft AS mtm\nJOIN nft_order\n  ON nft_order.id = $1\nWHERE nft_order_id = $1\nRETURNING nft_id\n", [orderId])];
                    case 1:
                        nftIds = _a.sent();
                        return [2 /*return*/, nftIds.rows.map(function (row) { return row.nft_id; })];
                }
            });
        });
    };
    __decorate([
        (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_MINUTE)
    ], PaymentService.prototype, "deleteExpiredPayments");
    __decorate([
        (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_MINUTE)
    ], PaymentService.prototype, "checkPendingTezpays");
    PaymentService = __decorate([
        (0, common_1.Injectable)(),
        __param(0, (0, common_1.Inject)(constants_1.PG_CONNECTION))
    ], PaymentService);
    return PaymentService;
}());
exports.PaymentService = PaymentService;
