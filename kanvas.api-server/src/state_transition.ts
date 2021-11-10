import { Ok, Err, Result } from 'ts-results'
import { NftEntity } from './nft/entity/nft.entity'
import { UserEntity } from './user/entity/user.entity'
import { findOne } from './utils'
import { assoc, and } from 'ramda'
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
  usersWhoConfirm: UserEntity[],
  newStatus: string,
) {
  // To transition the status of a NFT, the transition must be approved by a certain amount of users with the correct role.
  // The number of confirming users with role is defined in the NftStateTransitionConfig
  const transitionDeclaration: Result<TransitionDeclaration, string> = findOne(
    (transitionDeclaration: TransitionDeclaration) => {
      return and(
        transitionDeclaration.from == nft.status,
        transitionDeclaration.to == newStatus,
      )
    },
    config.transitions,
  )
  if (transitionDeclaration.ok) {
    let requiredRole: string = transitionDeclaration.val.requires[0]
    const confirmingUsersWithCorrectRole = usersWhoConfirm.filter(
      (user) => findOne((role: string) => role == requiredRole, user.roles).ok,
    )
    const requiredConfirmations = transitionDeclaration.val.requires[1]
    if (requiredConfirmations <= confirmingUsersWithCorrectRole.length) {
      // if (actualRolesPerUser.length >= requiredConfirmations) {
      return Ok(assoc('status', newStatus, nft))
    } else {
      return Err(
        `Given users does not have the required role to change nft #{nft.id} from from ${nft.status} to ${newStatus}`,
      )
    }
  } else {
    return transitionDeclaration
  }
}
