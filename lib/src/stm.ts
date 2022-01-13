import * as fs from 'fs';
import { parse } from 'yaml';
import { evalExpr, execExpr } from './expr';
import { Nft, Actor } from './types';
import * as log from 'log';

interface StateTransition {}

interface State {
  transitions: [
    {
      next_state: string;
      when: string;
      do?: string;
    },
  ];
  mutables: [
    {
      attributes: string[];
      by_roles: string[];
    },
  ];
}

export const enum STMResultStatus {
  OK,
  NOT_ALLOWED
}

export interface STMResult {
  status: STMResultStatus;
  message?: string;
}

export class StateTransitionMachine {
  attrTypes: any = {};
  states: any = {};

  constructor(filepath: string) {
    const file = fs.readFileSync(filepath, 'utf8');
    const parsed = parse(file);

    for (const attr in parsed.attributes) {
      this.attrTypes[attr] = parsed.attributes[attr];
    }

    for (const stateName in parsed.states) {
      const st = parsed.states[stateName];
      this.states[stateName] = {
        transitions: st.state_transitions,
        mutables: st.mutables,
      };
    }
  }

  getAllowedActions(actor: Actor, nft: Nft): any {
    let res: any = {};

    const st: State = this.states[nft.state];
    for (const mut of st.mutables) {
      if (
        !mut.by_roles.some((allowedRole: string) => actor.hasRole(allowedRole))
      ) {
        continue;
      }

      for (const attr of mut.attributes) {
        res[attr] = this.attrTypes[attr];
      }
    }

    return res;
  }

  tryAttributeApply(
    actor: Actor,
    nft: Nft,
    attr: string,
    v?: string,
  ): STMResult {
    const st = this.states[nft.state];
    const isAllowed =
      st.mutables.findIndex(
        (m: any) =>
          m.attributes.some((mutableAttr: string) => attr === mutableAttr) &&
          m.by_roles.some((allowedRole: string) => actor.hasRole(allowedRole)),
      ) !== -1;
    if (!isAllowed) {
      return <STMResult>{
        status: STMResultStatus.NOT_ALLOWED,
        message: `attribute '${attr}' is not allowed to be set by user with roles '${actor.roles}' for nft with state '${nft.state}'`,
      };
    }

    switch (this.attrTypes[attr]) {
      case 'votes':
        if (v === 'true') {
          this.#tryAttributeAddVote(nft, attr, actor.id);
        } else {
          this.#tryAttributeRemoveVote(nft, attr, actor.id);
        }
        break;
      default:
        this.#attributeSet(nft, attr, v);
        break;
    }

    log.notice(`nft.id ${nft.id}: '${attr}' ${v} (by actor.id ${actor.id})`);
    this.tryMoveNft(nft);

    return <STMResult>{
      status: STMResultStatus.OK,
    };
  }

  #attributeSet(nft: Nft, attr: string, v?: string) {
    if (typeof v === 'undefined') {
      nft.attributes[attr] = null;
      return;
    }
    nft.attributes[attr] = JSON.parse(v);
    log.info(`type of attribute '${attr}' is '${typeof nft.attributes[attr]}'`);
  }

  #tryAttributeRemoveVote(nft: Nft, attr: string, actorId: number) {
    if (!nft.attributes.hasOwnProperty(attr)) {
      throw `cannot remove actor id from non existing attr ${attr}, nft=${JSON.stringify(
        nft,
      )}`;
    }
    nft.attributes[attr] = nft.attributes[attr].filter(
      (id: number) => id !== actorId,
    );
  }

  #tryAttributeAddVote(nft: Nft, attr: string, actorId: number) {
    if (!nft.attributes.hasOwnProperty(attr)) {
      nft.attributes[attr] = [];
    }
    if (nft.attributes[attr].some((id: number) => id === actorId)) {
      throw `actor with id ${actorId} already signed nft with attr '${attr}', nft=${JSON.stringify(
        nft,
      )}'`;
    }
    nft.attributes[attr].push(actorId);
  }

  // move nft if possible to a new state
  // returns true if moved and adjusts nft in memory
  // returns false if not moved
  tryMoveNft(nft: Nft): boolean {
    const st = this.states[nft.state];

    for (const transition of st.transitions) {
      if (evalExpr<boolean>(nft, transition.when, false)) {
        log.notice(
          `nft.id ${nft.id} ${nft.state} -> ${
            transition.next_state
          }, attrs=${JSON.stringify(nft.attributes)}`,
        );
        nft.state = transition.next_state;
        if (typeof transition.do !== 'undefined') {
          execExpr(nft, transition.do);
        }
        return true;
      }
    }

    return false;
  }
}
