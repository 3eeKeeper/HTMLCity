/**
 * Building types and their properties
 */

// Building types and their properties
const BUILDINGS = {
    // Residential buildings
    'residential_small': {
        name: 'Small House',
        category: 'residential',
        cost: 100,
        upkeep: 5,
        residents: 4,
        workers: 0,
        power: -1,
        water: -1,
        happiness: 1,
        description: 'A small house for a few residents',
        height: 1,
        texturePath: 'assets/buildings/residential_small.png'
    },
    'residential_medium': {
        name: 'Apartment Building',
        category: 'residential',
        cost: 1000,
        upkeep: 50,
        residents: 40,
        workers: 0,
        power: -10,
        water: -10,
        happiness: 0,
        description: 'An apartment building for many residents',
        height: 2,
        texturePath: 'assets/buildings/residential_medium.png'
    },
    'residential_large': {
        name: 'Luxury Condo',
        category: 'residential',
        cost: 5000,
        upkeep: 200,
        residents: 100,
        workers: 0,
        power: -30,
        water: -30,
        happiness: 5,
        description: 'Luxury condominiums for wealthy residents',
        height: 3,
        texturePath: 'assets/buildings/residential_large.png'
    },
    
    // Commercial buildings
    'commercial_small': {
        name: 'Small Shop',
        category: 'commercial',
        cost: 150,
        upkeep: 10,
        residents: 0,
        workers: 5,
        power: -2,
        water: -1,
        happiness: 1,
        description: 'A small shop providing jobs and services',
        height: 1,
        texturePath: 'assets/buildings/commercial_small.png'
    },
    'commercial_medium': {
        name: 'Shopping Center',
        category: 'commercial',
        cost: 1500,
        upkeep: 100,
        residents: 0,
        workers: 50,
        power: -20,
        water: -10,
        happiness: 2,
        description: 'A shopping center with many stores',
        height: 2,
        texturePath: 'assets/buildings/commercial_medium.png'
    },
    'commercial_large': {
        name: 'Office Building',
        category: 'commercial',
        cost: 7500,
        upkeep: 500,
        residents: 0,
        workers: 250,
        power: -50,
        water: -25,
        happiness: 0,
        description: 'A large office building providing many jobs',
        height: 3,
        texturePath: 'assets/buildings/commercial_large.png'
    },
    
    // Industrial buildings
    'industrial_small': {
        name: 'Small Factory',
        category: 'industrial',
        cost: 300,
        upkeep: 20,
        residents: 0,
        workers: 10,
        power: -5,
        water: -5,
        happiness: -2,
        description: 'A small factory providing jobs',
        height: 1,
        texturePath: 'assets/buildings/industrial_small.png'
    },
    'industrial_medium': {
        name: 'Factory',
        category: 'industrial',
        cost: 3000,
        upkeep: 200,
        residents: 0,
        workers: 100,
        power: -50,
        water: -25,
        happiness: -5,
        description: 'A factory providing many jobs',
        height: 2,
        texturePath: 'assets/buildings/industrial_medium.png'
    },
    'industrial_large': {
        name: 'Industrial Park',
        category: 'industrial',
        cost: 15000,
        upkeep: 800,
        residents: 0,
        workers: 500,
        power: -200,
        water: -100,
        happiness: -10,
        description: 'A large industrial complex with many factories',
        height: 2,
        texturePath: 'assets/buildings/industrial_large.png'
    },
    
    // Utility buildings
    'power_plant': {
        name: 'Power Plant',
        category: 'utility',
        cost: 5000,
        upkeep: 500,
        residents: 0,
        workers: 20,
        power: 1000,
        water: -50,
        happiness: -5,
        description: 'Generates power for your city',
        height: 2,
        texturePath: 'assets/buildings/power_plant.png'
    },
    'water_plant': {
        name: 'Water Treatment Plant',
        category: 'utility',
        cost: 3000,
        upkeep: 300,
        residents: 0,
        workers: 10,
        power: -20,
        water: 1000,
        happiness: 0,
        description: 'Provides water for your city',
        height: 2,
        texturePath: 'assets/buildings/water_plant.png'
    },
    'solar_plant': {
        name: 'Solar Power Plant',
        category: 'utility',
        cost: 10000,
        upkeep: 200,
        residents: 0,
        workers: 5,
        power: 500,
        water: 0,
        happiness: 5,
        description: 'Clean energy source with no pollution',
        height: 1,
        texturePath: 'assets/buildings/solar_plant.png'
    },
    
    // Special buildings
    'park': {
        name: 'Park',
        category: 'special',
        cost: 500,
        upkeep: 50,
        residents: 0,
        workers: 2,
        power: 0,
        water: -5,
        happiness: 10,
        description: 'A park that increases happiness',
        height: 0.5,
        texturePath: 'assets/buildings/park.png'
    },
    'police_station': {
        name: 'Police Station',
        category: 'special',
        cost: 1000,
        upkeep: 100,
        residents: 0,
        workers: 20,
        power: -5,
        water: -5,
        happiness: 5,
        description: 'Increases safety and happiness',
        height: 1,
        texturePath: 'assets/buildings/police_station.png'
    },
    'fire_station': {
        name: 'Fire Station',
        category: 'special',
        cost: 1000,
        upkeep: 100,
        residents: 0,
        workers: 20,
        power: -5,
        water: -10,
        happiness: 5,
        description: 'Protects city from fires',
        height: 1,
        texturePath: 'assets/buildings/fire_station.png'
    },
    'hospital': {
        name: 'Hospital',
        category: 'special',
        cost: 3000,
        upkeep: 300,
        residents: 0,
        workers: 50,
        power: -20,
        water: -20,
        happiness: 10,
        description: 'Provides healthcare and increases happiness',
        height: 2,
        texturePath: 'assets/buildings/hospital.png'
    },
    'school': {
        name: 'School',
        category: 'special',
        cost: 2000,
        upkeep: 200,
        residents: 0,
        workers: 30,
        power: -10,
        water: -10,
        happiness: 5,
        description: 'Educates residents and increases happiness',
        height: 1,
        texturePath: 'assets/buildings/school.png'
    },
    
    // Transportation
    'road': {
        name: 'Road',
        category: 'transportation',
        cost: 10,
        upkeep: 1,
        residents: 0,
        workers: 0,
        power: 0,
        water: 0,
        happiness: 0,
        description: 'Connects buildings',
        height: 0.1,
        texturePath: 'assets/buildings/road.png'
    },
    'bridge': {
        name: 'Bridge',
        category: 'transportation',
        cost: 1000,
        upkeep: 20,
        residents: 0,
        workers: 0,
        power: 0,
        water: 0,
        happiness: 0,
        description: 'Crosses over water',
        height: 0.2,
        texturePath: 'assets/buildings/bridge.png'
    },
    
    // Decorative
    'tree': {
        name: 'Tree',
        category: 'decorative',
        cost: 20,
        upkeep: 1,
        residents: 0,
        workers: 0,
        power: 0,
        water: -1,
        happiness: 1,
        description: 'A decorative tree that slightly increases happiness',
        height: 0.8,
        texturePath: 'assets/buildings/tree.png'
    },
    'fountain': {
        name: 'Fountain',
        category: 'decorative',
        cost: 200,
        upkeep: 5,
        residents: 0,
        workers: 0,
        power: -1,
        water: -5,
        happiness: 2,
        description: 'A decorative fountain that increases happiness',
        height: 0.5,
        texturePath: 'assets/buildings/fountain.png'
    }
};

