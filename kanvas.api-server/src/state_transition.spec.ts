import { NftStateTransitionConfig } from './state_transition'

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

let exampleNftStateConfigSource = ```
(states (:start :rejected) ;; terminal stages
        (:uploaded :moderated :categorised :commericaltermsadded)) ;; others

(roles (:uploader :moderator :editor :god))

(transition (:start :uploaded)
            (requires :uploader))

(transition (:uploaded :moderated)
            (requires :moderator 3))
```
