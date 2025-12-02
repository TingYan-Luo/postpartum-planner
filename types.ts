export enum MealType {
  BREAKFAST = '早餐',
  MORNING_SNACK = '早加餐',
  LUNCH = '午餐',
  AFTERNOON_SNACK = '午加餐',
  DINNER = '晚餐'
}

export interface Meal {
  id: string;
  name: string;
  type: string; // Keep flexible as string to match Chinese output directly
  description: string;
  calories?: number;
  tags: string[];
  isCompleted?: boolean;
}

export interface RecipeDetails {
  ingredients: string[];
  steps: string[];
  tips: string[];
  nutritionHighlights: string;
}

export interface DailyPlan {
  day: number;
  phase: string;
  meals: Meal[];
}

export interface UserSettings {
  startDate: string; // ISO Date string
  dislikes: string[];
  allergies: string[];
  lactationSupport: boolean;
  isSeniorMode: boolean; // New: Senior mode flag
}

export interface ShoppingItem {
  name: string;
  amount: string;
  category: string;
  checked: boolean;
}

export interface ShoppingList {
  startDate: string;
  daysCovered: number;
  items: ShoppingItem[];
}