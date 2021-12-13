export interface UserEntity {
  id: number;
  email: string;
  userName: string;
  address: string;
  password?: string;
  disabled: boolean;
  roles: number[];
}
