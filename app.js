/**
 * Gradient Weather Companion - Application Logic
 */

// UI Elements
const searchForm = document.getElementById('search-form');
const searchInput = document.getElementById('search-input');
const loader = document.getElementById('loader');
const errorCard = document.getElementById('error-card');
const errorMessage = document.getElementById('error-message');
const weatherDashboard = document.getElementById('weather-dashboard');
const cityNameEl = document.getElementById('city-name');
const localTimeEl = document.getElementById('local-time');
const temperatureEl = document.getElementById('temperature');
const weatherDescriptionEl = document.getElementById('weather-description');
const animationContainer = document.getElementById('weather-animation-container');
const feelsLikeEl = document.getElementById('feels-like');
const humidityEl = document.getElementById('humidity');
const windSpeedEl = document.getElementById('wind-speed');
const cloudCoverEl = document.getElementById('cloud-cover');
const unitToggleBtn = document.getElementById('unit-toggle-btn');

// New UI Elements
const geoBtn = document.getElementById('geo-btn');
const hourlyChartEl = document.getElementById('hourly-chart');
const forecastStripEl = document.getElementById('forecast-strip');
const sunriseTimeEl = document.getElementById('sunrise-time');
const sunsetTimeEl = document.getElementById('sunset-time');
const daylightDurationEl = document.getElementById('daylight-duration');
const sunArcProgressEl = document.getElementById('sun-arc-progress');
const sunDotEl = document.getElementById('sun-dot');
const humidityBarEl = document.getElementById('humidity-bar');
const cloudBarEl = document.getElementById('cloud-bar');
const precipProbEl = document.getElementById('precip-prob');
const precipBarEl = document.getElementById('precip-bar');
const uvIndexEl = document.getElementById('uv-index');
const uvLabelEl = document.getElementById('uv-label');
const recentDropdownEl = document.getElementById('recent-dropdown');

// New Quick Stats Elements in Hero Card
const qsHumidityEl = document.getElementById('qs-humidity');
const qsWindEl = document.getElementById('qs-wind');
const qsWindUnitEl = document.getElementById('qs-wind-unit');
const qsPrecipEl = document.getElementById('qs-precip');
const qsFeelsEl = document.getElementById('qs-feels');

// Unified Application State
let appState = {
    currentUnit: 'F', // 'F' or 'C'
    cityData: null,   // { name, country_code, country, latitude, longitude, timezone }
    weatherData: null // raw JSON response from open-meteo
};

// Recent Searches State
let recentSearches = JSON.parse(localStorage.getItem('weather_recent_searches')) || [];

function fahrenheitToCelsius(f) {
    return (f - 32) * 5 / 9;
}

function mphToKmh(mph) {
    return mph * 1.60934;
}

