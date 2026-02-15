/**
 * GeoNames API service for city search and timezone lookup.
 * Requires VITE_GEONAMES_USERNAME in the frontend env for city search/timezone.
 * Callers must catch errors and show a user-friendly message (e.g. "Location services not configured").
 */
import axios from "axios";

const GEONAMES_USERNAME =
  import.meta.env.VITE_GEONAMES_USERNAME ||
  process.env.GEONAMES_USERNAME ||
  null;

const ensureUsername = () => {
  if (!GEONAMES_USERNAME) {
    throw new Error(
      "GeoNames username is not configured. Set VITE_GEONAMES_USERNAME (frontend) or GEONAMES_USERNAME."
    );
  }
  return GEONAMES_USERNAME;
};

export async function searchCities(query) {
  if (!query) return [];
  const username = ensureUsername();
  const url = `https://secure.geonames.org/searchJSON?name_startsWith=${encodeURIComponent(
    query
  )}&maxRows=10&featureClass=P&orderby=relevance&username=${username}`;
  const { data } = await axios.get(url);
  return (data.geonames || []).map((place) => ({
    city: place.name,
    country: place.countryName,
    state: place.adminName1,
    label: `${place.name}, ${
      place.adminName1 ? place.adminName1 + ", " : ""
    }${place.countryName}`,
  }));
}

export async function getTimezone(lat, lng) {
  if (lat === undefined || lng === undefined) return null;
  const username = ensureUsername();
  const url = `https://secure.geonames.org/timezoneJSON?lat=${encodeURIComponent(
    lat
  )}&lng=${encodeURIComponent(lng)}&username=${username}`;
  const { data } = await axios.get(url);
  return {
    timezoneId: data.timezoneId,
    gmtOffset: data.gmtOffset,
    dstOffset: data.dstOffset,
    rawOffset: data.rawOffset,
  };
}
