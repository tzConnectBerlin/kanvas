import { Logger, Injectable, Inject } from '@nestjs/common';
import { PG_CONNECTION, MINTER_ADDRESS } from '../../constants.js';
import { NftEntity } from '../entity/nft.entity.js';
import { IpfsService } from './ipfs.service.js';
import { Lock } from 'async-await-mutex-lock';

interface Command {
  handler: string;
  name: string;
  args: {
    token_id: number;
    to_address: string;
    amount: number;

    from_address?: string;
    metadata_ipfs?: string;
  };
}

@Injectable()
export class MintService {
  nftLock: Lock<number>;

  constructor(
    @Inject(PG_CONNECTION) private conn: any,
    private ipfsService: IpfsService,
  ) {
    this.nftLock = new Lock<number>();
  }

  async transfer_nfts(nfts: NftEntity[], buyer_address: string) {
    for (const nft of nfts) {
      try {
        await this.#transfer_nft(nft, buyer_address);
        Logger.log(
          `transfer created for nft (id=${nft.id}) to buyer (address=${buyer_address})`,
        );
      } catch (err: any) {
        Logger.error(
          `failed to transfer nft (id=${nft.id}) to buyer (address=${buyer_address}), err: ${err}`,
        );
      }
    }
  }

  async #transfer_nft(nft: NftEntity, buyer_address: string) {
    await this.nftLock.acquire(nft.id);
    try {
      if (!(await this.#isNftSubmitted(nft))) {
        await this.#mint(nft);
      }

      const cmd = {
        handler: 'nft',
        name: 'transfer',
        args: {
          token_id: nft.id,
          from_address: MINTER_ADDRESS,
          to_address: buyer_address,
          amount: 1,
        },
      };
      await this.#insertCommand(cmd);
    } finally {
      this.nftLock.release(nft.id);
    }
  }

  async #mint(nft: NftEntity) {
    const metadataIpfs = await this.ipfsService.uploadNft(nft);
    if (typeof metadataIpfs === 'undefined') {
      throw `failed to upload nft to Ipfs`;
    }
    const cmd = {
      handler: 'nft',
      name: 'create_and_mint',
      args: {
        token_id: nft.id,
        to_address: MINTER_ADDRESS,
        metadata_ipfs: metadataIpfs,
        amount: nft.editionsSize,
      },
    };

    await this.#insertCommand(cmd);
  }

  async #insertCommand(cmd: Command) {
    await this.conn.query(
      `
INSERT INTO peppermint.operations (
  originator, command
)
VALUES (
  $1, $2
)
`,
      [MINTER_ADDRESS, cmd],
    );
  }

  async #isNftSubmitted(nft: NftEntity): Promise<boolean> {
    const qryRes = await this.conn.query(
      `
SELECT 1
FROM onchain_kanvas."storage.token_metadata_live"
WHERE idx_assets_nat::INTEGER = $1

UNION ALL

SELECT 1
FROM peppermint.operations
WHERE command->>'handler' = 'nft'
  AND command->>'name' = 'create_and_mint'
  AND (command->'args'->>'token_id')::INTEGER = $1
  AND state IN ('pending', 'processing', 'waiting')
`,
      [nft.id],
    );
    return qryRes.rowCount > 0;
  }
}