// Default fallback images for each building category
const DEFAULT_BUILDING_SVG = {
    'residential': 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA2NCA2NCI+PHBhdGggZD0iTTMyLDAgTDY0LDE2IEwzMiwzMiBMMCwxNiBaIiBmaWxsPSIjMmVjYzcxIiBzdHJva2U9IiMyN2FlNjAiIHN0cm9rZS13aWR0aD0iMSIvPjxwYXRoIGQ9Ik0zMiw1IEw1MCwxNSBMMzIsMjUgTDE0LDE1IFoiIGZpbGw9IiNlNzRjM2MiIHN0cm9rZT0iI2MwMzkyYiIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9zdmc+',
    'commercial': 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA2NCA2NCI+PHBhdGggZD0iTTMyLDAgTDY0LDE2IEwzMiwzMiBMMCwxNiBaIiBmaWxsPSIjMzQ5OGRiIiBzdHJva2U9IiMyOTgwYjkiIHN0cm9rZS13aWR0aD0iMSIvPjxwYXRoIGQ9Ik0zMiw1IEw1MCwxNSBMMzIsMjUgTDE0LDE1IFoiIGZpbGw9IiNlY2YwZjEiIHN0cm9rZT0iI2JkYzNjNyIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9zdmc+',
    'industrial': 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA2NCA2NCI+PHBhdGggZD0iTTMyLDAgTDY0LDE2IEwzMiwzMiBMMCwxNiBaIiBmaWxsPSIjZTc0YzNjIiBzdHJva2U9IiNjMDM5MmIiIHN0cm9rZS13aWR0aD0iMSIvPjxwYXRoIGQ9Ik0zMiw1IEw1MCwxNSBMMzIsMjUgTDE0LDE1IFoiIGZpbGw9IiNlY2YwZjEiIHN0cm9rZT0iI2JkYzNjNyIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9zdmc+',
    'utility': 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA2NCA2NCI+PHBhdGggZD0iTTMyLDAgTDY0LDE2IEwzMiwzMiBMMCwxNiBaIiBmaWxsPSIjZjM5YzEyIiBzdHJva2U9IiNlNjc2MTEiIHN0cm9rZS13aWR0aD0iMSIvPjxwYXRoIGQ9Ik0zMiw1IEw1MCwxNSBMMzIsMjUgTDE0LDE1IFoiIGZpbGw9IiM3ZjhjOGQiIHN0cm9rZT0iIzk1YTVhNiIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9zdmc+',
    'special': 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA2NCA2NCI+PHBhdGggZD0iTTMyLDAgTDY0LDE2IEwzMiwzMiBMMCwxNiBaIiBmaWxsPSIjMzQ5OGRiIiBzdHJva2U9IiMyOTgwYjkiIHN0cm9rZS13aWR0aD0iMSIvPjxwYXRoIGQ9Ik0zMiw1IEw1MCwxNSBMMzIsMjUgTDE0LDE1IFoiIGZpbGw9IiNlY2YwZjEiIHN0cm9rZT0iI2JkYzNjNyIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9zdmc+',
    'transportation': 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA2NCAzMiI+PHBhdGggZD0iTTMyLDAgTDY0LDE2IEwzMiwzMiBMMCwxNiBaIiBmaWxsPSIjN2Y4YzhkIiBzdHJva2U9IiM2NjY2NjYiIHN0cm9rZS13aWR0aD0iMSIvPjxwYXRoIGQ9Ik0zMiw0IEwzMiwyOCIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtZGFzaGFycmF5PSI0LDQiLz48L3N2Zz4=',
    'decorative': 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA2NCA2NCI+PHBhdGggZD0iTTMyLDAgTDY0LDE2IEwzMiwzMiBMMCwxNiBaIiBmaWxsPSIjMjdhZTYwIiBzdHJva2U9IiMyN2FlNjAiIHN0cm9rZS13aWR0aD0iMSIvPjxjaXJjbGUgY3g9IjMyIiBjeT0iMTYiIHI9IjgiIGZpbGw9IiMyZWNjNzEiIHN0cm9rZT0iIzI3YWU2MCIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9zdmc+'
};

