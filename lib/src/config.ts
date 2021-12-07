import * as fs from 'fs';
const file = fs.readFileSync('./redacted_redacted.yaml', 'utf8');
import { parse } from 'yaml';
import { evalExpr } from './expr';

interface StateTransition {}

interface State {
  transitions: [
    {
      next_state: string;
      when: string;
    },
  ];
}

export class StateTransitionMachine {
  attributes: any = {};
  states: any = {};

  constructor(filepath: string) {
    const parsed = parse(file);

    console.log('BEGIN');
    console.log(JSON.stringify(parsed));
    console.log('END');

    for (const attr in parsed.attributes) {
      this.attributes[attr] = parsed.attributes[attr];
    }

    for (const state in parsed.states) {
      this.states[state] = {
        transitions: parsed.states[state].state_transitions,
      };
    }
  }

  attributeSet(nft: Nft, role: string, attribute: string, value: string) {}

  // greedily move nft if possible to a new state
  // returns true if moved, false if not
  // if moved, adjusts nft in memory
  tryMoveNft(nft: Nft): boolean {
    const state = this.states[nft.state];

    for (const transition of state.transitions) {
      const evalRes = evalExpr(nft, transition.when);
      if (!evalRes.ok) {
        throw evalRes.val;
      }
      if (evalRes.val) {
        nft.state = transition.next_state;
        return true;
      }
    }

    return false;
  }
}
