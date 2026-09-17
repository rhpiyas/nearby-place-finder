const locationButton = document.querySelector('#use-location-button');
const currentLocationElement = document.querySelector('#current-location');
const statusMessage = document.querySelector('#status-message');

// This value will be used later when we request nearby places.
let currentLocation = null;

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
    locationButton.disabled = false;
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
        1: 'Location permission was denied. Allow access to discover nearby places.',
        2: 'Your location is currently unavailable. Please try again.',
        3: 'Location request timed out. Please try again.'
    };

    locationButton.disabled = false;
    locationButton.textContent = 'Use My Location';
    currentLocationElement.textContent = 'Location not selected';
    statusMessage.textContent = messages[error.code] || 'Unable to access your location.';
}

function requestLocation() {
    if (!navigator.geolocation) {
        statusMessage.textContent = 'Geolocation is not supported by this browser.';
        return;
    }

    locationButton.disabled = true;
    locationButton.textContent = 'Finding location...';
    currentLocationElement.textContent = 'Reading your coordinates...';
    statusMessage.textContent = 'Finding your location...';

    navigator.geolocation.getCurrentPosition(
        handleLocationSuccess,
        handleLocationError,
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );
}

locationButton.addEventListener('click', requestLocation);
