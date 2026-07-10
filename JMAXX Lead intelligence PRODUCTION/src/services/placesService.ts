const API_KEY = import.meta.env.VITE_GOOGLE_PLACES_API_KEY;

export interface PlaceResult {
  place_id: string;
  name: string;
  formatted_address: string;
  formatted_phone_number?: string;
  website?: string;
  rating?: number;
  user_ratings_total?: number;
}

export async function searchPlaces(query: string, location: string): Promise<PlaceResult[]> {
  const searchQuery = `${query} ${location} Switzerland`;
  const response = await fetch(
    `https://cors-anywhere.herokuapp.com/https://maps.googleapis.com/maps/api/textsearch/json?query=${encodeURIComponent(searchQuery)}&key=${API_KEY}`
  );
  const data = await response.json();
  return data.results || [];
}

export async function getPlaceDetails(placeId: string): Promise<PlaceResult | null> {
  const response = await fetch(
    `https://cors-anywhere.herokuapp.com/https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,formatted_address,formatted_phone_number,website,rating,user_ratings_total&key=${API_KEY}`
  );
  const data = await response.json();
  return data.result || null;
}
