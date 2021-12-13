import { Injectable, Inject } from '@nestjs/common';
import { CreateNftDto } from './dto/create-nft.dto';
import { UpdateNftDto } from './dto/update-nft.dto';
import { StateTransitionMachine, Actor } from 'roles_stm';
import { UserEntity } from '../user/entities/user.entity';
import { NftEntity } from './entities/nft.entity';
import { RoleService } from '../role/role.service';
import { PG_CONNECTION } from '../constants';
import { DbPool } from '../db.module';

@Injectable()
export class NftService {
  constructor(
    @Inject(PG_CONNECTION) private db: DbPool,
    private readonly roleService: RoleService,
    private stm: StateTransitionMachine,
  ) {}

  create(createNftDto: CreateNftDto) {
    return 'This action adds a new nft';
  }

  findAll() {
    return `This action returns all nft`;
  }

  async getNft(nftId: number): Promise<NftEntity | undefined> {
    const nftRes = await this.db.query(
      `
SELECT id AS nft_id, state, attributes
FROM nft
WHERE id = $1
    `,
      [nftId],
    );

    if (nftRes.rowCount === 0) {
      return null;
    }

    const row = nftRes.rows[0];
    return {
      id: row['nft_id'],
      state: row['state'],
      attributes: row['attributes'],
    };
  }

  async apply(
    user: UserEntity,
    nftId: number,
    attr: string,
    value?: string,
  ): Promise<STMResult> {
    const roles = await this.roleService.getLabels(user.roles);
    const actor = new Actor(user.id, roles);
    const nft = await this.getNft(nftId);

    const stmRes = this.stm.tryAttributeApply(actor, nft, attr, value);
    if (stmRes.status != STMStatusResult.Ok) {
      return stmRes;
    }

    await this.updateNft(nft);
    return stmRes;
  }

  async updateNft(nft: NftEntity) {
    await this.db.query(
      `
UPDATE nft
SET
  state = $2,
  attributes = $3
WHERE nft.id = $1
`,
      [nft.id, nft.state, nft.attributes],
    );
  }

  update(id: number, updateNftDto: UpdateNftDto) {
    return `This action updates a #${id} nft`;
  }

  remove(id: number) {
    return `This action removes a #${id} nft`;
  }
}
