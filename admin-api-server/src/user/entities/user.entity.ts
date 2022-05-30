export interface UserEntity {
  id: number;
  email: string;
  userName: string;
  roles: number[];
  password?: string;
  disabled?: boolean;
}
