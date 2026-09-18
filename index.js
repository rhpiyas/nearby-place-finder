const locationButton = document.querySelector('#use-location-button');
const currentLocationElement = document.querySelector('#current-location');
const statusMessage = document.querySelector('#status-message');
const placesList = document.querySelector('#places-list');
const categoryButtons = document.querySelectorAll('[data-category]');

let currentLocation = null;
const geoapifyApiKey = '86e57720c76d42ada8cd2d13b7a76006';

const categoryMap = {
    restaurant: 'catering.restaurant',
    cafe: 'catering.cafe',
    hospital: 'healthcare.hospital',
    pharmacy: 'healthcare.pharmacy',
    hotel: 'accommodation.hotel',
    university: 'education.university',
    atm: 'service.financial.atm',
    supermarket: 'commercial.supermarket'
};

function getPlaceCoordinates(place) {
    const properties = place.properties || {};

    return {
        latitude: properties.lat ?? place.lat ?? place.center?.lat,
        longitude: properties.lon ?? place.lon ?? place.center?.lon
    };
}

function createPlaceCard(place, category) {
    const card = document.createElement('article');
    const properties = place.properties || {};
    const { latitude, longitude } = getPlaceCoordinates(place);
    const address = properties.formatted
        || [properties.housenumber, properties.street, properties.city]
            .filter(Boolean)
            .join(', ');

    card.className = 'place-card';

    const name = document.createElement('h3');
    name.textContent = properties.name || 'Unnamed place';

    const type = document.createElement('span');
    type.className = 'place-category';
    type.textContent = category;

    const addressText = document.createElement('p');
    addressText.textContent = address || 'Address not available';

    card.append(name, type, addressText);

    if (latitude !== undefined && longitude !== undefined) {
        const mapLink = document.createElement('a');
        mapLink.href = `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=18/${latitude}/${longitude}`;
        mapLink.target = '_blank';
        mapLink.rel = 'noreferrer';
        mapLink.textContent = 'View on map';
        card.append(mapLink);
    }

    return card;
}

function renderPlaceCards(places, category) {
    placesList.replaceChildren();

    const fragment = document.createDocumentFragment();
    places.slice(0, 30).forEach((place) => {
        fragment.append(createPlaceCard(place, category));
    });
    placesList.append(fragment);
}

async function fetchNearbyPlaces(category) {
    if (!currentLocation) {
        statusMessage.textContent = 'Allow location access before choosing a category.';
        return;
    }

    const geoapifyCategory = categoryMap[category];
    if (!geoapifyCategory) return;

    const { latitude, longitude } = currentLocation;
    const params = new URLSearchParams({
        categories: geoapifyCategory,
        filter: `circle:${longitude},${latitude},3000`,
        limit: '30',
        apiKey: geoapifyApiKey
    });
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    statusMessage.textContent = `Finding nearby ${category} places...`;
    placesList.textContent = '';

    try {
        const response = await fetch(
            `https://api.geoapify.com/v2/places?${params}`,
            { signal: controller.signal }
        );
        if (!response.ok) throw new Error(`Geoapify returned ${response.status}`);

        const data = await response.json();
        const places = data.features || [];
        const placeCount = places.length;
        statusMessage.textContent = placeCount
            ? `Found ${placeCount} nearby ${category} places.`
            : `No nearby ${category} places found.`;
        renderPlaceCards(places, category);
    } catch (error) {
        placesList.textContent = '';
        statusMessage.textContent = 'Places could not be loaded. Please try again.';
    } finally {
        clearTimeout(timeoutId);
    }
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

categoryButtons.forEach((button) => {
    button.addEventListener('click', () => fetchNearbyPlaces(button.dataset.category));
});
