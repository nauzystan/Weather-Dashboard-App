# 🌤 Weather Dashboard App

A simple weather web application built with Node.js, Express, EJS, and Axios.
It allows users to enter a city and country code to retrieve real-time weather data using the OpenWeather API.

---

## 🚀 Features

- Search weather by city and country
- Displays:
  - Temperature
  - Weather condition
  - Humidity
  - Wind speed

- Clean and responsive UI
- Uses real-time API data

---

## 🛠 Tech Stack

- Node.js
- Express.js
- EJS (Templating)
- Axios (API requests)
- CSS (Styling)

---

## 📦 Installation

1. Clone the repository:

```
git clone <your-repo-link>
cd <your-folder-name>
```

2. Install dependencies:

```
npm install
```

---

## 🔑 API Key Setup

1. Go to https://openweathermap.org/api
2. Create an account and generate an API key
3. Replace this in `index.js`:

```js
const yourAPIKey = "YOUR_API_KEY_HERE";
```

OR Create a `.env` file in the root:

```js

OPENWEATHER_API_KEY=your_api_key_here
---

## ▶️ Running the App

Start the server:

```

node index.js

```

OR (if you have nodemon installed):

```

nodemon index.js

```

---

## 🌐 Open in Browser

Visit:

```

http://localhost:3000

```

---

## 📁 Project Structure

```

Weather Dashboard App/
│── public/
│ └── styles/
│ └── main.css
│
│── views/
│ └── index.ejs
│
│── index.js
│── package.json

```

```
