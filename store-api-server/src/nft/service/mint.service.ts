import { Logger, Injectable, Inject } from '@nestjs/common';
import {
  PG_CONNECTION,
  MINTER_ADDRESS,
  TOKEN_METADATA_TOKEN_COLUMN,
} from '../../constants.js';
import { NftEntity } from '../entity/nft.entity.js';
import { NftIpfsService } from './ipfs.service.js';
import { withMutexLock, DbTransaction } from '../../db.module.js';

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
  constructor(
    @Inject(PG_CONNECTION) private conn: any,
    private ipfsService: NftIpfsService,
  ) {}

  async transferNfts(
    nfts: NftEntity[],
    buyerAddress: string,
  ): Promise<{ [key: number]: number }> {
    const operationIds: { [key: number]: number } = {};
    for (const nft of nfts) {
      try {
        const opId = await this.#transferNft(nft, buyerAddress);
        operationIds[nft.id] = opId;
        Logger.log(
          `transfer created for nft (id=${nft.id}) to buyer (address=${buyerAddress})`,
        );
      } catch (err: any) {
        Logger.error(
          `failed to transfer nft (id=${nft.id}) to buyer (address=${buyerAddress}), err: ${err}`,
        );
      }
    }
    return operationIds;
  }

  async #transferNft(nft: NftEntity, buyerAddress: string): Promise<number> {
    return await withMutexLock({
      mutexName: `transferNft:${nft.id}`,
      dbPool: this.conn,
      f: async (dbTx: DbTransaction) => {
        if (!(await this.#isNftSubmitted(dbTx, nft))) {
          const operationId = await this.#mint(dbTx, nft, buyerAddress);
          if (nft.editionsSize === 1) {
            return operationId;
          }
        }

        const cmd = {
          handler: 'nft',
          name: 'transfer',
          args: {
            token_id: nft.id,
            from_address: MINTER_ADDRESS,
            to_address: buyerAddress,
            amount: 1,
          },
        };
        return await this.#insertCommand(dbTx, cmd);
      },
    });
  }

  async #mint(
    dbTx: DbTransaction,
    nft: NftEntity,
    buyerAddress: string,
  ): Promise<number> {
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
        to_address: nft.editionsSize === 1 ? buyerAddress : MINTER_ADDRESS,
        metadata_ipfs: metadataIpfs,
        amount: nft.editionsSize,
      },
    };

    return await this.#insertCommand(dbTx, cmd);
  }

  async #insertCommand(dbTx: DbTransaction, cmd: Command): Promise<number> {
    return (
      await dbTx.query(
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

  async #isNftSubmitted(dbTx: DbTransaction, nft: NftEntity): Promise<boolean> {
    const qryRes = await dbTx.query(
      `
SELECT 1
FROM onchain_kanvas."storage.token_metadata_live"
WHERE ${TOKEN_METADATA_TOKEN_COLUMN}::INTEGER = $1

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
