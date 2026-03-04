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
- **Barcode Scanning & QR Handoff**: Scan groceries with your laptop camera or hand off the scan to your phone via QR code
- **Handwritten Recipe OCR Import**: Snap a recipe card photo and convert it into structured ingredients and instructions
- **Guided Onboarding**: New users get a quick in-app walkthrough of the core workflow
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
├── docs/                       # Project documentation
│   ├── api.md                  # API reference
│   ├── frontend.md             # Frontend documentation
│   ├── technical.md            # Architecture & technical guide
│   └── deployment.md           # Deployment & CI/CD
├── e2e/                        # Playwright end-to-end tests
├── .github/workflows/          # CI/CD pipelines
├── package.json                # Root workspace configuration
└── README.md
```

## 📚 Documentation

Detailed docs live in **[docs/](docs/)**:

- **[API Reference](docs/api.md)** — Endpoints, auth, request/response formats
- **[Frontend](docs/frontend.md)** — React app structure and components
- **[Technical](docs/technical.md)** — Architecture, database, and dev guidelines
- **[Deployment](docs/deployment.md)** — Docker, env config, and production

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
   # Optional: override the signing secret for phone scan handoffs
   SCAN_SESSION_TOKEN_SECRET=separate_secret_for_scan_tokens
   # Optional: adjust how long phone tokens remain valid (seconds, defaults to 300)
   SCAN_SESSION_TOKEN_TTL_SECONDS=300
   PORT=3001
   CORS_ORIGIN=http://localhost:5173
   ```
   
   Create `.env` file in `foodfornow-frontend/` (optional, for location features):
   ```env
   VITE_API_URL=http://localhost:3001/api
   VITE_GEONAMES_USERNAME=your_geonames_username
   # Optional: make the dev server reachable from your phone for barcode scans
   VITE_APP_PUBLIC_URL=http://192.168.1.23:5173
   ```

4. **Start development servers** (both frontend and backend concurrently)
   ```bash
   npm run dev
   ```
   Need to scan barcodes from a phone during development? Start the hosted variant:
   ```bash
   npm run dev:host
   ```
   Then confirm `VITE_APP_PUBLIC_URL` is set to the LAN URL (for example `http://192.168.1.23:5173`) so the desktop app can generate QR codes that your phone can open.

5. **Access the application**
   - **Frontend**: http://localhost:5173
   - **Backend API**: http://localhost:3001

6. **Run the full-flow E2E test** (optional)
   With both frontend and backend running, from the repo root:
   ```bash
   npm run e2e
   ```
   This Playwright test registers a user, creates a recipe, adds it to the meal plan, adds ingredients to the shopping list, moves them to the pantry, and marks the meal as cooked.

**If you see "Connection failed" or the app can't load data:**  
You need **both** the frontend and backend running. From the **repo root** (FoodForNow/), run:
   ```bash
   npm run dev
   ```
   That starts the backend (port 3001) and the frontend (port 5173). Then open **http://localhost:5173** in your browser.  
   If you started only the backend (e.g. `cd foodfornow-backend && npm run dev`), open a second terminal, go to the repo root, and run `npm run dev` so both run together. Or run the frontend alone in a second terminal: `cd foodfornow-frontend && npm run dev`.

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
npm run dev          # Start both frontend and backend in development mode
npm run dev:host     # Same as dev, but exposes the frontend to your LAN for phone barcode scans
npm run build        # Build frontend for production
npm run start        # Start backend in production mode
```

#### Frontend Only
```bash
cd foodfornow-frontend
npm run dev          # Start Vite development server
npm run dev:host     # Start Vite with --host for testing on phones/tablets
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
- `POST /recipes/parse-url` - Scrape a recipe from a supported website URL
- `POST /recipes/parse-text` - Parse OCR/plain text (e.g., handwritten recipe cards)
- `POST /recipes/prepare-import` - Create ingredient records from parsed recipe data

### Barcode & Scan Session
- `GET /barcode/:code` - Look up a UPC/EAN barcode via Open Food Facts
- `POST /scan-session` - Create a temporary session for phone handoffs (auth required)
- `GET /scan-session/:id` - Poll for scanned barcodes (auth required)
- `POST /scan-session/:id` - Submit a barcode from the phone (no auth, session-scoped)
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

## 🔀 Development workflow

Work on the **`develop`** branch, then merge into **`main`** via a Pull Request when you're ready to release.

1. **Switch to develop**
   ```bash
   git checkout develop
   ```
2. **Do your work** – edit, test locally with `npm run dev`, commit on `develop`.
3. **Push develop**
   ```bash
   git push origin develop
   ```
4. **Open a Pull Request** on GitHub: **base branch `main`** ← **compare branch `develop`**. Add a short description, then merge when ready.
5. **Deploy** – Merging into `main` triggers the build and deploys to production.

After merging, either keep working on `develop` (it will be behind main until you merge or pull main into develop), or run:
   ```bash
   git checkout develop && git merge main
   ```
   to bring `develop` up to date with `main`.

### Contributing (external contributors)

1. **Fork the repository**
2. **Create a feature branch** from `develop`: `git checkout -b feature/amazing-feature`
3. **Make your changes**, test with `npm run dev`, commit, and push your branch
4. **Open a Pull Request** into `develop` (not `main`)

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
