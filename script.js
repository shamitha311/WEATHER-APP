/* ==============================================
   WEATHER FORECAST APP — script.js
   Enhanced College Mini-Project
   Features: Theme, Map, Auto-Location, Hourly,
             Recent Searches, Tips, Sunrise/Sunset,
             Wind Direction, UV, Cloud Cover
   ============================================== */


// ── 1. API CONFIG ──────────────────────────────
const API_KEY  = "85b2ca6c6c6230b51b2bacc9b2c982e8";
const BASE_URL = "https://api.openweathermap.org/data/2.5";
const GEO_URL  = "https://api.openweathermap.org/geo/1.0";
const ICON_URL = "https://openweathermap.org/img/wn";


// ── 2. APP STATE ───────────────────────────────
var currentLat   = null;
var currentLon   = null;
var leafletMap   = null;
var mapMarker    = null;
var recentCities = [];  // recent search history


// ── 3. DOM ELEMENTS ────────────────────────────

// Search
var cityInput     = document.getElementById("city-input");
var searchBtn     = document.getElementById("search-btn");
var locationBtn   = document.getElementById("location-btn");
var mapToggleBtn  = document.getElementById("map-toggle-btn");

// Recent searches
var recentSection = document.getElementById("recent-section");
var recentChips   = document.getElementById("recent-chips");
var clearRecentBtn= document.getElementById("clear-recent");

// Messages
var errorBox      = document.getElementById("error-box");
var errorText     = document.getElementById("error-text");
var loadingBox    = document.getElementById("loading-box");
var loadingText   = document.getElementById("loading-text");

// Map
var mapSection    = document.getElementById("map-section");
var closeMapBtn   = document.getElementById("close-map");

// Theme
var themeToggle   = document.getElementById("theme-toggle");
var themeIcon     = document.getElementById("theme-icon");

// Header
var greetingEl    = document.getElementById("greeting");
var clockEl       = document.getElementById("live-clock");

// Weather content
var weatherContent= document.getElementById("weather-content");

// Main card
var cityNameEl    = document.getElementById("city-name");
var weatherDateEl = document.getElementById("weather-date");
var localTimeEl   = document.getElementById("local-time");
var weatherIconEl = document.getElementById("weather-icon");
var temperatureEl = document.getElementById("temperature");
var conditionEl   = document.getElementById("condition");
var feelsLikeEl   = document.getElementById("feels-like");
var hiLoEl        = document.getElementById("hi-lo");
var humidityEl    = document.getElementById("humidity");
var windSpeedEl   = document.getElementById("wind-speed");
var pressureEl    = document.getElementById("pressure");
var visibilityEl  = document.getElementById("visibility");
var sunriseEl     = document.getElementById("sunrise");
var sunsetEl      = document.getElementById("sunset");

// Hourly
var hourlyList    = document.getElementById("hourly-list");

// Forecast
var forecastListEl= document.getElementById("forecast-list");

// Extra row
var tipText       = document.getElementById("tip-text");
var uvValue       = document.getElementById("uv-value");
var uvLabel       = document.getElementById("uv-label");
var cloudValue    = document.getElementById("cloud-value");
var windDirArrow  = document.getElementById("wind-dir-arrow");
var windDirLabel  = document.getElementById("wind-dir-label");
var rainChance    = document.getElementById("rain-chance");

// Weather card (for gradient class)
var weatherCard   = document.getElementById("weather-card");


// ── 4. ON PAGE LOAD ────────────────────────────

window.addEventListener("DOMContentLoaded", function () {

  // Set greeting based on time of day
  setGreeting();

  // Start the live clock
  startClock();

  // Load saved theme from localStorage
  loadTheme();

  // Load recent searches from localStorage
  loadRecentSearches();

  // Init the map (hidden by default)
  initMap();

  // Auto-detect location and load weather
  autoDetectLocation();

});


// ── 5. GREET THE USER ──────────────────────────

function setGreeting() {
  var hour = new Date().getHours();
  var msg;

  if (hour >= 5 && hour < 12)       { msg = "Good Morning ☀️"; }
  else if (hour >= 12 && hour < 17) { msg = "Good Afternoon 🌤"; }
  else if (hour >= 17 && hour < 21) { msg = "Good Evening 🌅"; }
  else                              { msg = "Good Night 🌙"; }

  greetingEl.textContent = msg;
}


