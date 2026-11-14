export type DietaryTag =
  | "Vegetarian"
  | "Vegan"
  | "Halal"
  | "Jain"
  | "GlutenFree"
  | "NutFree"
  | "Contains Egg"

export const DIETARY_TAGS: DietaryTag[] = [
  "Vegetarian",
  "Vegan",
  "Halal",
  "Jain",
  "GlutenFree",
  "NutFree",
  "Contains Egg",
]

export const DIETARY_TAG_LABEL: Record<DietaryTag, string> = {
  Vegetarian: "Vegetarian",
  Vegan: "Vegan",
  Halal: "Halal",
  Jain: "Jain",
  GlutenFree: "Gluten-free",
  NutFree: "Nut-free",
  "Contains Egg": "Contains egg",
}

export type MealPeriod = "Breakfast" | "Lunch" | "Snacks" | "Dinner"

export const MEAL_PERIOD_ORDER: MealPeriod[] = [
  "Breakfast",
  "Lunch",
  "Snacks",
  "Dinner",
]

export type CuisineTag = "Indian" | "Continental" | "Asian" | "Grill"

export const CUISINE_TAGS: CuisineTag[] = [
  "Indian",
  "Continental",
  "Asian",
  "Grill",
]

export const CUISINE_TAG_LABEL: Record<CuisineTag, string> = {
  Indian: "Indian",
  Continental: "Continental",
  Asian: "Asian",
  Grill: "Grill",
}

export type PaymentMethod = "Card" | "UPI" | "Payroll deduction" | "Cash"

export const PAYMENT_METHODS: PaymentMethod[] = [
  "Card",
  "UPI",
  "Payroll deduction",
  "Cash",
]

export type SpiceLevel = "Mild" | "Medium" | "Hot"

export type MenuStatus = "Draft" | "Published"

export type Weekday = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun"

export const WEEKDAY_ORDER: Weekday[] = [
  "mon",
  "tue",
  "wed",
  "thu",
  "fri",
  "sat",
  "sun",
]

export const WEEKDAY_LABEL: Record<Weekday, string> = {
  mon: "Monday",
  tue: "Tuesday",
  wed: "Wednesday",
  thu: "Thursday",
  fri: "Friday",
  sat: "Saturday",
  sun: "Sunday",
}
