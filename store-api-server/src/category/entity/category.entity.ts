export interface CategoryEntity {
  id: number;
  name: string;
  description: string;
  metadata?: any;
  children?: CategoryEntity[];
}

export interface CategoriesInfo {
  categories: CategoryEntity[];

  info: {
    [key: number]: {
      totalNftCount: number;
      unavailableNftCount: number;
    };
  };
}