// Helpers for dates and times
function getFormattedDateTime() {
    const options = { weekday: 'long', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date().toLocaleDateString('en-US', options);
}

function formatLocalTime(isoStr) {
    if (!isoStr) return '—';
    const timePart = isoStr.split('T')[1];
    if (!timePart) return '—';
    let [hours, minutes] = timePart.split(':').map(Number);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${hours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
}

function formatHourlyTimeLabel(isoStr, isFirst) {
    if (isFirst) return "Now";
    if (!isoStr) return '—';
    const timePart = isoStr.split('T')[1];
    if (!timePart) return '—';
    let hours = parseInt(timePart.split(':')[0], 10);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${hours} ${ampm}`;
}

function formatDailyDayLabel(dateStr, isFirst) {
    if (isFirst) return "Today";
    if (!dateStr) return '—';
    const date = new Date(dateStr + 'T00:00:00');
    const options = { weekday: 'short' };
    return date.toLocaleDateString('en-US', options);
}

// UV Index category labels
function getUVLabel(index) {
    if (index <= 2) return { text: 'Low', class: 'uv-low' };
    if (index <= 5) return { text: 'Mod', class: 'uv-mod' };
    if (index <= 7) return { text: 'High', class: 'uv-high' };
    if (index <= 10) return { text: 'Very High', class: 'uv-veryhigh' };
    return { text: 'Extreme', class: 'uv-extreme' };
}

// SVG Animated Weather Icons
const WEATHER_SVGS = {
    clearDay: `
        <svg class="weather-icon-svg" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <radialGradient id="sun-grad" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stop-color="#ffb703" />
                    <stop offset="100%" stop-color="#fb8500" />
                </radialGradient>
            </defs>
            <circle class="animate-spin-slow" cx="50" cy="50" r="18" fill="url(#sun-grad)" />
            <g class="animate-spin-slow" stroke="#fb8500" stroke-width="4" stroke-linecap="round">
                <line x1="50" y1="18" x2="50" y2="8" />
                <line x1="50" y1="82" x2="50" y2="92" />
                <line x1="18" y1="50" x2="8" y2="50" />
                <line x1="82" y1="50" x2="92" y2="50" />
                <line x1="27.3" y1="27.3" x2="20.3" y2="20.3" />
                <line x1="72.7" y1="72.7" x2="79.7" y2="79.7" />
                <line x1="27.3" y1="72.7" x2="20.3" y2="79.7" />
                <line x1="72.7" y1="27.3" x2="79.7" y2="20.3" />
            </g>
        </svg>
    `,
    clearNight: `
        <svg class="weather-icon-svg" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="moon-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#eaeaea" />
                    <stop offset="100%" stop-color="#8e9eab" />
                </linearGradient>
            </defs>
            <path class="animate-float" d="M45,30 A22,22 0 1,0 70,55 A16,16 0 1,1 45,30 Z" fill="url(#moon-grad)" filter="drop-shadow(0 4px 8px rgba(255,255,255,0.1))"/>
            <circle class="animate-pulse-slow" cx="30" cy="25" r="1.5" fill="#fff" />
            <circle class="animate-pulse-slow" cx="75" cy="30" r="2" fill="#fff" style="animation-delay: 1s;" />
            <circle class="animate-pulse-slow" cx="65" cy="75" r="1" fill="#fff" style="animation-delay: 1.5s;" />
            <circle class="animate-pulse-slow" cx="25" cy="60" r="1.8" fill="#fff" style="animation-delay: 0.5s;" />
        </svg>
    `,
    cloudy: `
        <svg class="weather-icon-svg" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="cloud-grad-1" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stop-color="#ffffff" />
                    <stop offset="100%" stop-color="#cfd9df" />
                </linearGradient>
                <linearGradient id="cloud-grad-2" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stop-color="#e6e9f0" />
                    <stop offset="100%" stop-color="#eef1f6" />
                </linearGradient>
            </defs>
            <path class="animate-float" d="M30,65 Q20,65 20,55 Q20,45 30,45 Q32,45 34,46 Q38,35 48,35 Q58,35 60,46 Q70,46 70,55 Q70,65 60,65 Z" fill="url(#cloud-grad-1)" style="animation-duration: 5s; opacity: 0.75;" />
            <path class="animate-float" d="M40,75 Q28,75 28,63 Q28,51 40,51 Q42.5,51 45,52 Q50,40 62,40 Q74,40 76.5,52 Q88,52 88,63 Q88,75 76.5,75 Z" fill="url(#cloud-grad-2)" style="animation-duration: 4s;" />
        </svg>
    `,
    rainy: `
        <svg class="weather-icon-svg" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="rain-cloud" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stop-color="#a1c4fd" />
                    <stop offset="100%" stop-color="#c2e9fb" />
                </linearGradient>
            </defs>
            <path class="animate-float" d="M40,60 Q28,60 28,48 Q28,36 40,36 Q42.5,36 45,37 Q50,25 62,25 Q74,25 76.5,37 Q88,37 88,48 Q88,60 76.5,60 Z" fill="url(#rain-cloud)" />
            <g stroke="#a1c4fd" stroke-width="3" stroke-linecap="round">
                <line x1="38" y1="68" x2="35" y2="76" class="animate-pulse-slow" style="animation-duration: 1s;" />
                <line x1="50" y1="70" x2="47" y2="78" class="animate-pulse-slow" style="animation-duration: 0.8s; animation-delay: 0.3s;" />
                <line x1="62" y1="68" x2="59" y2="76" class="animate-pulse-slow" style="animation-duration: 1.2s; animation-delay: 0.1s;" />
                <line x1="74" y1="66" x2="71" y2="74" class="animate-pulse-slow" style="animation-duration: 0.9s; animation-delay: 0.5s;" />
            </g>
        </svg>
    `,
    stormy: `
        <svg class="weather-icon-svg" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="storm-cloud" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stop-color="#4f5d75" />
                    <stop offset="100%" stop-color="#2d3142" />
                </linearGradient>
            </defs>
            <path class="animate-float" d="M40,60 Q28,60 28,48 Q28,36 40,36 Q42.5,36 45,37 Q50,25 62,25 Q74,25 76.5,37 Q88,37 88,48 Q88,60 76.5,60 Z" fill="url(#storm-cloud)" />
            <polygon class="animate-pulse-slow" points="52,62 43,73 50,73 45,86 58,71 50,71" fill="#ffd166" style="animation-duration: 1.5s;" />
            <g stroke="#4f5d75" stroke-width="2.5" stroke-linecap="round">
                <line x1="35" y1="68" x2="32" y2="76" class="animate-pulse-slow" style="animation-duration: 0.8s;" />
                <line x1="65" y1="68" x2="62" y2="76" class="animate-pulse-slow" style="animation-duration: 1s; animation-delay: 0.2s;" />
            </g>
        </svg>
    `,
    snowy: `
        <svg class="weather-icon-svg" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="snow-cloud" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stop-color="#eef2f3" />
                    <stop offset="100%" stop-color="#8e9eab" />
                </linearGradient>
            </defs>
            <path class="animate-float" d="M40,60 Q28,60 28,48 Q28,36 40,36 Q42.5,36 45,37 Q50,25 62,25 Q74,25 76.5,37 Q88,37 88,48 Q88,60 76.5,60 Z" fill="url(#snow-cloud)" />
            <g fill="#ffffff">
                <circle cx="38" cy="70" r="3" class="animate-pulse-slow" style="animation-duration: 1.5s;" />
                <circle cx="52" cy="74" r="2.5" class="animate-pulse-slow" style="animation-duration: 1.8s; animation-delay: 0.4s;" />
                <circle cx="66" cy="71" r="3" class="animate-pulse-slow" style="animation-duration: 1.2s; animation-delay: 0.8s;" />
            </g>
        </svg>
    `,
    misty: `
        <svg class="weather-icon-svg" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <g stroke="#ffffff" stroke-width="4" stroke-linecap="round" opacity="0.8">
                <path d="M25,35 C35,30 45,40 55,35 C65,30 75,40 85,35" fill="none" class="animate-float" style="animation-duration: 6s;"/>
                <path d="M15,50 C25,45 35,55 45,50 C55,45 65,55 75,50" fill="none" class="animate-float" style="animation-duration: 5s; animation-delay: 0.5s;"/>
                <path d="M20,65 C30,60 40,70 50,65 C60,60 70,70 80,65" fill="none" class="animate-float" style="animation-duration: 7s; animation-delay: 1s;"/>
            </g>
        </svg>
    `
};

/**
 * Maps WMO weather codes returned by Open-Meteo to specific UI states.
 */
function getWeatherState(code, isDay) {
    if (code === 0) {
        return isDay
            ? { desc: 'Clear Sky', class: 'weather-clear-day', svg: WEATHER_SVGS.clearDay }
            : { desc: 'Clear Night', class: 'weather-clear-night', svg: WEATHER_SVGS.clearNight };
    }

    if (code >= 1 && code <= 3) {
        let desc = 'Partly Cloudy';
        if (code === 3) desc = 'Overcast';
        else if (code === 1) desc = 'Mainly Clear';

        return {
            desc,
            class: isDay ? 'weather-cloudy' : 'weather-clear-night',
            svg: isDay ? WEATHER_SVGS.cloudy : WEATHER_SVGS.clearNight
        };
    }

    if (code === 45 || code === 48) {
        return { desc: 'Foggy/Misty', class: 'weather-misty', svg: WEATHER_SVGS.misty };
    }

    if ((code >= 51 && code <= 55) || (code >= 61 && code <= 65) || (code >= 80 && code <= 82)) {
        let desc = 'Rainy';
        if (code === 51 || code === 80) desc = 'Light Rain';
        else if (code === 65 || code === 82) desc = 'Heavy Rain';

        return { desc, class: 'weather-rainy', svg: WEATHER_SVGS.rainy };
    }

    if ((code >= 71 && code <= 77) || code === 85 || code === 86 || code === 56 || code === 57 || code === 66 || code === 67) {
        return { desc: 'Snowing', class: 'weather-snowy', svg: WEATHER_SVGS.snowy };
    }

    if (code >= 95 && code <= 99) {
        return { desc: 'Thunderstorm', class: 'weather-stormy', svg: WEATHER_SVGS.stormy };
    }

    return { desc: 'Moderate', class: 'weather-clear-day', svg: WEATHER_SVGS.clearDay };
}

/**
 * Searches for a city name using the Open-Meteo Geocoding API.
 */
async function fetchCityCoordinates(cityName) {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityName)}&count=1&language=en&format=json`;
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error('Failed to search city coordinate data.');
    }
    const data = await response.json();
    if (!data.results || data.results.length === 0) {
        throw new Error('City not found. Please verify the name and spelling.');
    }
    return data.results[0]; // returns { name, country, latitude, longitude, timezone, etc. }
}

/**
 * Retrieves the weather data using coordinates.
 */
async function fetchWeatherData(lat, lon) {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,cloud_cover,wind_speed_10m,precipitation&hourly=temperature_2m,weather_code,precipitation_probability,is_day&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max&wind_speed_unit=mph&temperature_unit=fahrenheit&timezone=auto`;
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error('Weather services are currently unavailable.');
    }
    return await response.json();
}

/**
 * Triggers loading visual state.
 */
function setLoaderState(isLoading) {
    if (isLoading) {
        loader.classList.remove('hidden');
        errorCard.classList.add('hidden');
        weatherDashboard.classList.add('hidden');
    } else {
        loader.classList.add('hidden');
    }
}

/**
 * Triggers error messaging feedback.
 */
function displayError(message) {
    errorMessage.textContent = message;
    errorCard.classList.remove('hidden');
    weatherDashboard.classList.add('hidden');
}

/**
 * Global render routine that maps state into elements.
 */
function renderDashboard() {
    const city = appState.cityData;
    const weather = appState.weatherData;
    if (!city || !weather) return;

    const current = weather.current;
    const isDay = current.is_day;
    const code = current.weather_code;
    const isF = appState.currentUnit === 'F';

    // Map weather code to class and icon
    const state = getWeatherState(code, isDay);
    document.body.className = state.class;

    // 1. Current City Header
    const countryStr = city.country_code ? city.country_code.toUpperCase() : (city.country || '');
    cityNameEl.textContent = `${city.name}${countryStr ? ', ' + countryStr : ''}`;
    localTimeEl.textContent = getFormattedDateTime();
    weatherDescriptionEl.textContent = state.desc;
    animationContainer.innerHTML = state.svg;

    // 2. Unit Conversions for Hero Temps & Speeds
    const tempVal = isF ? current.temperature_2m : fahrenheitToCelsius(current.temperature_2m);
    const feelsVal = isF ? current.apparent_temperature : fahrenheitToCelsius(current.apparent_temperature);
    const windVal = isF ? current.wind_speed_10m : mphToKmh(current.wind_speed_10m);
    const windUnit = isF ? 'mph' : 'km/h';

    temperatureEl.textContent = Math.round(tempVal);
    
    // Toggle active classes on unit switch span elements
    const unitF = unitToggleBtn.querySelector('.unit-f');
    const unitC = unitToggleBtn.querySelector('.unit-c');
    if (isF) {
        unitF.classList.add('active');
        unitC.classList.remove('active');
    } else {
        unitF.classList.remove('active');
        unitC.classList.add('active');
    }

    // 3. Quick Stats Row in Hero
    qsHumidityEl.textContent = current.relative_humidity_2m;
    qsWindEl.textContent = Math.round(windVal);
    qsWindUnitEl.textContent = windUnit;
    
    const currentHourIndex = weather.hourly.time.indexOf(current.time);
    const currentPrecipProb = currentHourIndex !== -1 ? weather.hourly.precipitation_probability[currentHourIndex] : 0;
    qsPrecipEl.textContent = currentPrecipProb;
    qsFeelsEl.textContent = `${Math.round(feelsVal)}°`;

    // 4. Detailed Stats Grid Cards
    feelsLikeEl.textContent = Math.round(feelsVal);
    humidityEl.textContent = current.relative_humidity_2m;
    humidityBarEl.style.width = `${current.relative_humidity_2m}%`;

    windSpeedEl.textContent = windVal.toFixed(1);
    const windUnitEls = document.querySelectorAll('#wind-unit');
    windUnitEls.forEach(el => el.textContent = windUnit);

    cloudCoverEl.textContent = current.cloud_cover;
    cloudBarEl.style.width = `${current.cloud_cover}%`;

    precipProbEl.textContent = currentPrecipProb;
    precipBarEl.style.width = `${currentPrecipProb}%`;

    const uvMaxToday = weather.daily.uv_index_max[0] || 0;
    uvIndexEl.textContent = uvMaxToday.toFixed(1);
    const uvLabel = getUVLabel(uvMaxToday);
    uvLabelEl.textContent = uvLabel.text;
    uvLabelEl.className = `uv-label ${uvLabel.class}`;

    // 5. Sunrise / Sunset Drawing logic
    const currentLocalTimeMs = Date.parse(current.time);
    const sunriseMs = Date.parse(weather.daily.sunrise[0]);
    const sunsetMs = Date.parse(weather.daily.sunset[0]);

    sunriseTimeEl.textContent = formatLocalTime(weather.daily.sunrise[0]);
    sunsetTimeEl.textContent = formatLocalTime(weather.daily.sunset[0]);

    const durationMs = sunsetMs - sunriseMs;
    if (durationMs > 0) {
        const diffHrs = Math.floor(durationMs / 3600000);
        const diffMins = Math.round((durationMs % 3600000) / 60000);
        daylightDurationEl.textContent = `${diffHrs}h ${diffMins}m of daylight`;
    } else {
        daylightDurationEl.textContent = '—';
    }

    // Determine parameter t along the Bezier curve
    let t = 0;
    if (currentLocalTimeMs < sunriseMs) {
        t = 0;
    } else if (currentLocalTimeMs > sunsetMs) {
        t = 1;
    } else if (durationMs > 0) {
        t = (currentLocalTimeMs - sunriseMs) / durationMs;
    }

    // Calculate quadratic curve coordinates (cx, cy)
    // curve path: M10,95 Q100,5 190,95
    const cx = 10 + 180 * t;
    const cy = 95 - 180 * t * (1 - t);
    sunDotEl.setAttribute('cx', cx);
    sunDotEl.setAttribute('cy', cy);

    // Dim the sun dot if it is nighttime
    if (isDay === 0) {
        sunDotEl.setAttribute('opacity', '0.4');
    } else {
        sunDotEl.setAttribute('opacity', '1');
    }

    // stroke-dasharray is 210
    const dashoffset = 210 - (t * 210);
    sunArcProgressEl.setAttribute('stroke-dashoffset', dashoffset);

    // 6. Render Hourly Sparkline List
    hourlyChartEl.innerHTML = '';
    const startIndex = currentHourIndex !== -1 ? currentHourIndex : 0;
    
    for (let i = 0; i < 12; i++) {
        const index = startIndex + i;
        if (index >= weather.hourly.time.length) break;

        const timeStr = weather.hourly.time[index];
        const hCode = weather.hourly.weather_code[index];
        const hTemp = weather.hourly.temperature_2m[index];
        const hPrecip = weather.hourly.precipitation_probability[index];
        const hIsDay = weather.hourly.is_day[index];

        const hState = getWeatherState(hCode, hIsDay);
        const isFirst = i === 0;

        const hTempConv = isF ? hTemp : fahrenheitToCelsius(hTemp);

        const item = document.createElement('div');
        item.className = `hourly-item ${isFirst ? 'active-now' : ''}`;
        item.innerHTML = `
            <span class="hourly-time">${formatHourlyTimeLabel(timeStr, isFirst)}</span>
            <div class="hourly-icon-svg">${hState.svg}</div>
            <span class="hourly-temp">${Math.round(hTempConv)}°</span>
            <span class="hourly-precip ${hPrecip > 0 ? '' : 'hidden'}">${hPrecip}%</span>
        `;
        hourlyChartEl.appendChild(item);
    }

    // 7. Render 7-Day Forecast Strip
    forecastStripEl.innerHTML = '';
    for (let i = 0; i < 7; i++) {
        const timeStr = weather.daily.time[i];
        const dCode = weather.daily.weather_code[i];
        const dMax = weather.daily.temperature_2m_max[i];
        const dMin = weather.daily.temperature_2m_min[i];

        if (!timeStr) break;

        const dState = getWeatherState(dCode, 1); // treat daily rows as day version
        const isFirst = i === 0;

        const maxConv = isF ? dMax : fahrenheitToCelsius(dMax);
        const minConv = isF ? dMin : fahrenheitToCelsius(dMin);

        const row = document.createElement('div');
        row.className = 'forecast-row';
        row.innerHTML = `
            <span class="forecast-day">${formatDailyDayLabel(timeStr, isFirst)}</span>
            <div class="forecast-weather">
                <span class="forecast-icon-svg">${dState.svg}</span>
                <span>${dState.desc}</span>
            </div>
            <div class="forecast-temps">
                <span class="forecast-temp-max">${Math.round(maxConv)}°</span>
                <span class="forecast-temp-min">${Math.round(minConv)}°</span>
            </div>
        `;
        forecastStripEl.appendChild(row);
    }

    // Display Dashboard Card
    weatherDashboard.classList.remove('hidden');
}

/**
 * Updates UI with successful results and unified state setup.
 */
function updateWeatherUI(cityObj, weatherObj) {
    appState.cityData = cityObj;
    appState.weatherData = weatherObj;
    renderDashboard();
}

/**
 * Recent Searches list logic helpers
 */
function saveRecentSearch(cityName) {
    if (!cityName) return;
    
    // Normalize format: e.g. "san francisco" -> "San Francisco"
    const formatted = cityName
        .split(' ')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ');

    recentSearches = recentSearches.filter(c => c !== formatted);
    recentSearches.unshift(formatted);
    recentSearches = recentSearches.slice(0, 5); // max 5

    localStorage.setItem('weather_recent_searches', JSON.stringify(recentSearches));
}

function deleteRecentSearch(cityName) {
    recentSearches = recentSearches.filter(c => c !== cityName);
    localStorage.setItem('weather_recent_searches', JSON.stringify(recentSearches));
    showRecentDropdown();
}

function showRecentDropdown() {
    const val = searchInput.value.trim().toLowerCase();
    const filtered = recentSearches.filter(c => c.toLowerCase().includes(val));

    recentDropdownEl.innerHTML = '';

    if (filtered.length === 0) {
        recentDropdownEl.classList.add('hidden');
        return;
    }

    filtered.forEach((search) => {
        const li = document.createElement('li');
        li.innerHTML = `
            <span class="recent-city-name">${search}</span>
            <button class="delete-search-btn" aria-label="Remove search" data-city="${search}">
                <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </button>
        `;

        li.addEventListener('click', (e) => {
            if (e.target.closest('.delete-search-btn')) return;
            searchInput.value = search;
            recentDropdownEl.classList.add('hidden');
            searchForm.dispatchEvent(new Event('submit'));
        });

        li.querySelector('.delete-search-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            deleteRecentSearch(search);
            searchInput.focus();
        });

        recentDropdownEl.appendChild(li);
    });

    recentDropdownEl.classList.remove('hidden');
}

// Event Listeners
searchForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const query = searchInput.value.trim();
    if (!query) return;

    recentDropdownEl.classList.add('hidden');
    setLoaderState(true);

    try {
        const cityData = await fetchCityCoordinates(query);
        const weatherData = await fetchWeatherData(cityData.latitude, cityData.longitude);

        // Success: save query and update
        saveRecentSearch(query);
        setLoaderState(false);
        updateWeatherUI(cityData, weatherData);

    } catch (err) {
        setLoaderState(false);
        displayError(err.message);
    }
});

// Geolocation button event handler
geoBtn.addEventListener('click', () => {
    if (!navigator.geolocation) {
        displayError("Geolocation is not supported by your browser.");
        return;
    }

    geoBtn.classList.add('loading');
    setLoaderState(true);

    navigator.geolocation.getCurrentPosition(async (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;

        try {
            // Get city name using BigDataCloud free client-side API
            const geoUrl = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`;
            const geoResponse = await fetch(geoUrl);
            let cityName = "Current Location";
            let countryCode = "";

            if (geoResponse.ok) {
                const geoData = await geoResponse.json();
                cityName = geoData.city || geoData.locality || "Current Location";
                countryCode = geoData.countryCode || "";
            }

            const weatherData = await fetchWeatherData(lat, lon);

            geoBtn.classList.remove('loading');
            setLoaderState(false);

            const cityObj = {
                name: cityName,
                country_code: countryCode,
                country: ""
            };

            updateWeatherUI(cityObj, weatherData);
        } catch (err) {
            geoBtn.classList.remove('loading');
            setLoaderState(false);
            displayError(err.message);
        }
    }, (error) => {
        geoBtn.classList.remove('loading');
        setLoaderState(false);
        let msg = "Unable to retrieve your location.";
        if (error.code === error.PERMISSION_DENIED) {
            msg = "Location access denied. Please enable location permissions in your browser.";
        }
        displayError(msg);
    }, {
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 0
    });
});