// ── 6. LIVE CLOCK ──────────────────────────────

function startClock() {
  function tick() {
    var now = new Date();
    var h   = now.getHours().toString().padStart(2, "0");
    var m   = now.getMinutes().toString().padStart(2, "0");
    var s   = now.getSeconds().toString().padStart(2, "0");
    clockEl.textContent = h + ":" + m + ":" + s;
  }
  tick();
  setInterval(tick, 1000);
}


// ── 7. THEME TOGGLE ────────────────────────────

function loadTheme() {
  // Read saved preference from localStorage
  var saved = localStorage.getItem("weather-theme") || "light";
  applyTheme(saved);
}

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  themeIcon.textContent = (theme === "dark") ? "☀️" : "🌙";
  localStorage.setItem("weather-theme", theme);
}

themeToggle.addEventListener("click", function () {
  var current = document.documentElement.getAttribute("data-theme");
  applyTheme(current === "dark" ? "light" : "dark");
});


// ── 8. AUTO-DETECT CURRENT LOCATION ───────────

function autoDetectLocation() {
  if (!navigator.geolocation) return;

  showLoading("📍 Detecting your location...");

  navigator.geolocation.getCurrentPosition(
    function (pos) {
      // Got GPS coords — fetch weather
      fetchWeatherByCoords(pos.coords.latitude, pos.coords.longitude);
    },
    function () {
      // Permission denied — show empty state (no error, just wait)
      hideLoading();
    }
  );
}


// ── 9. SEARCH BY CITY ──────────────────────────

function searchCity() {
  var city = cityInput.value.trim();
  if (!city) {
    showError("Please enter a city name to search.");
    return;
  }
  getWeatherByCity(city);
}

// Click Search button
searchBtn.addEventListener("click", searchCity);

// Press Enter key
cityInput.addEventListener("keydown", function (e) {
  if (e.key === "Enter") searchCity();
});

// Current Location button
locationBtn.addEventListener("click", function () {
  if (!navigator.geolocation) {
    showError("Your browser doesn't support location access.");
    return;
  }
  showLoading("📍 Getting your location...");
  navigator.geolocation.getCurrentPosition(
    function (pos) {
      fetchWeatherByCoords(pos.coords.latitude, pos.coords.longitude);
    },
    function () {
      hideLoading();
      showError("Location access was denied. Please search a city manually.");
    }
  );
});


// ── 10. MAP TOGGLE ─────────────────────────────

mapToggleBtn.addEventListener("click", function () {
  if (mapSection.style.display === "none" || mapSection.style.display === "") {
    mapSection.style.display = "block";
    mapToggleBtn.textContent = "🗺️ Hide Map";
    // Leaflet needs this when shown inside a hidden element
    setTimeout(function () { leafletMap.invalidateSize(); }, 200);
    // Smooth scroll to map
    mapSection.scrollIntoView({ behavior: "smooth", block: "start" });
  } else {
    mapSection.style.display = "none";
    mapToggleBtn.textContent = "🗺️ Pick from Map";
  }
});

closeMapBtn.addEventListener("click", function () {
  mapSection.style.display = "none";
  mapToggleBtn.textContent = "🗺️ Pick from Map";
});


// ── 11. INIT LEAFLET MAP ───────────────────────

function initMap() {
  // Create the map centered on the world
  leafletMap = L.map("map", { zoomControl: true }).setView([20, 0], 2);

  // OpenStreetMap tile layer
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a>',
    maxZoom: 18
  }).addTo(leafletMap);

  // When user clicks on the map → fetch weather for that location
  leafletMap.on("click", function (e) {
    var lat = e.latlng.lat;
    var lon = e.latlng.lng;
    fetchWeatherByCoords(lat, lon);
    updateMapMarker(lat, lon, "Loading...");

    // Close map after selection on mobile
    if (window.innerWidth < 640) {
      mapSection.style.display = "none";
      mapToggleBtn.textContent = "🗺️ Pick from Map";
    }
  });
}

function updateMapMarker(lat, lon, label) {
  if (mapMarker) {
    leafletMap.removeLayer(mapMarker);
  }
  mapMarker = L.marker([lat, lon])
    .addTo(leafletMap)
    .bindPopup("<b>" + label + "</b>")
    .openPopup();

  leafletMap.setView([lat, lon], 9);
}


