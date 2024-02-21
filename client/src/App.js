import React, { useState } from 'react';
import axios from 'axios';

const App = () => {
  const [recipe, setRecipe] = useState({
    title: '',
    ingredients: [],
    instructions: ''
  });

  // Function to fetch a random recipe from the backend
  const getRandomRecipe = async () => {
    try {
      // Send a GET request to fetch a random recipe
      const result = await axios.get('api/random'); // Updated endpoint
      // Update the state with the fetched recipe
      setRecipe(result.data);
    } catch (error) {
      // Handle the error
      console.error('Error fetching random recipe:', error);
      // You might want to set an error state here or display a message to the user
    }
  };

  return (
    <div>
      <h1>Random Recipe Generator</h1>
      {/* Button to trigger fetching a random recipe */}
      <button onClick={getRandomRecipe}>Get Random Recipe</button>
      {/* Display the fetched recipe */}
      {recipe.title && (
        <div>
          {/* Display recipe name */}
          <h2>{recipe.title}</h2>
          {/* Display ingredients list */}
          <h3>Ingredients:</h3>
          <ul>
            {recipe.ingredients.map((ingredient, index) => (
              <li key={index}>{ingredient}</li>
            ))}
          </ul>
          {/* Display instructions list */}
          <h3>Instructions:</h3>
          <ol>
            {recipe.instructions.split('\n').map((instruction, index) => (
              <li key={index}>{instruction}</li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
};

export default App;
