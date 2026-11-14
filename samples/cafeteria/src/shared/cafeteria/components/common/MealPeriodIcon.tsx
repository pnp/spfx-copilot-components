import * as React from "react"
import { GiCoffeeCup, GiMeal, GiCupcake, GiHotMeal } from "react-icons/gi"

import type { MealPeriod } from "../../models"

const MEAL_PERIOD_ICONS: Record<MealPeriod, React.ComponentType<{ size?: number }>> = {
  Breakfast: GiCoffeeCup,
  Lunch: GiMeal,
  Snacks: GiCupcake,
  Dinner: GiHotMeal,
}

export interface IMealPeriodIconProps {
  period: MealPeriod
  size?: number
}

export default function MealPeriodIcon(props: IMealPeriodIconProps): React.ReactElement {
  const Icon = MEAL_PERIOD_ICONS[props.period]
  return <Icon size={props.size ?? 20} />
}
