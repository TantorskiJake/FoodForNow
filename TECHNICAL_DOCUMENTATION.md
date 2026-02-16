# FoodForNow Technical Documentation

## Table of Contents
1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Backend Documentation](#backend-documentation)
4. [Frontend Documentation](#frontend-documentation)
5. [Database Schema](#database-schema)
6. [API Reference](#api-reference)
7. [Authentication System](#authentication-system)
8. [Development Guidelines](#development-guidelines)
9. [Deployment](#deployment)
10. [Testing](#testing)

## Project Overview

FoodForNow is a full-stack web application built with React 19 frontend and Node.js/Express backend, designed to help users manage their pantry, recipes, meal planning, and shopping lists. The application features a modern Material-UI interface with dark/light theme support and comprehensive user management.

### Key Features
- **User Authentication**: JWT-based secure authentication system
- **Pantry Management**: Track ingredients with quantities and expiration dates
- **Recipe Management**: Create, edit, and organize recipes with detailed instructions
- **Meal Planning**: Weekly meal planning with drag-and-drop interface
- **Shopping Lists**: Automatic generation based on meal plans and pantry status
- **Achievement System**: Gamification elements to encourage user engagement
- **Responsive Design**: Mobile-first design with Material-UI components

## Architecture

### Monorepo Structure
```
FoodForNow/
├── foodfornow-backend/          # Node.js/Express API server
│   ├── src/
│   │   ├── models/             # MongoDB schemas
│   │   ├── routes/             # API endpoint handlers
│   │   ├── middleware/         # Custom middleware
│   │   ├── services/           # Business logic services
│   │   └── scripts/            # Database utilities
│   ├── Dockerfile              # Backend containerization
│   └── package.json
├── foodfornow-frontend/         # React 19 application
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   ├── pages/              # Page components
│   │   ├── context/            # React context providers
│   │   ├── services/           # API service layer
│   │   └── utils/              # Utility functions
│   ├── Dockerfile              # Frontend containerization
│   └── package.json
├── .github/workflows/          # CI/CD pipelines
└── package.json                # Root workspace configuration
```

### Technology Stack

#### Backend
- **Runtime**: Node.js
- **Framework**: Express.js 4.21.2
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT with bcrypt password hashing
- **Security**: Helmet.js for HTTP headers
- **CORS**: Cross-origin resource sharing configuration
- **Development**: Nodemon for auto-restart

#### Frontend
- **Framework**: React 19.1.0 with concurrent features
- **Build Tool**: Vite 6.3.5
- **UI Library**: Material-UI (MUI) 5.15.12
- **Routing**: React Router DOM 6.22.3
- **HTTP Client**: Axios 1.6.7
- **Notifications**: React Hot Toast 2.5.2
- **Barcode Scanning**: React ZXing 2.1.0
- **Development**: ESLint 9.25.0

#### DevOps
- **Containerization**: Docker
- **CI/CD**: GitHub Actions
- **Registry**: GitHub Container Registry
- **Package Management**: npm workspaces

## Backend Documentation

### Server Configuration (`server.js`)

The main server file sets up the Express application with the following configuration:

```javascript
// Key middleware setup
app.use(helmet()); // Security headers
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());
```

### Environment Variables

Required environment variables for backend:

```env
MONGO_URI=mongodb://localhost:27017/foodfornow
JWT_SECRET=your_secure_jwt_secret_key
PORT=3001
CORS_ORIGIN=http://localhost:5173
```

### Middleware

#### Authentication Middleware (`src/middleware/auth.js`)
- Validates JWT tokens from cookies or Authorization header
- Attaches user information to request object
- Handles token refresh logic

#### Request Logging
- Logs all incoming requests with timestamp and method
- Useful for debugging and monitoring

### Error Handling

The application implements comprehensive error handling:

```javascript
// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Something went wrong!" });
});

// Process error handlers
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
});
```

## Database Schema

### User Model (`src/models/user.js`)

```javascript
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  bio: { type: String, maxlength: 500 },
  location: { type: String, maxlength: 100 },
  website: { type: String, maxlength: 200 },
  profilePicture: { type: String },
  preferences: {
    theme: { type: String, enum: ['light', 'dark', 'auto'], default: 'dark' },
    units: { type: String, enum: ['metric', 'imperial'], default: 'metric' },
    language: { type: String, default: 'en' },
    timezone: { type: String, default: 'UTC' }
  },
  notifications: {
    email: { type: Boolean, default: true },
    push: { type: Boolean, default: true },
    mealReminders: { type: Boolean, default: true },
    shoppingReminders: { type: Boolean, default: true }
  }
}, { timestamps: true });
```

### Recipe Model (`src/models/recipe.js`)

```javascript
const recipeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  ingredients: [{
    ingredient: { type: mongoose.Schema.Types.ObjectId, ref: 'Ingredient', required: true },
    quantity: { type: Number, required: true },
    unit: { type: String, required: true, enum: ['g', 'kg', 'oz', 'lb', 'ml', 'l', 'cup', 'tbsp', 'tsp', 'piece', 'pinch'] }
  }],
  instructions: [{ type: String, required: true }],
  prepTime: { type: Number, required: true },
  cookTime: { type: Number, required: true },
  servings: { type: Number, required: true },
  tags: [{ type: String }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });
```

### Meal Plan Model (`src/models/mealPlan.js`)

```javascript
const mealPlanSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, required: true },
  mealType: { type: String, enum: ['breakfast', 'lunch', 'dinner', 'snack'], required: true },
  recipe: { type: mongoose.Schema.Types.ObjectId, ref: 'Recipe' },
  customMeal: { type: String },
  isCooked: { type: Boolean, default: false },
  notes: { type: String }
}, { timestamps: true });
```

### Pantry Model (`src/models/pantry.js`)

```javascript
const pantrySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  ingredient: { type: mongoose.Schema.Types.ObjectId, ref: 'Ingredient', required: true },
  quantity: { type: Number, required: true },
  unit: { type: String, required: true },
  expirationDate: { type: Date },
  category: { type: String, required: true }
}, { timestamps: true });
```

### Shopping List Item Model (`src/models/shopping-list-item.js`)

```javascript
const shoppingListItemSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  ingredient: { type: mongoose.Schema.Types.ObjectId, ref: 'Ingredient', required: true },
  quantity: { type: Number, required: true },
  unit: { type: String, required: true },
  isCompleted: { type: Boolean, default: false },
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' }
}, { timestamps: true });
```

### Achievement Model (`src/models/achievement.js`)

```javascript
const achievementSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  icon: { type: String, required: true },
  unlockedAt: { type: Date, default: Date.now },
  isRead: { type: Boolean, default: false }
}, { timestamps: true });
```

## API Reference

### Authentication Endpoints

#### POST `/api/auth/register`
Register a new user account.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "user": {
    "id": "user_id",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

#### POST `/api/auth/login`
Authenticate user and return JWT token.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "securepassword123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "id": "user_id",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

#### POST `/api/auth/logout`
Logout user and invalidate JWT token.

#### POST `/api/auth/token`
Refresh access token using refresh token (HTTP-only cookie).

#### POST `/api/auth/forgot-password`
Request password reset for the given email. Returns reset token (for development; production would send via email).

#### POST `/api/auth/reset-password`
Reset password using token from forgot-password. Requires `token` and `newPassword` in body.

#### PUT `/api/auth/profile`
Update authenticated user's profile (name, email, bio, location, preferences, notifications, password).

#### GET `/api/auth/me`
Get current authenticated user information.

### Recipe Endpoints

#### GET `/api/recipes`
Get all recipes for the authenticated user.

**Query Parameters:**
- `search`: Search recipes by name
- `tags`: Filter by tags
- `limit`: Number of recipes to return
- `page`: Page number for pagination

#### GET `/api/recipes/popular`
Get the authenticated user's popular recipes (sorted by popularity).

#### GET `/api/recipes/shared`
Get recipes from other users (excluding names the user already has). Query param: `search`.

#### POST `/api/recipes`
Create a new recipe.

**Request Body:**
```json
{
  "name": "Spaghetti Carbonara",
  "description": "Classic Italian pasta dish",
  "ingredients": [
    {
      "ingredient": "ingredient_id",
      "quantity": 500,
      "unit": "g"
    }
  ],
  "instructions": ["Step 1", "Step 2"],
  "prepTime": 15,
  "cookTime": 20,
  "servings": 4,
  "tags": ["italian", "pasta"]
}
```

#### GET `/api/recipes/:id`
Get a specific recipe by ID.

#### PUT `/api/recipes/:id`
Update an existing recipe.

#### DELETE `/api/recipes/:id`
Delete a recipe.

### Meal Plan Endpoints

#### GET `/api/mealplan`
Get meal plan for the current week.

**Query Parameters:**
- `startDate`: Start date for meal plan (ISO string)
- `endDate`: End date for meal plan (ISO string)

#### POST `/api/mealplan`
Add a meal to the meal plan.

**Request Body:**
```json
{
  "date": "2024-01-15",
  "mealType": "dinner",
  "recipe": "recipe_id",
  "customMeal": "Custom meal name",
  "notes": "Optional notes"
}
```

#### PATCH `/api/mealplan/:id/cook`
Mark a meal as cooked.

#### POST `/api/mealplan/populate-week`
Automatically populate the week with recipes.

#### DELETE `/api/mealplan/reset-week`
Clear all meals for the current week.

### Pantry Endpoints

#### GET `/api/pantry`
Get all pantry items for the authenticated user.

#### POST `/api/pantry`
Add an item to the pantry.

**Request Body:**
```json
{
  "ingredient": "ingredient_id",
  "quantity": 2,
  "unit": "kg",
  "expirationDate": "2024-02-15",
  "category": "vegetables"
}
```

#### PUT `/api/pantry/:id`
Update a pantry item.

#### DELETE `/api/pantry/:id`
Remove an item from the pantry.

### Shopping List Endpoints

#### GET `/api/shopping-list`
Get the user's shopping list.

#### POST `/api/shopping-list`
Add an item to the shopping list.

**Request Body:**
```json
{
  "ingredient": "ingredient_id",
  "quantity": 1,
  "unit": "kg",
  "priority": "high"
}
```

#### PUT `/api/shopping-list/:id`
Update a shopping list item.

#### DELETE `/api/shopping-list/:id`
Remove an item from the shopping list.

#### POST `/api/shopping-list/update-from-meal-plan`
Automatically update shopping list based on meal plan.

### Achievement Endpoints

#### GET `/api/achievements`
Get all achievements for the authenticated user, grouped by category with progress and stats.

#### GET `/api/achievements/recent`
Get achievements completed in the last 7 days.

#### POST `/api/achievements/check`
Manually trigger achievement check (for testing). Body: `achievementId`, `progress`.

#### GET `/api/achievements/leaderboard`
Get users ranked by achievement completion.

## Frontend Documentation

### Application Structure

#### Main App Component (`src/App.jsx`)
The main application component sets up:
- Context providers (Auth, Theme, Achievement)
- Routing configuration
- Error boundary
- Global components (Navbar, Toaster)

#### Context Providers

**AuthContext (`src/context/AuthContext.jsx`)**
- Manages user authentication state
- Handles login/logout operations
- Provides user information to components

**ThemeContext (`src/context/ThemeContext.jsx`)**
- Manages light/dark theme state
- Persists theme preference
- Provides theme toggle functionality

**AchievementContext (`src/context/AchievementContext.jsx`)**
- Manages achievement notifications
- Handles achievement unlocking
- Provides achievement display functionality

### Key Components

#### Navbar (`src/components/Navbar.jsx`)
- Main navigation component
- User menu with profile and logout
- Theme toggle
- Responsive design

#### PrivateRoute (`src/components/PrivateRoute.jsx`)
- Route protection component
- Redirects unauthenticated users to login
- Handles authentication state

#### MealPlanGrid (`src/components/MealPlanGrid.jsx`)
- Weekly meal planning interface
- Drag-and-drop functionality
- Meal status tracking

#### BarcodeScanner (`src/components/BarcodeScanner.jsx`)
- Barcode scanning functionality
- Product lookup integration
- Ingredient addition to pantry

### Pages

#### Dashboard (`src/pages/Dashboard.jsx`)
- Overview of pantry, recipes, and meal plans
- Quick actions and statistics
- Recent activity feed

#### Recipes (`src/pages/Recipes.jsx`)
- Recipe listing with search and filters
- Recipe creation and editing
- Category and tag management

#### Pantry (`src/pages/Pantry.jsx`)
- Pantry item management
- Quantity tracking
- Expiration date monitoring

#### ShoppingList (`src/pages/ShoppingList.jsx`)
- Shopping list management
- Item completion tracking
- Bulk operations

### Services

#### API Service (`src/services/api.js`)
- Centralized API communication
- Request/response interceptors
- Error handling

#### Geonames Service (`src/services/geonames.js`)
- Location-based services
- City and country data

## Authentication System

### JWT Implementation

The application uses JWT (JSON Web Tokens) for authentication:

1. **Token Generation**: Tokens are generated upon successful login
2. **Token Storage**: Tokens are stored in HTTP-only cookies for security
3. **Token Validation**: Middleware validates tokens on protected routes
4. **Token Refresh**: Automatic token refresh mechanism

### Security Features

- **Password Hashing**: bcrypt with salt rounds
- **HTTP-only Cookies**: Prevents XSS attacks
- **CORS Configuration**: Restricts cross-origin requests
- **Helmet.js**: Security headers protection
- **Input Validation**: Request body validation

### Authentication Flow

1. User submits login credentials
2. Server validates credentials against database
3. Server generates JWT token with user payload
4. Token is sent as HTTP-only cookie
5. Client includes token in subsequent requests
6. Server validates token on protected routes

## Development Guidelines

### Code Style

#### Backend (Node.js/Express)
- Use ES6+ features
- Follow Express.js best practices
- Implement proper error handling
- Use async/await for database operations
- Add JSDoc comments for functions

#### Frontend (React)
- Use functional components with hooks
- Follow React best practices
- Implement proper prop validation
- Use TypeScript-like prop documentation
- Follow Material-UI design patterns

### File Naming Conventions

- **Components**: PascalCase (e.g., `MealPlanGrid.jsx`)
- **Pages**: PascalCase (e.g., `Dashboard.jsx`)
- **Services**: camelCase (e.g., `api.js`)
- **Models**: camelCase (e.g., `user.js`)
- **Routes**: camelCase (e.g., `auth.js`)

### Database Best Practices

- Use indexes for frequently queried fields
- Implement proper validation in schemas
- Use references for related data
- Implement soft deletes where appropriate
- Use transactions for complex operations

### API Design Principles

- RESTful endpoint design
- Consistent response formats
- Proper HTTP status codes
- Input validation and sanitization
- Comprehensive error messages

## Deployment

### Docker Deployment

#### Backend Dockerfile
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3001
CMD ["npm", "start"]
```

#### Frontend Dockerfile
```dockerfile
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Environment Configuration

#### Production Environment Variables
```env
NODE_ENV=production
MONGO_URI=mongodb://production-db:27017/foodfornow
JWT_SECRET=production-secret-key
CORS_ORIGIN=https://yourdomain.com
PORT=3001
```

### CI/CD Pipeline

The project uses GitHub Actions for automated deployment:

1. **Build**: Build Docker images
2. **Test**: Run automated tests
3. **Push**: Push images to GitHub Container Registry
4. **Deploy**: Deploy to production environment

## Testing

### Backend Testing

#### Unit Tests
- Test individual functions and methods
- Mock database operations
- Test error handling scenarios

#### Integration Tests
- Test API endpoints
- Test database operations
- Test authentication flows

#### Test Structure
```
tests/
├── unit/
│   ├── models/
│   ├── services/
│   └── middleware/
├── integration/
│   ├── auth.test.js
│   ├── recipes.test.js
│   └── mealplan.test.js
└── fixtures/
    └── test-data.json
```

### Frontend Testing

#### Component Tests
- Test component rendering
- Test user interactions
- Test prop validation

#### Integration Tests
- Test page navigation
- Test API integration
- Test user workflows

### Testing Tools

- **Backend**: Jest, Supertest
- **Frontend**: React Testing Library, Jest
- **E2E**: Playwright or Cypress

### Test Coverage

- Aim for 80%+ code coverage
- Test critical user paths
- Test error scenarios
- Test edge cases

## Performance Optimization

### Backend Optimizations

- **Database Indexing**: Proper indexes on frequently queried fields
- **Query Optimization**: Use aggregation pipelines for complex queries
- **Caching**: Implement Redis for session storage
- **Compression**: Enable gzip compression
- **Rate Limiting**: Implement API rate limiting

### Frontend Optimizations

- **Code Splitting**: Lazy load components and routes
- **Bundle Optimization**: Tree shaking and minification
- **Image Optimization**: Compress and lazy load images
- **Caching**: Implement service worker for offline support
- **Virtual Scrolling**: For large lists

## Security Considerations

### Data Protection

- **Input Validation**: Validate all user inputs
- **SQL Injection**: Use parameterized queries (MongoDB handles this)
- **XSS Prevention**: Sanitize user-generated content
- **CSRF Protection**: Implement CSRF tokens
- **Rate Limiting**: Prevent brute force attacks

### Authentication Security

- **Password Requirements**: Enforce strong password policies
- **Account Lockout**: Implement account lockout after failed attempts
- **Session Management**: Proper session timeout
- **Token Security**: Secure token storage and transmission

### Infrastructure Security

- **HTTPS**: Use SSL/TLS encryption
- **Environment Variables**: Secure storage of sensitive data
- **Dependencies**: Regular security updates
- **Monitoring**: Implement security monitoring

## Monitoring and Logging

### Application Monitoring

- **Error Tracking**: Implement error tracking (Sentry)
- **Performance Monitoring**: Monitor API response times
- **User Analytics**: Track user behavior and engagement
- **Health Checks**: Implement health check endpoints

### Logging Strategy

- **Structured Logging**: Use structured log formats
- **Log Levels**: Appropriate log levels (debug, info, warn, error)
- **Log Rotation**: Implement log rotation policies
- **Centralized Logging**: Use centralized logging solution

## Future Enhancements

### Planned Features

- **Recipe Sharing**: Social features for sharing recipes
- **Nutritional Information**: Add nutritional data to recipes
- **Meal Recommendations**: AI-powered meal suggestions
- **Mobile App**: Native mobile applications
- **Voice Commands**: Voice-controlled interface
- **Smart Notifications**: Intelligent reminder system

### Technical Improvements

- **GraphQL**: Implement GraphQL API
- **Real-time Updates**: WebSocket integration
- **Offline Support**: Progressive Web App features
- **Microservices**: Break down into microservices
- **Kubernetes**: Container orchestration

---

This documentation provides a comprehensive overview of the FoodForNow application architecture, implementation details, and development guidelines. For specific implementation questions or additional details, refer to the individual source files and their inline documentation. 
