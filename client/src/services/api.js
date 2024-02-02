// api.js

const API_BASE_URL = 'http://localhost:8080/api/data'; // Replace with your actual backend URL

export const fetchData = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/data`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching data:', error);
    throw error;
  }
};
