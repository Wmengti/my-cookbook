export interface Recipe {
  菜名: string;
  类型: string;
  主要原料: string;
  配料调料: string;
  做法: string;
  备注: string;
}

export type RecipeKey = keyof Recipe; 