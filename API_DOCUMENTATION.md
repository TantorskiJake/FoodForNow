# FoodForNow API Documentation

## Overview

The FoodForNow API is a RESTful service built with Node.js and Express.js, providing endpoints for user authentication, recipe management, meal planning, pantry management, and shopping list functionality. The API uses JWT authentication and MongoDB for data storage.

**Base URL**: `http://localhost:3001/api` (development)  
**Content-Type**: `application/json`  
**Authentication**: JWT tokens (HTTP-only cookies)

## Authentication

### JWT Token Format

JWT tokens are automatically handled via HTTP-only cookies. The token contains:

```json
{
  "userId": "user_id",
  "email": "user@example.com",
  "iat": 1640995200,
  "exp": 1641081600
}
```

### Error Responses

All endpoints return consistent error responses:

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error information (development only)"
}
```

## Endpoints

## Authentication Endpoints

### POST `/api/auth/register`

Register a new user account.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword123"
}
```

**Validation Rules:**
- `name`: Required, 2-50 characters
- `email`: Required, valid email format, unique
- `password`: Required, minimum 8 characters

**Success Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error Responses:**
- `400`: Validation error
- `409`: Email already exists

---

### POST `/api/auth/login`

Authenticate user and return JWT token.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "securepassword123"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

**Error Responses:**
- `400`: Invalid credentials
- `401`: Authentication failed

---

### POST `/api/auth/logout`

Logout user and invalidate JWT token.

**Success Response (200):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

### POST `/api/auth/token`

Refresh access token using refresh token (stored in HTTP-only cookie).

**Success Response (200):**
```json
{
  "success": true
}
```

**Error Responses:**
- `401`: No refresh token or invalid token
- `403`: Invalid or expired refresh token

---

### POST `/api/auth/forgot-password`

Request a password reset for the given email address.

**Request Body:**
```json
{
  "email": "john@example.com"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "If that email exists, a reset link will be sent.",
  "resetToken": "hex_token_string"
}
```

**Note:** Returns success regardless of whether the email exists (prevents email enumeration). The `resetToken` is returned for development; in production, this would be sent via email.

---

### POST `/api/auth/reset-password`

Reset password using the token from forgot-password.

**Request Body:**
```json
{
  "token": "reset_token_from_forgot_password",
  "newPassword": "newSecurePassword123!"
}
```

**Validation Rules:**
- `token`: Required
- `newPassword`: Required, minimum 8 characters, must contain uppercase, lowercase, digit, and special character

**Success Response (200):**
```json
{
  "success": true,
  "message": "Password has been reset. You can now sign in."
}
```

**Error Responses:**
- `400`: Invalid or expired token, or validation error

---

### PUT `/api/auth/profile`

Update the authenticated user's profile. Requires authentication.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "bio": "Food enthusiast",
  "location": "New York",
  "website": "https://example.com",
  "profilePicture": "https://example.com/avatar.jpg",
  "preferences": {
    "theme": "dark",
    "units": "metric",
    "language": "en",
    "timezone": "America/New_York"
  },
  "notifications": {
    "email": true,
    "push": true,
    "mealReminders": true,
    "shoppingReminders": true
  },
  "currentPassword": "current_password",
  "newPassword": "new_password"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "bio": "Food enthusiast",
    "location": "New York",
    "website": "https://example.com",
    "profilePicture": "https://example.com/avatar.jpg",
    "preferences": {...},
    "notifications": {...},
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Note:** When changing password, both `currentPassword` and `newPassword` are required.

---

### GET `/api/auth/me`

Get current authenticated user information.

**Headers Required:**
- Authentication token (cookie or Authorization header)

