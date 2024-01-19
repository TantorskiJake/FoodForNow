// src/components/App.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';

const App = () => {
  const [data, setData] = useState([]);

  useEffect(() => {
    // Fetch data from the API endpoint
    const fetchData = async () => {
      try {
        // Update the API endpoint to match your server route
        const response = await axios.get('/');
        setData(response.data);
      } catch (error) {
        console.error(error);
      }
    };

    fetchData();
  }, []);

  // Format and render the data
  const formattedData = data.map(item => (
    <div key={item._id}>
      <h3>{item.title}</h3>
      <p>{item.ingredients}</p>
    </div>
  ));

  return (
    <div>
      <h1>FoodForNow</h1>
      {formattedData}
    </div>
  );
};

export default App;
