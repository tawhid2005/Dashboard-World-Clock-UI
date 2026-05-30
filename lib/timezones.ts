export interface City {
  id: string;
  name: string;
  country: string;
  timezone: string;
  lat: number;
  lng: number;
}

export interface CityTimeInfo {
  city: City;
  time: string;
  date: string;
  isNight: boolean;
  offsetString: string;
  sunrise: string;
  sunset: string;
  dayLength: string;
}

export const AVAILABLE_CITIES: City[] = [
  { id: "los-angeles", name: "Los Angeles", country: "United States", timezone: "America/Los_Angeles", lat: 34.0522, lng: -118.2437 },
  { id: "new-york", name: "New York", country: "United States", timezone: "America/New_York", lat: 40.7128, lng: -74.0060 },
  { id: "london", name: "London", country: "United Kingdom", timezone: "Europe/London", lat: 51.5074, lng: -0.1278 },
  { id: "paris", name: "Paris", country: "France", timezone: "Europe/Paris", lat: 48.8566, lng: 2.3522 },
  { id: "tokyo", name: "Tokyo", country: "Japan", timezone: "Asia/Tokyo", lat: 35.6762, lng: 139.6503 },
  { id: "sydney", name: "Sydney", country: "Australia", timezone: "Australia/Sydney", lat: -33.8688, lng: 151.2093 },
  { id: "dubai", name: "Dubai", country: "United Arab Emirates", timezone: "Asia/Dubai", lat: 25.2048, lng: 55.2708 },
  { id: "singapore", name: "Singapore", country: "Singapore", timezone: "Asia/Singapore", lat: 1.3521, lng: 103.8198 },
  { id: "reykjavik", name: "Reykjavik", country: "Iceland", timezone: "Atlantic/Reykjavik", lat: 64.1466, lng: -21.9426 },
  { id: "mumbai", name: "Mumbai", country: "India", timezone: "Asia/Kolkata", lat: 19.0760, lng: 72.8777 },
];

export const DEFAULT_TRACKED_IDS = ["los-angeles", "new-york", "london", "paris"];

// Formats offset value to UTC+X or UTC-X string
export function getTimezoneOffsetString(timezone: string, date: Date = new Date()): string {
  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      timeZoneName: "shortOffset",
    });
    const parts = formatter.formatToParts(date);
    const offsetPart = parts.find((part) => part.type === "timeZoneName");
    return offsetPart ? offsetPart.value : "UTC+0";
  } catch (e) {
    return "UTC+0";
  }
}

// Estimates sunrise and sunset times based roughly on latitude and date (returns clean formatted strings)
export function getSunriseSunsetInfo(timezone: string, lat: number, date: Date = new Date()): {
  sunrise: string;
  sunset: string;
  dayLength: string;
} {
  // Simple deterministic model for realistic looking data based on latitude and day of the year
  const dayOfYear = Math.floor(
    (date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86400000
  );
  
  // Latitude amplitude effect on day length (equator is ~12h, poles vary wildly)
  const latRad = (lat * Math.PI) / 180;
  const declination = 0.409 * Math.sin((2 * Math.PI * (dayOfYear - 80)) / 365);
  
  let hourAngle = 0;
  const cosHourAngle = -Math.tan(latRad) * Math.tan(declination);
  
  if (cosHourAngle <= -1) {
    hourAngle = Math.PI; // Polar day
  } else if (cosHourAngle >= 1) {
    hourAngle = 0; // Polar night
  } else {
    hourAngle = Math.acos(cosHourAngle);
  }
  
  const dayLengthHours = (2 * hourAngle * 180) / (Math.PI * 15);
  
  // Local solar noon is roughly 12:00, adjusted for timezone is close enough for placeholder realism
  const noonHour = 12.2; 
  const sunriseHour = noonHour - dayLengthHours / 2;
  const sunsetHour = noonHour + dayLengthHours / 2;
  
  const formatHour = (h: number) => {
    const hours = Math.floor(h);
    const mins = Math.floor((h - hours) * 60);
    return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
  };

  const dayLengthStr = `${Math.floor(dayLengthHours)}h ${Math.floor((dayLengthHours - Math.floor(dayLengthHours)) * 60)}m`;

  return {
    sunrise: formatHour(sunriseHour),
    sunset: formatHour(sunsetHour),
    dayLength: dayLengthStr,
  };
}

// Resolves current details for a specific city
export function getCityTimeInfo(city: City, baseDate: Date = new Date(), use24Hour: boolean = true): CityTimeInfo {
  // Get time in city's timezone
  const options: Intl.DateTimeFormatOptions = {
    timeZone: city.timezone,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: !use24Hour,
  };
  
  const timeFormatter = new Intl.DateTimeFormat("en-US", options);
  let timeStr = timeFormatter.format(baseDate);
  
  // Strip AM/PM if 12 hour to keep just the digits (clock designs often show AM/PM separately or rely on day/night indicator)
  timeStr = timeStr.replace(/\s*[AP]M\s*$/i, "").trim();

  // Get date in city's timezone
  const dateOptions: Intl.DateTimeFormatOptions = {
    timeZone: city.timezone,
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  };
  const dateFormatter = new Intl.DateTimeFormat("en-US", dateOptions);
  const dateStr = dateFormatter.format(baseDate);

  // Check if it is night (typical night is 18:00 - 06:00 local time)
  const localHourStr = new Intl.DateTimeFormat("en-US", {
    timeZone: city.timezone,
    hour: "numeric",
    hour12: false,
  }).format(baseDate);
  const localHour = parseInt(localHourStr, 10);
  const isNight = localHour >= 18 || localHour < 6;

  const offsetString = getTimezoneOffsetString(city.timezone, baseDate);
  const { sunrise, sunset, dayLength } = getSunriseSunsetInfo(city.timezone, city.lat, baseDate);

  return {
    city,
    time: timeStr,
    date: dateStr,
    isNight,
    offsetString,
    sunrise,
    sunset,
    dayLength,
  };
}

// Calculates the exact UTC Date that corresponds to targetHour:targetMinute in a specific city's timezone
export function getUtcDateForCityHour(cityTimezone: string, targetHour: number, baseDate: Date = new Date(), targetMinute: number = 0): Date {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: cityTimezone,
    year: "numeric",
    month: "numeric",
    day: "numeric",
  });
  const parts = formatter.formatToParts(baseDate);
  const year = parts.find(p => p.type === 'year')?.value;
  const month = parts.find(p => p.type === 'month')?.value;
  const day = parts.find(p => p.type === 'day')?.value;

  // Construct a UTC guess date with targetHour and targetMinute
  const utcGuess = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day), targetHour, targetMinute, 0));
  
  // Format check
  const checkHourFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone: cityTimezone,
    hour: "numeric",
    hour12: false,
  });
  
  const localHour = parseInt(checkHourFormatter.format(utcGuess), 10);
  let diff = targetHour - localHour;
  
  if (diff < -12) diff += 24;
  if (diff > 12) diff -= 24;
  
  utcGuess.setUTCHours(utcGuess.getUTCHours() + diff);
  return utcGuess;
}
