# FoodForNow

## Overview
FoodForNow is a comprehensive full-stack web application designed to help users manage their pantry, recipes, meal planning, and shopping lists. The application features an intuitive meal planning system with cooking status tracking, automatic ingredient management, and smart shopping list generation.

## 🚀 Features

### Core Functionality
- **User Authentication**: Secure JWT-based login, registration, and password reset (forgot/reset)
- **Dashboard**: Comprehensive overview of pantry, recipes, meal plans, and shopping lists
- **Pantry Management**: Add, edit, and remove items with quantity tracking
- **Recipe Management**: Browse, add, and manage recipes with detailed ingredient lists
- **Meal Planning**: Weekly meal planning with drag-and-drop interface
- **Cooking Status Tracking**: Mark meals as cooked and track preparation progress
- **Smart Shopping Lists**: Automatic generation based on meal plans and pantry status
- **Ingredient Management**: Categorized ingredients with color coding
- **Responsive Design**: Modern Material-UI interface that works on all devices

### Advanced Features
- **Auto-Populate Week**: Automatically generate meal plans from your recipe collection
- **Missing Ingredient Detection**: Identifies missing ingredients when cooking meals
- **Shopping List Integration**: Automatically add missing ingredients to shopping lists
- **Pantry Integration**: Bulk add shopping list items to pantry
- **Theme Support**: Dark mode by default with an optional manual light mode toggle

## 🛠 Tech Stack

### Frontend
- **React 19** - Latest React with concurrent features
- **Material-UI (MUI) 5** - Comprehensive component library
- **Vite 6** - Fast build tool and development server
- **React Router 6** - Client-side routing
- **Axios** - HTTP client for API communication
- **React Hot Toast** - User notifications

### Backend
- **Node.js** - JavaScript runtime
- **Express 4** - Web application framework
- **MongoDB** - NoSQL database with Mongoose ODM
- **JWT** - JSON Web Token authentication
- **bcrypt** - Password hashing
- **Helmet** - Security middleware

### DevOps
- **Docker** - Containerization for both frontend and backend
- **GitHub Actions** - CI/CD pipeline with automated Docker builds
- **GitHub Container Registry** - Docker image storage
- **Concurrently** - Run multiple development servers simultaneously

## 📦 Project Structure

This is a **monorepo** using npm workspaces for efficient dependency management:

```
FoodForNow/
├── foodfornow-backend/          # Backend API server
│   ├── src/
│   │   ├── models/             # MongoDB schemas
│   │   ├── routes/             # API endpoints
│   │   ├── middleware/         # Custom middleware (auth, etc.)
│   │   └── scripts/            # Database utilities
│   ├── Dockerfile              # Backend container
│   └── package.json
├── foodfornow-frontend/         # React frontend application
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   ├── pages/              # Page components
│   │   ├── services/           # API service layer
│   │   ├── context/            # React context providers
│   │   └── utils/              # Utility functions
│   ├── Dockerfile              # Frontend container
│   └── package.json
├── .github/workflows/          # CI/CD pipelines
├── package.json                # Root workspace configuration
└── README.md
```

## 🚀 Quick Start

### Prerequisites
- **Node.js** (v18 or higher)
- **npm** (v8 or higher)
- **MongoDB** (local instance or MongoDB Atlas)
- **Git**

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/FoodForNow.git
   cd FoodForNow
   ```

2. **Install all dependencies** (both frontend and backend)
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create `.env` file in `foodfornow-backend/`:
   ```env
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_secure_jwt_secret_key
   PORT=3001
   CORS_ORIGIN=http://localhost:5173
   ```
   
   Create `.env` file in `foodfornow-frontend/` (optional, for location features):
   ```env
   VITE_API_URL=http://localhost:3001/api
   VITE_GEONAMES_USERNAME=your_geonames_username
   ```

4. **Start development servers** (both frontend and backend concurrently)
   ```bash
   npm run dev
   ```

5. **Access the application**
   - **Frontend**: http://localhost:5173
   - **Backend API**: http://localhost:3001

## 🐳 Docker Deployment

### Production Builds

The project includes Dockerfiles for both frontend and backend, with automated builds via GitHub Actions.

#### Manual Docker Builds

```bash
# Build and run backend
docker build -t foodfornow-backend ./foodfornow-backend
docker run -p 3001:3001 --env-file foodfornow-backend/.env foodfornow-backend

