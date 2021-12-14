import { Injectable, Inject } from '@nestjs/common';
import { PG_CONNECTION, MINTER_ADDRESS } from '../../constants';
import { NftEntity } from 'src/nft/entity/nft.entity';
import { IpfsService } from 'src/nft/service/ipfs.service';

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
  ipfsService: IpfsService;

  constructor(@Inject(PG_CONNECTION) private conn: any) {
    this.ipfsService = new IpfsService();
  }

  async transfer(nft: NftEntity, buyer: string) {
    if (!(await this.#isNftSubmitted(nft))) {
      await this.#mint(nft);
    }
    const cmd = {
      handler: 'nft',
      name: 'transfer',
      args: {
        token_id: nft.id,
        from_address: MINTER_ADDRESS,
        to_address: 'tz1QyKEvd16HRssMJdBXxDLrtV7uQUR7EYjk', // buyer,
        amount: 1,
      },
    };
    await this.#insertCommand(cmd);
  }

  async #mint(nft: NftEntity) {
    const metadataIpfs = await this.ipfsService.uploadNft(nft);
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
FROM peppermint.operations
WHERE command->'handler'::TEXT = 'nft'
  AND command->'name'::TEXT = 'create_and_mint'
  AND command->'args'->'token_id'::INTEGER = $1
  AND state != 'rejected'
`,
      [nft.id],
    );
    return qryRes.rowCount === 1;
  }
}
