export interface Nft {
  id: number;
  state: string;
  attributes: any;
}

export class Actor {
  id: number;
  roles: string[];

  constructor(id: number, roles: string[]) {
    this.id = id;
    this.roles = roles;
  }

  hasRole(role: string) {
    return this.roles.some((r: string) => r === role);
  }
}
