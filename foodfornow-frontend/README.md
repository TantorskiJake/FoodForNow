# FoodForNow

## Overview
FoodForNow is a full-stack web application designed to help users manage their pantry, recipes, and shopping lists. The application is built using React for the frontend and Node.js with Express for the backend.

## Features
- **User Authentication**: Secure login, registration, and password reset (forgot/reset).
- **Dashboard**: Overview of user's pantry, recipes, and shopping lists.
- **Pantry Management**: Add, edit, and remove items from your pantry.
- **Recipe Management**: Browse, add, and manage recipes.
- **Shopping List**: Create and manage shopping lists based on recipes and pantry items.
- **Responsive Design**: Built with Material-UI for a modern and responsive user interface.

## Tech Stack
- **Frontend**: React, Material-UI, Vite
- **Backend**: Node.js, Express, MongoDB
- **Authentication**: JWT (JSON Web Tokens)

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm (v8 or higher)
- MongoDB (local or Atlas)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/FoodForNow.git
   cd FoodForNow
   ```

2. **Install backend dependencies**
   ```bash
   cd foodfornow-backend
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd ../foodfornow-frontend
   npm install
   ```

4. **Set up environment variables**
   - Create a `.env` file in the `foodfornow-backend` directory:
     ```
     MONGO_URI=your_mongodb_connection_string
     JWT_SECRET=your_jwt_secret
     PORT=3001
     CORS_ORIGIN=http://localhost:5173
     ```
   - Optionally create a `.env` file in `foodfornow-frontend` for location features:
     ```
     VITE_API_URL=http://localhost:3001/api
     VITE_GEONAMES_USERNAME=your_geonames_username
     ```

5. **Start the backend server**
   ```bash
   cd foodfornow-backend
   npm start
   ```

6. **Start the frontend development server**
   ```bash
   cd foodfornow-frontend
   npm run dev
   ```

7. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3001

## Project Structure

### Frontend
- `src/`: Contains all frontend source code
  - `components/`: Reusable UI components
  - `pages/`: Page components
  - `services/`: API service for backend communication
  - `App.jsx`: Main application component
  - `main.jsx`: Entry point

### Backend
- `src/`: Contains all backend source code
  - `routes/`: API routes
  - `models/`: MongoDB models
  - `middleware/`: Custom middleware (e.g., authentication)
  - `server.js`: Main server file

## Navbar Component

The Navbar component (`src/components/Navbar.jsx`) is a crucial part of the application's user interface. It provides navigation links and user authentication controls.

### Features
- **Conditional Rendering**: The Navbar is hidden on the login and registration pages.
- **Authentication**: Shows different options based on user authentication status.
- **Navigation Links**: Provides quick access to Dashboard, Pantry, Ingredients, Recipes, and Shopping List.
- **User Menu**: Displays a dropdown menu for user actions (e.g., logout).

### Usage
The Navbar is automatically rendered in the `App.jsx` file. It checks the user's authentication status and displays the appropriate navigation options.

## Contributing
1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License
This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments
- Material-UI for the component library
- MongoDB for the database
- Express for the backend framework
- React for the frontend framework
