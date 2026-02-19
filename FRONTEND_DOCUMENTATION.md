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

The main application component orchestrates global providers, routing, and the onboarding overlay. `AppRoutes` encapsulates all routes plus conditional UI that depends on auth state.

```jsx
function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <AchievementProvider>
            <Router>
              <AppRoutes />
            </Router>
          </AchievementProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
```

**Key Features:**
- **Error Boundary**: Catches runtime issues and shows a friendly fallback
- **Context Providers**: Theme (dark-by-default), authentication, and achievements
- **Routing**: `PrivateRoute` protects all app pages; public routes cover `/login`, `/register`, `/forgot-password`, `/reset-password`, plus `/scan` (phone barcode helper)
- **Guided Onboarding**: `AppRoutes` checks `hasCompletedOnboarding(userId)` and mounts `OnboardingOverlay` until dismissed
- **Global Components**: Navbar, `Toaster` (bottom-right), and route-specific overlays

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

Manages application theme (dark by default) and persists the user's manual light/dark preference.

**State:**
```jsx
const [darkMode, setDarkMode] = useState(true);
const theme = createTheme({
  palette: { mode: darkMode ? 'dark' : 'light' },
});
```

**Methods:**
- `toggleDarkMode()`: Switch between dark and light modes on demand
- `setThemeFromPreference(preference)`: Apply the user's saved preference (treats anything but `'light'` as dark)

**Usage:**
```jsx
const { darkMode, toggleDarkMode } = useTheme();

return (
  <IconButton onClick={toggleDarkMode}>
    {darkMode ? <LightModeIcon /> : <DarkModeIcon />}
  </IconButton>
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

Modal component that lets users add barcodes three different ways: manual entry, laptop camera, or a QR handoff to their phone.

**Features:**
- Toggle between `type`, `camera`, and `phone` modes in a single dialog
- Generates `/api/scan-session` IDs and polls until a phone submission arrives
- Shows a QR code that opens `/scan?session=...` on the phone (needs `VITE_APP_PUBLIC_URL` or LAN URL)
- Performs Open Food Facts lookups (via backend proxy) and falls back to manual ingredient creation
- Allows manual barcode entry for grocery items that won't scan well

**Props:**
- `open`: Boolean to show/hide the dialog
- `onDetected(barcode: string)`: Fired when a valid code is captured (from any mode)
- `onClose()`: Close handler (also clears timers/session polling)

**Usage:**
```jsx
<BarcodeScanner
  open={scannerOpen}
  onDetected={handleBarcodeScan}
  onClose={() => setScannerOpen(false)}
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

### EmptyState (`src/components/EmptyState.jsx`)

Reusable call-to-action card for empty screens (dashboard widgets, pantry, shopping list, etc.).

**Features:**
- Accepts any icon and copy; adapts styling to light/dark mode
- Primary/secondary button slots with consistent gradients/borders
- Keeps layouts consistent when sections have no data

**Props:**
- `icon`: React node rendered at the top
- `title`: Headline text
- `description`: Supporting copy
- `primaryAction`: `{ label, onClick, startIcon? }`
- `secondaryAction`: Optional `{ label, onClick, startIcon? }`

**Usage:**
```jsx
<EmptyState
  icon={<ShoppingCartIcon sx={{ fontSize: 48 }} />}
  title="Your shopping list is empty"
  description="Scan a barcode or auto-import ingredients from your meal plan."
  primaryAction={{ label: 'Add Item', onClick: handleAdd }}
  secondaryAction={{ label: 'Auto Update', onClick: handleAutoUpdate }}
/>
```

### OnboardingOverlay (`src/components/OnboardingOverlay.jsx`)

Stepper-style modal that guides first-time users through the workflow.

**Features:**
- Four steps (Recipes → Meal Plan → Shopping List → Pantry) with icons and descriptions
- Persists completion via `localStorage` per user ID (`foodfornow_onboarding_<id>`)
- Offers Skip/Got it controls; automatically opens until dismissed

**Props:**
- `open`: Controls visibility
- `onClose()`: Called after Skip/Got it
- `userId`: Used to key onboarding preference

**Usage:**
```jsx
<OnboardingOverlay
  open={showOnboarding}
  onClose={() => setShowOnboarding(false)}
  userId={user?._id}
/>
```

## Pages

### Dashboard (`src/pages/Dashboard.jsx`)

Main dashboard page providing overview of all application features.

**Features:**
- Personalized greeting + stats (recipes, pantry items, meal plans, shopping items)
- Weekly meal plan grid with copy-to-slot mode, cooked toggles, and optimistic edits
- Collapsible “Needed Ingredients” panel with Add-All-to-shopping-list, pantry adjustments, and per-item state chips
- EmptyState fallbacks for meal plan/ingredient widgets
- Contextual help dialog ("How FoodForNow Works") accessible from the header

