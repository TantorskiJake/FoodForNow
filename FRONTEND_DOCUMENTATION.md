# FoodForNow Frontend Documentation

## Overview

The FoodForNow frontend is a React 19 application built with Vite, featuring a modern Material-UI interface with dark/light theme support, comprehensive state management, and responsive design. The application provides an intuitive user experience for managing recipes, meal planning, pantry items, and shopping lists.

## Technology Stack

- **React**: 19.1.0 with concurrent features
- **Vite**: 6.3.5 build tool and development server
- **Material-UI (MUI)**: 5.15.12 component library
- **React Router**: 6.22.3 for client-side routing
- **Axios**: 1.6.7 for HTTP requests
- **React Hot Toast**: 2.5.2 for notifications
- **React ZXing**: 2.1.0 for barcode scanning
- **ESLint**: 9.25.0 for code quality

## Project Structure

```
src/
├── components/          # Reusable UI components
├── pages/              # Page components
├── context/            # React context providers
├── services/           # API service layer
├── utils/              # Utility functions
├── assets/             # Static assets
├── App.jsx             # Main application component
├── main.jsx            # Application entry point
└── index.css           # Global styles
```

## Application Architecture

### Main App Component (`src/App.jsx`)

The main application component orchestrates the entire application:

```jsx
function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <AchievementProvider>
            <Router>
              <Navbar />
              <Routes>
                {/* Route definitions */}
              </Routes>
              <Toaster position="bottom-right" />
            </Router>
          </AchievementProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
```

**Key Features:**
- **Error Boundary**: Catches and handles JavaScript errors gracefully
- **Context Providers**: Manages global state (auth, theme, achievements)
- **Routing**: Client-side navigation with protected routes
- **Global Components**: Navbar and toast notifications

### Error Boundary

The error boundary component provides graceful error handling:

```jsx
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('App Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <h1>Something went wrong</h1>
          <p>Please refresh the page or contact support if the problem persists.</p>
          <button onClick={() => window.location.reload()}>
            Refresh Page
          </button>
          {process.env.NODE_ENV === 'development' && (
            <details>
              <summary>Error Details (Development)</summary>
              <pre>{this.state.error?.toString()}</pre>
            </details>
          )}
        </div>
      );
    }
    return this.props.children;
  }
}
```

## Context Providers

### AuthContext (`src/context/AuthContext.jsx`)

Manages user authentication state and provides authentication methods.

**State:**
```jsx
const [user, setUser] = useState(null);
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);
```

**Methods:**
- `login(email, password)`: Authenticate user
- `register(name, email, password)`: Register new user
- `logout()`: Logout user
- `checkAuth()`: Verify authentication status
- `updateUser(userData)`: Update user information

**Usage:**
```jsx
const { user, login, logout, loading } = useAuth();

if (loading) return <CircularProgress />;
if (!user) return <Navigate to="/login" />;
```

### ThemeContext (`src/context/ThemeContext.jsx`)

Manages application theme (light/dark mode) and persists user preference.

**State:**
```jsx
const [mode, setMode] = useState('auto');
const [theme, setTheme] = useState(createTheme());
```

**Methods:**
- `toggleTheme()`: Switch between light and dark modes
- `setThemeMode(mode)`: Set specific theme mode
- `getSystemTheme()`: Detect system theme preference

**Usage:**
```jsx
const { theme, toggleTheme, mode } = useTheme();

return (
  <ThemeProvider theme={theme}>
    <IconButton onClick={toggleTheme}>
      {mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
    </IconButton>
  </ThemeProvider>
);
```

### AchievementContext (`src/context/AchievementContext.jsx`)

Manages achievement notifications and provides achievement functionality.

**State:**
```jsx
const [achievements, setAchievements] = useState([]);
const [unreadCount, setUnreadCount] = useState(0);
const [showNotification, setShowNotification] = useState(false);
```

**Methods:**
- `fetchAchievements()`: Load user achievements
- `markAsRead(achievementId)`: Mark achievement as read
- `showAchievement(achievement)`: Display achievement notification
- `checkForNewAchievements()`: Check for newly unlocked achievements

## Components

### Navbar (`src/components/Navbar.jsx`)

Main navigation component with user menu and theme toggle.

**Features:**
- Responsive design with mobile menu
- User profile dropdown
- Theme toggle button
- Navigation links
- Achievement notifications

**Props:**
- None (uses context for state)

**Usage:**
```jsx
<Navbar />
```

### PrivateRoute (`src/components/PrivateRoute.jsx`)

Route protection component that redirects unauthenticated users.

**Props:**
- `children`: React elements to render if authenticated

