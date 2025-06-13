# FoodForNow Backend

## Overview
The backend of FoodForNow is built using Node.js and Express, providing a robust API for the frontend application. It handles user authentication, data management, and business logic.

## Features
- **User Authentication**: Secure login and registration using JWT.
- **API Routes**: Endpoints for managing pantry, recipes, and shopping lists.
- **MongoDB Integration**: Data storage and retrieval using MongoDB.
- **Middleware**: Custom middleware for authentication and error handling.

## Tech Stack
- **Node.js**: Runtime environment
- **Express**: Web framework
- **MongoDB**: Database
- **JWT**: Authentication

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm (v6 or higher)
- MongoDB (local or Atlas)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/FoodForNow.git
   cd FoodForNow/foodfornow-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   - Create a `.env` file with the following variables:
     ```
     MONGO_URI=your_mongodb_connection_string
     JWT_SECRET=your_jwt_secret
     PORT=3001
     CORS_ORIGIN=http://localhost:5173
     ```

4. **Start the server**
   ```bash
   npm start
   ```

5. **Access the API**
   - API: http://localhost:3001

## Project Structure

- `src/`: Contains all backend source code
  - `routes/`: API routes
  - `models/`: MongoDB models
  - `middleware/`: Custom middleware (e.g., authentication)
  - `server.js`: Main server file

## API Routes

- **Authentication**
  - `POST /api/auth/register`: Register a new user
  - `POST /api/auth/login`: Login a user
  - `GET /api/auth/me`: Get current user info
  - `POST /api/auth/logout`: Logout a user

- **Pantry**
  - `GET /api/pantry`: Get all pantry items
  - `POST /api/pantry`: Add a new pantry item
  - `PUT /api/pantry/:id`: Update a pantry item
  - `DELETE /api/pantry/:id`: Delete a pantry item

- **Recipes**
  - `GET /api/recipes`: Get all recipes
  - `POST /api/recipes`: Add a new recipe
  - `GET /api/recipes/:id`: Get a specific recipe
  - `PUT /api/recipes/:id`: Update a recipe
  - `DELETE /api/recipes/:id`: Delete a recipe

- **Shopping List**
  - `GET /api/shopping-list`: Get the shopping list
  - `POST /api/shopping-list`: Add items to the shopping list
  - `PUT /api/shopping-list/:id`: Update a shopping list item
  - `DELETE /api/shopping-list/:id`: Delete a shopping list item

## Contributing
1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License
This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments
- Express for the backend framework
- MongoDB for the database
- JWT for authentication

