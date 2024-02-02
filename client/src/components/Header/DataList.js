// DataList.js

import React, { useEffect, useState } from 'react';
import { fetchData } from '../services/api';

const DataList = () => {
  const [data, setData] = useState([]);

  useEffect(() => {
    const fetchDataFromApi = async () => {
      try {
        const result = await fetchData();
        setData(result);
      } catch (error) {
        // Handle error
      }
    };

    fetchDataFromApi();
  }, []);

  return (
    <div>
      <h2>Data List</h2>
      <ul>
        {data.map(item => (
          <li key={item.id}>{item.name}</li>
        ))}
      </ul>
    </div>
  );
};

export default DataList;
