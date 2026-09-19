# Ashe Pashe - Nearby Place Finder

A lightweight browser-based app for discovering nearby places using the user's current location, category search, map visualization, and saved favorites. The app is built with plain HTML, CSS, and JavaScript, and it uses Geoapify for place data and Leaflet + OpenStreetMap for the map.

## Overview

Ashe Pashe helps users find useful places around them such as restaurants, cafes, hospitals, pharmacies, hotels, universities, ATMs, and supermarkets. It uses browser geolocation to detect the user's position, searches nearby places within a selected radius, sorts results by distance/rating/status, and displays them in an easy-to-scan list with details like address, rating, opening hours, and map links.

## Features

- Detect user location with the browser geolocation API
- Search for nearby places by category or keyword
- Filter results by radius: 1 km, 3 km, 5 km, 10 km
- Sort results by distance, rating, or open/closed status
- Show place cards with:
  - name
  - category
  - address
  - distance from user
  - rating
  - opening status
  - opening hours
  - OpenStreetMap link
- View places on an interactive Leaflet map
- Save favorite places to localStorage
- Toggle favorites list without leaving the app
- Responsive interface for desktop and smaller screens

## Tech Stack

- HTML5
- CSS3
- JavaScript (ES modules)
- Leaflet.js
- OpenStreetMap tiles
- Geoapify Places API
- Browser localStorage

## Project Structure

- `index.html` — app structure and UI
- `index.js` — main app logic, filtering, rendering, interactions
- `location.js` — geolocation handling and current location lookup
- `place.js` — Geoapify API calls and category matching
- `map.js` — map setup and marker rendering
- `favorites.js` — favorite place persistence
- `searchKeywords.js` — keyword-to-category mappings for search
- `style.css` — layout and design
- `assets/` — project assets and static resources

## How It Works

1. The user clicks the location button to allow access to their current location.
2. The app resolves a rough place name from the coordinates (city/town/area).
3. The user selects a category or enters a search term.
4. The app matches the term to a predefined category and requests nearby places from the Geoapify API.
5. Results are sorted and rendered on screen.
6. The map shows the user marker and place markers.
7. Favorite places are saved in the browser and can be revisited later.

## Supported Categories

- Restaurants
- Cafes
- Hospitals
- Pharmacies
- Hotels
- Schools & Colleges
- Universities
- ATMs
- Supermarkets

## Local Setup

Because this is a static web app, you can run it with a simple local web server.

### Option 1: Python

```bash
cd /path/to/nearby-place-finder
python3 -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

### Option 2: VS Code Live Server

Open the project in VS Code and launch it with a local static server extension such as Live Server.

## API Configuration

This project uses the Geoapify Places API in `place.js`.

```js
const geoapifyApiKey = '86e57720c76d42ada8cd2d13b7a76006';
```

If you want to use your own API key, replace the value in `place.js` with your personal key.

## Notes

- The app depends on browser geolocation permission.
- Without location access, the user cannot search for nearby places.
- Some results may not include complete data such as ratings or opening hours depending on the provider data.
- The app stores favorites in the browser using `localStorage`, so favorites persist on the same browser/device.

## License

This project is for personal and educational use unless otherwise specified by the author.

## Author

Rakib Hasan Piyas  
Department of Software Engineering  
Daffodil International University