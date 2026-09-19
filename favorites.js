const storageKey = 'amarpashe-favorites';
const legacyStorageKey = 'ashepashe-favorites';

function getPlaceKey(place) {
    const properties = place.properties || {};
    const coordinates = [properties.lat, properties.lon]
        .filter((coordinate) => coordinate !== undefined)
        .join(',');

    return properties.place_id
        || properties.datasource?.raw?.osm_id
        || `${properties.name || 'unnamed'}:${coordinates}`;
}

function readFavorites() {
    try {
        const savedFavorites = localStorage.getItem(storageKey);
        if (savedFavorites) return JSON.parse(savedFavorites);

        const legacyFavorites = localStorage.getItem(legacyStorageKey);
        if (!legacyFavorites) return [];

        const favorites = JSON.parse(legacyFavorites);
        localStorage.setItem(storageKey, JSON.stringify(favorites));
        return favorites;
    } catch (error) {
        return [];
    }
}

function writeFavorites(favorites) {
    localStorage.setItem(storageKey, JSON.stringify(favorites));
}

export function getFavorites() {
    return readFavorites();
}

export function isFavorite(place) {
    const placeKey = getPlaceKey(place);
    return readFavorites().some((favorite) => favorite.key === placeKey);
}

export function toggleFavorite(place, category) {
    const favorites = readFavorites();
    const placeKey = getPlaceKey(place);
    const favoriteIndex = favorites.findIndex((favorite) => favorite.key === placeKey);

    if (favoriteIndex >= 0) {
        favorites.splice(favoriteIndex, 1);
        writeFavorites(favorites);
        return false;
    }

    favorites.push({ key: placeKey, place, category });
    writeFavorites(favorites);
    return true;
}
