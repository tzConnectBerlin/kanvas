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
exports.__esModule = true;
exports.PaymentController = void 0;
var common_1 = require("@nestjs/common");
var user_decorator_1 = require("../../decoraters/user.decorator");
var jwt_auth_guard_1 = require("../../authentication/guards/jwt-auth.guard");
var payment_service_1 = require("../service/payment.service");
var kanvas_api_lib_1 = require("kanvas-api-lib");
var paramUtils_1 = require("../../paramUtils");
var endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
var PaymentController = /** @class */ (function () {
    function PaymentController(paymentService, userService) {
        this.paymentService = paymentService;
        this.userService = userService;
    }
    PaymentController.prototype.stripeWebhook = function (signature, request) {
        return __awaiter(this, void 0, void 0, function () {
            var constructedEvent, err_1, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!endpointSecret) {
                            throw new common_1.HttpException('Stripe not enabled', common_1.HttpStatus.BAD_REQUEST);
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.paymentService.stripe.webhooks.constructEvent(request.body, signature, endpointSecret)];
                    case 2:
                        constructedEvent =
                            _a.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        err_1 = _a.sent();
                        common_1.Logger.error("Err on payment webhook signature verification: ".concat(err_1));
                        throw new common_1.HttpException('Webhook signature verification failed', common_1.HttpStatus.BAD_REQUEST);
                    case 4:
                        _a.trys.push([4, 6, , 7]);
                        return [4 /*yield*/, this.paymentService.webhookHandler(constructedEvent)];
                    case 5:
                        _a.sent();
                        return [3 /*break*/, 7];
                    case 6:
                        error_1 = _a.sent();
                        new common_1.HttpException('', common_1.HttpStatus.UNPROCESSABLE_ENTITY);
                        return [3 /*break*/, 7];
                    case 7: throw new common_1.HttpException('', common_1.HttpStatus.NO_CONTENT);
                }
            });
        });
    };
    PaymentController.prototype.createPaymentIntent = function (user, currency) {
        if (currency === void 0) { currency = kanvas_api_lib_1.BASE_CURRENCY; }
        return __awaiter(this, void 0, void 0, function () {
            var paymentProvider, err_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        (0, paramUtils_1.validateRequestedCurrency)(currency);
                        if (currency === 'XTZ') {
                            paymentProvider = payment_service_1.PaymentProvider.TEZPAY;
                        }
                        else {
                            paymentProvider = payment_service_1.PaymentProvider.STRIPE;
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.paymentService.createPayment(user.id, paymentProvider, currency)];
                    case 2: return [2 /*return*/, _a.sent()];
                    case 3:
                        err_2 = _a.sent();
                        common_1.Logger.error(err_2);
                        throw new common_1.HttpException('Unable to place the order', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    __decorate([
        (0, common_1.Post)('/stripe-webhook'),
        __param(0, (0, common_1.Headers)('stripe-signature')),
        __param(1, (0, common_1.Req)())
    ], PaymentController.prototype, "stripeWebhook");
    __decorate([
        (0, common_1.Post)('/create-payment-intent'),
        (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
        __param(0, (0, user_decorator_1.CurrentUser)()),
        __param(1, (0, common_1.Body)())
    ], PaymentController.prototype, "createPaymentIntent");
    PaymentController = __decorate([
        (0, common_1.Controller)('payment')
    ], PaymentController);
    return PaymentController;
}());
exports.PaymentController = PaymentController;
