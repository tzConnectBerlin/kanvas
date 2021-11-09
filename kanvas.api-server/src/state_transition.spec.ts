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
    { from: 'start', to: 'uploaded', requires: ['uploader', 1] },
    { from: 'uploaded', to: 'moderated', requires: ['moderator', 3] },
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
  it('should allow state transitions when the user role is correct', () => {
    let user: UserEntity = {
      id: 1337,
      name: 'Max Mustermann',
      address: 'abc123',
      signedPayload: 'signed',
      roles: ['uploader', 'moderator'],
    }
    let nft: NftEntity = {
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
    let actual = transition(
      exampleNftStateTransitionConfig,
      nft,
      user,
      'moderated',
    ).val
    let expected = assoc('status', 'moderated', nft)
    expect(actual).toStrictEqual(expected)
  })
})
