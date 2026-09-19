const locationButton = document.querySelector('#use-location-button');
const currentLocationElement = document.querySelector('#current-location');

let currentLocation = null;
let statusMessage = null;
let onLocationReady = null;

export function getCurrentLocation() {
    return currentLocation;
}

async function findPlaceName(latitude, longitude) {
    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&zoom=10`,
            { headers: { Accept: 'application/json' } }
        );

        if (!response.ok) throw new Error('Place lookup failed');

        const data = await response.json();
        const address = data.address || {};
        return address.city
            || address.town
            || address.village
            || address.municipality
            || address.county
            || address.state;
    } catch (error) {
        return null;
    }
}

async function handleLocationSuccess(position) {
    const { latitude, longitude, accuracy } = position.coords;

    currentLocation = { latitude, longitude, accuracy };
    onLocationReady?.(currentLocation);
    locationButton.disabled = false;
    locationButton.classList.add('location-ready');
    locationButton.textContent = 'Location Ready';
    currentLocationElement.textContent = 'Finding place name...';
    statusMessage.textContent = 'Location access granted. Looking up your area...';

    const placeName = await findPlaceName(latitude, longitude);
    currentLocationElement.textContent = placeName
        ? `Current location: ${placeName}`
        : `Current location: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
    statusMessage.textContent = 'Location ready. Choose a category to find nearby places.';
}

function handleLocationError(error) {
    const messages = {
        1: 'Location permission was denied. Allow location access in Chrome site settings, then try again.',
        2: 'Your location is currently unavailable. Turn on Location Services and try again.',
        3: 'Location request timed out. Turn on GPS or move near a window, then try again.'
    };

    locationButton.disabled = false;
    locationButton.classList.remove('location-ready');
    locationButton.textContent = 'Use My Location';
    currentLocationElement.textContent = 'Location not selected';
    statusMessage.textContent = messages[error.code]
        || 'Unable to access your location. Check your browser and device location settings.';
}

function requestLocation() {
    if (!navigator.geolocation) {
        statusMessage.textContent = 'Geolocation is not supported by this browser.';
        return;
    }

    if (!window.isSecureContext) {
        statusMessage.textContent = 'Location needs HTTPS. Open this app from a secure website, not a file or regular HTTP link.';
        currentLocationElement.textContent = 'Secure connection required';
        return;
    }

    locationButton.disabled = true;
    locationButton.classList.remove('location-ready');
    locationButton.textContent = 'Finding location...';
    currentLocationElement.textContent = 'Reading your coordinates...';
    statusMessage.textContent = 'Finding your location...';

    navigator.geolocation.getCurrentPosition(
        handleLocationSuccess,
        handleLocationError,
        { enableHighAccuracy: false, timeout: 20000, maximumAge: 60000 }
    );
}

export function setupLocation(statusElement, locationReadyCallback) {
    statusMessage = statusElement;
    onLocationReady = locationReadyCallback;
    locationButton.addEventListener('click', requestLocation);
}
