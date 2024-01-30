// Importing necessary dependencies from React and Axios
import React, { useEffect, useState } from 'react';
import axios from 'axios';

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
        console.error(error); // Log any errors that occur during the data fetching process
      }
    };

    fetchData(); // Invoke the data fetching function when the component mounts
  }, []); // Empty dependency array ensures the effect runs only once, similar to componentDidMount in class components

  // Function to select and set a random recipe from the fetched data
  const getRandomRecipe = () => {
    const randomIndex = Math.floor(Math.random() * data.length); // Generate a random index within the range of available data
    setRandomRecipe(data[randomIndex]); // Set the randomly selected recipe in the state variable
  };

  // Function to recursively render fields of an object or array in a structured format
  const renderField = (fieldName, fieldValue) => {
    if (Array.isArray(fieldValue)) { // Check if the field value is an array
      return (
        <div key={fieldName}>
          <p>{fieldName}:</p>
          <ul>
            {fieldValue.map((item, index) => (
              <li key={index}>{renderField(index, item)}</li>
            ))}
          </ul>
        </div>
      );
    } else if (typeof fieldValue === 'object' && fieldValue !== null) { // Check if the field value is an object
      return (
        <div key={fieldName}>
          <p>{fieldName}:</p>
          <ul>
            {Object.entries(fieldValue).map(([key, value]) => (
              <li key={key}>{renderField(key, value)}</li>
            ))}
          </ul>
        </div>
      );
    } else { // Render a simple key-value pair if the field value is neither an array nor an object
      return <p key={fieldName}>{`${fieldName}: ${fieldValue}`}</p>;
    }
  };

  // Create a formatted representation of the random recipe using the renderField function
  const formattedData = randomRecipe ? renderField('Recipe', randomRecipe) : null;

  // JSX structure representing the UI of the application
  return (
    <div className="App">
      <header className="App-header">
        <h1>FoodForNow!</h1>
        <button onClick={getRandomRecipe}>Get Random Recipe</button>
        <div style={{ textAlign: 'left' }}>{formattedData}</div>
      </header>
    </div>
  );
}

// Export the 'App' component as the default export
export default App;
