/* import { Nft } from './nft/entities/nft.entity';
import {
  NftStateTransitionConfig,
  transition,
  parse,
} from './state_transition';
import { User } from './user/entities/user.entity';
import { assoc } from 'ramda';
import * as SExp from './s_expression';
let exampleNftStateTransitionConfig: NftStateTransitionConfig = {
  states: {
    terminal: [':start', ':rejected'],
    nonterminal: [
      ':uploaded',
      ':moderated',
      ':categorised',
      ':commercial-terms-added',
    ],
  },
  roles: [':uploader', ':moderator', ':editor', ':god'],
  transitions: [
    {
      fromRole: ':start',
      toRole: ':uploaded',
      requiresRole: ':uploader',
      requiresConfirmations: 2,
    },
    {
      fromRole: ':uploaded',
      toRole: ':moderated',
      requiresRole: ':moderator',
      requiresConfirmations: 1,
    },
  ],
};

export const exampleNftStateConfigSource = `
(states (:start :rejected) ;; terminal stages
        (:uploaded :moderated :categorised :commercial-terms-added)) ;; others

(roles (:uploader :moderator :editor :god))

(transition (:start :uploaded)
            (requires :uploader 2))

(transition (:uploaded :moderated)
            (requires :moderator 1))
`;

describe('NFT state transition', () => {
  let users: User[] = [
    {
      id: 1337,
      name: 'Antonio Vivaldi',
      address: 'abc123',
      signedPayload: 'nruxmkoszopqnrhu',
      roles: [':uploader', ':moderator'],
    },
    {
      id: 777,
      name: 'Bob the Builder',
      address: 'abc123',
      signedPayload: 'aihcogimoriuehafhiou',
      roles: [':moderator', ':editor'],
    },
  ];
  var nft: Nft = {
    id: 7331,
    name: 'cool nft',
    ipfsHash: '12345',
    metadata: {},
    dataUri: 'protocol:user@host/resource',
    contract: 'contract id',
    tokenId: '1234567',
    categories: [],
    status: ':uploaded',
  };
  it('should allow state transitions when the user role is correct', () => {
    let actual = transition(
      exampleNftStateTransitionConfig,
      nft,
      users,
      ':moderated',
    ).val;
    let expected = assoc('status', ':moderated', nft);
    expect(actual).toStrictEqual(expected);
  });
  it('should disallow state transitions when insufficient amount of users have confirmed', () => {
    nft = assoc('status', 'start', nft);
    let actual = transition(
      exampleNftStateTransitionConfig,
      nft,
      users,
      ':uploaded',
    );
    let expected = assoc('status', ':uploaded', nft);
    expect(actual).not.toStrictEqual(expected);
  });
});
describe('parsing state transition configs', () => {
  it('should parse correctly', () => {
    expect(
      parse(SExp.parse(SExp.stripJunk('(' + exampleNftStateConfigSource + ')')))
        .val,
    ).toStrictEqual(exampleNftStateTransitionConfig);
  });
});
 */
