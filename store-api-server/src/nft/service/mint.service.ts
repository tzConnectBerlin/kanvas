import { Logger, Injectable, Inject } from '@nestjs/common';
import { PG_CONNECTION, MINTER_ADDRESS } from '../../constants.js';
import { NftEntity } from '../entity/nft.entity.js';
import { NftIpfsService } from './ipfs.service.js';
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
    private ipfsService: NftIpfsService,
  ) {
    this.nftLock = new Lock<number>();
  }

  async transferNfts(
    nfts: NftEntity[],
    buyer_address: string,
  ): Promise<{ [key: number]: number }> {
    const operationIds: { [key: number]: number } = {};
    for (const nft of nfts) {
      try {
        const opId = await this.#transferNft(nft, buyer_address);
        operationIds[nft.id] = opId;
        Logger.log(
          `transfer created for nft (id=${nft.id}) to buyer (address=${buyer_address})`,
        );
      } catch (err: any) {
        Logger.error(
          `failed to transfer nft (id=${nft.id}) to buyer (address=${buyer_address}), err: ${err}`,
        );
        operationIds[nft.id] = -1; // TODO: check if this makes sense
      }
    }
    return operationIds;
  }

  async #transferNft(nft: NftEntity, buyer_address: string): Promise<number> {
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
      return await this.#insertCommand(cmd);
    } finally {
      this.nftLock.release(nft.id);
    }
  }

  async #mint(nft: NftEntity) {
    if (nft.isProxy) {
      throw `cannot mint a proxy nft (id=${nft.id})`;
    }

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

  async #insertCommand(cmd: Command): Promise<number> {
    return (
      await this.conn.query(
        `
INSERT INTO peppermint.operations (
  originator, command
)
VALUES (
  $1, $2
)
RETURNING id AS operation_id
`,
        [MINTER_ADDRESS, cmd],
      )
    ).rows[0]['operation_id'];
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
