// Importing necessary dependencies from React and Axios
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import RecipeDisplay from './RecipeDisplay'; // Importing the RecipeDisplay component

// Functional component 'App' representing the main application
function App() {
  // State variables using the 'useState' hook
  const [data, setData] = useState([]); // Holds the fetched data from the API
  const [randomRecipe, setRandomRecipe] = useState(null); // Holds a randomly selected recipe from the data

  // Effect hook to fetch data from the API when the component mounts
  useEffect(() => {
    // Function to fetch data asynchronously using Axios
    const fetchData = async () => {
      try {
        const response = await axios.get('http://localhost:8080/api/data');
        setData(response.data); // Set the fetched data in the state variable
      } catch (error) {
        console.error('Error fetching data:', error); // Log any errors that occur during the data fetching process
      }
    };

    fetchData(); // Invoke the data fetching function when the component mounts
  }, []); // Empty dependency array ensures the effect runs only once, similar to componentDidMount in class components

  // Function to select and set a random recipe from the fetched data
  const getRandomRecipe = () => {
    const randomIndex = Math.floor(Math.random() * data.length); // Generate a random index within the range of available data
    setRandomRecipe(data[randomIndex]); // Set the randomly selected recipe in the state variable
  };

  // JSX structure representing the UI of the application
  return (
    <div className="App">
      <header className="App-header">
        <h1>FoodForNow!</h1>
        <button onClick={getRandomRecipe}>Get Random Recipe</button>
        {/* Using RecipeDisplay component to display recipe details */}
        <RecipeDisplay randomRecipe={randomRecipe} />
      </header>
    </div>
  );
}

// Export the 'App' component as the default export
export default App;