// Unit toggle click listener
unitToggleBtn.addEventListener('click', () => {
    appState.currentUnit = appState.currentUnit === 'F' ? 'C' : 'F';
    if (appState.weatherData) {
        renderDashboard();
    }
});

// Recent searches UI controls
searchInput.addEventListener('focus', showRecentDropdown);
searchInput.addEventListener('input', showRecentDropdown);

document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-wrapper')) {
        recentDropdownEl.classList.add('hidden');
    }
});

searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        recentDropdownEl.classList.add('hidden');
        searchInput.blur();
    }
});

// =============================================
// Particle System — ambient weather atmosphere
// =============================================
const particleContainer = document.getElementById('particle-container');
const PARTICLE_CONFIGS = {
    'weather-clear-day':   { count: 12, colors: ['rgba(255,220,100,0.5)', 'rgba(255,255,255,0.4)'], sizeRange: [2, 6], opacityMax: 0.45 },
    'weather-clear-night': { count: 20, colors: ['rgba(200,220,255,0.6)', 'rgba(255,255,255,0.5)'], sizeRange: [1, 4], opacityMax: 0.6 },
    'weather-cloudy':      { count: 8,  colors: ['rgba(200,210,230,0.4)', 'rgba(180,190,210,0.3)'], sizeRange: [3, 8], opacityMax: 0.3 },
    'weather-rainy':       { count: 20, colors: ['rgba(100,180,255,0.5)', 'rgba(150,200,255,0.4)'], sizeRange: [1, 3], opacityMax: 0.5 },
    'weather-stormy':      { count: 15, colors: ['rgba(100,130,200,0.4)', 'rgba(150,150,200,0.3)'], sizeRange: [1, 4], opacityMax: 0.4 },
    'weather-snowy':       { count: 18, colors: ['rgba(255,255,255,0.7)', 'rgba(220,240,255,0.6)'], sizeRange: [2, 6], opacityMax: 0.6 },
    'weather-misty':       { count: 8,  colors: ['rgba(200,210,230,0.3)', 'rgba(230,235,245,0.25)'], sizeRange: [6, 14], opacityMax: 0.25 },
};

