let map;
let userMarker;
const placeMarkers = new Map();

export function setupMap() {
    map = L.map('map').setView([23.8103, 90.4125], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19
    }).addTo(map);
}

export function refreshMapSize() {
    map?.invalidateSize();
}

export function showUserLocation(location) {
    const coordinates = [location.latitude, location.longitude];

    if (userMarker) userMarker.remove();
    userMarker = L.marker(coordinates)
        .addTo(map)
        .bindPopup('Your current location');
    map.setView(coordinates, 14);
}

export function showPlaces(places, userLocation, getPlaceCoordinates) {
    placeMarkers.forEach((marker) => marker.remove());
    placeMarkers.clear();

    places.forEach((place) => {
        const { latitude, longitude } = getPlaceCoordinates(place);
        if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return;

        const properties = place.properties || {};
        const marker = L.marker([latitude, longitude])
            .addTo(map)
            .bindPopup(properties.name || 'Unnamed place');
        placeMarkers.set(place, marker);
    });

    if (userLocation) showUserLocation(userLocation);
}

export function focusPlace(place) {
    const marker = placeMarkers.get(place);
    if (!marker) return;

    map.setView(marker.getLatLng(), 17);
    marker.openPopup();
}
