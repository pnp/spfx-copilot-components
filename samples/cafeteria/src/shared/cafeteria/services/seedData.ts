import type { ICafeteria, IMenuItem, IWeeklyHours } from "../models"

const ALL_DAYS_LONG: IWeeklyHours = {
  mon: ["07:00", "21:00"],
  tue: ["07:00", "21:00"],
  wed: ["07:00", "21:00"],
  thu: ["07:00", "21:00"],
  fri: ["07:00", "21:00"],
  sat: ["08:00", "18:00"],
  sun: ["08:00", "18:00"],
}

const WEEKDAYS_ONLY: IWeeklyHours = {
  mon: ["08:00", "16:00"],
  tue: ["08:00", "16:00"],
  wed: ["08:00", "16:00"],
  thu: ["08:00", "16:00"],
  fri: ["08:00", "16:00"],
  sat: undefined,
  sun: undefined,
}

const LUNCH_ONLY: IWeeklyHours = {
  mon: ["11:00", "15:00"],
  tue: ["11:00", "15:00"],
  wed: ["11:00", "15:00"],
  thu: ["11:00", "15:00"],
  fri: ["11:00", "15:00"],
  sat: ["11:00", "15:00"],
  sun: undefined,
}

export const SPICE_ROUTE_ID = "cafeteria-b4-spice-route"
export const THE_DELI_ID = "cafeteria-b4-the-deli"
export const DRAGON_WOK_ID = "cafeteria-b7-dragon-wok"
export const GARDEN_CAFE_ID = "cafeteria-b7-garden-cafe"
export const NORTHSIDE_KITCHEN_ID = "cafeteria-b12-northside-kitchen"

export const SEED_CAFETERIAS: ICafeteria[] = [
  {
    id: SPICE_ROUTE_ID,
    title: "Spice Route",
    building: "Building 4",
    floor: "1",
    capacity: 120,
    cuisineTags: ["Indian", "Grill"],
    imageUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ef/Tradtional_Thali.jpg/330px-Tradtional_Thali.jpg",
    openingHours: ALL_DAYS_LONG,
    timeZone: "Asia/Kolkata",
    contactEmail: "spiceroute.b4@contoso.com",
    paymentMethods: ["Card", "UPI", "Payroll deduction"],
    isActive: true,
  },
  {
    id: THE_DELI_ID,
    title: "The Deli",
    building: "Building 4",
    floor: "2",
    capacity: 60,
    cuisineTags: ["Continental"],
    imageUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/1/17/Rome_Italian_deli.jpg/330px-Rome_Italian_deli.jpg",
    openingHours: WEEKDAYS_ONLY,
    timeZone: "Asia/Kolkata",
    contactEmail: "thedeli.b4@contoso.com",
    paymentMethods: ["Card", "UPI"],
    isActive: true,
  },
  {
    id: DRAGON_WOK_ID,
    title: "Dragon Wok",
    building: "Building 7",
    floor: "1",
    capacity: 80,
    cuisineTags: ["Asian"],
    imageUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0d/Collage_Chinese_Cuisine_by_User-EME.png/330px-Collage_Chinese_Cuisine_by_User-EME.png",
    openingHours: LUNCH_ONLY,
    timeZone: "Asia/Kolkata",
    contactEmail: "dragonwok.b7@contoso.com",
    paymentMethods: ["Card", "Cash"],
    isActive: true,
  },
  {
    id: GARDEN_CAFE_ID,
    title: "Garden Cafe",
    building: "Building 7",
    floor: "Ground",
    capacity: 100,
    cuisineTags: ["Continental", "Indian"],
    imageUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fd/Caf%C3%A9_de_Flore.jpg/330px-Caf%C3%A9_de_Flore.jpg",
    openingHours: ALL_DAYS_LONG,
    timeZone: "Asia/Kolkata",
    contactEmail: "gardencafe.b7@contoso.com",
    paymentMethods: ["Card", "UPI", "Cash"],
    closureNotice: "Closed for kitchen renovation. Reopening soon — thank you for your patience.",
    closureUntil: "2026-09-15",
    isActive: true,
  },
  {
    id: NORTHSIDE_KITCHEN_ID,
    title: "Northside Kitchen",
    building: "Building 12",
    floor: "3",
    capacity: 90,
    cuisineTags: ["Grill", "Continental"],
    imageUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ae/Grillen_-_BBQ_-_Barbeque_-_Fleisch_auf_dem_Grill.jpg/330px-Grillen_-_BBQ_-_Barbeque_-_Fleisch_auf_dem_Grill.jpg",
    openingHours: ALL_DAYS_LONG,
    timeZone: "America/New_York",
    contactEmail: "northside.b12@contoso.com",
    paymentMethods: ["Card", "Payroll deduction"],
    isActive: true,
  },
]

let nextItemId = 1
function item(
  cafeteriaId: string,
  fields: Omit<IMenuItem, "id" | "menuId" | "cafeteriaId">,
): IMenuItem {
  const id = `menu-item-${nextItemId++}`
  return { id, menuId: `menu-${cafeteriaId}-today`, cafeteriaId, ...fields }
}

