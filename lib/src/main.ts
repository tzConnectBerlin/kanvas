require('log-node')();
import { STMResultStatus, StateTransitionMachine } from './stm';
import { Actor } from './types';
import * as log from 'log';

export { STMResultStatus, StateTransitionMachine, Actor };

// Note: set log level through env variable LOG_LEVEL to one of:
// - debug
// - info
// - notice (default)
// - warning
// - error

function test() {
  const nft = {
    id: 0,
    state: 'setup_nft',
    attributes: {},
  };

  let stm = new StateTransitionMachine('./redacted_redacted.yaml');

  const editor = new Actor(0, ['editor', 'something']);
  const moderator1 = new Actor(1, ['moderator']);
  const moderator2 = new Actor(2, ['moderator']);
  const moderator3 = new Actor(3, ['moderator']);

  log.notice(
    `allowed actions (editor): ${JSON.stringify(
      stm.getAllowedActions(editor, nft),
    )}`,
  );
  log.notice(
    `allowed actions (moderator): ${JSON.stringify(
      stm.getAllowedActions(moderator1, nft),
    )}`,
  );
  stm.tryAttributeApply(editor, nft, 'editions_size', '1');
  stm.tryAttributeApply(editor, nft, 'price', '4');
  stm.tryAttributeApply(editor, nft, 'proposed', 'true');
  stm.tryAttributeApply(editor, nft, 'categories', '[1,4]');
  log.notice(
    `allowed actions (editor): ${JSON.stringify(
      stm.getAllowedActions(editor, nft),
    )}`,
  );
  log.notice(
    `allowed actions (moderator): ${JSON.stringify(
      stm.getAllowedActions(moderator1, nft),
    )}`,
  );

  stm.tryAttributeApply(moderator1, nft, 'proposal_pass', 'true');
  stm.tryAttributeApply(moderator3, nft, 'proposal_pass', 'true');
  stm.tryAttributeApply(moderator3, nft, 'proposal_pass', 'false');
  stm.tryAttributeApply(moderator3, nft, 'proposal_pass', 'true');
  try {
    stm.tryAttributeApply(moderator3, nft, 'proposal_pass', 'true');
  } catch (err: any) {
    // this will throw an error that moderator3 already signed proposal_pass
    log.warn(err);
  }

  stm.tryAttributeApply(moderator2, nft, 'proposal_pass', 'true');
}

// test();
