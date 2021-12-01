/* import { Ok, Err, Result } from 'ts-results';
import { Nft } from './nft/entities/nft.entity';
import { User } from './user/entities/user.entity';
import { findOne } from './utils';
import { assoc, and } from 'ramda';

type StateDeclaration = {
  terminal: string[];
  nonterminal: string[];
};

type TransitionDeclaration = {
  fromRole: string;
  toRole: string;
  requiresRole: string;
  requiresConfirmations: number; // So many of `requiresRole` must confirm
};

export type NftStateTransitionConfig = {
  states: StateDeclaration;
  roles: Array<string>; // refers to User.roles
  transitions: Array<TransitionDeclaration>;
};

export function transition(
  config: NftStateTransitionConfig,
  nft: Nft,
  usersWhoConfirm: User[],
  newStatus: string,
) {
  // To transition the status of a NFT, the transition must be approved by a certain amount of users with the correct role.
  // The number of confirming users with role is defined in the NftStateTransitionConfig
  const transitionDeclaration: Result<TransitionDeclaration, string> = findOne(
    (transitionDeclaration: TransitionDeclaration) => {
      return and(
        transitionDeclaration.fromRole == nft.status,
        transitionDeclaration.toRole == newStatus,
      );
    },
    config.transitions,
  );

  if (transitionDeclaration.ok) {
    let requiredRole: string = transitionDeclaration.val.requiresRole;
    const confirmingUsersWithCorrectRole = usersWhoConfirm.filter(
      (user) => findOne((role: string) => role == requiredRole, user.roles).ok,
    );

    const requiredConfirmations =
      transitionDeclaration.val.requiresConfirmations;
    if (requiredConfirmations <= confirmingUsersWithCorrectRole.length) {
      // if (actualRolesPerUser.length >= requiredConfirmations) {
      return new Ok(assoc('status', newStatus, nft));
    } else {
      return new Err(
        `Given users does not have the required role to change nft #{nft.id} from from ${nft.status} to ${newStatus}`,
      );
    }
  } else {
    return new Err(
      `Found no config declaration for transtition from state ${nft.status} to ${newStatus}. Please double-check your spelling here and in the configuration`,
    );
  }
}

type SExp = string | SExp[];

type StringArrayOfSexpError = string;

const stringArrayOfSexp = (
  sexp: SExp,
): Result<string[], StringArrayOfSexpError> => {
  if (Array.isArray(sexp)) {
    const returnval: string[] = sexp
      .map((s) => {
        if (!Array.isArray(s)) {
          const newS: string = s;
          return newS;
        } else {
          return '';
        }
      })
      .filter((x) => x !== '');
    return new Ok(returnval);
  } else {
    return new Err(`Expected Array from ${sexp}`);
  }
};

export function parse(sexp: SExp) {
  let errors = [];
  let output: NftStateTransitionConfig = {
    states: { terminal: [], nonterminal: [] },
    roles: [],
    transitions: [],
  };
  // console.debug(sexp)
  if (Array.isArray(sexp)) {
    for (let i = 0; i < sexp.length; i++) {
      if (sexp[i][0] == 'states') {
        const terminal = stringArrayOfSexp(sexp[i][1]);
        const nonterminal = stringArrayOfSexp(sexp[i][2]);
        if (terminal.ok && nonterminal.ok) {
          output.states = {
            terminal: terminal.val,
            nonterminal: nonterminal.val,
          };
        } else {
          errors.push(
            `ParseError: Failed to create 'states' field from source ${
              sexp[i][1]
            }. ${JSON.stringify({
              terminal: terminal.val,
              nonterminal: nonterminal.val,
            })}`,
          );
        }
      } else if (sexp[i][0] == 'roles') {
        const roles = stringArrayOfSexp(sexp[i][1]);
        if (roles.ok) {
          output.roles = roles.val;
        } else {
          errors.push(roles.val);
        }
      } else if (sexp[i][0] == 'transition') {
        const fromTo = stringArrayOfSexp(sexp[i][1]);
        const requiresRoleConfirmations = stringArrayOfSexp(sexp[i][2]);
        if (fromTo.val.length == 2) {
          const confirmerRole = requiresRoleConfirmations.val[1];
          const confirmations =
            requiresRoleConfirmations.val[0] == 'requires' &&
            requiresRoleConfirmations.val.length === 3
              ? parseInt(requiresRoleConfirmations.val[2])
              : 1;

          output.transitions.push({
            fromRole: fromTo.val[0],
            toRole: fromTo.val[1],
            requiresConfirmations: confirmations,
            requiresRole: confirmerRole,
          });
        } else {
          errors.push(`Can't parse transition ${sexp[i]}`);
        }
      }
    }
    if (errors.length == 0) {
      return new Ok(output);
    } else {
      return new Ok(output); //Err(errors)
    }
  } else {
    return new Ok(output); //Err(["Can't parse a string - give me a list of list of string"])
  }
}
 */
