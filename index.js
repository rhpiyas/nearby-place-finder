import { getCurrentLocation, setupLocation } from './location.js';
import { fetchNearbyPlaces as requestNearbyPlaces } from './place.js';

const statusMessage = document.querySelector('#status-message');
const placesList = document.querySelector('#places-list');
const categoryButtons = document.querySelectorAll('[data-category]');

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
    const currentLocation = getCurrentLocation();
    if (!currentLocation) {
        statusMessage.textContent = 'Allow location access before choosing a category.';
        return;
    }

    statusMessage.textContent = `Finding nearby ${category} places...`;
    placesList.textContent = '';

    try {
        const places = await requestNearbyPlaces(category, currentLocation);
        const placeCount = places.length;
        statusMessage.textContent = placeCount
            ? `Found ${placeCount} nearby ${category} places.`
            : `No nearby ${category} places found.`;
        renderPlaceCards(places, category);
    } catch (error) {
        placesList.textContent = '';
        statusMessage.textContent = 'Places could not be loaded. Please try again.';
    }
}

setupLocation(statusMessage);

categoryButtons.forEach((button) => {
    button.addEventListener('click', () => fetchNearbyPlaces(button.dataset.category));
});
