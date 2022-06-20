export interface CategoryEntity {
  id: number;
  name: string;
  description: string;
  metadata?: any;
  children?: CategoryEntity[];
}
