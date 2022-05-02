"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
exports.__esModule = true;
exports.AppModule = void 0;
var core_1 = require("@nestjs/core");
var common_1 = require("@nestjs/common");
var throttler_1 = require("@nestjs/throttler");
var category_module_1 = require("./category/category.module");
var nft_module_1 = require("./nft/nft.module");
var user_module_1 = require("./user/user.module");
var auth_provider_module_1 = require("./auth-provider/auth-provider.module");
var authentication_module_1 = require("./authentication/authentication.module");
var db_module_1 = require("./db.module");
var payment_module_1 = require("./payment/payment.module");
var logger_1 = require("./middleware/logger");
var cookie_session_1 = require("./middleware/cookie_session");
var proxied_throttler_1 = require("./decoraters/proxied_throttler");
var schedule_1 = require("@nestjs/schedule");
var kanvas_api_lib_1 = require("kanvas-api-lib");
var constants_1 = require("./constants");
var AppModule = /** @class */ (function () {
    function AppModule() {
    }
    AppModule.prototype.configure = function (consumer) {
        consumer.apply(cookie_session_1.CookieSessionMiddleware, logger_1.LoggerMiddleware).forRoutes('*');
    };
    AppModule = __decorate([
        (0, common_1.Module)({
            imports: [
                schedule_1.ScheduleModule.forRoot(),
                authentication_module_1.AuthenticationModule,
                category_module_1.CategoryModule,
                nft_module_1.NftModule,
                user_module_1.UserModule,
                auth_provider_module_1.AuthProviderModule,
                payment_module_1.PaymentModule,
                db_module_1.DbModule,
                kanvas_api_lib_1.CurrencyModule,
                throttler_1.ThrottlerModule.forRoot({
                    ttl: constants_1.RATE_LIMIT_TTL,
                    limit: constants_1.RATE_LIMIT
                }),
                common_1.CacheModule.register({
                    ttl: constants_1.CACHE_TTL,
                    max: constants_1.CACHE_SIZE,
                    isGlobal: true
                }),
            ],
            providers: [
                logger_1.StatsLogger,
                { provide: core_1.APP_GUARD, useClass: proxied_throttler_1.ProxiedThrottlerGuard },
            ]
        })
    ], AppModule);
    return AppModule;
}());
exports.AppModule = AppModule;