// Building Image cache
const BUILDING_IMGS = {};

// Preload building images
function preloadBuildingImages() {
    // Preload texture images
    for (const [key, building] of Object.entries(BUILDINGS)) {
        if (building.texturePath) {
            BUILDING_IMGS[key] = new Image();
            BUILDING_IMGS[key].src = building.texturePath;
            
            // Use default SVG as fallback
            BUILDING_IMGS[key].onerror = function() {
                // If texture fails to load, use default SVG for the category
                const defaultSVG = DEFAULT_BUILDING_SVG[building.category];
                if (defaultSVG) {
                    this.src = defaultSVG;
                }
            };
        }
    }
    
    // Preload default SVGs
    for (const [category, svg] of Object.entries(DEFAULT_BUILDING_SVG)) {
        const img = new Image();
        img.src = svg;
        BUILDING_IMGS[`default_${category}`] = img;
    }
}

// Preload the building images when the script loads
preloadBuildingImages();

/**
 * Get building information by building type
 */
function getBuildingInfo(buildingType) {
    return BUILDINGS[buildingType] || null;
}

/**
 * Get all buildings in a specific category
 */
function getBuildingsByCategory(category) {
    const result = [];
    
    for (const [key, building] of Object.entries(BUILDINGS)) {
        if (building.category === category) {
            result.push({
                id: key,
                ...building
            });
        }
    }
    
    return result;
}