**Success Response (200):**
```json
{
  "success": true,
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "bio": "Food enthusiast",
    "location": "New York",
    "website": "https://example.com",
    "profilePicture": "https://example.com/avatar.jpg",
    "preferences": {
      "theme": "dark",
      "units": "metric",
      "language": "en",
      "timezone": "America/New_York"
    },
    "notifications": {
      "email": true,
      "push": true,
      "mealReminders": true,
      "shoppingReminders": true
    },
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error Responses:**
- `401`: Unauthorized

---

## Recipe Endpoints

### GET `/api/recipes`

Get all recipes for the authenticated user.

**Query Parameters:**
- `search` (string): Search recipes by name
- `tags` (string): Filter by tags (comma-separated)
- `limit` (number): Number of recipes to return (default: 20, max: 100)
- `page` (number): Page number for pagination (default: 1)
- `sortBy` (string): Sort field (name, createdAt, updatedAt)
- `sortOrder` (string): Sort order (asc, desc)

**Success Response (200):**
```json
{
  "success": true,
  "recipes": [
    {
      "id": "507f1f77bcf86cd799439011",
      "name": "Spaghetti Carbonara",
      "description": "Classic Italian pasta dish",
      "ingredients": [
        {
          "ingredient": {
            "id": "507f1f77bcf86cd799439012",
            "name": "Spaghetti",
            "category": "pasta"
          },
          "quantity": 500,
          "unit": "g"
        }
      ],
      "instructions": [
        "Boil pasta according to package instructions",
        "Cook bacon until crispy"
      ],
      "prepTime": 15,
      "cookTime": 20,
      "servings": 4,
      "tags": ["italian", "pasta"],
      "createdBy": "507f1f77bcf86cd799439013",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalRecipes": 100,
    "hasNext": true,
    "hasPrev": false
  }
}
```

---

### GET `/api/recipes/popular`

Get the authenticated user's most popular recipes (sorted by popularity).

**Success Response (200):**
```json
[
  {
    "id": "507f1f77bcf86cd799439011",
    "name": "Spaghetti Carbonara",
    "description": "Classic Italian pasta dish",
    "ingredients": [...],
    "popularity": 10,
    ...
  }
]
```

---

### GET `/api/recipes/shared`

Get recipes shared by other users (excluding recipes with names the user already has).

**Query Parameters:**
- `search` (string): Search shared recipes by name

**Success Response (200):**
```json
[
  {
    "id": "507f1f77bcf86cd799439011",
    "name": "Shared Recipe Name",
    "description": "...",
    "ingredients": [...],
    "createdBy": "other_user_id",
    ...
  }
]
```

---

### POST `/api/recipes`

Create a new recipe.

**Request Body:**
```json
{
  "name": "Spaghetti Carbonara",
  "description": "Classic Italian pasta dish",
  "ingredients": [
    {
      "ingredient": "507f1f77bcf86cd799439012",
      "quantity": 500,
      "unit": "g"
    }
  ],
  "instructions": [
    "Boil pasta according to package instructions",
    "Cook bacon until crispy"
  ],
  "prepTime": 15,
  "cookTime": 20,
  "servings": 4,
  "tags": ["italian", "pasta"]
}
```

**Validation Rules:**
- `name`: Required, 1-100 characters
- `description`: Required, 1-500 characters
- `ingredients`: Required, non-empty array
- `instructions`: Required, non-empty array
- `prepTime`: Required, positive number
- `cookTime`: Required, positive number
- `servings`: Required, positive number

**Success Response (201):**
```json
{
  "success": true,
  "message": "Recipe created successfully",
  "recipe": {
    "id": "507f1f77bcf86cd799439011",
    "name": "Spaghetti Carbonara",
    "description": "Classic Italian pasta dish",
    "ingredients": [...],
    "instructions": [...],
    "prepTime": 15,
    "cookTime": 20,
    "servings": 4,
    "tags": ["italian", "pasta"],
    "createdBy": "507f1f77bcf86cd799439013",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error Responses:**
- `400`: Validation error
- `409`: Recipe name already exists for user

---

### GET `/api/recipes/:id`

Get a specific recipe by ID.

**Success Response (200):**
```json
{
  "success": true,
  "recipe": {
    "id": "507f1f77bcf86cd799439011",
    "name": "Spaghetti Carbonara",
    "description": "Classic Italian pasta dish",
    "ingredients": [...],
    "instructions": [...],
    "prepTime": 15,
    "cookTime": 20,
    "servings": 4,
    "tags": ["italian", "pasta"],
    "createdBy": "507f1f77bcf86cd799439013",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error Responses:**
- `404`: Recipe not found
- `403`: Access denied (not owner)

---

### PUT `/api/recipes/:id`

Update an existing recipe.

**Request Body:** (Same as POST, all fields optional)

**Success Response (200):**
```json
{
  "success": true,
  "message": "Recipe updated successfully",
  "recipe": {
    "id": "507f1f77bcf86cd799439011",
    "name": "Updated Spaghetti Carbonara",
    "description": "Updated description",
    "ingredients": [...],
    "instructions": [...],
    "prepTime": 20,
    "cookTime": 25,
    "servings": 6,
    "tags": ["italian", "pasta", "updated"],
    "createdBy": "507f1f77bcf86cd799439013",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-02T00:00:00.000Z"
  }
}
```

**Error Responses:**
- `400`: Validation error
- `404`: Recipe not found
- `403`: Access denied (not owner)
- `409`: Recipe name already exists for user

---

### POST `/api/recipes/parse-url`

Scrape recipe data from a supported website (Serious Eats, TheKitchn, Food Network, ChewOutLoud, etc.). Requires authentication.

**Request Body:**
```json
{
  "url": "https://www.seriouseats.com/real-deal-carbonara"
}
```

**Success Response (200):**
```json
{
  "name": "Real Deal Carbonara",
  "description": "Roman-style pasta",
  "ingredients": [
    {
      "name": "guanciale",
      "quantity": 150,
      "unit": "g",
      "suggestedCategory": "Meat",
      "uncertain": false
    }
  ],
  "instructions": ["..."],
  "prepTime": 15,
  "cookTime": 15,
  "servings": 4,
  "tags": ["italian"]
}
```

**Error Responses:**
- `400`: Missing/invalid URL or unsupported schema
- `403`: Upstream site blocked scraping after retries

---

### POST `/api/recipes/parse-text`

Convert OCR/plain text (e.g., handwritten recipe cards) into structured recipe data.

**Request Body:**
```json
{
  "text": "Grandma's Lasagna\nIngredients:\n2 cups sauce\n...\nInstructions:\n1. Preheat oven..."
}
```

**Success Response (200):**
Same payload shape as `parse-url`. Unparsable lines become `uncertain` ingredients so the UI can ask for confirmation.

**Error Responses:**
- `400`: Missing or empty `text` body

---

### POST `/api/recipes/prepare-import`

Create ingredient records (or map to existing ones) after parsing. Returns a recipe payload where all ingredient IDs are resolvable.

**Request Body:**
```json
{
  "recipeData": { "...": "Output from parse-url/parse-text" },
  "categoryOverrides": {
    "guanciale": "Meat",
    "pecorino romano": "Dairy"
  }
}
```

**Success Response (200):**
```json
{
  "recipe": {
    "name": "Real Deal Carbonara",
    "ingredients": [
      {
        "ingredient": "65f5f41fc...",
        "quantity": 150,
        "unit": "g"
      }
    ],
    "instructions": ["..."]
  }
}
```

**Error Responses:**
- `400`: Validation error (e.g., missing ingredient IDs)
- `500`: Failed to create ingredient records

---

### DELETE `/api/recipes/:id`

Delete a recipe.

**Success Response (200):**
```json
{
  "success": true,
  "message": "Recipe deleted successfully"
}
```

**Error Responses:**
- `404`: Recipe not found
- `403`: Access denied (not owner)

---

## Meal Plan Endpoints

### GET `/api/mealplan`

Get meal plan for the specified date range.

**Query Parameters:**
- `startDate` (string): Start date (ISO string, default: start of current week)
- `endDate` (string): End date (ISO string, default: end of current week)

**Success Response (200):**
```json
{
  "success": true,
  "mealPlan": [
    {
      "id": "507f1f77bcf86cd799439011",
      "date": "2024-01-15T00:00:00.000Z",
      "mealType": "dinner",
      "recipe": {
        "id": "507f1f77bcf86cd799439012",
        "name": "Spaghetti Carbonara",
        "description": "Classic Italian pasta dish"
      },
      "customMeal": null,
      "isCooked": false,
      "notes": "Add extra cheese",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

---

### POST `/api/mealplan`

Add a meal to the meal plan.

**Request Body:**
```json
{
  "date": "2024-01-15",
  "mealType": "dinner",
  "recipe": "507f1f77bcf86cd799439012",
  "customMeal": "Custom meal name",
  "notes": "Optional notes"
}
```

**Validation Rules:**
- `date`: Required, valid date
- `mealType`: Required, enum: ['breakfast', 'lunch', 'dinner', 'snack']
- `recipe` or `customMeal`: At least one required

**Success Response (201):**
```json
{
  "success": true,
  "message": "Meal added to plan successfully",
  "mealPlan": {
    "id": "507f1f77bcf86cd799439011",
    "date": "2024-01-15T00:00:00.000Z",
    "mealType": "dinner",
    "recipe": {...},
    "customMeal": null,
    "isCooked": false,
    "notes": "Optional notes",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

### PUT `/api/mealplan/:id`

Update a meal plan entry.

**Request Body:** (Same as POST, all fields optional)

**Success Response (200):**
```json
{
  "success": true,
  "message": "Meal plan updated successfully",
  "mealPlan": {...}
}
```

---

### PATCH `/api/mealplan/:id/cook`

Mark a meal as cooked.

**Success Response (200):**
```json
{
  "success": true,
  "message": "Meal marked as cooked",
  "mealPlan": {
    "id": "507f1f77bcf86cd799439011",
    "isCooked": true,
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

### POST `/api/mealplan/populate-week`

Automatically populate the week with recipes.

**Request Body:**
```json
{
  "startDate": "2024-01-15",
  "endDate": "2024-01-21",
  "mealTypes": ["breakfast", "lunch", "dinner"]
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Week populated successfully",
  "addedMeals": 21,
  "mealPlan": [...]
}
```

---

### DELETE `/api/mealplan/reset-week`

Clear all meals for the current week.

**Query Parameters:**
- `startDate` (string): Start date (ISO string)
- `endDate` (string): End date (ISO string)

**Success Response (200):**
```json
{
  "success": true,
  "message": "Week reset successfully",
  "deletedMeals": 21
}
```

---

### DELETE `/api/mealplan/:id`

Remove a meal from the meal plan.

**Success Response (200):**
```json
{
  "success": true,
  "message": "Meal removed from plan successfully"
}
```

---

## Pantry Endpoints

### GET `/api/pantry`

Get all pantry items for the authenticated user.

**Query Parameters:**
- `category` (string): Filter by category
- `search` (string): Search by ingredient name
- `expiringSoon` (boolean): Show items expiring soon
- `sortBy` (string): Sort field (name, quantity, expirationDate)
- `sortOrder` (string): Sort order (asc, desc)

**Success Response (200):**
```json
{
  "success": true,
  "pantry": [
    {
      "id": "507f1f77bcf86cd799439011",
      "ingredient": {
        "id": "507f1f77bcf86cd799439012",
        "name": "Tomatoes",
        "category": "vegetables"
      },
      "quantity": 2,
      "unit": "kg",
      "expirationDate": "2024-02-15T00:00:00.000Z",
      "category": "vegetables",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

---

### POST `/api/pantry`

Add an item to the pantry.

**Request Body:**
```json
{
  "ingredient": "507f1f77bcf86cd799439012",
  "quantity": 2,
  "unit": "kg",
  "expirationDate": "2024-02-15",
  "category": "vegetables"
}
```

**Validation Rules:**
- `ingredient`: Required, valid ingredient ID
- `quantity`: Required, positive number
- `unit`: Required, valid unit
- `category`: Required, valid category

**Success Response (201):**
```json
{
  "success": true,
  "message": "Item added to pantry successfully",
  "pantryItem": {
    "id": "507f1f77bcf86cd799439011",
    "ingredient": {...},
    "quantity": 2,
    "unit": "kg",
    "expirationDate": "2024-02-15T00:00:00.000Z",
    "category": "vegetables",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

### PUT `/api/pantry/:id`

Update a pantry item.

**Request Body:** (Same as POST, all fields optional)

**Success Response (200):**
```json
{
  "success": true,
  "message": "Pantry item updated successfully",
  "pantryItem": {...}
}
```

---

### DELETE `/api/pantry/:id`

Remove an item from the pantry.

**Success Response (200):**
```json
{
  "success": true,
  "message": "Item removed from pantry successfully"
}
```

---

### POST `/api/pantry/bulk-add`

Add multiple items to pantry from shopping list.

**Request Body:**
```json
{
  "shoppingListItems": ["507f1f77bcf86cd799439011", "507f1f77bcf86cd799439012"]
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Items added to pantry successfully",
  "addedItems": 2,
  "pantryItems": [...]
}
```

---

## Shopping List Endpoints

### GET `/api/shopping-list`

Get the user's shopping list.

**Query Parameters:**
- `completed` (boolean): Filter by completion status
- `priority` (string): Filter by priority (low, medium, high)
- `category` (string): Filter by category

**Success Response (200):**
```json
{
  "success": true,
  "shoppingList": [
    {
      "id": "507f1f77bcf86cd799439011",
      "ingredient": {
        "id": "507f1f77bcf86cd799439012",
        "name": "Milk",
        "category": "dairy"
      },
      "quantity": 1,
      "unit": "l",
      "isCompleted": false,
      "priority": "high",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

---

### POST `/api/shopping-list`

Add an item to the shopping list.

**Request Body:**
```json
{
  "ingredient": "507f1f77bcf86cd799439012",
  "quantity": 1,
  "unit": "l",
  "priority": "high"
}
```

**Validation Rules:**
- `ingredient`: Required, valid ingredient ID
- `quantity`: Required, positive number
- `unit`: Required, valid unit
- `priority`: Optional, enum: ['low', 'medium', 'high']

**Success Response (201):**
```json
{
  "success": true,
  "message": "Item added to shopping list successfully",
  "shoppingListItem": {
    "id": "507f1f77bcf86cd799439011",
    "ingredient": {...},
    "quantity": 1,
    "unit": "l",
    "isCompleted": false,
    "priority": "high",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

### PUT `/api/shopping-list/:id`

Update a shopping list item.

**Request Body:** (Same as POST, all fields optional)

**Success Response (200):**
```json
{
  "success": true,
  "message": "Shopping list item updated successfully",
  "shoppingListItem": {...}
}
```

---

### PATCH `/api/shopping-list/:id/toggle`

Toggle completion status of shopping list item.

**Success Response (200):**
```json
{
  "success": true,
  "message": "Item completion status updated",
  "shoppingListItem": {
    "id": "507f1f77bcf86cd799439011",
    "isCompleted": true,
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

### DELETE `/api/shopping-list/:id`

Remove an item from the shopping list.

**Success Response (200):**
```json
{
  "success": true,
  "message": "Item removed from shopping list successfully"
}
```

---

### POST `/api/shopping-list/update-from-meal-plan`

Automatically update shopping list based on meal plan.

**Request Body:**
```json
{
  "startDate": "2024-01-15",
  "endDate": "2024-01-21",
  "clearExisting": false
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Shopping list updated from meal plan",
  "addedItems": 15,
  "updatedItems": 3
}
```

---

### POST `/api/shopping-list/clear-completed`

Remove all completed items from shopping list.

**Success Response (200):**
```json
{
  "success": true,
  "message": "Completed items cleared successfully",
  "removedItems": 5
}
```

---

## Ingredient Endpoints

### GET `/api/ingredients`

Get all ingredients.

**Query Parameters:**
- `search` (string): Search by name
- `category` (string): Filter by category
- `limit` (number): Number of ingredients to return
- `page` (number): Page number for pagination

**Success Response (200):**
```json
{
  "success": true,
  "ingredients": [
    {
      "id": "507f1f77bcf86cd799439011",
      "name": "Tomatoes",
      "category": "vegetables",
      "defaultUnit": "kg",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 10,
    "totalIngredients": 200,
    "hasNext": true,
    "hasPrev": false
  }
}
```

---

### POST `/api/ingredients`

Create a new ingredient.

**Request Body:**
```json
{
  "name": "New Ingredient",
  "category": "vegetables",
  "defaultUnit": "kg"
}
```

**Validation Rules:**
- `name`: Required, 1-50 characters, unique
- `category`: Required, valid category
- `defaultUnit`: Required, valid unit

**Success Response (201):**
```json
{
  "success": true,
  "message": "Ingredient created successfully",
  "ingredient": {
    "id": "507f1f77bcf86cd799439011",
    "name": "New Ingredient",
    "category": "vegetables",
    "defaultUnit": "kg",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

## Achievement Endpoints

### GET `/api/achievements`

Get all achievements for the authenticated user, grouped by category with progress and stats.

**Success Response (200):**
```json
{
  "success": true,
  "achievements": {
    "getting-started": [...],
    "recipe-mastery": [...],
    "meal-planning": [...],
    "pantry-shopping": [...],
    "milestone": [...]
  },
  "stats": {
    "total": 25,
    "completed": 10,
    "completionPercentage": 40,
    "categories": {
      "getting-started": 3,
      "recipe-mastery": 2,
      "meal-planning": 2,
      "pantry-shopping": 2,
      "milestone": 1
    }
  }
}
```

Each achievement object includes: `id`, `name`, `description`, `category`, `icon`, `requiredProgress`, `progress`, `completed`, `completedAt`, `unlockedAt`.

---

### GET `/api/achievements/recent`

Get achievements completed in the last 7 days.

**Success Response (200):**
```json
{
  "success": true,
  "recentAchievements": [
    {
      "id": "recipe_created",
      "name": "First Recipe",
      "description": "You created your first recipe!",
      "category": "getting-started",
      "icon": "🍳",
      "completedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

---

### POST `/api/achievements/check`

Manually trigger achievement check (for testing).

**Request Body:**
```json
{
  "achievementId": "recipe_created",
  "progress": 1
}
```

**Success Response (200):**
```json
{
  "success": true,
  "achievement": {...},
  "newlyCompleted": true,
  "message": "Achievement unlocked!"
}
```

---

### GET `/api/achievements/leaderboard`

Get users ranked by achievement completion.

**Success Response (200):**
```json
{
  "leaderboard": [
    {
      "userId": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "completedCount": 15,
      "lastCompleted": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

---

## Error Codes

### HTTP Status Codes

- `200`: Success
- `201`: Created
- `400`: Bad Request (validation error)
- `401`: Unauthorized (authentication required)
- `403`: Forbidden (access denied)
- `404`: Not Found
- `409`: Conflict (duplicate resource)
- `422`: Unprocessable Entity
- `500`: Internal Server Error

### Common Error Messages

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "email": "Email is required",
    "password": "Password must be at least 8 characters"
  }
}
```

```json
{
  "success": false,
  "message": "Resource not found"
}
```

```json
{
  "success": false,
  "message": "Access denied"
}
```

```json
{
  "success": false,
  "message": "Internal server error"
}
```

## Rate Limiting

The API implements rate limiting to prevent abuse:

- **Authentication endpoints**: 5 requests per minute
- **Other endpoints**: 100 requests per minute
- **Bulk operations**: 10 requests per minute

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

## Pagination

Endpoints that return lists support pagination:

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)

**Response Format:**
```json
{
  "data": [...],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalItems": 100,
    "hasNext": true,
    "hasPrev": false,
    "limit": 20
  }
}
```

## Data Validation

### Common Validation Rules

**Email:**
- Required format: `user@domain.com`
- Maximum length: 254 characters
- Must be unique per user

**Password:**
- Minimum length: 8 characters
- Must contain at least one letter and one number
- Special characters allowed

**Names:**
- Minimum length: 2 characters
- Maximum length: 50 characters
- Alphanumeric and spaces only

**Quantities:**
- Must be positive numbers
- Maximum value: 999999

**Dates:**
- Must be valid ISO date strings
- Cannot be in the past for future events

## Barcode & Scan Session Endpoints

### GET `/api/barcode/:code`

Look up product metadata by UPC/EAN barcode via the Open Food Facts proxy. Requires authentication.

**Success Response (200):**
```json
{
  "productName": "Nutella",
  "category": "Pantry",
  "quantity": 750,
  "unit": "g",
  "barcode": "3017620422003"
}
```

**Error Responses:**
- `404`: Product not found
- `503`: Open Food Facts unreachable
- `500`: Unexpected lookup error

---

### POST `/api/scan-session`

Create a 5-minute session to pair a logged-in desktop browser with a phone scanner.

**Success Response (200):**
```json
{ "sessionId": "4c7ab1f9fa1e44c3a4cd1f89a6d26335" }
```

Use the session ID to generate `https://app.example.com/scan?session=<id>` or rely on the frontend QR code.

---

### GET `/api/scan-session/:id`

Poll for barcode submissions tied to a session. Requires authentication.

**Success Response (200):**
```json
{ "barcode": null }
```

When the phone posts, `barcode` becomes a numeric string (e.g., `"3017620422003"`).

**Error Responses:**
- `404`: Session expired or invalid

---

### POST `/api/scan-session/:id`

Called from the mobile `/scan` page (no auth) to send a decoded barcode back to the desktop.

**Request Body:**
```json
{ "barcode": "3017620422003" }
```

**Success Response (200):**
```json
{ "success": true }
```

**Error Responses:**
- `400`: Missing/invalid barcode
- `404`: Session expired or invalid

---

## Webhooks (Future Feature)

The API will support webhooks for real-time notifications:

**Supported Events:**
- `recipe.created`
- `meal.cooked`
- `pantry.item.expired`
- `achievement.unlocked`

**Webhook Format:**
```json
{
  "event": "recipe.created",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "data": {
    "recipeId": "507f1f77bcf86cd799439011",
    "recipeName": "Spaghetti Carbonara",
    "userId": "507f1f77bcf86cd799439012"
  }
}
```

---

This API documentation provides comprehensive information about all endpoints, request/response formats, and implementation details. For additional support or questions, refer to the source code or contact the development team. 