// ── 12. FETCH WEATHER BY CITY NAME ─────────────

function getWeatherByCity(city) {
  showLoading("🔍 Searching for " + city + "...");

  // Step 1: Geocode city name → coordinates
  fetch(GEO_URL + "/direct?q=" + encodeURIComponent(city) + "&limit=1&appid=" + API_KEY)
    .then(function (res) { return res.json(); })
    .then(function (geo) {

      if (!geo || geo.length === 0) {
        hideLoading();
        showError("City \"" + city + "\" not found. Try a different spelling.");
        return;
      }

      var lat  = geo[0].lat;
      var lon  = geo[0].lon;
      var name = geo[0].name;

      // Save to recent searches
      saveRecentSearch(name, lat, lon);

      // Update map marker
      updateMapMarker(lat, lon, name);

      // Fetch full weather data
      fetchWeatherByCoords(lat, lon);

    })
    .catch(function () {
      hideLoading();
      showError("Network error. Please check your internet connection.");
    });
}


// ── 13. FETCH WEATHER BY COORDINATES ───────────

function fetchWeatherByCoords(lat, lon) {
  currentLat = lat;
  currentLon = lon;

  showLoading("☁️ Fetching weather data...");

  // Fetch Current Weather
  var currentUrl = BASE_URL + "/weather?lat=" + lat + "&lon=" + lon + "&units=metric&appid=" + API_KEY;
  // Fetch 5-Day Forecast (3h intervals)
  var forecastUrl = BASE_URL + "/forecast?lat=" + lat + "&lon=" + lon + "&units=metric&cnt=40&appid=" + API_KEY;

  // Make both requests at the same time using Promise.all
  Promise.all([
    fetch(currentUrl).then(function (r) { return r.json(); }),
    fetch(forecastUrl).then(function (r) { return r.json(); })
  ])
  .then(function (results) {
    var currentData  = results[0];
    var forecastData = results[1];

    if (currentData.cod !== 200) {
      hideLoading();
      showError("Could not get weather data. Please try again.");
      return;
    }

    hideLoading();
    hideError();

    // Save to recent (from reverse geocode name)
    saveRecentSearch(currentData.name, lat, lon);

    // Update map marker with real city name
    updateMapMarker(lat, lon, currentData.name);

    // Render everything
    renderCurrentWeather(currentData);
    renderHourlyForecast(forecastData);
    renderDailyForecast(forecastData);
    renderExtraInfo(currentData, forecastData);
    setWeatherTip(currentData);

    // Show the weather section with animation
    weatherContent.classList.add("show");

    // Scroll to weather card on mobile
    if (window.innerWidth < 640) {
      setTimeout(function () {
        weatherContent.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    }

  })
  .catch(function () {
    hideLoading();
    showError("Failed to load weather. Please check your connection.");
  });
}


// ── 14. RENDER CURRENT WEATHER ─────────────────

function renderCurrentWeather(data) {
  var city      = data.name;
  var country   = data.sys.country;
  var temp      = Math.round(data.main.temp);
  var hi        = Math.round(data.main.temp_max);
  var lo        = Math.round(data.main.temp_min);
  var feelsLike = Math.round(data.main.feels_like);
  var humidity  = data.main.humidity;
  var pressure  = data.main.pressure;
  var windMs    = data.wind.speed;
  var windKmh   = Math.round(windMs * 3.6);
  var iconCode  = data.weather[0].icon;
  var desc      = data.weather[0].description;

  // City + Date
  cityNameEl.textContent    = city + ", " + country;
  weatherDateEl.textContent = formatDate(new Date());

  // Local time using timezone offset from API (in seconds)
  var utc      = new Date().getTime() + new Date().getTimezoneOffset() * 60000;
  var localMs  = utc + data.timezone * 1000;
  var localNow = new Date(localMs);
  localTimeEl.textContent   = "Local time: " + formatTime(localNow);

  // Temperature
  temperatureEl.textContent = temp + "°C";
  conditionEl.textContent   = capitalize(desc);
  feelsLikeEl.textContent   = "Feels like " + feelsLike + "°C";
  hiLoEl.textContent        = "H: " + hi + "°  ·  L: " + lo + "°";

  // Icon
  weatherIconEl.src = ICON_URL + "/" + iconCode + "@2x.png";
  weatherIconEl.alt = desc;

  // Detail items
  humidityEl.textContent  = humidity + "%";
  windSpeedEl.textContent = windKmh + " km/h";
  pressureEl.textContent  = pressure + " hPa";
  visibilityEl.textContent= data.visibility ? (data.visibility / 1000).toFixed(1) + " km" : "N/A";

  // Sunrise / Sunset (convert Unix UTC + timezone offset)
  sunriseEl.textContent = formatSunTime(data.sys.sunrise, data.timezone);
  sunsetEl.textContent  = formatSunTime(data.sys.sunset,  data.timezone);

  // Apply weather gradient to card
  setCardGradient(iconCode);
}


// ── 15. WEATHER CARD GRADIENT ──────────────────
// Changes the card background color based on weather condition

function setCardGradient(iconCode) {
  // Remove all old classes
  var classes = weatherCard.className.split(" ");
  classes.forEach(function (c) {
    if (c.startsWith("sky-")) weatherCard.classList.remove(c);
  });

  // Map icon codes to gradient classes
  // d = day, n = night
  if (iconCode === "01d")                                    { weatherCard.classList.add("sky-clear-day"); }
  else if (iconCode === "01n")                               { weatherCard.classList.add("sky-clear-night"); }
  else if (["02d","03d","04d","02n","03n","04n"].indexOf(iconCode) >= 0) { weatherCard.classList.add("sky-clouds"); }
  else if (["09d","09n"].indexOf(iconCode) >= 0)             { weatherCard.classList.add("sky-drizzle"); }
  else if (["10d","10n"].indexOf(iconCode) >= 0)             { weatherCard.classList.add("sky-rain"); }
  else if (["11d","11n"].indexOf(iconCode) >= 0)             { weatherCard.classList.add("sky-thunder"); }
  else if (["13d","13n"].indexOf(iconCode) >= 0)             { weatherCard.classList.add("sky-snow"); }
  else if (["50d","50n"].indexOf(iconCode) >= 0)             { weatherCard.classList.add("sky-mist"); }
}


// ── 16. RENDER HOURLY FORECAST ─────────────────

function renderHourlyForecast(forecastData) {
  var items = forecastData.list.slice(0, 8); // next 24 hours (8 x 3h)
  var now   = new Date();
  var html  = "";

  items.forEach(function (item, index) {
    var time    = new Date(item.dt * 1000);
    var timeStr = index === 0 ? "Now" : formatTime(time);
    var icon    = item.weather[0].icon;
    var temp    = Math.round(item.main.temp);
    var pop     = Math.round((item.pop || 0) * 100); // probability of precipitation
    var isNow   = index === 0 ? "now" : "";

    html += '<div class="hourly-card ' + isNow + '">';
    html += '  <div class="h-time">' + timeStr + '</div>';
    html += '  <img class="h-icon" src="' + ICON_URL + '/' + icon + '.png" alt="" />';
    html += '  <div class="h-temp">' + temp + '°</div>';
    html += '  <div class="h-rain">' + (pop > 0 ? "💧 " + pop + "%" : "—") + '</div>';
    html += '</div>';
  });

  hourlyList.innerHTML = html;
}


// ── 17. RENDER 5-DAY FORECAST ──────────────────

function renderDailyForecast(forecastData) {
  // Group by day
  var days = {};

  forecastData.list.forEach(function (item) {
    var d    = new Date(item.dt * 1000);
    var key  = d.toDateString();
    var hour = d.getHours();

    if (!days[key]) {
      days[key] = { date: d, icon: item.weather[0].icon, desc: item.weather[0].description, temps: [] };
    }

    // Prefer midday icon
    if (hour >= 11 && hour <= 14) {
      days[key].icon = item.weather[0].icon;
      days[key].desc = item.weather[0].description;
    }

    days[key].temps.push(item.main.temp);
  });

  var dayList = Object.values(days).slice(1, 6); // skip today, take 5
  var html    = "";

  dayList.forEach(function (day) {
    var dayName = day.date.toLocaleDateString("en-US", { weekday: "short" });
    var dateNum = day.date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    var hi      = Math.round(Math.max.apply(null, day.temps));
    var lo      = Math.round(Math.min.apply(null, day.temps));
    var icon    = day.icon.replace("n", "d");

    html += '<div class="forecast-card">';
    html += '  <div class="forecast-day">' + dayName + '</div>';
    html += '  <div style="font-size:0.65rem;color:var(--text-muted);margin-bottom:6px;">' + dateNum + '</div>';
    html += '  <img class="forecast-icon" src="' + ICON_URL + '/' + icon + '.png" alt="' + day.desc + '" />';
    html += '  <div class="forecast-max">' + hi + '°C</div>';
    html += '  <div class="forecast-min">' + lo + '°C</div>';
    html += '</div>';
  });

  forecastListEl.innerHTML = html;
}


// ── 18. RENDER EXTRA INFO ──────────────────────

function renderExtraInfo(currentData, forecastData) {
  // Cloud cover %
  cloudValue.textContent = currentData.clouds.all + "%";

  // Wind direction (degrees → compass label + arrow)
  var windDeg = currentData.wind.deg || 0;
  windDirLabel.textContent  = getWindDirection(windDeg);
  windDirArrow.textContent  = getWindArrow(windDeg);
  windDirArrow.style.transform = "rotate(" + windDeg + "deg)";

  // Rain chance from first forecast slot
  var pop = forecastData.list[0] ? Math.round((forecastData.list[0].pop || 0) * 100) : 0;
  rainChance.textContent = pop + "%";

  // UV Index — estimated from clouds + time of day (free API doesn't give UV)
  var hour = new Date().getHours();
  var uv   = estimateUV(currentData.clouds.all, hour);
  var uvInfo = uvInfo_label(uv);
  uvValue.textContent = uv;
  uvLabel.textContent = uvInfo.label;
  uvValue.style.color = uvInfo.color;
}


// ── 19. WEATHER TIP BANNER ─────────────────────

function setWeatherTip(data) {
  var id   = data.weather[0].id;     // weather condition ID
  var temp = Math.round(data.main.temp);
  var pop  = 0; // no pop in current weather, use condition
  var tip  = "";

  if (id >= 200 && id < 300)       { tip = "⚡ Thunderstorm alert! Stay indoors and away from windows."; }
  else if (id >= 300 && id < 400)  { tip = "🌦️ Light drizzle expected. A light jacket would help!"; }
  else if (id >= 500 && id < 510)  { tip = "🌂 It's raining! Don't forget your umbrella today."; }
  else if (id >= 511 && id < 600)  { tip = "🧊 Freezing rain possible. Drive carefully!"; }
  else if (id >= 600 && id < 700)  { tip = "❄️ Snowy conditions! Wear warm layers and watch your step."; }
  else if (id >= 700 && id < 800)  { tip = "🌫️ Low visibility due to mist or fog. Take it slow!"; }
  else if (id === 800) {
    if (temp > 35)                 { tip = "🥵 Very hot and sunny! Stay hydrated and wear sunscreen."; }
    else if (temp > 28)            { tip = "😎 Beautiful sunny day! A great time to go outside."; }
    else if (temp > 20)            { tip = "🌞 Clear and comfortable — perfect weather for a walk!"; }
    else if (temp > 10)            { tip = "🧥 Clear but cool — carry a light jacket just in case."; }
    else                           { tip = "🥶 Clear but cold! Bundle up before heading out."; }
  }
  else if (id > 800)               { tip = "☁️ Partly cloudy today. Should stay dry overall!"; }
  else                             { tip = "🌤️ Have a wonderful day! Check back for updates."; }

  tipText.textContent = tip;
}


// ── 20. RECENT SEARCHES ────────────────────────

function loadRecentSearches() {
  try {
    var saved = localStorage.getItem("recent-cities");
    recentCities = saved ? JSON.parse(saved) : [];
  } catch (e) {
    recentCities = [];
  }
  renderRecentChips();
}

function saveRecentSearch(name, lat, lon) {
  // Don't add duplicates
  recentCities = recentCities.filter(function (c) {
    return c.name.toLowerCase() !== name.toLowerCase();
  });

  // Add to front
  recentCities.unshift({ name: name, lat: lat, lon: lon });

  // Keep only last 5
  if (recentCities.length > 5) recentCities = recentCities.slice(0, 5);

  try {
    localStorage.setItem("recent-cities", JSON.stringify(recentCities));
  } catch (e) {}

  renderRecentChips();
}

function renderRecentChips() {
  if (recentCities.length === 0) {
    recentSection.style.display = "none";
    return;
  }

  recentSection.style.display = "flex";
  recentChips.innerHTML = "";

  recentCities.forEach(function (city) {
    var chip = document.createElement("button");
    chip.className   = "chip";
    chip.textContent = city.name;

    chip.addEventListener("click", function () {
      cityInput.value = city.name;
      fetchWeatherByCoords(city.lat, city.lon);
      updateMapMarker(city.lat, city.lon, city.name);
    });

    recentChips.appendChild(chip);
  });
}

clearRecentBtn.addEventListener("click", function () {
  recentCities = [];
  localStorage.removeItem("recent-cities");
  recentSection.style.display = "none";
});


// ── 21. UI HELPER FUNCTIONS ────────────────────

function showLoading(msg) {
  loadingText.textContent = msg || "Loading...";
  loadingBox.classList.add("show");
  errorBox.classList.remove("show");
  weatherContent.classList.remove("show");
}

function hideLoading() {
  loadingBox.classList.remove("show");
}

function showError(msg) {
  errorText.textContent = "⚠️  " + msg;
  errorBox.classList.add("show");
}

function hideError() {
  errorBox.classList.remove("show");
}


// ── 22. DATE / TIME HELPERS ────────────────────

// Format: "Monday, 9 June 2026"
function formatDate(date) {
  return date.toLocaleDateString("en-US", {
    weekday: "long", day: "numeric", month: "long", year: "numeric"
  });
}

// Format: "14:30"
function formatTime(date) {
  var h = date.getHours().toString().padStart(2, "0");
  var m = date.getMinutes().toString().padStart(2, "0");
  return h + ":" + m;
}

// Convert Unix timestamp + timezone offset to readable time
function formatSunTime(unixTs, tzOffsetSec) {
  var utcMs   = unixTs * 1000;
  var localMs = utcMs + tzOffsetSec * 1000;
  var d       = new Date(localMs);
  var h       = d.getUTCHours().toString().padStart(2, "0");
  var m       = d.getUTCMinutes().toString().padStart(2, "0");
  return h + ":" + m;
}

// Capitalize first letter of every word
function capitalize(str) {
  return str.replace(/\b\w/g, function (c) { return c.toUpperCase(); });
}


// ── 23. WIND DIRECTION HELPERS ─────────────────

function getWindDirection(deg) {
  var dirs = ["N","NNE","NE","ENE","E","ESE","SE","SSE","S","SSW","SW","WSW","W","WNW","NW","NNW"];
  return dirs[Math.round(deg / 22.5) % 16];
}

// Return a directional arrow character based on degrees
function getWindArrow(deg) {
  if (deg >= 337.5 || deg < 22.5)  return "↑";   // N
  if (deg < 67.5)                  return "↗";   // NE
  if (deg < 112.5)                 return "→";   // E
  if (deg < 157.5)                 return "↘";   // SE
  if (deg < 202.5)                 return "↓";   // S
  if (deg < 247.5)                 return "↙";   // SW
  if (deg < 292.5)                 return "←";   // W
  return                                  "↖";   // NW
}


// ── 24. UV INDEX (Estimated) ───────────────────
// UV is estimated from cloud cover + time of day
// (Free OpenWeather plan doesn't include UV)

function estimateUV(clouds, hour) {
  if (hour < 6 || hour > 19) return 0;
  // Peak UV at noon (12:00)
  var peak = Math.sin(Math.PI * (hour - 6) / 13);
  var base = peak * 11;
  return Math.max(0, Math.round(base * (1 - clouds / 150)));
}

function uvInfo_label(uv) {
  if (uv <= 2)  return { label: "Low",       color: "#22c55e" };
  if (uv <= 5)  return { label: "Moderate",  color: "#eab308" };
  if (uv <= 7)  return { label: "High",      color: "#f97316" };
  if (uv <= 10) return { label: "Very High", color: "#ef4444" };
  return              { label: "Extreme",   color: "#9333ea" };
}
