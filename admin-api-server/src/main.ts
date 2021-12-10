import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';
import { assertEnv } from './utils';
import { v4 as uuidv4 } from 'uuid';
import { StateTransitionMachine, Actor } from 'roles_stm';
// import { testString } from 'roles_stm';

dotenv.config();

const nft = {
  id: 0,
  state: 'setup_nft',
  attributes: {},
};

let stm = new StateTransitionMachine('./config/redacted_redacted.yaml');

const editor = new Actor(0, ['editor', 'something']);
const moderator1 = new Actor(1, ['moderator']);
const moderator2 = new Actor(2, ['moderator']);
const moderator3 = new Actor(3, ['moderator']);

console.log(
  `allowed actions (editor): ${JSON.stringify(
    stm.getAllowedActions(editor, nft),
  )}`,
);
console.log(
  `allowed actions (moderator): ${JSON.stringify(
    stm.getAllowedActions(moderator1, nft),
  )}`,
);
stm.tryAttributeApply(editor, nft, 'editions_size', '1');
stm.tryAttributeApply(editor, nft, 'price', '4');
stm.tryAttributeApply(editor, nft, 'proposed', 'true');
stm.tryAttributeApply(editor, nft, 'categories', '[1,4]');
console.log(
  `allowed actions (editor): ${JSON.stringify(
    stm.getAllowedActions(editor, nft),
  )}`,
);
console.log(
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
  console.log(err);
}

stm.tryAttributeApply(moderator2, nft, 'proposal_pass', 'true');

console.log('running!');
throw 'exit';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });
  const port = process.env['KANVAS_API_PORT'] || 3001;
  await app.listen(port);
  console.log('Listening on ', port);
}
bootstrap();