/**
 * Today's menu items per cafeteria. A cafeteria with no entry here (Northside
 * Kitchen) deliberately has no published menu today, demonstrating the F12
 * "not published yet" empty state and the UC-4 roll-up note.
 */
export const SEED_TODAYS_MENU_ITEMS: Record<string, IMenuItem[]> = {
  [SPICE_ROUTE_ID]: [
    item(SPICE_ROUTE_ID, {
      title: "Masala Dosa",
      mealPeriod: "Breakfast",
      description: "Crisp rice-and-lentil crepe with potato masala and chutney.",
      imageUrl:
        "https://upload.wikimedia.org/wikipedia/commons/thumb/b/ba/Masala_Dosa_2023.jpg/330px-Masala_Dosa_2023.jpg",
      price: 80,
      dietaryTags: ["Vegetarian", "GlutenFree"],
      spiceLevel: "Mild",
      sortOrder: 1,
    }),
    item(SPICE_ROUTE_ID, {
      title: "Idli Sambar",
      mealPeriod: "Breakfast",
      description: "Steamed rice cakes with lentil sambar.",
      imageUrl:
        "https://upload.wikimedia.org/wikipedia/commons/thumb/1/11/Idli_Sambar.JPG/330px-Idli_Sambar.JPG",
      price: 60,
      dietaryTags: ["Vegetarian", "Vegan", "GlutenFree"],
      spiceLevel: "Mild",
      sortOrder: 2,
    }),
    item(SPICE_ROUTE_ID, {
      title: "Paneer Butter Masala",
      mealPeriod: "Lunch",
      description: "Cottage cheese in a rich tomato-butter gravy.",
      imageUrl:
        "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ad/Shahi_panner.jpg/330px-Shahi_panner.jpg",
      price: 140,
      dietaryTags: ["Vegetarian"],
      spiceLevel: "Medium",
      sortOrder: 1,
    }),
    item(SPICE_ROUTE_ID, {
      title: "Chicken Tikka",
      mealPeriod: "Lunch",
      description: "Char-grilled marinated chicken skewers.",
      imageUrl:
        "https://upload.wikimedia.org/wikipedia/commons/thumb/b/bd/Tandoorimumbai.jpg/330px-Tandoorimumbai.jpg",
      price: 180,
      dietaryTags: ["Halal"],
      spiceLevel: "Hot",
      sortOrder: 2,
    }),
    item(SPICE_ROUTE_ID, {
      title: "Dal Tadka",
      mealPeriod: "Lunch",
      description: "Yellow lentils tempered with cumin and garlic.",
      imageUrl:
        "https://upload.wikimedia.org/wikipedia/commons/thumb/0/09/Chaunkphoto.jpg/330px-Chaunkphoto.jpg",
      price: 90,
      dietaryTags: ["Vegan", "GlutenFree"],
      spiceLevel: "Mild",
      sortOrder: 3,
    }),
    item(SPICE_ROUTE_ID, {
      title: "Samosa Chaat",
      mealPeriod: "Snacks",
      description: "Crushed samosa topped with yogurt and tamarind chutney.",
      imageUrl:
        "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c4/Samosas%2C_snack_food_at_Wikipedia%27s_16th_Birthday_celebration_in_Chittagong_%2801%29.jpg/330px-Samosas%2C_snack_food_at_Wikipedia%27s_16th_Birthday_celebration_in_Chittagong_%2801%29.jpg",
      price: 50,
      dietaryTags: ["Vegetarian"],
      spiceLevel: "Medium",
      sortOrder: 1,
      isSoldOut: true,
    }),
  ],
  [THE_DELI_ID]: [
    item(THE_DELI_ID, {
      title: "Ham & Cheese Croissant",
      mealPeriod: "Breakfast",
      description: "Buttery croissant with ham and melted cheese.",
      imageUrl:
        "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Croissant-Petr_Kratochvil.jpg/330px-Croissant-Petr_Kratochvil.jpg",
      price: 90,
      dietaryTags: ["Contains Egg"],
      sortOrder: 1,
    }),
    item(THE_DELI_ID, {
      title: "Grilled Veggie Sandwich",
      mealPeriod: "Lunch",
      description: "Grilled seasonal vegetables on multigrain bread.",
      imageUrl:
        "https://upload.wikimedia.org/wikipedia/commons/thumb/2/26/Vegetable_sandwiches.jpg/330px-Vegetable_sandwiches.jpg",
      price: 120,
      dietaryTags: ["Vegetarian", "NutFree"],
      sortOrder: 1,
    }),
    item(THE_DELI_ID, {
      title: "Caesar Salad",
      mealPeriod: "Lunch",
      description: "Romaine, parmesan, croutons, Caesar dressing.",
      imageUrl:
        "https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/Caesar_salad_%282%29.jpg/330px-Caesar_salad_%282%29.jpg",
      price: 110,
      dietaryTags: ["Contains Egg", "GlutenFree"],
      sortOrder: 2,
    }),
    item(THE_DELI_ID, {
      title: "Tomato Basil Soup",
      mealPeriod: "Lunch",
      description: "Slow-roasted tomato soup with fresh basil.",
      imageUrl:
        "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Tomato_soup%2C_plant-based_%2844040252791%29.jpg/330px-Tomato_soup%2C_plant-based_%2844040252791%29.jpg",
      price: 70,
      dietaryTags: ["Vegan", "GlutenFree"],
      sortOrder: 3,
    }),
    item(THE_DELI_ID, {
      title: "Fruit Bowl",
      mealPeriod: "Snacks",
      description: "Seasonal fresh-cut fruit.",
      imageUrl:
        "https://upload.wikimedia.org/wikipedia/commons/thumb/7/74/Fruktsallad_%28Fruit_salad%29.jpg/330px-Fruktsallad_%28Fruit_salad%29.jpg",
      price: 60,
      dietaryTags: ["Vegan", "GlutenFree", "NutFree"],
      sortOrder: 1,
    }),
  ],
  [DRAGON_WOK_ID]: [
    item(DRAGON_WOK_ID, {
      title: "Veg Fried Rice",
      mealPeriod: "Lunch",
      description: "Wok-tossed rice with mixed vegetables.",
      imageUrl:
        "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/Koh_Mak%2C_Thailand%2C_Fried_rice_with_seafood%2C_Thai_fried_rice.jpg/330px-Koh_Mak%2C_Thailand%2C_Fried_rice_with_seafood%2C_Thai_fried_rice.jpg",
      price: 110,
      dietaryTags: ["Vegetarian", "Vegan"],
      spiceLevel: "Medium",
      sortOrder: 1,
    }),
    item(DRAGON_WOK_ID, {
      title: "Chicken Manchurian",
      mealPeriod: "Lunch",
      description: "Crispy chicken tossed in a tangy Indo-Chinese sauce.",
      imageUrl:
        "https://upload.wikimedia.org/wikipedia/commons/thumb/b/bb/Chicken_Manchurian_%28Hyderabad_Style%29_%2811960049916%29.jpg/330px-Chicken_Manchurian_%28Hyderabad_Style%29_%2811960049916%29.jpg",
      price: 160,
      dietaryTags: ["Halal"],
      spiceLevel: "Hot",
      sortOrder: 2,
    }),
    item(DRAGON_WOK_ID, {
      title: "Tofu Pad Thai",
      mealPeriod: "Lunch",
      description: "Rice noodles, tofu, tamarind sauce, bean sprouts.",
      imageUrl:
        "https://upload.wikimedia.org/wikipedia/commons/thumb/3/39/Phat_Thai_kung_Chang_Khien_street_stall.jpg/330px-Phat_Thai_kung_Chang_Khien_street_stall.jpg",
      price: 140,
      dietaryTags: ["Vegan"],
      spiceLevel: "Medium",
      sortOrder: 3,
    }),
    item(DRAGON_WOK_ID, {
      title: "Spring Rolls",
      mealPeriod: "Snacks",
      description: "Crispy vegetable spring rolls with sweet chili dip.",
      imageUrl:
        "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/Spring_Rolls_%283357696061%29.jpg/330px-Spring_Rolls_%283357696061%29.jpg",
      price: 70,
      dietaryTags: ["Vegetarian"],
      spiceLevel: "Mild",
      sortOrder: 1,
    }),
    item(DRAGON_WOK_ID, {
      title: "Miso Soup",
      mealPeriod: "Lunch",
      description: "Light soybean broth with tofu and scallion.",
      imageUrl:
        "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e8/Miso_Soup_001.jpg/330px-Miso_Soup_001.jpg",
      price: 50,
      dietaryTags: ["Vegan", "GlutenFree"],
      spiceLevel: "Mild",
      sortOrder: 4,
    }),
  ],
  [GARDEN_CAFE_ID]: [
    item(GARDEN_CAFE_ID, {
      title: "Grilled Cheese Sandwich",
      mealPeriod: "Lunch",
      description: "Toasted sourdough with a three-cheese blend.",
      imageUrl:
        "https://upload.wikimedia.org/wikipedia/commons/thumb/1/13/Classic_Grilled_Cheese_Sandwich_%2825791331763%29_%28cropped%29.jpg/330px-Classic_Grilled_Cheese_Sandwich_%2825791331763%29_%28cropped%29.jpg",
      price: 80,
      dietaryTags: ["Vegetarian"],
      sortOrder: 1,
    }),
    item(GARDEN_CAFE_ID, {
      title: "Greek Salad",
      mealPeriod: "Lunch",
      description: "Cucumber, tomato, olives, feta, oregano vinaigrette.",
      imageUrl:
        "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f2/Greece_Food_Horiatiki.JPG/330px-Greece_Food_Horiatiki.JPG",
      price: 100,
      dietaryTags: ["Vegetarian", "GlutenFree"],
      sortOrder: 2,
    }),
  ],
}
