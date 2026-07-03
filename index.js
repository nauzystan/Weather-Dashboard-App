import express from "express";
import axios from "axios";
import bodyParser from "body-parser";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const port = 3000;

//Base URL for OpenWeather API
const API_URL = "http://api.openweathermap.org";

//Middleware to serve static files (CSS etc.)
app.use(express.static("public"));

//Middleware to parse form data
app.use(bodyParser.urlencoded({ extended: true }));

//Assigned API key from OpenWeather
const yourAPIKey = process.env.OPENWEATHER_API_KEY;

let searchHistory = [];
let favorites = [];
let weatherCache = {};
const CACHE_TIME = 10 * 60 * 1000;

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

async function getWeatherData(lat, lon) {
  const weather = await axios.get(API_URL + "/data/2.5/weather", {
    params: {
      lat,
      lon,
      units: "metric",
      appid: yourAPIKey,
    },
  });

  const forecast = await axios.get(API_URL + "/data/2.5/forecast", {
    params: {
      lat,
      lon,
      units: "metric",
      appid: yourAPIKey,
    },
  });

  const dailyForecast = forecast.data.list.filter((item) =>
    item.dt_txt.includes("12:00:00"),
  );

  return {
    weather: weather.data,
    forecast: forecast.data,
    dailyForecast,
  };
}

async function loadWeather(city, country) {
  const geo = await getCoordinates(city, country);

  if (!geo.length) {
    return null;
  }

  const { weather, forecast, dailyForecast } = await getWeatherData(
    geo[0].lat,
    geo[0].lon,
  );

  return {
    content: weather,
    forecast,
    dailyForecast,
    searchHistory,
    favorites,
    lastCity: city,
    lastCountry: country,
  };
}

function buildResponseData(weather, forecast, dailyForecast) {
  return {
    content: weather,
    forecast,
    dailyForecast,
    searchHistory,
    favorites,
  };
}

//Home route. Renders initial page
app.get("/", (req, res) => {
  res.render("index.ejs", {
    content: "Please provide a location and date to retrieve the weather data.",
    forecast: null,
    searchHistory,
    favorites,
  });
});

//Route to handle form submission
app.post("/get-forecast", async (req, res) => {
  try {
    //Get user input from form
    const name = req.body.city;
    const countryCode = req.body.code;

    const cacheKey = `${name.toLowerCase()}-${countryCode.toLowerCase()}`;

    const cache = weatherCache[cacheKey];

    if (cache) {
      const age = Date.now() - cache.cachedAt;

      if (age < CACHE_TIME) {
        console.log("Returned from cache");
        return res.render("index.ejs", cache.data);
      }

      console.log("Cache expired");

      delete weatherCache[cacheKey];
    }

    //Step 1: Get lat & lon coordinates from geo API

    searchHistory.unshift(`${name}, ${countryCode}`);
    searchHistory = searchHistory.slice(0, 5);

    const responseData = await loadWeather(name, countryCode);

    if (!responseData) {
      return res.render("index.ejs", {
        content: "Location not found",
        forecast: null,
        dailyForecast: null,
        searchHistory,
        favorites,
      });
    }

    console.log(responseData.forecast.list.slice(0, 5));

    //Send weather data to frontend

    if (!cache) {
      weatherCache[cacheKey] = {
        data: responseData,
        cachedAt: Date.now(),
      };
    }

    console.log("Saved to cache");

    res.render("index.ejs", responseData);
  } catch (error) {
    console.error(error);

    res.render("index.ejs", {
      content: "Unable to retrieve weather data.",
      forecast: null,
      dailyForecast: null,
      searchHistory,
    });
  }
});

app.get("/current-location", async (req, res) => {
  try {
    const lat = req.query.lat;
    const lon = req.query.lon;

    console.log(lat, lon);

    const { weather, forecast, dailyForecast } = await getWeatherData(lat, lon);

    res.render(
      "index.ejs",
      buildResponseData(weather, forecast, dailyForecast),
    );
  } catch (error) {
    console.log(error.message);
    res.redirect("/");
  }
});

app.get("/favorite-weather", async (req, res) => {
  try {
    const city = req.query.city;
    const country = req.query.country;

    const responseData = await loadWeather(city, country);

    if (!responseData) {
      return res.redirect("/");
    }

    res.render("index.ejs", responseData);
  } catch (error) {
    console.log(error.message);

    res.redirect("/");
  }
});

app.post("/favorite", (req, res) => {
  const city = req.body.city;
  const country = req.body.country;

  const exists = favorites.find(
    (item) => item.city === city && item.country === country,
  );

  if (!exists) {
    favorites.push({
      city,
      country,
    });
  }

  res.redirect("/");
});

app.get("/delete-favorite", (req, res) => {
  const city = req.query.city;
  const country = req.query.country;

  favorites = favorites.filter((item) => {
    return !(item.city === city && item.country === country);
  });

  res.redirect("/");
});

//Start server
app.listen(port, () => {
  console.log(`listening to port ${port}`);
});
