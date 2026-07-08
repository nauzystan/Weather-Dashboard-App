# 🌤️ Weather Dashboard

A modern weather dashboard built with **Node.js**, **Express.js**, **EJS**, and the **OpenWeather API**. The application provides real-time weather information, hourly and multi-day forecasts, interactive weather animations, favorites, search history, customizable settings, and a beautiful space-inspired glassmorphism interface.

---

## 🚀 Features

### 🌍 Real-Time Weather

- Search weather by city and country.
- Current weather conditions.
- Feels like temperature.
- Humidity.
- Wind speed.
- Atmospheric pressure.
- Visibility.
- Sunrise & Sunset.
- Air Quality Index.

### 📅 Forecasts

- Hourly weather forecast.
- 4-day weather forecast.

### ⭐ Favorites

- Save favorite locations.
- View all saved cities.
- Remove favorites.

### 🕘 Search History

- Automatically stores previous searches.
- Quickly revisit previous locations.
- Clear search history.

### ⚙️ Settings

- Toggle Temperature Unit (°C / °F)
- Light & Dark Themes
- Weather Animation Toggle

### 🌌 Interactive Weather Effects

Weather conditions dynamically generate visual effects such as:

- ☀️ Animated Sunshine
- 🌧️ Rain
- ❄️ Snow
- ⚡ Lightning
- 🌠 Shooting Stars
- ☄️ Floating Asteroids

### 🎨 UI

- Glassmorphism design
- Responsive layout
- Toast notifications
- Loading screen
- Animated transitions
- Space-themed interface

### 💾 Persistent Preferences

- Theme persistence
- Temperature unit persistence
- Animation preference persistence
- Last searched location persistence

---

# 🛠️ Technologies Used

- Node.js
- Express.js
- EJS
- HTML5
- CSS3
- JavaScript
- OpenWeather API
- Client-side state management using Local Storage
- Persistent user preferences

---

# 📂 Project Structure

```
Weather Dashboard
│
├── public/
│   ├── css/
│   ├── js/
│   ├── images/
│
├── views/
│   ├── index.ejs
│   ├── favorites.ejs
│   ├── history.ejs
│   └── settings.ejs
│
├── app.js
├── package.json
└── README.md
```

---

# 📦 Installation

Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/weather-dashboard.git
```

Move into the project

```bash
cd weather-dashboard
```

Install dependencies

```bash
npm install
```

Create a `.env` file

```env
API_KEY=YOUR_OPENWEATHER_API_KEY
```

Start the server

```bash
node app.js
```

or

```bash
nodemon app.js
```

Open

```
http://localhost:3000
```

---

# 🌍 API

This project uses the **OpenWeather API**

https://openweathermap.org/api

Endpoints used include:

- Current Weather
- 5 Day / 3 Hour Forecast
- Air Pollution API
- Reverse Geocoding

---

# 📸 Screens

- Dashboard
- Favorites
- Search History
- Settings
- Responsive Mobile Layout

_(More Screenshots coming soon.)_

---

# 💡 Future Improvements

- Live temperature conversion without refresh
- User authentication
- Database storage for favorites/history
- Weather maps
- PWA support
- Multi-language support
- Severe weather alerts
- Geolocation improvements
- Charts & analytics

---

# 👨‍💻 Developer

**Gabriel Chinonso Stanley**

Electrical Engineer | Backend Engineer | Tech Support Engineer

LinkedIn

https://www.linkedin.com/in/chinonso-gabriel-535b42176/

GitHub

https://github.com/nauzystan

---

# 📜 License

This project is licensed under the MIT License.

Feel free to fork, improve and contribute.