**State Management:**
- Fetches recipes, pantry, shopping list, and meal plans in parallel
- Optimistic updates for add/edit/cook operations with toast feedback
- Achievement notifications fire when API responses include `achievements`

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
- Link to forgot password

**Form Validation:**
- Email format validation
- Password requirements
- Required field validation
- API error display

**Usage:**
```jsx
<Route path="/login" element={<Login />} />
```

### ForgotPassword (`src/pages/ForgotPassword.jsx`)

Password reset request page.

**Features:**
- Email input form
- Request reset link
- Success/error feedback
- Link back to login

**Usage:**
```jsx
<Route path="/forgot-password" element={<ForgotPassword />} />
```

### ResetPassword (`src/pages/ResetPassword.jsx`)

Password reset completion page (accessed via token in URL).

**Features:**
- New password and confirmation form
- Token validation from URL query params
- Password strength requirements
- Link to login after success

**URL Parameters:**
- `token`: Reset token from forgot-password flow (query param)

**Usage:**
```jsx
<Route path="/reset-password" element={<ResetPassword />} />
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

Recipe management page that now supports both URL scraping and handwritten card imports.

**Features:**
- Recipe listing with search, filters, sorting, and empty-state guidance
- Dual import menu (URL scraper + OCR image upload powered by `tesseract.js`)
- Category review dialog for uncertain ingredients before import completes
- Inline editing/creation with image upload, tags, timings, and instructions
- Toast notifications + loading states for parse/prep flows

**State Management:**
- Tracks list filters, import dialog states, OCR progress, category overrides, and pending recipe payloads
- Uses `api.post('/recipes/parse-text')` + `/prepare-import` to hydrate forms

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
- Grouped ingredient cards with per-unit chips and expiration badges
- Add/edit dialog with drag/drop photos (if desired) and quantity controls
- Barcode scanner integration (manual/camera/phone) plus Open Food Facts lookup + fallback placeholder creation
- Empty state CTA that links to Dashboard when no pantry items exist
- Quick actions to add scanning results directly into pantry forms

**State Management:**
- Aggregates pantry items by ingredient name for clean UI
- Tracks form data, dialog state, scanner modal, and existing ingredients
- Gracefully degrades when barcode lookup fails (keeps dialog populated)

### ShoppingList (`src/pages/ShoppingList.jsx`)

Shopping list management page.

**Features:**
- Full CRUD with inline checkboxes and quantity/unit display
- Auto Update action pulls missing meal-plan ingredients; Add Item dialog supports manual additions
- Clear menu differentiates “Clear Completed” vs “Clear All”
- Barcode scanner integration mirrors pantry behavior, auto-creating ingredients when needed
- Empty state CTA cards for first-time use

**State Management:**
- Maintains filters, sort order, search term, barcode scanner visibility, and add dialog state
- Calls `/shopping-list` APIs and surfaces achievements returned from server

### Scan (`src/pages/Scan.jsx`)

Simple mobile-friendly page used when a user scans the QR code from the desktop barcode dialog.

**Features:**
- Uses `@zxing/browser` to access the device camera and continuously decode barcodes
- Submits scanned text to `POST /scan-session/:id` (session ID comes from QR query string)
- Shows success/error states and instructs the user to return to their computer after scanning

**Usage:**
```jsx
<Route path="/scan" element={<Scan />} />
```

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
- Notification settings (email, push, reminders)
- Display preferences (theme, units, language) with dark-mode default + manual light override only
- Security tab for password updates with live validation
- Account stats and downloadable data section

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

Location-based services for user profiles (city search, timezone lookup).

**Environment Requirement:**
- `VITE_GEONAMES_USERNAME` must be set in the frontend `.env` for city search and timezone features. Get a free username at [geonames.org](https://www.geonames.org/).
- If not configured, `searchCities` and `getTimezone` will throw. Callers should catch errors and show a user-friendly message (e.g. "Location services not configured").

**Features:**
- City and country data
- Location search
- Timezone information
- Geographic data

**Usage:**
```jsx
import { searchCities, getTimezone } from '../services/geonames';

try {
  const cities = await searchCities('New York');
  const timezone = await getTimezone(lat, lng);
} catch (err) {
  // Show "Location services not configured" or similar
}
```

### Barcode Lookup (`src/services/barcodeLookup.js`)

Helper functions shared by Pantry and Shopping List flows.

**Exports:**
- `extractBarcode(value: string)`: Strips non-digits and returns a normalized UPC/EAN or `null`
- `lookupBarcode(barcode: string)`: Calls the backend (`/barcode/:code`) and returns `{ productName, category, quantity, unit, barcode }`

**Usage Considerations:**
- Throwing errors are surfaced to the UI; callers fall back to manual ingredient selection when lookup fails
- Depends on the backend proxy so no API keys are needed client-side

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