/**
 * Get all building categories
 */
function getBuildingCategories() {
    const categories = new Set();
    
    for (const building of Object.values(BUILDINGS)) {
        categories.add(building.category);
    }
    
    return Array.from(categories);
}

/**
 * Draw a building on the isometric grid
 */
function drawBuilding(ctx, x, y, type, offsetX = 0, offsetY = 0) {
    if (type === 'empty' || type === 'grass' || type === 'water') return;
    
    const screenPos = isoToScreen(x, y);
    
    // Adjust for offset (camera position)
    screenPos.x += offsetX;
    screenPos.y += offsetY;
    
    // Get building info
    const buildingInfo = getBuildingInfo(type);
    if (!buildingInfo) return;
    
    // Determine the image to use
    let image = BUILDING_IMGS[type];
    if (!image || !image.complete) {
        // Try to use category default if specific image isn't available
        image = BUILDING_IMGS[`default_${buildingInfo.category}`];
    }
    
    // Calculate building height based on the building type
    const height = (buildingInfo.height || 1) * TILE_HEIGHT;
    
    if (image && image.complete) {
        // Draw the building image
        ctx.drawImage(
            image,
            screenPos.x - TILE_WIDTH / 2,
            screenPos.y - TILE_HEIGHT / 2 - height,
            TILE_WIDTH,
            TILE_HEIGHT + height
        );
    } else {
        // Fallback to colored rectangle if image is not available
        const color = type.includes('residential') ? '#2ecc71' : 
                     type.includes('commercial') ? '#3498db' : 
                     type.includes('industrial') ? '#e74c3c' : 
                     type.includes('power') ? '#f39c12' : 
                     type.includes('water') ? '#3498db' : 
                     type.includes('park') || type.includes('tree') ? '#27ae60' : 
                     type.includes('road') || type.includes('bridge') ? '#7f8c8d' : '#95a5a6';
        
        // Draw building as a 3D block
        ctx.beginPath();
        ctx.moveTo(screenPos.x, screenPos.y - height);
        ctx.lineTo(screenPos.x + TILE_WIDTH / 2, screenPos.y - height + TILE_HEIGHT / 2);
        ctx.lineTo(screenPos.x, screenPos.y + TILE_HEIGHT - height);
        ctx.lineTo(screenPos.x - TILE_WIDTH / 2, screenPos.y - height + TILE_HEIGHT / 2);
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.lineWidth = 1;
        ctx.stroke();
    }
}