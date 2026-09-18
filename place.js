const geoapifyApiKey = '86e57720c76d42ada8cd2d13b7a76006';

const categoryMap = {
    restaurant: 'catering.restaurant',
    cafe: 'catering.cafe',
    hospital: 'healthcare.hospital',
    pharmacy: 'healthcare.pharmacy',
    hotel: 'accommodation.hotel',
    schoolCollege: 'education.school,education.college',
    university: 'education.university',
    atm: 'service.financial.atm',
    supermarket: 'commercial.supermarket'
};

const searchKeywordMap = [
    { keywords: ['restaurant', 'restaurants', 'food', 'pizza'], category: 'restaurant' },
    { keywords: ['cafe', 'cafes', 'coffee'], category: 'cafe' },
    { keywords: ['hospital', 'hospitals'], category: 'hospital' },
    { keywords: ['pharmacy', 'pharmacies', 'medicine'], category: 'pharmacy' },
    { keywords: ['hotel', 'hotels'], category: 'hotel' },
    { keywords: ['school', 'college'], category: 'schoolCollege' },
    { keywords: ['university', 'universities'], category: 'university' },
    { keywords: ['atm', 'cash'], category: 'atm' },
    { keywords: ['supermarket', 'supermarkets', 'grocery'], category: 'supermarket' }
];

export function getCategoryFromSearchTerm(searchTerm) {
    const normalizedTerm = searchTerm.trim().toLowerCase();
    const match = searchKeywordMap.find(({ keywords }) => (
        keywords.some((keyword) => normalizedTerm.includes(keyword))
    ));

    return match?.category || null;
}

export async function fetchNearbyPlaces(category, location, radiusKm) {
    const geoapifyCategory = categoryMap[category];
    if (!geoapifyCategory) {
        throw new Error(`Unsupported category: ${category}`);
    }

    const { latitude, longitude } = location;
    const params = new URLSearchParams({
        categories: geoapifyCategory,
        filter: `circle:${longitude},${latitude},${radiusKm * 1000}`,
        limit: '30',
        apiKey: geoapifyApiKey
    });
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
        const response = await fetch(
            `https://api.geoapify.com/v2/places?${params}`,
            { signal: controller.signal }
        );
        if (!response.ok) throw new Error(`Geoapify returned ${response.status}`);

        const data = await response.json();
        return data.features || [];
    } finally {
        clearTimeout(timeoutId);
    }
}
