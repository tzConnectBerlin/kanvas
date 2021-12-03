export class User {
  id: number;
  email: string;
  userName: string;
  address: string;
  password?: string;
  disabled: boolean;
  roles: number[];
}
