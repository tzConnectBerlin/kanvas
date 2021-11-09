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
