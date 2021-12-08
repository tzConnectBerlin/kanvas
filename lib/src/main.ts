import { StateTransitionMachine } from './stm';

const nft = {
  name: 'test',
  state: 'setup_nft',
  attributes: {
    categories: ['test'],
  },
};

let stm = new StateTransitionMachine('./redacted_redacted.yaml');

console.log(JSON.stringify(stm));

stm.tryAttributeSet(nft, 'editor', 'editions_size', '1');
console.log(stm.tryMoveNft(nft));
stm.tryAttributeSet(nft, 'editor', 'price', '4');
console.log(stm.tryMoveNft(nft));
stm.tryAttributeSet(nft, 'editor', 'proposed', 'true');
console.log(stm.tryMoveNft(nft));
console.log(nft);
