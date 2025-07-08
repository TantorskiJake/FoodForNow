// Category colors for ingredients
export const categoryColors = {
  Produce: {
    main: '#43a047', // Green 600
    light: '#66bb6a',
    dark: '#2e7031'
  },
  Dairy: {
    main: '#2196f3', // Blue
    light: '#64b5f6',
    dark: '#1976d2'
  },
  Meat: {
    main: '#f44336', // Red
    light: '#e57373',
    dark: '#d32f2f'
  },
  Seafood: {
    main: '#00bcd4', // Cyan
    light: '#4dd0e1',
    dark: '#0097a7'
  },
  Pantry: {
    main: '#ff9800', // Orange
    light: '#ffb74d',
    dark: '#f57c00'
  },
  Spices: {
    main: '#9c27b0', // Purple
    light: '#ba68c8',
    dark: '#7b1fa2'
  },
  Beverages: {
    main: '#795548', // Brown
    light: '#a1887f',
    dark: '#5d4037'
  },
  Other: {
    main: '#607d8b', // Blue Grey
    light: '#90a4ae',
    dark: '#455a64'
  }
};

// Helper function to get color for a category
export const getCategoryColor = (category) => {
  return categoryColors[category] || categoryColors.Other;
}; 