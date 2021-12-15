export interface UserType {
  id: number;
  address: string;
  username: string;
  disabled?: boolean;
  password?: string;
  email: string;
  roles: number[];
}

export interface NftType {
  id: number;
  name: string;
  editions: number;
  description: string;
  image: any;
  categories: any[];
  status: string;
}

export interface CategoryType {
  id: number;
  name: string;
  description: string;
  children: CategoryType[];
}
