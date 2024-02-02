// Import necessary dependencies from React
import React from 'react';

// Functional component 'RecipeDisplay' representing the display of recipe details
function RecipeDisplay({ randomRecipe }) {
  return (
    <div style={{ textAlign: 'left' }}>
      {randomRecipe ? (
        <>
          {/* Display recipe details */}
          <h2>{randomRecipe.title}</h2>
          <p>{`Category: ${randomRecipe.category}`}</p>
          <p>{`Ingredients: ${randomRecipe.ingredients.map((ingredient) => ingredient.type).join(', ')}`}</p>
          <p>{`Instructions: ${randomRecipe.instructions}`}</p>
        </>
      ) : (
        <p>No recipe available</p>
      )}
    </div>
  );
}

// Export the 'RecipeDisplay' component as the default export
export default RecipeDisplay;
