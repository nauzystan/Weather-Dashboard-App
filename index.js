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

//Home route. Renders initial page
app.get("/", (req, res) => {
  res.render("index.ejs", {
    content: "Please provide a location and date to retrieve the weather data.",
  });
});

//Route to handle form submission
app.post("/get-forecast", async (req, res) => {
  try {
    //Get user input from form
    const name = req.body.city;
    const countryCode = req.body.code;

    //Step 1: Get lat & lon coordinates from geo API
    const geo = await axios.get(API_URL + "/geo/1.0/direct?", {
      params: {
        appid: yourAPIKey,
        limit: 5,
        q: `${name},${countryCode}`,
      },
    });

    //If user inputted location is not found, return message
    if (!geo.data.length) {
      return res.render("index.ejs", { content: "Location not found" });
    }

    //Step 2: Get weather data using coordinates
    const weather = await axios.get(API_URL + "/data/2.5/weather?", {
      params: {
        appid: yourAPIKey,

        //Extract lattitude and longitude coordinates
        lat: geo.data[0].lat,
        lon: geo.data[0].lon,

        units: "metric", //Celsius
      },
    });

    //Send weather data to frontend
    res.render("index.ejs", { content: weather.data });
  } catch (error) {
    //Error handling for dev and user
    console.log(error.response?.data || error.message);
    res.status(404).send(error.response?.data || error.message);
  }
});

//Start server
app.listen(port, () => {
  console.log(`listening to port ${port}`);
});
