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

// State variables for units
let currentUnit = 'F'; // 'F' or 'C'
let currentWeatherData = {
    tempF: 0,
    tempC: 0,
    feelsF: 0,
    feelsC: 0,
    windMph: 0,
    windKmh: 0
};

function fahrenheitToCelsius(f) {
    return (f - 32) * 5 / 9;
}

function mphToKmh(mph) {
    return mph * 1.60934;
}

function updateWeatherDataState(current) {
    const tempF = current.temperature_2m;
    const feelsF = current.apparent_temperature;
    const windMph = current.wind_speed_10m;
    
    currentWeatherData.tempF = tempF;
    currentWeatherData.tempC = fahrenheitToCelsius(tempF);
    currentWeatherData.feelsF = feelsF;
    currentWeatherData.feelsC = fahrenheitToCelsius(feelsF);
    currentWeatherData.windMph = windMph;
    currentWeatherData.windKmh = mphToKmh(windMph);
}

function renderUnits() {
    const unitF = unitToggleBtn.querySelector('.unit-f');
    const unitC = unitToggleBtn.querySelector('.unit-c');
    const windUnitEl = document.getElementById('wind-unit');
    
    if (currentUnit === 'F') {
        unitF.classList.add('active');
        unitC.classList.remove('active');
        temperatureEl.textContent = Math.round(currentWeatherData.tempF);
        feelsLikeEl.textContent = Math.round(currentWeatherData.feelsF);
        windSpeedEl.textContent = currentWeatherData.windMph.toFixed(1);
        windUnitEl.textContent = 'mph';
    } else {
        unitF.classList.remove('active');
        unitC.classList.add('active');
        temperatureEl.textContent = Math.round(currentWeatherData.tempC);
        feelsLikeEl.textContent = Math.round(currentWeatherData.feelsC);
        windSpeedEl.textContent = currentWeatherData.windKmh.toFixed(1);
        windUnitEl.textContent = 'km/h';
    }
}

