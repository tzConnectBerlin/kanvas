export interface CategoryEntity {
  id: number;
  name: string;
  description: string;
  children: CategoryEntity[];
}