# Build and run frontend
docker build -t foodfornow-frontend ./foodfornow-frontend
docker run -p 8080:80 --env-file foodfornow-frontend/.env foodfornow-frontend
```

#### Automated CI/CD

GitHub Actions automatically builds and pushes Docker images to GitHub Container Registry on every push to the main branch:

- **Backend Image**: `ghcr.io/yourusername/foodfornow-backend`
- **Frontend Image**: `ghcr.io/yourusername/foodfornow-frontend`

## 🛠 Development

### Available Scripts

#### Root Level (Monorepo)
```bash
npm run dev          # Start both frontend and backend in development mode
npm run build        # Build frontend for production
npm run start        # Start backend in production mode
```

#### Frontend Only
```bash
cd foodfornow-frontend
npm run dev          # Start Vite development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

#### Backend Only
```bash
cd foodfornow-backend
npm run dev          # Start with nodemon (auto-restart)
npm run start        # Start production server
```

### Development Workflow

1. **Concurrent Development**: Use `npm run dev` from the root to start both servers simultaneously
2. **Hot Reloading**: Frontend uses Vite for instant updates, backend uses nodemon
3. **API Development**: Backend runs on port 3001, frontend on port 5173
4. **Database**: Ensure MongoDB is running and accessible via the connection string

## 📋 API Endpoints

### Authentication
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `POST /auth/logout` - User logout
- `GET /auth/me` - Get current user
- `POST /auth/token` - Refresh access token
- `POST /auth/forgot-password` - Request password reset
- `POST /auth/reset-password` - Reset password with token
- `PUT /auth/profile` - Update user profile

### Recipes
- `GET /recipes` - Get all recipes
- `GET /recipes/popular` - Get user's popular recipes
- `GET /recipes/shared` - Get shared recipes from other users
- `POST /recipes` - Create new recipe
- `GET /recipes/:id` - Get recipe by ID
- `PUT /recipes/:id` - Update recipe
- `DELETE /recipes/:id` - Delete recipe

### Meal Planning
- `GET /mealplan` - Get meal plan for week
- `POST /mealplan` - Add meal to plan
- `PUT /mealplan/:id` - Update meal
- `DELETE /mealplan/:id` - Remove meal
- `PATCH /mealplan/:id/cook` - Mark meal as cooked
- `POST /mealplan/populate-week` - Auto-populate week with recipes
- `DELETE /mealplan/reset-week` - Clear week's meal plan

### Pantry
- `GET /pantry` - Get pantry items
- `POST /pantry` - Add item to pantry
- `PUT /pantry/:id` - Update pantry item
- `DELETE /pantry/:id` - Remove pantry item

### Shopping List
- `GET /shopping-list` - Get shopping list
- `POST /shopping-list` - Add item to list
- `PUT /shopping-list/:id` - Update list item
- `DELETE /shopping-list/:id` - Remove list item
- `POST /shopping-list/update-from-meal-plan` - Auto-update from meal plan

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Make your changes**
4. **Test thoroughly**
   ```bash
   npm run dev  # Test both frontend and backend
   ```
5. **Commit your changes**
   ```bash
   git commit -m 'Add amazing feature'
   ```
6. **Push to your branch**
   ```bash
   git push origin feature/amazing-feature
   ```
7. **Open a Pull Request**

### Development Guidelines

- Follow the existing code style and structure
- Add appropriate error handling
- Include comments for complex logic
- Test your changes thoroughly
- Update documentation if needed

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Material-UI** for the comprehensive component library
- **MongoDB** for the flexible database solution
- **Express.js** for the robust backend framework
- **React** for the powerful frontend framework
- **Vite** for the lightning-fast build tool
- **GitHub Actions** for seamless CI/CD integration

## 📞 Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/yourusername/FoodForNow/issues) page
2. Create a new issue with detailed information
3. Include steps to reproduce the problem
4. Provide relevant error messages and logs

---

**Happy cooking! 🍳** 
