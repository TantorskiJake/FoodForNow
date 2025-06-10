# FoodForNow Backend API

A secure Node.js/Express backend API for food management with user authentication, recipe management, pantry tracking, and meal planning.

## 🔒 Security Features

- ✅ JWT authentication with refresh tokens
- ✅ Database-stored refresh tokens (no in-memory storage)
- ✅ Rate limiting to prevent abuse
- ✅ Security headers with Helmet.js
- ✅ Input sanitization and validation
- ✅ Password hashing with bcrypt
- ✅ MongoDB injection protection
- ✅ CORS configuration

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or Atlas)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd foodfornow-backend
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

4. **IMPORTANT**: Edit `.env` and replace the placeholder values:

```bash
# Generate secure JWT secrets:
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"
node -e "console.log('JWT_REFRESH_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"

# Update your MongoDB connection string
# For local development:
MONGO_URI=mongodb://localhost:27017/foodfornow

# For MongoDB Atlas:
# MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/foodfornow?retryWrites=true&w=majority
```

5. Start the server:
```bash
# Development (with auto-restart)
npm run dev

# Production
npm start
```

## 📚 API Endpoints

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - User login
- `POST /auth/token` - Refresh access token
- `POST /auth/logout` - User logout

### User Management
- `GET /user/profile` - Get user profile
- `PUT /user/profile` - Update user profile
- `DELETE /user/profile` - Delete user account

### Ingredients
- `GET /ingred` - Get all ingredients
- `POST /ingred` - Create ingredient (auth required)
- `GET /ingred/:id` - Get single ingredient
- `PUT /ingred/:id` - Update ingredient (auth required)
- `DELETE /ingred/:id` - Delete ingredient (auth required)

### Recipes
- `GET /recipes` - Get all recipes
- `POST /recipes` - Create recipe (auth required)
- `PUT /recipes/:id` - Update recipe (auth required)
- `DELETE /recipes/:id` - Delete recipe (auth required)

### Pantry Management
- `GET /pantry` - Get user's pantry (auth required)
- `POST /pantry` - Add to pantry (auth required)
- `DELETE /pantry/:id` - Remove pantry item (auth required)
- `DELETE /pantry` - Clear entire pantry (auth required)

### Meal Plans
- `GET /meal-plans` - Get user's meal plans (auth required)
- `POST /meal-plans` - Create meal plan (auth required)
- `GET /meal-plans/:id` - Get single meal plan (auth required)
- `PUT /meal-plans/:id` - Update meal plan (auth required)
- `DELETE /meal-plans/:id` - Delete meal plan (auth required)

## 🛡️ Security Configuration

### Rate Limiting
The API includes rate limiting to prevent abuse:
- Default: 100 requests per 15 minutes per IP
- Configurable via environment variables

### Authentication
- Access tokens expire in 1 hour
- Refresh tokens expire in 7 days
- Tokens are stored securely in the database
- Automatic cleanup of expired tokens

### Input Validation
- All inputs are sanitized and validated
- Email format validation
- Required field checking
- MongoDB injection prevention

## 🔧 Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `PORT` | Server port | No | 5000 |
| `MONGO_URI` | MongoDB connection string | Yes | - |
| `JWT_SECRET` | JWT access token secret | Yes | - |
| `JWT_REFRESH_SECRET` | JWT refresh token secret | Yes | - |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window in ms | No | 900000 (15 min) |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window | No | 100 |

## 🚨 Security Best Practices

1. **Never commit `.env` files** - They're in `.gitignore` for a reason
2. **Use strong, unique JWT secrets** - Generate them with crypto.randomBytes(64)
3. **Use HTTPS in production** - Never send tokens over HTTP
4. **Regularly rotate JWT secrets** - Especially after security incidents
5. **Monitor rate limits** - Adjust based on your usage patterns
6. **Keep dependencies updated** - Run `npm audit` regularly
7. **Use environment-specific configurations** - Different secrets for dev/staging/prod

## 📝 Development

```bash
# Install dependencies
npm install

# Run in development mode with auto-restart
npm run dev

# Check for security vulnerabilities
npm audit

# Fix vulnerabilities
npm audit fix
```

## 🧪 Testing

You can test the API endpoints using tools like:
- Postman
- curl
- Thunder Client (VS Code extension)
- Insomnia

Example login request:
```bash
curl -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'
```

## 📄 License

ISC License

