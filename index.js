// Import required packages
import express from "express";
import axios from "axios";
import bodyParser from "body-parser";
import dotenv from "dotenv";

// Load environment variables from the .env file
dotenv.config();

// Initialize the Express application
const app = express();

// Port the server will run on
const port = 3000;

// Base URL for all OpenWeather API requests
const API_URL = "http://api.openweathermap.org";

// Serve static assets (CSS, images, client-side JavaScript)
app.use(express.static("public"));

// Parse form data submitted from the frontend
app.use(bodyParser.urlencoded({ extended: true }));

// Retrieve the OpenWeather API key from environment variables
const yourAPIKey = process.env.OPENWEATHER_API_KEY;

// Temporary in-memory storage for application data
// (These reset whenever the server restarts)
let searchHistory = [];
let favorites = [];

// Cache previously searched weather data
let weatherCache = {};

// Cache expiry time (10 minutes)
const CACHE_TIME = 10 * 60 * 1000;

/**
 * Retrieve latitude and longitude for a given city and country.
 * OpenWeather requires coordinates for most weather endpoints.
 */
async function getCoordinates(city, country) {
  const geo = await axios.get(API_URL + "/geo/1.0/direct", {
    params: {
      q: `${city},${country}`,
      limit: 1,
      appid: yourAPIKey,
    },
  });

  return geo.data;
}

/**
 * Fetch all weather-related information using latitude and longitude.
 * This includes:
 * - Current weather
 * - 5-day / 3-hour forecast
 * - Air quality data
 */
async function getWeatherData(lat, lon) {
  // Current weather conditions
  const weather = await axios.get(API_URL + "/data/2.5/weather", {
    params: {
      lat,
      lon,
      units: "metric",
      appid: yourAPIKey,
    },
  });

  // 5-day weather forecast
  const forecast = await axios.get(API_URL + "/data/2.5/forecast", {
    params: {
      lat,
      lon,
      units: "metric",
      appid: yourAPIKey,
    },
  });

  // Air Quality Index (AQI)
  const airQuality = await axios.get(API_URL + "/data/2.5/air_pollution", {
    params: {
      lat,
      lon,
      appid: yourAPIKey,
    },
  });

  // Keep only the midday forecast for each day
  const dailyForecast = forecast.data.list.filter((item) =>
    item.dt_txt.includes("12:00:00"),
  );

  return {
    weather: weather.data,
    forecast: forecast.data,
    dailyForecast,
    airQuality: airQuality.data,
  };
}

async function loadWeatherByCoordinates(lat, lon) {
  const { weather, forecast, dailyForecast, airQuality } = await getWeatherData(
    lat,
    lon,
  );

  return {
    content: weather,
    forecast,
    dailyForecast,
    airQuality,
    searchHistory,
    favorites,

    lastCity: weather.name,
    lastCountry: weather.sys.country,

    lastLat: lat,
    lastLon: lon,
  };
}

/**
 * Load all weather information required by the application.
 * Returns a single object ready to be rendered by the frontend.
 */
async function loadWeather(city, country) {
  console.log("Loading weather...");

  // Get geographical coordinates
  const geo = await getCoordinates(city, country);

  // Return null if the location does not exist
  if (!geo.length) {
    return null;
  }

  console.log("Coordinates found");

  // Retrieve weather data using the coordinates
  const { weather, forecast, dailyForecast, airQuality } = await getWeatherData(
    geo[0].lat,
    geo[0].lon,
  );

  console.log("Weather data received");

  // Build the response object used by the EJS template
  return {
    content: weather,
    forecast,
    dailyForecast,
    airQuality,
    searchHistory,
    favorites,

    // Actual location returned by the API
    lastCity: weather.name,
    lastCountry: weather.sys.country,

    // Coordinates for reliable future lookups
    lat: geo[0].lat,
    lon: geo[0].lon,
  };
}

/**
 * Create a consistent response object for rendering weather data.
 */
function buildResponseData(weather, forecast, dailyForecast, airQuality) {
  return {
    content: weather,
    forecast,
    dailyForecast,
    airQuality,
    searchHistory,
    favorites,
  };
}

/**
 * Home Route
 * Displays the landing page before the user performs a search.
 */
app.get("/", (req, res) => {
  res.render("index.ejs", {
    content: "Please provide a location and date to retrieve the weather data.",
    forecast: null,
    searchHistory,
    favorites,
  });
});

/**
 * Search Route
 * Handles weather searches submitted from the search form.
 * Validates input, checks the cache, retrieves fresh data if necessary,
 * updates search history, and renders the results page.
 */
