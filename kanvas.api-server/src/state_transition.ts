import { Ok, Err, Result } from 'ts-results'
import { NftEntity } from './nft/entity/nft.entity'
import { UserEntity } from './user/entity/user.entity'
import { assert } from 'src/utils'
import { assoc, filter, find, propEq, and } from 'ramda'
type StateDeclaration = {
  [key: string]: Array<string>
}

type TransitionDeclaration = {
  from: string
  to: string
  requires: [string, number] // role, how many must confirm
}

export type NftStateTransitionConfig = {
  states: StateDeclaration
  roles: Array<string> // refers to UserEntity.roles
  transitions: Array<TransitionDeclaration>
}

export function transition(
  config: NftStateTransitionConfig,
  nft: NftEntity,
  user: UserEntity,
  newStatus: string,
) {
  let currentStatus = nft.status
  let transitionDeclaration = config.transitions.filter(
    (transitionDeclaration) =>
      and(
        transitionDeclaration.from == currentStatus,
        transitionDeclaration.to == newStatus,
      ),
  )[0]

  if (transitionDeclaration) {
    let requiredRole: string = transitionDeclaration.requires[0]
    console.debug(requiredRole, user.roles)
    let actualRoles = user.roles.filter((role) => role === requiredRole)
    if (actualRoles.length === 0) {
      return Err(
        `User #{user.id} does not have the required role to change nft #{nft.id} from from ${currentStatus} to ${newStatus}`,
      )
    } else if (actualRoles[0] === requiredRole) {
      return Ok(assoc('status', newStatus, nft))
    }
  }
}
