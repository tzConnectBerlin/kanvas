export interface CategoryEntity {
  id: number;
  name: string;
  description: string;
  metadata?: any;
  children?: CategoryEntity[];
}

export interface CategoriesExtendedInfo {
  categories: CategoryEntity[];

  info: {
    [key: number]: {
      totalNftCount: number;
      unavailableNftCount: number;
    };
  };
}
