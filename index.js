import { getCurrentLocation, setupLocation } from './location.js';
import {
    fetchNearbyPlaces as requestNearbyPlaces,
    getCategoryFromSearchTerm
} from './place.js';

const statusMessage = document.querySelector('#status-message');
const placesList = document.querySelector('#places-list');
const searchForm = document.querySelector('#place-search-form');
const searchInput = document.querySelector('#place-search');
const categoryButtons = document.querySelectorAll('[data-category]');
const radiusButtons = document.querySelectorAll('[data-radius]');

let selectedRadiusKm = 3;
let selectedCategory = null;

function selectCategory(category) {
    selectedCategory = category;
    categoryButtons.forEach((categoryButton) => {
        categoryButton.setAttribute(
            'aria-pressed',
            String(categoryButton.dataset.category === category)
        );
    });
}

function clearSearchResults() {
    selectedCategory = null;
    placesList.replaceChildren();
    categoryButtons.forEach((categoryButton) => {
        categoryButton.setAttribute('aria-pressed', 'false');
    });
}

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

function isToday(dayExpression, today) {
    const days = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
    return dayExpression.split(',').some((dayRange) => {
        const [startDay, endDay] = dayRange.split('-');
        const startIndex = days.indexOf(startDay);
        const endIndex = days.indexOf(endDay || startDay);
        const todayIndex = days.indexOf(today);

        if (startIndex === -1 || endIndex === -1) return false;
        return startIndex <= endIndex
            ? todayIndex >= startIndex && todayIndex <= endIndex
            : todayIndex >= startIndex || todayIndex <= endIndex;
    });
}

function getOpeningStatus(openingHours) {
    if (!openingHours) return 'Opening information not found';
    if (openingHours.trim() === '24/7') return 'Open now';

    const days = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
    const today = days[new Date().getDay()];
    const currentMinutes = new Date().getHours() * 60 + new Date().getMinutes();
    const todaySchedule = openingHours.split(';').find((schedule) => {
        const parts = schedule.trim().split(/\s+/, 2);
        return parts.length === 2 && isToday(parts[0], today);
    });

    if (!todaySchedule) return 'Closed now';

    const timeExpression = todaySchedule.trim().split(/\s+/, 2)[1];
    if (/^(off|closed)$/i.test(timeExpression)) return 'Closed now';

    const isOpen = timeExpression.split(',').some((timeRange) => {
        const [start, end] = timeRange.trim().split('-');
        const startParts = start?.split(':').map(Number);
        const endParts = end?.split(':').map(Number);
        if (startParts?.length !== 2 || endParts?.length !== 2) return false;

        const startMinutes = startParts[0] * 60 + startParts[1];
        const endMinutes = endParts[0] * 60 + endParts[1];
        return startMinutes <= endMinutes
            ? currentMinutes >= startMinutes && currentMinutes <= endMinutes
            : currentMinutes >= startMinutes || currentMinutes <= endMinutes;
    });

    return isOpen ? 'Open now' : 'Closed now';
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
    name.className = 'place-name';
    name.textContent = properties.name || 'Unnamed place';

    const type = document.createElement('span');
    type.className = 'place-category';
    type.textContent = category;

    const addressText = document.createElement('p');
    addressText.className = 'place-detail place-address';
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

    const ratingText = document.createElement('p');
    ratingText.className = 'place-detail place-rating';
    ratingText.textContent = properties.rating !== undefined
        ? `Rating: ${properties.rating}`
        : 'Rating not found';
    card.append(ratingText);

    const openingStatus = getOpeningStatus(properties.opening_hours);
    const openingStatusText = document.createElement('p');
    openingStatusText.className = 'place-detail place-opening-status';
    const statusDot = document.createElement('span');
    statusDot.className = 'opening-status-dot';
    statusDot.classList.add(
        openingStatus === 'Open now'
            ? 'is-open'
            : openingStatus === 'Closed now'
                ? 'is-closed'
                : 'is-unknown'
    );
    statusDot.setAttribute('aria-hidden', 'true');
    openingStatusText.append(statusDot, document.createTextNode(openingStatus));
    card.append(openingStatusText);

    const openingHoursText = document.createElement('p');
    openingHoursText.className = 'place-detail place-hours';
    openingHoursText.textContent = `Hours: ${properties.opening_hours || 'Information not found'}`;
    card.append(openingHoursText);

    if (latitude !== undefined && longitude !== undefined) {
        const mapLink = document.createElement('a');
        mapLink.className = 'place-map-link';
        mapLink.href = `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=18/${latitude}/${longitude}`;
        mapLink.target = '_blank';
        mapLink.rel = 'noreferrer';
        mapLink.textContent = 'View on map';
        card.append(mapLink);
    }

    return card;
}

function syncCardRowHeights() {
    const rowSelectors = [
        ['name', '.place-name'],
        ['category', '.place-category'],
        ['address', '.place-address'],
        ['distance', '.place-distance'],
        ['rating', '.place-rating'],
        ['status', '.place-opening-status'],
        ['hours', '.place-hours'],
        ['map', '.place-map-link']
    ];

    rowSelectors.forEach(([rowName, selector]) => {
        const rowHeight = [...placesList.querySelectorAll(selector)]
            .reduce((maximumHeight, element) => (
                Math.max(maximumHeight, element.scrollHeight)
            ), 0);
        placesList.style.setProperty(`--place-${rowName}-height`, `${rowHeight}px`);
    });
}

function renderPlaceCards(places, category, userLocation) {
    placesList.replaceChildren();

    const fragment = document.createDocumentFragment();
    sortPlacesByDistance(places, userLocation).slice(0, 30).forEach((place) => {
        fragment.append(createPlaceCard(place, category, userLocation));
    });
    placesList.append(fragment);
    requestAnimationFrame(syncCardRowHeights);
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

let resizeFrameId;
window.addEventListener('resize', () => {
    cancelAnimationFrame(resizeFrameId);
    resizeFrameId = requestAnimationFrame(syncCardRowHeights);
});

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
        selectCategory(button.dataset.category);
        fetchNearbyPlaces(selectedCategory);
    });
});

searchForm.addEventListener('submit', (event) => {
    event.preventDefault();

    const category = getCategoryFromSearchTerm(searchInput.value);
    if (!category) {
        clearSearchResults();
        const searchTerm = searchInput.value.trim();
        statusMessage.textContent = searchTerm
            ? `No category found for "${searchTerm}". Try pizza, coffee, pharmacy, or supermarket.`
            : 'Please enter a place or category to search.';
        return;
    }

    selectCategory(category);
    fetchNearbyPlaces(selectedCategory);
});
