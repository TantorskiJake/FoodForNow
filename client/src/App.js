import React, { useState, useEffect } from 'react';
import axios from 'axios';

function App() {
  const [data, setData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Update the API endpoint to match your server route
        const response = await axios.get('http://localhost:8080/api/data');
        setData(response.data);
      } catch (error) {
        console.error(error);
      }
    };

    fetchData();
  }, []);

  const formattedData = data.map(item => (
    <div key={item._id.$oid}>
      <h3>{item.title}</h3>
      <p>{item.ingredients.map(ingredient => `${ingredient.quantity} ${ingredient.quantity_type} ${ingredient.type}`).join(', ')}</p>
      <p>{item.instructions}</p>
    </div>
  ));

  return (
    <div className="App">
      <header className="App-header">
        <h1>FoodForNow!</h1>
        {formattedData}
      </header>
    </div>
  );
}

export default App;
