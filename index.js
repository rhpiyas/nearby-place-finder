import { getCurrentLocation, setupLocation } from './location.js';
import { fetchNearbyPlaces as requestNearbyPlaces } from './place.js';

const statusMessage = document.querySelector('#status-message');
const placesList = document.querySelector('#places-list');
const categoryButtons = document.querySelectorAll('[data-category]');
const radiusButtons = document.querySelectorAll('[data-radius]');

let selectedRadiusKm = 3;
let selectedCategory = null;

function getPlaceCoordinates(place) {
    const properties = place.properties || {};

    return {
        latitude: properties.lat ?? place.lat ?? place.center?.lat,
        longitude: properties.lon ?? place.lon ?? place.center?.lon
    };
}

function calculateDistanceKm(firstLocation, secondLocation) {
    const earthRadiusKm = 6371;
    const latitudeDifference = (secondLocation.latitude - firstLocation.latitude)
        * Math.PI / 180;
    const longitudeDifference = (secondLocation.longitude - firstLocation.longitude)
        * Math.PI / 180;
    const firstLatitude = firstLocation.latitude * Math.PI / 180;
    const secondLatitude = secondLocation.latitude * Math.PI / 180;
    const haversine = Math.sin(latitudeDifference / 2) ** 2
        + Math.cos(firstLatitude)
        * Math.cos(secondLatitude)
        * Math.sin(longitudeDifference / 2) ** 2;
    const centralAngle = 2 * Math.atan2(
        Math.sqrt(haversine),
        Math.sqrt(1 - haversine)
    );

    return earthRadiusKm * centralAngle;
}

function sortPlacesByDistance(places, userLocation) {
    return places.slice().sort((firstPlace, secondPlace) => {
        const firstCoordinates = getPlaceCoordinates(firstPlace);
        const secondCoordinates = getPlaceCoordinates(secondPlace);
        const firstHasCoordinates = Number.isFinite(firstCoordinates.latitude)
            && Number.isFinite(firstCoordinates.longitude);
        const secondHasCoordinates = Number.isFinite(secondCoordinates.latitude)
            && Number.isFinite(secondCoordinates.longitude);

        if (!firstHasCoordinates) return 1;
        if (!secondHasCoordinates) return -1;

        return calculateDistanceKm(userLocation, firstCoordinates)
            - calculateDistanceKm(userLocation, secondCoordinates);
    });
}

function createPlaceCard(place, category, userLocation) {
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

    if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
        const distanceText = document.createElement('p');
        distanceText.className = 'place-distance';
        distanceText.textContent = `Approximately ${calculateDistanceKm(userLocation, {
            latitude,
            longitude
        }).toFixed(1)} km away`;
        card.append(distanceText);
    }

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

function renderPlaceCards(places, category, userLocation) {
    placesList.replaceChildren();

    const fragment = document.createDocumentFragment();
    sortPlacesByDistance(places, userLocation).slice(0, 30).forEach((place) => {
        fragment.append(createPlaceCard(place, category, userLocation));
    });
    placesList.append(fragment);
}

async function fetchNearbyPlaces(category) {
    const currentLocation = getCurrentLocation();
    if (!currentLocation) {
        statusMessage.textContent = 'Allow location access before choosing a category.';
        return;
    }

    statusMessage.textContent = `Finding nearby ${category} places within ${selectedRadiusKm} km...`;
    placesList.textContent = '';

    try {
        const places = await requestNearbyPlaces(category, currentLocation, selectedRadiusKm);
        const placeCount = places.length;
        statusMessage.textContent = placeCount
            ? `Found ${placeCount} nearby ${category} places within ${selectedRadiusKm} km.`
            : `No nearby ${category} places found within ${selectedRadiusKm} km.`;
        renderPlaceCards(places, category, currentLocation);
    } catch (error) {
        placesList.textContent = '';
        statusMessage.textContent = 'Places could not be loaded. Please try again.';
    }
}

setupLocation(statusMessage);

radiusButtons.forEach((button) => {
    button.addEventListener('click', () => {
        selectedRadiusKm = Number(button.dataset.radius);
        radiusButtons.forEach((radiusButton) => {
            radiusButton.setAttribute(
                'aria-pressed',
                String(radiusButton === button)
            );
        });

        if (selectedCategory) fetchNearbyPlaces(selectedCategory);
    });
});

categoryButtons.forEach((button) => {
    button.addEventListener('click', () => {
        selectedCategory = button.dataset.category;
        categoryButtons.forEach((categoryButton) => {
            categoryButton.setAttribute(
                'aria-pressed',
                String(categoryButton === button)
            );
        });
        fetchNearbyPlaces(selectedCategory);
    });
});