**Usage:**
```jsx
<Route
  path="/dashboard"
  element={
    <PrivateRoute>
      <Dashboard />
    </PrivateRoute>
  }
/>
```

### MealPlanGrid (`src/components/MealPlanGrid.jsx`)

Weekly meal planning interface with drag-and-drop functionality.

**Features:**
- Weekly calendar view
- Drag-and-drop meal assignment
- Meal status tracking (cooked/uncooked)
- Recipe integration
- Custom meal support

**Props:**
- `startDate`: Start date for the week
- `endDate`: End date for the week
- `onMealUpdate`: Callback for meal updates
- `onMealDelete`: Callback for meal deletion

**Usage:**
```jsx
<MealPlanGrid
  startDate={startOfWeek}
  endDate={endOfWeek}
  onMealUpdate={handleMealUpdate}
  onMealDelete={handleMealDelete}
/>
```

### BarcodeScanner (`src/components/BarcodeScanner.jsx`)

Barcode scanning component for adding items to pantry.

**Features:**
- Camera access for barcode scanning
- Product lookup integration
- Automatic ingredient addition
- Error handling for unsupported devices

**Props:**
- `onScan`: Callback when barcode is scanned
- `onError`: Callback for scanning errors
- `onClose`: Callback to close scanner

**Usage:**
```jsx
<BarcodeScanner
  onScan={handleBarcodeScan}
  onError={handleScanError}
  onClose={handleCloseScanner}
/>
```

### AchievementNotification (`src/components/AchievementNotification.jsx`)

Displays achievement unlock notifications.

**Features:**
- Animated notification display
- Achievement details (title, description, icon)
- Auto-dismiss functionality
- Sound effects (optional)

**Props:**
- `achievement`: Achievement object to display
- `onClose`: Callback when notification is closed
- `autoClose`: Whether to auto-close (default: true)

**Usage:**
```jsx
<AchievementNotification
  achievement={unlockedAchievement}
  onClose={handleNotificationClose}
  autoClose={true}
/>
```

### PasswordField (`src/components/PasswordField.jsx`)

Enhanced password input field with visibility toggle.

**Features:**
- Password visibility toggle
- Strength indicator
- Validation feedback
- Material-UI styling

**Props:**
- `value`: Password value
- `onChange`: Change handler
- `label`: Field label
- `error`: Error state
- `helperText`: Helper text

**Usage:**
```jsx
<PasswordField
  value={password}
  onChange={handlePasswordChange}
  label="Password"
  error={!!passwordError}
  helperText={passwordError}
/>
```

### ThemeToggle (`src/components/ThemeToggle.jsx`)

Theme toggle button component.

**Features:**
- Icon changes based on current theme
- Smooth transitions
- Tooltip for accessibility
- Context integration

**Props:**
- `size`: Button size ('small', 'medium', 'large')
- `color`: Button color

**Usage:**
```jsx
<ThemeToggle size="medium" color="primary" />
```

## Pages

### Dashboard (`src/pages/Dashboard.jsx`)

Main dashboard page providing overview of all application features.

**Features:**
- Quick statistics (recipes, pantry items, meal plans)
- Recent activity feed
- Quick action buttons
- Responsive grid layout
- Achievement highlights

**State Management:**
- Fetches data from multiple API endpoints
- Real-time updates for meal plan status
- Achievement notifications

**Usage:**
```jsx
<Route path="/dashboard" element={<Dashboard />} />
```

### Login (`src/pages/Login.jsx`)

User authentication page.

**Features:**
- Email and password form
- Form validation
- Error handling
- Remember me functionality
- Link to registration

**Form Validation:**
- Email format validation
- Password requirements
- Required field validation
- API error display

**Usage:**
```jsx
<Route path="/login" element={<Login />} />
```

### Register (`src/pages/Register.jsx`)

User registration page.

**Features:**
- Name, email, and password form
- Password confirmation
- Terms and conditions acceptance
- Form validation
- Link to login

**Validation Rules:**
- Name: 2-50 characters
- Email: Valid format, unique
- Password: Minimum 8 characters, alphanumeric
- Password confirmation: Must match

### Recipes (`src/pages/Recipes.jsx`)

Recipe management page.

**Features:**
- Recipe listing with search and filters
- Recipe creation and editing
- Category and tag management
- Pagination
- Sort options

**State Management:**
- Recipe list with pagination
- Search and filter state
- Loading states
- Error handling

### RecipeDetail (`src/pages/RecipeDetail.jsx`)

Individual recipe view page.

**Features:**
- Complete recipe information
- Ingredient list with quantities
- Step-by-step instructions
- Cooking time and servings
- Edit and delete options
- Add to meal plan functionality

**URL Parameters:**
- `id`: Recipe ID from URL