// SVG Animated Weather Icons
const WEATHER_SVGS = {
    clearDay: `
        <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
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
        <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="moon-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#eaeaea" />
                    <stop offset="100%" stop-color="#8e9eab" />
                </linearGradient>
            </defs>
            <path class="animate-float" d="M45,30 A22,22 0 1,0 70,55 A16,16 0 1,1 45,30 Z" fill="url(#moon-grad)" filter="drop-shadow(0 4px 8px rgba(255,255,255,0.1))"/>
            <!-- Pulsing stars -->
            <circle class="animate-pulse-slow" cx="30" cy="25" r="1.5" fill="#fff" />
            <circle class="animate-pulse-slow" cx="75" cy="30" r="2" fill="#fff" style="animation-delay: 1s;" />
            <circle class="animate-pulse-slow" cx="65" cy="75" r="1" fill="#fff" style="animation-delay: 1.5s;" />
            <circle class="animate-pulse-slow" cx="25" cy="60" r="1.8" fill="#fff" style="animation-delay: 0.5s;" />
        </svg>
    `,
    cloudy: `
        <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
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
            <!-- Back Cloud -->
            <path class="animate-float" d="M30,65 Q20,65 20,55 Q20,45 30,45 Q32,45 34,46 Q38,35 48,35 Q58,35 60,46 Q70,46 70,55 Q70,65 60,65 Z" fill="url(#cloud-grad-1)" style="animation-duration: 5s; opacity: 0.75;" />
            <!-- Front Cloud -->
            <path class="animate-float" d="M40,75 Q28,75 28,63 Q28,51 40,51 Q42.5,51 45,52 Q50,40 62,40 Q74,40 76.5,52 Q88,52 88,63 Q88,75 76.5,75 Z" fill="url(#cloud-grad-2)" style="animation-duration: 4s;" />
        </svg>
    `,
    rainy: `
        <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="rain-cloud" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stop-color="#a1c4fd" />
                    <stop offset="100%" stop-color="#c2e9fb" />
                </linearGradient>
            </defs>
            <path class="animate-float" d="M40,60 Q28,60 28,48 Q28,36 40,36 Q42.5,36 45,37 Q50,25 62,25 Q74,25 76.5,37 Q88,37 88,48 Q88,60 76.5,60 Z" fill="url(#rain-cloud)" />
            <!-- Rain Drops -->
            <g stroke="#a1c4fd" stroke-width="3" stroke-linecap="round">
                <line x1="38" y1="68" x2="35" y2="76" class="animate-pulse-slow" style="animation-duration: 1s;" />
                <line x1="50" y1="70" x2="47" y2="78" class="animate-pulse-slow" style="animation-duration: 0.8s; animation-delay: 0.3s;" />
                <line x1="62" y1="68" x2="59" y2="76" class="animate-pulse-slow" style="animation-duration: 1.2s; animation-delay: 0.1s;" />
                <line x1="74" y1="66" x2="71" y2="74" class="animate-pulse-slow" style="animation-duration: 0.9s; animation-delay: 0.5s;" />
            </g>
        </svg>
    `,
    stormy: `
        <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="storm-cloud" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stop-color="#4f5d75" />
                    <stop offset="100%" stop-color="#2d3142" />
                </linearGradient>
            </defs>
            <path class="animate-float" d="M40,60 Q28,60 28,48 Q28,36 40,36 Q42.5,36 45,37 Q50,25 62,25 Q74,25 76.5,37 Q88,37 88,48 Q88,60 76.5,60 Z" fill="url(#storm-cloud)" />
            <!-- Lightning Bolt -->
            <polygon class="animate-pulse-slow" points="52,62 43,73 50,73 45,86 58,71 50,71" fill="#ffd166" style="animation-duration: 1.5s;" />
            <!-- Rain Drops -->
            <g stroke="#4f5d75" stroke-width="2.5" stroke-linecap="round">
                <line x1="35" y1="68" x2="32" y2="76" class="animate-pulse-slow" style="animation-duration: 0.8s;" />
                <line x1="65" y1="68" x2="62" y2="76" class="animate-pulse-slow" style="animation-duration: 1s; animation-delay: 0.2s;" />
            </g>
        </svg>
    `,
    snowy: `
        <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="snow-cloud" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stop-color="#eef2f3" />
                    <stop offset="100%" stop-color="#8e9eab" />
                </linearGradient>
            </defs>
            <path class="animate-float" d="M40,60 Q28,60 28,48 Q28,36 40,36 Q42.5,36 45,37 Q50,25 62,25 Q74,25 76.5,37 Q88,37 88,48 Q88,60 76.5,60 Z" fill="url(#snow-cloud)" />
            <!-- Falling Snowflakes -->
            <g fill="#ffffff">
                <circle cx="38" cy="70" r="3" class="animate-pulse-slow" style="animation-duration: 1.5s;" />
                <circle cx="52" cy="74" r="2.5" class="animate-pulse-slow" style="animation-duration: 1.8s; animation-delay: 0.4s;" />
                <circle cx="66" cy="71" r="3" class="animate-pulse-slow" style="animation-duration: 1.2s; animation-delay: 0.8s;" />
            </g>
        </svg>
    `,
    misty: `
        <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <!-- Mist lines drifting -->
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
 * Reference: WMO weather codes (https://open-meteo.com/en/docs)
 */
function getWeatherState(code, isDay) {
    // 0: Clear sky
    if (code === 0) {
        return isDay 
            ? { desc: 'Clear Sky', class: 'weather-clear-day', svg: WEATHER_SVGS.clearDay }
            : { desc: 'Clear Night', class: 'weather-clear-night', svg: WEATHER_SVGS.clearNight };
    }
    
    // 1, 2, 3: Mainly clear, partly cloudy, and overcast
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
    
    // 45, 48: Fog and depositing rime fog
    if (code === 45 || code === 48) {
        return { desc: 'Foggy/Misty', class: 'weather-misty', svg: WEATHER_SVGS.misty };
    }
    
    // 51, 53, 55: Drizzle: Light, moderate, and dense intensity
    // 56, 57: Freezing Drizzle: Light and dense intensity
    // 61, 63, 65: Rain: Slight, moderate and heavy intensity
    // 66, 67: Freezing Rain: Light and heavy intensity
    // 80, 81, 82: Rain showers: Slight, moderate, and violent
    if ((code >= 51 && code <= 55) || (code >= 61 && code <= 65) || (code >= 80 && code <= 82)) {
        let desc = 'Rainy';
        if (code === 51 || code === 80) desc = 'Light Rain';
        else if (code === 65 || code === 82) desc = 'Heavy Rain';
        
        return { desc, class: 'weather-rainy', svg: WEATHER_SVGS.rainy };
    }
    
    // 71, 73, 75: Snow fall: Slight, moderate, and heavy intensity
    // 77: Snow grains
    // 85, 86: Snow showers slight and heavy
    // 56, 57, 66, 67: Freezing rain/drizzle
    if ((code >= 71 && code <= 77) || code === 85 || code === 86 || code === 56 || code === 57 || code === 66 || code === 67) {
        return { desc: 'Snowing', class: 'weather-snowy', svg: WEATHER_SVGS.snowy };
    }
    
    // 95: Thunderstorm: Slight or moderate
    // 96, 99: Thunderstorm with slight and heavy hail
    if (code >= 95 && code <= 99) {
        return { desc: 'Thunderstorm', class: 'weather-stormy', svg: WEATHER_SVGS.stormy };
    }
    
    // Fallback default
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
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,cloud_cover,wind_speed_10m&wind_speed_unit=mph&temperature_unit=fahrenheit`;
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error('Weather services are currently unavailable.');
    }
    return await response.json();
}

