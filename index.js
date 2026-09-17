const locationButton = document.querySelector('#use-location-button');
const statusMessage = document.querySelector('#status-message');

// This value will be used later when we request nearby places.
let currentLocation = null;

function handleLocationSuccess(position) {
    const { latitude, longitude, accuracy } = position.coords;

    currentLocation = { latitude, longitude, accuracy };
    locationButton.disabled = false;
    locationButton.textContent = 'Location Ready';
    statusMessage.textContent = 'Location access granted. Ready to find nearby places.';
}

function handleLocationError(error) {
    const messages = {
        1: 'Location permission was denied. Allow access to discover nearby places.',
        2: 'Your location is currently unavailable. Please try again.',
        3: 'Location request timed out. Please try again.'
    };

    locationButton.disabled = false;
    locationButton.textContent = 'Use My Location';
    statusMessage.textContent = messages[error.code] || 'Unable to access your location.';
}

function requestLocation() {
    if (!navigator.geolocation) {
        statusMessage.textContent = 'Geolocation is not supported by this browser.';
        return;
    }

    locationButton.disabled = true;
    locationButton.textContent = 'Finding location...';
    statusMessage.textContent = 'Finding your location...';

    navigator.geolocation.getCurrentPosition(
        handleLocationSuccess,
        handleLocationError,
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );
}

locationButton.addEventListener('click', requestLocation);