let particleAnimationFrame = null;

function spawnParticles(weatherClass) {
    // Clear existing particles
    particleContainer.innerHTML = '';
    if (particleAnimationFrame) cancelAnimationFrame(particleAnimationFrame);

    const cfg = PARTICLE_CONFIGS[weatherClass] || PARTICLE_CONFIGS['weather-clear-day'];

    for (let i = 0; i < cfg.count; i++) {
        const p = document.createElement('div');
        p.className = 'particle';

        const size = cfg.sizeRange[0] + Math.random() * (cfg.sizeRange[1] - cfg.sizeRange[0]);
        const xPos = Math.random() * 100;
        const duration = 6 + Math.random() * 10;
        const delay = -(Math.random() * duration); // negative delay = start mid-animation
        const drift = (Math.random() - 0.5) * 80;
        const color = cfg.colors[Math.floor(Math.random() * cfg.colors.length)];

        p.style.setProperty('--size', `${size}px`);
        p.style.setProperty('--x', `${xPos}%`);
        p.style.setProperty('--duration', `${duration}s`);
        p.style.setProperty('--delay', `${delay}s`);
        p.style.setProperty('--drift', `${drift}px`);
        p.style.setProperty('--max-opacity', cfg.opacityMax);
        p.style.background = `radial-gradient(circle, ${color} 0%, transparent 70%)`;

        particleContainer.appendChild(p);
    }
}

