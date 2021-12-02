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

  async mint(nft: NftEntity, buyer: string) {
    const metadataIpfs = await this.ipfsService.uploadNft(nft);
    const cmd = {
      handler: 'nft',
      name: 'mint',
      args: {
        token_id: nft.id,
        to_address: MINTER_ADDRESS,
        metadata_ipfs: metadataIpfs,
        amount: nft.editionsSize,
      },
    };

    await this.insertCommand(cmd);
    this.transfer(nft, buyer);
  }

  async transfer(nft: NftEntity, buyer: string) {
    const cmd = {
      handler: 'nft',
      name: 'transfer',
      args: {
        token_id: nft.id,
        from_address: MINTER_ADDRESS,
        to_address: buyer,
        amount: 1,
      },
    };
    await this.insertCommand(cmd);
  }

  async insertCommand(cmd: Command) {
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
}
