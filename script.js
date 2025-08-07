// Weather App JavaScript

class WeatherApp {
    constructor() {
        this.initializeElements();
        this.initializeEventListeners();
        this.updateDateTime();
        this.startDateTimeUpdater();
        this.hideLoading();
    }

    initializeElements() {
        this.locationInput = document.getElementById('location-input');
        this.searchBtn = document.getElementById('search-btn');
        this.weatherContainer = document.getElementById('weather-container');
        this.weatherCard = document.getElementById('weather-card');
        this.loading = document.getElementById('loading');
        this.errorMessage = document.getElementById('error-message');
        
        // Weather data elements
        this.locationName = document.getElementById('location-name');
        this.locationCoords = document.getElementById('location-coords');
        this.temperature = document.getElementById('temperature');
        this.weatherIcon = document.getElementById('weather-icon');
        this.humidity = document.getElementById('humidity');
        this.windSpeed = document.getElementById('wind-speed');
        this.feelsLike = document.getElementById('feels-like');
        this.precipitation = document.getElementById('precipitation');
        this.forecastContainer = document.getElementById('forecast-container');
        
        // DateTime elements
        this.currentTime = document.getElementById('current-time');
        this.currentDate = document.getElementById('current-date');
    }

    initializeEventListeners() {
        this.searchBtn.addEventListener('click', () => this.handleSearch());
        this.locationInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleSearch();
            }
        });
    }

    updateDateTime() {
        const now = new Date();
        
        // Format time
        const timeOptions = {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
        };
        this.currentTime.textContent = now.toLocaleTimeString('en-US', timeOptions);
        
        // Format date
        const dateOptions = {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        };
        this.currentDate.textContent = now.toLocaleDateString('en-US', dateOptions);
    }

    startDateTimeUpdater() {
        // Update every second
        setInterval(() => this.updateDateTime(), 1000);
    }

    async handleSearch() {
        const location = this.locationInput.value.trim();
        if (!location) {
            this.showError('Please enter a location');
            return;
        }

        this.showLoading();
        
        try {
            const coordinates = await this.getCoordinates(location);
            const weatherData = await this.getWeatherData(coordinates);
            this.displayWeatherData(weatherData, coordinates, location);
        } catch (error) {
            console.error('Error fetching weather data:', error);
            this.showError('Unable to fetch weather data. Please try again.');
        }
    }

    async getCoordinates(location) {
        // Using OpenStreetMap Nominatim API for geocoding (free, no API key required)
        const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}&limit=1`
        );
        
        if (!response.ok) {
            throw new Error('Geocoding API request failed');
        }
        
        const data = await response.json();
        
        if (data.length === 0) {
            throw new Error('Location not found');
        }
        
        return {
            lat: parseFloat(data[0].lat),
            lon: parseFloat(data[0].lon),
            displayName: data[0].display_name
        };
    }

    async getWeatherData(coordinates) {
        const { lat, lon } = coordinates;
        
        // Open-Meteo API call
        const currentParams = [
            'temperature_2m',
            'relative_humidity_2m',
            'apparent_temperature',
            'precipitation',
            'weather_code',
            'wind_speed_10m'
        ].join(',');
        
        const dailyParams = [
            'weather_code',
            'temperature_2m_max',
            'temperature_2m_min'
        ].join(',');
        
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=${currentParams}&daily=${dailyParams}&timezone=auto&forecast_days=7`;
        
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error('Weather API request failed');
        }
        
        return await response.json();
    }

    displayWeatherData(data, coordinates, searchLocation) {
        // Update location info
        this.locationName.textContent = searchLocation;
        this.locationCoords.textContent = `${coordinates.lat.toFixed(2)}°, ${coordinates.lon.toFixed(2)}°`;
        
        // Update current weather
        const current = data.current;
        this.temperature.textContent = Math.round(current.temperature_2m);
        this.humidity.textContent = `${current.relative_humidity_2m}%`;
        this.windSpeed.textContent = `${Math.round(current.wind_speed_10m)} km/h`;
        this.feelsLike.textContent = `${Math.round(current.apparent_temperature)}°C`;
        this.precipitation.textContent = `${current.precipitation} mm`;
        
        // Update weather icon based on weather code
        this.updateWeatherIcon(current.weather_code);
        
        // Update forecast
        this.updateForecast(data.daily);
        
        this.showWeatherCard();
    }

    updateWeatherIcon(weatherCode) {
        // Weather code mapping for Open-Meteo
        const iconMap = {
            0: 'fas fa-sun', // Clear sky
            1: 'fas fa-sun', // Mainly clear
            2: 'fas fa-cloud-sun', // Partly cloudy
            3: 'fas fa-cloud', // Overcast
            45: 'fas fa-smog', // Fog
            48: 'fas fa-smog', // Depositing rime fog
            51: 'fas fa-cloud-drizzle', // Light drizzle
            53: 'fas fa-cloud-drizzle', // Moderate drizzle
            55: 'fas fa-cloud-drizzle', // Dense drizzle
            56: 'fas fa-cloud-drizzle', // Light freezing drizzle
            57: 'fas fa-cloud-drizzle', // Dense freezing drizzle
            61: 'fas fa-cloud-rain', // Slight rain
            63: 'fas fa-cloud-rain', // Moderate rain
            65: 'fas fa-cloud-rain', // Heavy rain
            66: 'fas fa-cloud-rain', // Light freezing rain
            67: 'fas fa-cloud-rain', // Heavy freezing rain
            71: 'fas fa-snowflake', // Slight snow fall
            73: 'fas fa-snowflake', // Moderate snow fall
            75: 'fas fa-snowflake', // Heavy snow fall
            77: 'fas fa-snowflake', // Snow grains
            80: 'fas fa-cloud-showers-heavy', // Slight rain showers
            81: 'fas fa-cloud-showers-heavy', // Moderate rain showers
            82: 'fas fa-cloud-showers-heavy', // Violent rain showers
            85: 'fas fa-snowflake', // Slight snow showers
            86: 'fas fa-snowflake', // Heavy snow showers
            95: 'fas fa-bolt', // Thunderstorm
            96: 'fas fa-bolt', // Thunderstorm with slight hail
            99: 'fas fa-bolt' // Thunderstorm with heavy hail
        };
        
        const iconClass = iconMap[weatherCode] || 'fas fa-question';
        this.weatherIcon.className = iconClass;
    }

    updateForecast(dailyData) {
        this.forecastContainer.innerHTML = '';
        
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        
        for (let i = 0; i < 7; i++) {
            const date = new Date(dailyData.time[i]);
            const dayName = i === 0 ? 'Today' : days[date.getDay()];
            
            const forecastItem = document.createElement('div');
            forecastItem.className = 'forecast-item';
            
            const iconClass = this.getWeatherIconClass(dailyData.weather_code[i]);
            
            forecastItem.innerHTML = `
                <div class="forecast-day">${dayName}</div>
                <div class="forecast-icon">
                    <i class="${iconClass}"></i>
                </div>
                <div class="forecast-temps">
                    <div class="forecast-high">${Math.round(dailyData.temperature_2m_max[i])}°</div>
                    <div class="forecast-low">${Math.round(dailyData.temperature_2m_min[i])}°</div>
                </div>
            `;
            
            this.forecastContainer.appendChild(forecastItem);
        }
    }

    getWeatherIconClass(weatherCode) {
        const iconMap = {
            0: 'fas fa-sun',
            1: 'fas fa-sun',
            2: 'fas fa-cloud-sun',
            3: 'fas fa-cloud',
            45: 'fas fa-smog',
            48: 'fas fa-smog',
            51: 'fas fa-cloud-drizzle',
            53: 'fas fa-cloud-drizzle',
            55: 'fas fa-cloud-drizzle',
            56: 'fas fa-cloud-drizzle',
            57: 'fas fa-cloud-drizzle',
            61: 'fas fa-cloud-rain',
            63: 'fas fa-cloud-rain',
            65: 'fas fa-cloud-rain',
            66: 'fas fa-cloud-rain',
            67: 'fas fa-cloud-rain',
            71: 'fas fa-snowflake',
            73: 'fas fa-snowflake',
            75: 'fas fa-snowflake',
            77: 'fas fa-snowflake',
            80: 'fas fa-cloud-showers-heavy',
            81: 'fas fa-cloud-showers-heavy',
            82: 'fas fa-cloud-showers-heavy',
            85: 'fas fa-snowflake',
            86: 'fas fa-snowflake',
            95: 'fas fa-bolt',
            96: 'fas fa-bolt',
            99: 'fas fa-bolt'
        };
        
        return iconMap[weatherCode] || 'fas fa-question';
    }

    showLoading() {
        this.loading.style.display = 'block';
        this.weatherCard.style.display = 'none';
        this.errorMessage.style.display = 'none';
    }

    hideLoading() {
        this.loading.style.display = 'none';
    }

    showWeatherCard() {
        this.loading.style.display = 'none';
        this.weatherCard.style.display = 'block';
        this.errorMessage.style.display = 'none';
    }

    showError(message) {
        this.loading.style.display = 'none';
        this.weatherCard.style.display = 'none';
        this.errorMessage.style.display = 'block';
        document.getElementById('error-text').textContent = message;
    }
}

// Initialize the weather app when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new WeatherApp();
});

