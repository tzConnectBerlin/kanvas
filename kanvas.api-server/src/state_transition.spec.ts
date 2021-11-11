import { NftEntity } from './nft/entity/nft.entity'
import { NftStateTransitionConfig, transition } from './state_transition'
import { UserEntity } from './user/entity/user.entity'
import { assoc } from 'ramda'
let exampleNftStateTransitionConfig: NftStateTransitionConfig = {
  states: {
    terminal: ['start', 'rejected'],
    nonterminal: [
      'uploaded',
      'moderated',
      'categorised',
      'commercial-terms-added',
    ],
  },
  roles: ['uploader', 'moderator', 'editor', 'god'],
  transitions: [
    { from: 'start', to: 'uploaded', requires: ['uploader', 2] },
    { from: 'uploaded', to: 'moderated', requires: ['moderator', 1] },
  ],
}

// let exampleNftStateConfigSource = ```
// (states (:start :rejected) ;; terminal stages
//         (:uploaded :moderated :categorised :commericaltermsadded)) ;; others

// (roles (:uploader :moderator :editor :god))

// (transition (:start :uploaded)
//             (requires :uploader))

// (transition (:uploaded :moderated)
//             (requires :moderator 3))
// ```

describe('NFT state transition', () => {
  let users: UserEntity[] = [
    {
      id: 1337,
      name: 'Antonio Vivaldi',
      address: 'abc123',
      signedPayload: 'nruxmkoszopqnrhu',
      roles: ['uploader', 'moderator'],
    },
    {
      id: 777,
      name: 'Bob the Builder',
      address: 'abc123',
      signedPayload: 'aihcogimoriuehafhiou',
      roles: ['moderator', 'editor'],
    },
  ]
  var nft: NftEntity = {
    id: 7331,
    name: 'cool nft',
    ipfsHash: '12345',
    metadata: {},
    dataUri: 'protocol:user@host/resource',
    contract: 'contract id',
    tokenId: '1234567',
    categories: [],
    status: 'uploaded',
  }
  it('should allow state transitions when the user role is correct', () => {
    let actual = transition(
      exampleNftStateTransitionConfig,
      nft,
      users,
      'moderated',
    ).val
    let expected = assoc('status', 'moderated', nft)
    expect(actual).toStrictEqual(expected)
  })
  it('should disallow state transitions when insufficient amount of users have confirmed', () => {
    nft = assoc('status', 'start', nft)
    let actual = transition(
      exampleNftStateTransitionConfig,
      nft,
      users,
      'uploaded',
    )
    let expected = assoc('status', 'uploaded', nft)
    expect(actual).not.toStrictEqual(expected)
  })
})
