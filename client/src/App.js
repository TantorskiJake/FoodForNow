// Importing necessary dependencies and modules from React and Axios.
import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Main functional component for the application.
function App() {
  // State hook to manage the fetched data from the API.
  const [data, setData] = useState([]);

  // useEffect hook to handle asynchronous data fetching when the component mounts.
  useEffect(() => {
    // Define an asynchronous function to fetch data from the specified API endpoint.
    const fetchData = async () => {
      try {
        // Update the API endpoint to match your server route.
        const response = await axios.get('http://localhost:8080/api/data');
        
        // Update the component state with the fetched data.
        setData(response.data);
      } catch (error) {
        // Log any errors that occur during the data fetching process.
        console.error(error);
      }
    };

    // Invoke the fetchData function when the component mounts (empty dependency array).
    fetchData();
  }, []);

  // Transform the fetched data into JSX elements for rendering.
  const formattedData = data.map(item => (
    <div key={item._id.$oid}>
      {/* Display various recipe details using the fetched data. */}
      <h3>{item.title}</h3>
      {/* Displaying ingredients with quantity, type, and name. */}
      <p><strong>Ingredients:</strong> {item.ingredients.map(ingredient => `${ingredient.quantity} ${ingredient.quantity_type} ${ingredient.type}`).join(', ')}</p>
      {/* Displaying recipe instructions. */}
      <p><strong>Instructions:</strong> {item.instructions}</p>
      {/* Displaying additional recipe details. */}
      <p><strong>Category:</strong> {item.category}</p>
      <p><strong>Prep Time:</strong> {item.prep_time} minutes</p>
      <p><strong>Cook Time:</strong> {item.cook_time} minutes</p>
      <p><strong>Servings:</strong> {item.servings}</p>
      <p><strong>Cuisine:</strong> {item.cuisine}</p>
      <p><strong>Difficulty:</strong> {item.difficulty}</p>
      <p><strong>Calories:</strong> {item.calories}</p>
      <p><strong>Source:</strong> {item.source.name} ({item.source.website || 'N/A'})</p>
      <p><strong>Tags:</strong> {item.tags.join(', ')}</p>
      <p><strong>Nutritional Info:</strong> Protein: {item.nutritional_info.protein}, Carbohydrates: {item.nutritional_info.carbohydrates}, Fat: {item.nutritional_info.fat}, Fiber: {item.nutritional_info.fiber}</p>
      <p><strong>Allergens:</strong> {item.allergens.join(', ')}</p>
      <p><strong>Equipment:</strong> {item.equipment.join(', ')}</p>
      <p><strong>Notes:</strong> {item.notes}</p>
      {/* Displaying links to similar recipes. */}
      <p><strong>Similar Recipes:</strong> {item.similar_recipes.map(recipe => <a href={recipe.link} key={recipe.link}>{recipe.title}</a>).join(', ')}</p>
      {/* Displaying keywords associated with the recipe. */}
      <p><strong>Keywords:</strong> {item.keywords.join(', ')}</p>
      {/* Displaying boolean values for vegetarian, vegan, and gluten-free. */}
      <p><strong>Is Vegetarian:</strong> {item.is_vegetarian.toString()}</p>
      <p><strong>Is Vegan:</strong> {item.is_vegan.toString()}</p>
      <p><strong>Is Gluten Free:</strong> {item.is_gluten_free.toString()}</p>
      {/* Displaying the main ingredient of the recipe. */}
      <p><strong>Main Ingredient:</strong> {item.main_ingredient}</p>
      {/* Displaying the author and creation/update timestamps. */}
      <p><strong>Author:</strong> {item.author}</p>
      <p><strong>Created At:</strong> {new Date(item.created_at.$date).toLocaleString()}</p>
      <p><strong>Updated At:</strong> {new Date(item.updated_at.$date).toLocaleString()}</p>
    </div>
  ));
  
  // Render the main application component with the formatted data.
  return (
    <div className="App">
      <header className="App-header">
        {/* Application header with a title */}
        <h1>FoodForNow!</h1>
        
        {/* Render the formatted data within the header */}
        {formattedData}
      </header>
    </div>
  );
}

// Export the App component as the default export for use in other files.
export default App;
