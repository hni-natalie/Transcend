import { useState, useEffect } from 'react';

// interface UserLocation {
//   location: string;
//   city: string;
//   country: string;
//   latitude: number | null;
//   longitude: number | null;
//   isLoading: boolean;
//   error: string | null;
// }

export const useUserLocation = () => {
  const [location, setLocation] = useState<string>('Location Unknown');
  const [city, setCity] = useState<string>('');
  const [country, setCountry] = useState<string>('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLocation = () => {
      // Check if geolocation is supported
      if (!navigator.geolocation) {
        setLocation('Location Unavailable');
        setError('Geolocation not supported');
        setIsLoading(false);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          setLatitude(latitude);
          setLongitude(longitude);

          try {
            // Reverse geocoding using OpenStreetMap API
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
            );
            const data = await response.json();

            if (data && data.address) {
              const cityName = data.address.city || data.address.town || data.address.village || data.address.state || 'Unknown';
              const countryName = data.address.country || '';
              setCity(cityName);
              setCountry(countryName);
              setLocation(countryName ? `${cityName}, ${countryName}` : cityName);
            } else {
              setLocation(`${latitude.toFixed(2)}, ${longitude.toFixed(2)}`);
            }
          } catch (err) {
            console.error('Reverse geocoding error:', err);
            setLocation(`${latitude.toFixed(2)}, ${longitude.toFixed(2)}`);
            setError(err instanceof Error ? err.message : 'Reverse geocoding failed');
          }
          setIsLoading(false);
        },
		
        async (err) => {
          console.error('Geolocation error:', err);
          setError(err.message);
          
          // Fallback: use IP-based location
          try {
            const ipResponse = await fetch('https://ipapi.co/json/');
            const ipData = await ipResponse.json();
            if (ipData.city && ipData.country_name) {
              setCity(ipData.city);
              setCountry(ipData.country_name);
              setLocation(`${ipData.city}, ${ipData.country_name}`);
            } else {
              setLocation('Location Unknown');
            }
          } catch (ipErr) {
            console.error('IP-based location error:', ipErr);
            setLocation('Location Unknown');
            setError(ipErr instanceof Error ? ipErr.message : 'Failed to fetch location');
          }
          setIsLoading(false);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    };

    fetchLocation();
  }, []);

  return {
    location,
    city,
    country,
    latitude,
    longitude,
    isLoading,
    error,
  };
};