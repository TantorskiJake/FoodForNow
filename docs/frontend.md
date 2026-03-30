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

Weekly meal-planning grid for one selected week.

**Features:**
- Renders only meals whose `weekStart` matches `selectedWeekStart` (UTC date-only comparison)
- Week matching uses `mealsForSelectedWeek` (`new Date(...).toISOString().slice(0, 10)`), so offset timestamps can move across local dates but still match UTC date keys
- Supports multiple meals per day/slot (stacked cards in each cell)
- Context actions per meal: edit, delete, view recipe, open restaurant URL
- Cook flow integration (`PATCH /mealplan/:id/cook`) with missing-ingredients dialog
- Uncook confirmation flow (`PATCH /mealplan/:id/cooked`)
- Copy mode for recipe/eating-out meals (copy one meal or all meals in a slot, then click target slots to paste)
- Mobile-first rendering (day sections) and desktop matrix rendering (days x meal types)
- If a cook attempt adds missing ingredients to shopping list and the meal remains uncooked, the component currently forces a full page reload to sync state

**Props:**
- `mealPlan`: Raw meal-plan array from API
- `days`: Ordered day names for the current week layout
- `selectedWeekStart`: `YYYY-MM-DD` string used to filter visible meals
- `onAddMeal(day, mealType)`
- `onDeleteMeal(mealId)`
- `onEditMeal(day, mealType, meal)`
- `onMealPlanUpdate(updatedMeal)`
- `onAddRecipeToSlot(day, mealType, recipe, existingMealId?)`
- `onAddRestaurantToSlot(day, mealType, restaurant)`

**Usage:**
```jsx
<MealPlanGrid
  days={orderedDayNames}
  mealPlan={mealPlan}
  selectedWeekStart={selectedWeekStart}
  onAddMeal={handleOpenMealDialog}
  onEditMeal={handleEditMeal}
  onDeleteMeal={handleDeleteMeal}
  onMealPlanUpdate={handleMealPlanUpdate}
  onAddRecipeToSlot={handleAddRecipeToSlot}
  onAddRestaurantToSlot={handleAddRestaurantToSlot}
/>
```

**Week filter example (UTC behavior):**
- Selecting `2026-03-10` includes `weekStart: "2026-03-09T19:00:00-05:00"` (UTC key becomes `2026-03-10`).
- Selecting `2026-03-10` excludes `weekStart: "2026-03-10T00:00:00+09:00"` (UTC key becomes `2026-03-09`).

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

### RecipeFormDialog (`src/components/RecipeFormDialog.jsx`)

Shared add/edit dialog used by both `Recipes` and `RecipeDetail`.

**Features:**
- Supports two modes: create (`POST /recipes`) and edit (`PUT /recipes/:id`)
- Accepts `createSeed` payloads from import flows (`parse-url`/`parse-text` -> `prepare-import`)
- Ingredient autocomplete with "Create new ingredient" fallback (`POST /ingredients`)
- Multi-line instruction editor with step reordering and validation
- Supports both ingredient IDs and free-text ingredient names (resolved on recipe save)
- Optional `runTask` + `submitDisabled` props for parent-level loading states

**Key Props:**
- `open`, `onClose`
- `editingRecipe`: switches dialog into edit mode
- `createSeed`: pre-fills fields for imported recipes
- `onSaved(payload)`: callback after successful create/update
- `runTask`, `submitDisabled`: optional wrappers from parent pages

## Pages

### Dashboard (`src/pages/Dashboard.jsx`)

Main dashboard page providing overview of all application features.

**Features:**
- Week selector with previous/next navigation, date-picker popover, and a persisted “Week starts on” preference (`localStorage`)
- Week-scoped meal-plan operations (`/mealplan?weekStart=...`, `/mealplan/reset-week`, `/mealplan/populate-week`)
- Meal grid with copy-to-slot mode, cooked toggles, eating-out support, and optimistic recipe-slot assignment
- Collapsible “Needed Ingredients” panel backed by `/mealplan/ingredients?weekStart=...&aggregateByIngredient=true`
- Ingredient action shortcuts (add/remove pantry, add to shopping list, add-all to shopping list)
- EmptyState fallbacks for meal plan/ingredient widgets
- Contextual help dialog ("How FoodForNow Works") accessible from the header

**State Management:**
- Fetches recipes, week-filtered meal plans, and week-filtered needed ingredients in parallel
- Uses cached API reads with targeted invalidation (`api.cachedGet` + `api.invalidateCache`)
- Optimistic updates for slot-level recipe assignment and delete-with-rollback flows
- Achievement notifications fire when API responses include `achievements`

**Operational Pitfall:**
- Always pass `weekStart` as `YYYY-MM-DD` when calling meal-plan endpoints to avoid timezone edge cases between client locale and server locale.

**Usage:**
```jsx
<Route path="/dashboard" element={<Dashboard />} />
```

### Login (`src/pages/Login.jsx`)

User authentication page.

**Features:**
- Email/password form that submits via shared API service (`api.post('/auth/login')`) so interceptors/cookies are handled consistently
- Remember-email preference stored in `localStorage` (`foodfornow_remembered_login`)
- Success transition state (`form` -> `success` -> `exiting`) before navigating to `/dashboard`
- Browser credential save attempt via `PasswordCredential` when supported
- Safety timeout to stop indefinite loading if login request hangs
- Error handling
- Link to registration
- Link to forgot password