app.post("/get-forecast", async (req, res) => {
  try {
    // Retrieve the city and country entered by the user
    const name = req.body.city;
    const countryCode = req.body.code;

    // Prevent empty searches
    if (!name.trim() || !countryCode.trim()) {
      return res.render("index.ejs", {
        content: "Please enter both city and country code.",
        forecast: null,
        dailyForecast: null,
        searchHistory,
        favorites,
      });
    }

    // Generate a unique cache key for this location
    const cacheKey = `${name.toLowerCase()}-${countryCode.toLowerCase()}`;

    // Check whether weather data already exists in cache
    const cache = weatherCache[cacheKey];

    if (cache) {
      const age = Date.now() - cache.cachedAt;

      // Return cached data if it is still valid
      if (age < CACHE_TIME) {
        console.log("Returned from cache");
        return res.render("index.ejs", cache.data);
      }

      // Remove expired cache entry
      console.log("Cache expired");
      delete weatherCache[cacheKey];
    }

    // Fetch fresh weather information
    const responseData = await loadWeather(name, countryCode);

    // Display an error if the location cannot be found
    if (!responseData) {
      return res.render("index.ejs", {
        content: "Location not found",
        forecast: null,
        dailyForecast: null,
        searchHistory,
        favorites,
      });
    }

    // Prevent duplicate entries in search history
    searchHistory = searchHistory.filter(
      (item) => !(item.city === name && item.country === countryCode),
    );

    // Add the latest search to the beginning of the history
    searchHistory.unshift({
      city: name,
      country: countryCode,
      searchedAt: new Date(),
    });

    // Keep only the six most recent searches
    searchHistory = searchHistory.slice(0, 6);

    // Store fresh weather data in cache
    if (!cache) {
      weatherCache[cacheKey] = {
        data: responseData,
        cachedAt: Date.now(),
      };
    }

    console.log("Saved to cache");

    // Render the weather dashboard
    res.render("index.ejs", responseData);
  } catch (error) {
    console.error(error.message);

    // Default error message
    let message = "Something went wrong. Please try again.";

    // Display a more meaningful error where possible
    if (error.code === "ECONNABORTED") {
      message = "Request timed out.";
    } else if (error.code === "ENOTFOUND") {
      message = "No internet connection.";
    } else if (error.response) {
      if (error.response.status === 401) {
        message = "Invalid API key.";
      } else if (error.response.status === 404) {
        message = "Location not found.";
      } else if (error.response.status >= 500) {
        message = "Weather service is temporarily unavailable.";
      }
    }

    // Render the page with the error message
    res.render("index.ejs", {
      content: message,
      forecast: null,
      dailyForecast: null,
      searchHistory,
      favorites,
    });
  }
});

/**
 * Current Location Route
 * Retrieves weather information using latitude and longitude
 * provided by the browser's Geolocation API.
 */
app.get("/current-location", async (req, res) => {
  try {
    // Read coordinates from the query string
    const lat = req.query.lat;
    const lon = req.query.lon;

    console.log(lat, lon);

    // Retrieve weather information for the coordinates
    const { weather, forecast, dailyForecast, airQuality } =
      await getWeatherData(lat, lon);

    // Render the weather dashboard
    res.render(
      "index.ejs",
      buildResponseData(weather, forecast, dailyForecast, airQuality),
    );
  } catch (error) {
    console.log(error.message);

    // Return to the home page if something goes wrong
    res.redirect("/");
  }
});

/**
 * History Route
 * Displays the user's recent search history.
 */
app.get("/history", (req, res) => {
  res.render("history.ejs", {
    history: searchHistory,
  });
});

/**
 * Settings Route
 * Displays the application settings page.
 */
app.get("/settings", (req, res) => {
  res.render("settings.ejs");
});

/**
 * Favorites Route
 * Displays all saved favorite locations.
 */
app.get("/favorites", (req, res) => {
  res.render("favorites.ejs", {
    favorites,
  });
});

/**
 * Favorite Weather Route
 * Loads weather information for a saved favorite location.
 * Also updates the search history.
 */
app.get("/favorite-weather", async (req, res) => {
  try {
    const lat = req.query.lat;
    const lon = req.query.lon;

    const responseData = await loadWeatherByCoordinates(lat, lon);

    if (!responseData) {
      return res.redirect("/");
    }

    // Get the actual location returned by the Weather API
    const city = responseData.content.name;
    const country = responseData.content.sys.country;

    // Prevent duplicate history entries
    searchHistory = searchHistory.filter(
      (item) => !(item.city === city && item.country === country),
    );

    // Add the location to the top of the search history
    searchHistory.unshift({
      city,
      country,
      searchedAt: new Date(),
    });

    // Keep only the latest six searches
    searchHistory = searchHistory.slice(0, 6);

    res.render("index.ejs", responseData);
  } catch (error) {
    console.log(error.message);
    res.redirect("/");
  }
});

/**
 * Add Favorite Route
 * Saves a location to the user's favorites list
 * if it has not already been added.
 */
app.post("/favorite", async (req, res) => {
  // Retrieve the coordinates of the selected location
  const lat = req.body.lat;
  const lon = req.body.lon;

  console.log("Favorite request:");
  console.log({ lat, lon });

  // Fetch weather directly using the coordinates
  const { weather } = await getWeatherData(lat, lon);

  // Check whether this location is already in favorites
  const exists = favorites.find((item) => item.lat == lat && item.lon == lon);

  // Save the location only if it is not already a favorite
  if (!exists) {
    favorites.push({
      city: weather.name,
      country: weather.sys.country,

      lat,
      lon,

      temp: Math.round(weather.main.temp),
      feelsLike: Math.round(weather.main.feels_like),
      humidity: weather.main.humidity,
      description: weather.weather[0].description,
      icon: weather.weather[0].icon,
    });
  }

  // Redirect back to the weather page with a success notification
  res.redirect(`/favorite-weather?lat=${lat}&lon=${lon}&toast=added`);
});

/**
 * Delete Favorite Route
 * Removes a selected location from the favorites list.
 */
app.get("/delete-favorite", async (req, res) => {
  // Retrieve the selected location from the query string
  const city = req.query.city;
  const country = req.query.country;

  // Remove the matching location from the favorites array
  favorites = favorites.filter((item) => {
    return !(item.city === city && item.country === country);
  });

  // Refresh weather data (optional, if needed elsewhere)
  const responseData = await loadWeather(city, country);

  // Redirect back to the favorites page with a success notification
  res.redirect("/favorites?toast=removed");
});

/**
 * Clear History Route
 * Removes all previously searched locations.
 */
app.get("/clear-history", (req, res) => {
  // Reset the search history
  searchHistory = [];

  // Redirect back to the history page with a success notification
  res.redirect("/history?toast=cleared");
});

/**
 * Start the Express server
 * Listens for incoming requests on the specified port.
 */
app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
