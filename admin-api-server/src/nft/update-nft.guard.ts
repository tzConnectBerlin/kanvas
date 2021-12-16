import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { NftService } from './nft.service';

@Injectable()
export class UpdateNftGuard implements CanActivate {
  constructor(private readonly nftService: NftService) {}
  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const {
      body,
      user,
      params: { id },
    } = request;
    if (id && body && user) {
      const nft = await this.nftService.findOne(+id);

      /**
       * TODO: Try to move nft to next stage here. if passed then return true else false
       */

      return true;
    }

    return false;
  }
}