/**
 * Formats the current date/time context.
 */
function getFormattedDateTime() {
    const options = { weekday: 'long', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date().toLocaleDateString('en-US', options);
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
 * Updates the user interface dynamically with fetched values.
 */
function updateWeatherUI(cityObj, weatherObj) {
    const current = weatherObj.current;
    const isDay = current.is_day;
    const code = current.weather_code;
    
    // Map code to visual styling state
    const state = getWeatherState(code, isDay);
    
    // Smooth transition between body classes for background gradient adjustments
    document.body.className = state.class;
    
    // Inject values
    cityNameEl.textContent = `${cityObj.name}, ${cityObj.country_code ? cityObj.country_code.toUpperCase() : cityObj.country || ''}`;
    localTimeEl.textContent = getFormattedDateTime();
    weatherDescriptionEl.textContent = state.desc;
    
    // Load SVG visual
    animationContainer.innerHTML = state.svg;
    
    // Update weather state and render with the active unit
    updateWeatherDataState(current);
    renderUnits();
    
    // Non-unit dependent values
    humidityEl.textContent = current.relative_humidity_2m;
    cloudCoverEl.textContent = current.cloud_cover;
    
    // Show Dashboard
    weatherDashboard.classList.remove('hidden');
}

// Event Listeners
searchForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const query = searchInput.value.trim();
    if (!query) return;
    
    setLoaderState(true);
    
    try {
        // Step 1: Geocode
        const cityData = await fetchCityCoordinates(query);
        
        // Step 2: Fetch Weather
        const weatherData = await fetchWeatherData(cityData.latitude, cityData.longitude);
        
        // Step 3: Populate UI
        setLoaderState(false);
        updateWeatherUI(cityData, weatherData);
        
    } catch (err) {
        setLoaderState(false);
        displayError(err.message);
    }
});

// Unit toggle listener
unitToggleBtn.addEventListener('click', () => {
    currentUnit = currentUnit === 'F' ? 'C' : 'F';
    renderUnits();
});

// Load default city on initialization (San Francisco)
window.addEventListener('DOMContentLoaded', () => {
    searchInput.focus();
    // Pre-populate with a default query
    searchInput.value = "San Francisco";
    searchForm.dispatchEvent(new Event('submit'));
});