### Pantry (`src/pages/Pantry.jsx`)

Pantry management page.

**Features:**
- Pantry item listing
- Add/edit/delete items
- Quantity tracking
- Expiration date monitoring
- Category filtering
- Barcode scanning integration

**State Management:**
- Pantry items with real-time updates
- Search and filter functionality
- Bulk operations
- Expiration alerts

### ShoppingList (`src/pages/ShoppingList.jsx`)

Shopping list management page.

**Features:**
- Shopping list items
- Add/edit/delete items
- Completion tracking
- Priority levels
- Category organization
- Bulk operations

**State Management:**
- Shopping list with real-time updates
- Completion status tracking
- Priority management
- Bulk add to pantry

### Ingredients (`src/pages/Ingredients.jsx`)

Ingredient management page.

**Features:**
- Ingredient listing
- Search and filter
- Category management
- Default unit settings
- Pagination

### Achievements (`src/pages/Achievements.jsx`)

Achievement display page.

**Features:**
- Achievement listing
- Unread/read status
- Achievement categories
- Progress tracking
- Achievement details

### Profile (`src/pages/Profile.jsx`)

User profile management page.

**Features:**
- Profile information editing
- Preference settings
- Notification settings
- Account management
- Theme preferences

## Services

### API Service (`src/services/api.js`)

Centralized API communication layer.

**Features:**
- Axios instance configuration
- Request/response interceptors
- Authentication token handling
- Error handling
- Base URL configuration

**Configuration:**
```jsx
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
  withCredentials: true,
  timeout: 10000,
});
```

**Interceptors:**
- Request: Add authentication headers
- Response: Handle errors and token refresh
- Error: Global error handling

**Usage:**
```jsx
import api from '../services/api';

// GET request
const recipes = await api.get('/recipes');

// POST request
const newRecipe = await api.post('/recipes', recipeData);

// PUT request
const updatedRecipe = await api.put(`/recipes/${id}`, updateData);

// DELETE request
await api.delete(`/recipes/${id}`);
```

### Geonames Service (`src/services/geonames.js`)

Location-based services for user profiles.

**Features:**
- City and country data
- Location search
- Timezone information
- Geographic data

**Usage:**
```jsx
import { searchCities, getTimezone } from '../services/geonames';

const cities = await searchCities('New York');
const timezone = await getTimezone(lat, lng);
```

## Utilities

### Category Colors (`src/utils/categoryColors.js`)

Utility for consistent category color mapping.

**Features:**
- Predefined color palette
- Category-to-color mapping
- Color generation for new categories
- Accessibility considerations

**Usage:**
```jsx
import { getCategoryColor } from '../utils/categoryColors';

const color = getCategoryColor('vegetables'); // Returns '#4CAF50'
```

### World Cities (`src/utils/worldCities.json`)

Static data for city selection.

**Features:**
- Major world cities
- Country information
- Timezone data
- Population data

## Styling and Theming

### Material-UI Theme Configuration

The application uses a custom Material-UI theme with:

**Light Theme:**
- Primary: Green (#228B22)
- Secondary: Orange (#FF8C00)
- Background: Light gray (#FAFAFA)
- Text: Dark gray (#212121)

**Dark Theme:**
- Primary: Light green (#4CAF50)
- Secondary: Light orange (#FFB74D)
- Background: Dark gray (#121212)
- Text: Light gray (#FFFFFF)

**Theme Features:**
- Responsive breakpoints
- Custom component styles
- Typography scale
- Spacing system

### CSS Custom Properties

Global CSS variables for consistent styling:

```css
:root {
  --primary-color: #228B22;
  --secondary-color: #FF8C00;
  --background-color: #FAFAFA;
  --text-color: #212121;
  --border-radius: 8px;
  --shadow: 0 2px 4px rgba(0,0,0,0.1);
}
```

## State Management Patterns

### Context + Hooks Pattern

The application uses React Context for global state management:

**Benefits:**
- No external dependencies
- Built-in React features
- TypeScript support
- Performance optimization

**Pattern:**
```jsx
// Context definition
const MyContext = createContext();

// Provider component
const MyProvider = ({ children }) => {
  const [state, setState] = useState(initialState);
  
  const value = {
    state,
    setState,
    // Other methods
  };
  
  return (
    <MyContext.Provider value={value}>
      {children}
    </MyContext.Provider>
  );
};

// Custom hook
const useMyContext = () => {
  const context = useContext(MyContext);
  if (!context) {
    throw new Error('useMyContext must be used within MyProvider');
  }
  return context;
};
```

### Local State Management

Component-level state management:

**Patterns:**
- `useState` for simple state
- `useReducer` for complex state logic
- `useCallback` for memoized functions
- `useMemo` for expensive calculations

## Performance Optimization

### Code Splitting

Lazy loading for route-based code splitting:

```jsx
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Recipes = lazy(() => import('./pages/Recipes'));

// With Suspense
<Suspense fallback={<CircularProgress />}>
  <Dashboard />
</Suspense>
```

### Memoization

Component and value memoization:

```jsx
// Memoized component
const MemoizedComponent = memo(({ data }) => {
  return <div>{data}</div>;
});

// Memoized value
const expensiveValue = useMemo(() => {
  return computeExpensiveValue(data);
}, [data]);

// Memoized callback
const handleClick = useCallback(() => {
  performAction(id);
}, [id]);
```

### Bundle Optimization

Vite configuration for optimal bundle size:

```javascript
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          mui: ['@mui/material', '@mui/icons-material'],
        },
      },
    },
  },
});
```

## Error Handling

### Global Error Boundary

Application-wide error catching:

```jsx
class ErrorBoundary extends React.Component {
  // Error boundary implementation
}
```

### API Error Handling

Consistent error handling for API calls:

```jsx
try {
  const response = await api.get('/endpoint');
  return response.data;
} catch (error) {
  if (error.response?.status === 401) {
    // Handle authentication error
    logout();
  } else if (error.response?.status === 404) {
    // Handle not found
    showError('Resource not found');
  } else {
    // Handle general error
    showError('Something went wrong');
  }
}
```

### Form Validation

Client-side validation with error display:

```jsx
const [errors, setErrors] = useState({});

const validateForm = () => {
  const newErrors = {};
  
  if (!email) newErrors.email = 'Email is required';
  if (!password) newErrors.password = 'Password is required';
  
  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};
```

## Accessibility

### ARIA Labels and Roles

Proper accessibility markup:

```jsx
<button
  aria-label="Toggle theme"
  aria-pressed={mode === 'dark'}
  onClick={toggleTheme}
>
  <ThemeToggleIcon />
</button>
```

### Keyboard Navigation

Full keyboard support:

```jsx
const handleKeyPress = (event) => {
  if (event.key === 'Enter' || event.key === ' ') {
    handleClick();
  }
};
```

### Screen Reader Support

Semantic HTML and proper labeling:

```jsx
<main role="main" aria-label="Dashboard">
  <h1>Dashboard</h1>
  <section aria-label="Quick Statistics">
    {/* Content */}
  </section>
</main>
```

## Testing

### Component Testing

React Testing Library for component tests:

```jsx
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import theme from '../theme';

const renderWithTheme = (component) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};

test('renders login form', () => {
  renderWithTheme(<Login />);
  expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
});
```

### Integration Testing

End-to-end user workflows:

```jsx
test('user can create a recipe', async () => {
  renderWithTheme(<Recipes />);
  
  fireEvent.click(screen.getByText('Add Recipe'));
  fireEvent.change(screen.getByLabelText('Name'), {
    target: { value: 'Test Recipe' },
  });
  fireEvent.click(screen.getByText('Save'));
  
  await waitFor(() => {
    expect(screen.getByText('Test Recipe')).toBeInTheDocument();
  });
});
```

## Development Guidelines

### Code Style

**Component Structure:**
```jsx
// Imports
import React, { useState, useEffect } from 'react';
import { Box, Typography } from '@mui/material';

// PropTypes (if using)
ComponentName.propTypes = {
  prop: PropTypes.string.isRequired,
};

// Component
const ComponentName = ({ prop }) => {
  // Hooks
  const [state, setState] = useState(initialState);
  
  // Effects
  useEffect(() => {
    // Effect logic
  }, [dependencies]);
  
  // Handlers
  const handleClick = () => {
    // Handler logic
  };
  
  // Render
  return (
    <Box>
      <Typography>{prop}</Typography>
    </Box>
  );
};

export default ComponentName;
```

### Naming Conventions

- **Components**: PascalCase (`MealPlanGrid`)
- **Files**: PascalCase for components, camelCase for utilities
- **Variables**: camelCase (`userData`)
- **Constants**: UPPER_SNAKE_CASE (`API_BASE_URL`)
- **Functions**: camelCase (`handleSubmit`)

### File Organization

```
components/
├── common/           # Shared components
├── forms/           # Form components
├── layout/          # Layout components
└── feature/         # Feature-specific components

pages/
├── auth/           # Authentication pages
├── dashboard/      # Dashboard pages
└── management/     # Management pages
```

---

This frontend documentation provides comprehensive information about the React application architecture, components, patterns, and development guidelines. For specific implementation details, refer to the individual source files and their inline documentation. 