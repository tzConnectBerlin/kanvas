require('log-node')();
import { StateTransitionMachine } from './stm';
import { Actor } from './types';
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
  attributes: {},
};

let stm = new StateTransitionMachine('./redacted_redacted.yaml');

log.debug(JSON.stringify(stm));

const editor = new Actor(0, ['editor', 'something']);
const moderator1 = new Actor(1, ['moderator']);
const moderator2 = new Actor(2, ['moderator']);
const moderator3 = new Actor(3, ['moderator']);

stm.tryAttributeApply(editor, nft, 'editions_size', '1');
stm.tryAttributeApply(editor, nft, 'price', '4');
stm.tryAttributeApply(editor, nft, 'proposed', 'true');
stm.tryAttributeApply(editor, nft, 'categories', '[1]');

stm.tryAttributeApply(moderator1, nft, 'proposal_pass', 'true');
stm.tryAttributeApply(moderator3, nft, 'proposal_pass', 'true');
stm.tryAttributeApply(moderator3, nft, 'proposal_pass', 'false');
try {
  stm.tryAttributeApply(moderator3, nft, 'proposal_pass', 'true');
} catch (err: any) {
  // this will throw an error that moderator3 already signed proposal_pass
  log.warn(err);
}

log.warn(`before: ${JSON.stringify(nft)}`);
stm.tryAttributeApply(moderator2, nft, 'proposal_pass', 'true');
log.warn(`after: ${JSON.stringify(nft)}`);
