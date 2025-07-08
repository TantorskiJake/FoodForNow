import axios from "axios";

const GEONAMES_USERNAME = "YOUR_GEONAMES_USERNAME"; // TODO: Replace with your GeoNames username

export async function searchCities(query) {
  if (!query) return [];
  const url = `https://secure.geonames.org/searchJSON?name_startsWith=${encodeURIComponent(query)}&maxRows=10&featureClass=P&orderby=relevance&username=${GEONAMES_USERNAME}`;
  const { data } = await axios.get(url);
  return data.geonames.map(place => ({
    city: place.name,
    country: place.countryName,
    state: place.adminName1,
    label: `${place.name}, ${place.adminName1 ? place.adminName1 + ', ' : ''}${place.countryName}`,
  }));
} 