// =============================================
// Sticky Search Bar — frost effect on scroll
// =============================================
const searchSection = document.querySelector('.search-section');
window.addEventListener('scroll', () => {
    if (window.scrollY > 20) {
        searchSection.classList.add('scrolled');
    } else {
        searchSection.classList.remove('scrolled');
    }
}, { passive: true });

// =============================================
// Live Local Time Clock
// =============================================
let localTimeInterval = null;

function startLocalTimeClock() {
    if (localTimeInterval) clearInterval(localTimeInterval);
    localTimeInterval = setInterval(() => {
        localTimeEl.textContent = getFormattedDateTime();
    }, 30000); // update every 30s
}

// =============================================
// Temperature flip animation
// =============================================
function animateTemperatureChange(newValue) {
    temperatureEl.style.transition = 'transform 0.2s ease, opacity 0.2s ease';
    temperatureEl.style.transform = 'translateY(-8px)';
    temperatureEl.style.opacity = '0';
    setTimeout(() => {
        temperatureEl.textContent = newValue;
        temperatureEl.style.transform = 'translateY(8px)';
        setTimeout(() => {
            temperatureEl.style.transform = 'translateY(0)';
            temperatureEl.style.opacity = '1';
        }, 20);
    }, 200);
}

// Patch renderDashboard to use animation and spawn particles
const _origRenderDashboard = renderDashboard;
renderDashboard = function() {
    const city = appState.cityData;
    const weather = appState.weatherData;
    if (!city || !weather) return;

    const current = weather.current;
    const isDay = current.is_day;
    const code = current.weather_code;
    const isF = appState.currentUnit === 'F';
    const state = getWeatherState(code, isDay);

    // Spawn particles for the weather state
    spawnParticles(state.class);
    startLocalTimeClock();

    // Call original render
    _origRenderDashboard();
};

// =============================================
// Load default city on initialization
// =============================================
window.addEventListener('DOMContentLoaded', () => {
    searchInput.focus();
    searchInput.value = "San Francisco";
    searchForm.dispatchEvent(new Event('submit'));
});
