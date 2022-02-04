export interface UserEntity {
  id: number;
  email: string;
  userName: string;
  address: string;
  roles: number[];
  password?: string;
  disabled?: boolean;
}
