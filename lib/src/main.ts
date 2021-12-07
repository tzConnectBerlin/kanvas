import { evalExpr } from './expr';
import { StateTransitionMachine } from './config';

const nft = {
  name: 'test',
  state: 'setup_nft',
  attributes: {
    proposed: true,
    editions_size: 1,
    categories: ['test'],
  },
};

let stm = new StateTransitionMachine('./redacted_redacted.yaml');

console.log(JSON.stringify(stm));

stm.tryAttributeSet(nft, 'editor', 'price', '4');
console.log(stm.tryMoveNft(nft));
console.log(nft);