**Error Handling Notes:**
- API error messages prefer backend-provided `error` payloads.
- If no response arrives in 10 seconds, the UI shows `"Request is taking too long. Please try again."`.

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
- Dual import menu (URL scraper + OCR image upload powered by `tesseract.js`) plus pasted text import
- Category review dialog for uncertain ingredients before import completes
- Shared `RecipeFormDialog` for create/edit
- Shared recipe tab with "Add" duplication flow (`POST /recipes/:id/duplicate`)
- Dashboard deep-link support (`/recipes?create=1`) to open create dialog directly
- Optimistic delete with rollback on API failure

**State Management:**
- Tracks list filters, import dialog states, OCR progress, category overrides, and pending recipe payloads
- Uses `api.cachedGet('/recipes')` and invalidates recipe cache after writes
- Import pipeline: `parse-url` or `parse-text` -> optional category review -> `prepare-import` -> `RecipeFormDialog`

### RecipeDetail (`src/pages/RecipeDetail.jsx`)

Individual recipe view page.

**Features:**
- Complete recipe information
- Ingredient list with quantities
- Numbered step-by-step instructions
- Cooking time and servings
- Back navigation to dashboard and recipe list
- In-place edit icon that opens `RecipeFormDialog`
- Updates local recipe state + invalidates recipe cache after successful save
- Success feedback via snackbar after edits

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
- Barcode scanner integration mirrors pantry behavior and opens a "Product not found" fallback dialog when lookup misses
- Empty state CTA cards for first-time use
- Group cards aggregate duplicate ingredients and show converted totals via `formatGroupedTotal`

**State Management:**
- Maintains filters, sort order, search term, barcode scanner visibility, and add dialog state
- Calls `/shopping-list` APIs and surfaces achievements returned from server (`response.data.achievements`)
- Uses `api.cachedGet('/shopping-list')` and invalidates cache after write operations

### Scan (`src/pages/Scan.jsx`)

Simple mobile-friendly page used when a user scans the QR code from the desktop barcode dialog.

**Features:**
- Uses `@zxing/browser` to access the device camera and continuously decode barcodes
- Requires both `session` and signed `token` query params from the QR link
- Submits scanned text to `POST /scan-session/:id` with `{ barcode, token }`
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
- Category management and inline editing
- Similar-name conflict handling (`409` + `existingIngredient`) with "Use existing" / "Add anyway" dialog
- Barcode scanner fallback that can create placeholder names such as `Product (barcode: ...)`

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
- Cookie-based authentication token handling
- CSRF bootstrap + header injection for state-changing requests
- Error handling
- In-memory GET caching (`cachedGet`, `prefetch`, `invalidateCache`, `clearCache`)
- Base URL configuration with same-origin fallback

**Configuration:**
```jsx
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
});
```

**Interceptors:**
- `Request`: for `POST|PUT|PATCH`, sets `Content-Type: application/json`; for `GET`, removes `Content-Type` to reduce unnecessary CORS preflights.
- `Request (CSRF)`: for `POST|PUT|PATCH|DELETE`, calls `GET /csrf-token` once, caches the token, and sends it as `x-csrf-token`. If token bootstrap fails transiently, the cached promise is cleared so the next request can retry.
- `Response`: on `401`, queues concurrent requests while a single `/auth/token` refresh is in flight, then replays queued requests on success.
- `Response (failure path)`: redirects to `/login` on refresh failure, except when already on public auth routes.
- `Response (CSRF recovery)`: on `403` + `code: "EBADCSRFTOKEN"`, clears cached CSRF state and retries once.
- `Error`: global error passthrough for non-auth failures.

**CSRF flow example:**
```jsx
// First state-changing request triggers CSRF bootstrap automatically:
await api.post('/recipes', recipeData);
// Internally:
// 1) GET /csrf-token
// 2) Set x-csrf-token on the outgoing POST
```

**Troubleshooting:**
- `403` on write requests with split frontend/backend origins in dev: ensure backend `CORS_ORIGIN` explicitly includes the frontend origin used by the browser, and confirm requests send credentials (`withCredentials: true`).
- Repeated `401` + redirect loops: verify refresh cookies are being set by `/auth/login` and `/auth/token`, and confirm `VITE_API_URL` points at the backend API root (including `/api`).

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

### API Error Utility (`src/utils/apiError.js`)

Normalizes backend error payload differences.

**Exports:**
- `getApiErrorMessage(error, fallback?)`

**Behavior:**
- Returns `error.response.data.error` when available
- Falls back to `error.response.data.message`
- Falls back to `error.message`
- Finally uses the provided fallback (default: `"Request failed"`)

This is used heavily in `Ingredients.jsx` and `ShoppingList.jsx` because some backend routes emit `error`, while others emit `message` (or both).

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

Prefer using `getApiErrorMessage` for user-facing toasts:

```jsx
import { getApiErrorMessage } from '../utils/apiError';

try {
  await api.post('/ingredients', payload);
} catch (error) {
  toast.error(getApiErrorMessage(error, 'Failed to save ingredient.'));
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
