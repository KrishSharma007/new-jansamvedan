// Reverse geocoding utility to convert coordinates to addresses
// Uses OpenStreetMap Nominatim API (free, no API key required)

export interface GeocodingResult {
  address: string;
  displayName: string;
  components: {
    house_number?: string;
    road?: string;
    suburb?: string;
    city?: string;
    state?: string;
    postcode?: string;
    country?: string;
  };
}

export async function reverseGeocode(
  latitude: number,
  longitude: number
): Promise<GeocodingResult | null> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1&accept-language=en`,
      {
        headers: {
          'User-Agent': 'JanSamvedan/1.0' // Required by Nominatim
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Geocoding failed: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data || !data.display_name) {
      return null;
    }

    // Format a clean address from the components
    const components = data.address || {};
    const addressParts = [];
    
    // Build address from most specific to general
    if (components.house_number && components.road) {
      addressParts.push(`${components.house_number}, ${components.road}`);
    } else if (components.road) {
      addressParts.push(components.road);
    }
    
    if (components.suburb) {
      addressParts.push(components.suburb);
    }
    
    if (components.city) {
      addressParts.push(components.city);
    }
    
    if (components.state) {
      addressParts.push(components.state);
    }
    
    if (components.postcode) {
      addressParts.push(components.postcode);
    }
    
    if (components.country) {
      addressParts.push(components.country);
    }

    const address = addressParts.join(', ') || data.display_name;

    return {
      address,
      displayName: data.display_name,
      components: {
        house_number: components.house_number,
        road: components.road,
        suburb: components.suburb,
        city: components.city,
        state: components.state,
        postcode: components.postcode,
        country: components.country
      }
    };
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return null;
  }
}

// Helper function to format coordinates for display
export function formatCoordinates(latitude: number, longitude: number): string {
  return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
}

// Helper function to validate coordinates
export function isValidCoordinates(latitude: number, longitude: number): boolean {
  return (
    latitude >= -90 && latitude <= 90 &&
    longitude >= -180 && longitude <= 180 &&
    !isNaN(latitude) && !isNaN(longitude)
  );
}
