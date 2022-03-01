import * as fs from 'fs';
import { parse } from 'yaml';
import { evalExpr, execExpr } from './expr';
import { Nft, Actor } from './types';
import * as log from 'log';

interface State {
  transitions: [
    {
      next_state: string;
      when: string[];
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
  NOT_ALLOWED,
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

  getAttributes(): any {
    return this.attrTypes;
  }

  getAttributeType(attr: string): string {
    return this.attrTypes[attr];
  }

  getAllowedActions(actor: Actor, nft: Nft): any {
    const res: any = {};

    const st: State | undefined = this.states[nft.state];
    if (typeof st === 'undefined') {
      return res;
    }
    for (const mut of st?.mutables) {
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
    v?: string | null,
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
        this.#attributeSetVote(nft, actor.id, attr, v);
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

  #attributeSet(nft: Nft, attr: string, v?: string | null) {
    if (isBottom(v)) {
      nft.attributes[attr] = null;
      return;
    }

    /* eslint-disable  @typescript-eslint/no-non-null-assertion */
    nft.attributes[attr] = JSON.parse(v!);
  }

  #attributeSetVote(
    nft: Nft,
    actorId: number,
    attr: string,
    v?: string | null,
  ) {
    if (isBottom(v)) {
      this.#removeVote(nft, actorId, attr, 'no');
      this.#removeVote(nft, actorId, attr, 'yes');
      return;
    }
    if (v === '1') {
      this.#addVote(nft, actorId, attr, 'yes');
      this.#removeVote(nft, actorId, attr, 'no');
    } else if (v === '0') {
      this.#addVote(nft, actorId, attr, 'no');
      this.#removeVote(nft, actorId, attr, 'yes');
    } else {
      throw `bad vote value ${v}`;
    }
  }

  #addVote(nft: Nft, actorId: number, attr: string, side: 'yes' | 'no') {
    if (!nft.attributes.hasOwnProperty(attr)) {
      nft.attributes[attr] = {
        yes: [],
        no: [],
      };
    }
    if (nft.attributes[attr][side].some((id: number) => id === actorId)) {
      throw `actor with id ${actorId} already voted ${side} nft with attr '${attr}', nft=${JSON.stringify(
        nft,
      )}'`;
    }
    nft.attributes[attr][side].push(actorId);
  }

  #removeVote(nft: Nft, actorId: number, attr: string, side: 'yes' | 'no') {
    if (!nft.attributes.hasOwnProperty(attr)) {
      return;
    }
    nft.attributes[attr][side] = nft.attributes[attr][side].filter(
      (id: number) => id !== actorId,
    );
  }

  // move nft if possible to a new state
  // returns for each possible transition target the list of conditions that
  // were not met (and if we did transition, returns []).
  tryMoveNft(nft: Nft): any {
    const st = this.states[nft.state];

    const unmetTransitionConditions: any = {};
    for (const transition of st?.transitions || []) {
      let allSucceed = true;

      unmetTransitionConditions[transition.next_state] = [];
      for (const condition of transition.when) {
        if (!evalExpr<boolean>(nft, condition, false)) {
          allSucceed = false;

          unmetTransitionConditions[transition.next_state].push(condition);
        }
      }

      if (allSucceed) {
        log.notice(
          `nft.id ${nft.id} ${nft.state} -> ${
            transition.next_state
          }, attrs=${JSON.stringify(nft.attributes)}`,
        );

        nft.state = transition.next_state;
        if (typeof transition.do !== 'undefined') {
          execExpr(nft, transition.do);
        }
        return {};
      }
    }

    return unmetTransitionConditions;
  }
}

function isBottom(v: any): boolean {
  // note: v here is checked for Javascripts' bottom values (null and undefined)
  //       because undefined coerces into null. And its safe because nothing
  //       else coerces into null (other than null itself).
  return v == null;
}
