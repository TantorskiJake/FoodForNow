import React, { useEffect, useState } from 'react';
import axios from 'axios';

function App() {
  const [data, setData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Update the API endpoint to match your server route
        const response = await axios.get('http://localhost:8080/');
        setData(response.data);
      } catch (error) {
        console.error(error);
      }
    };

    fetchData();
  }, []);

  const formattedData = data.map(item => (
    <div key={item._id}>
      <h3>{item.title}</h3>
      <p>{item.ingredients}</p>
    </div>
  ));

  return (
    <div className="App">
      <header className="App-header">
        {/* You can replace the logo with your own content */}
        <h1>FoodForNow</h1>
        {formattedData}
      </header>
    </div>
  );
}

export default App;
