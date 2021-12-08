require('log-node')();
import { StateTransitionMachine } from './stm';
import * as log from 'log';

// Note: set log level through env variable LOG_LEVEL to one of:
// - debug
// - info
// - notice (default)
// - warning
// - error

const nft = {
  name: 'test',
  state: 'setup_nft',
  attributes: {
    categories: ['test'],
  },
};

let stm = new StateTransitionMachine('./redacted_redacted.yaml');

log.debug(JSON.stringify(stm));

stm.tryAttributeSet(nft, 'editor', 'editions_size', '1');
stm.tryAttributeSet(nft, 'editor', 'price', '4');
stm.tryAttributeSet(nft, 'editor', 'proposed', 'true');

stm.tryMoveNft(nft);
log.warn(nft);
