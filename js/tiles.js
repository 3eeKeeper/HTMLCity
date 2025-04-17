/**
 * Tile management for the city builder game
 */

// Isometric tile dimensions
const TILE_WIDTH = 64;
const TILE_HEIGHT = 32;

// Base64 encoded SVG images for different tile types
const TILE_IMAGES = {
    'grass': 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA2NCAzMiI+PHBhdGggZD0iTTMyLDAgTDY0LDE2IEwzMiwzMiBMMCwxNiBaIiBmaWxsPSIjMmVjYzcxIiBzdHJva2U9IiMyN2FlNjAiIHN0cm9rZS13aWR0aD0iMSIvPjwvc3ZnPg==',
    'water': 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA2NCAzMiI+PHBhdGggZD0iTTMyLDAgTDY0LDE2IEwzMiwzMiBMMCwxNiBaIiBmaWxsPSIjMzQ5OGRiIiBzdHJva2U9IiMyOTgwYjkiIHN0cm9rZS13aWR0aD0iMSIvPjxwYXRoIGQ9Ik0xNiwxNiBRMjQsMTIgMzIsMTYgUTQwLDIwIDQ4LDE2IiBmaWxsPSJub25lIiBzdHJva2U9IiNlY2YwZjEiIHN0cm9rZS13aWR0aD0iMSIgc3Ryb2tlLW9wYWNpdHk9IjAuNSIvPjwvc3ZnPg==',
    'empty': 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA2NCAzMiI+PHBhdGggZD0iTTMyLDAgTDY0LDE2IEwzMiwzMiBMMCwxNiBaIiBmaWxsPSIjYmRjM2M3IiBzdHJva2U9IiM5NWE1YTYiIHN0cm9rZS13aWR0aD0iMSIvPjwvc3ZnPg==',
    'road': 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA2NCAzMiI+PHBhdGggZD0iTTMyLDAgTDY0LDE2IEwzMiwzMiBMMCwxNiBaIiBmaWxsPSIjN2Y4YzhkIiBzdHJva2U9IiM2NjY2NjYiIHN0cm9rZS13aWR0aD0iMSIvPjxwYXRoIGQ9Ik0zMiw0IEwzMiwyOCIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtZGFzaGFycmF5PSI0LDQiLz48L3N2Zz4='
};

// Preload images
const IMAGES = {};
for (const [key, src] of Object.entries(TILE_IMAGES)) {
    IMAGES[key] = new Image();
    IMAGES[key].src = src;
}

// Tile types and their properties
const TILES = {
    'empty': {
        color: '#95a5a6',
        zIndex: 0
    },
    'grass': {
        color: '#2ecc71',
        zIndex: 0
    },
    'water': {
        color: '#3498db',
        zIndex: 0
    },
    'road': {
        color: '#7f8c8d',
        zIndex: 0
    }
};

/**
 * Convert isometric coordinates to screen coordinates
 */
function isoToScreen(x, y) {
    return {
        x: (x - y) * (TILE_WIDTH / 2),
        y: (x + y) * (TILE_HEIGHT / 2)
    };
}

/**
 * Convert screen coordinates to isometric grid coordinates
 */
function screenToIso(screenX, screenY, offsetX = 0, offsetY = 0) {
    // Adjust screen coordinates based on viewport offset
    screenX -= offsetX;
    screenY -= offsetY;
    
    // Convert to tile coordinates
    const tileX = Math.floor((screenY / (TILE_HEIGHT / 2) + screenX / (TILE_WIDTH / 2)) / 2);
    const tileY = Math.floor((screenY / (TILE_HEIGHT / 2) - screenX / (TILE_WIDTH / 2)) / 2);
    
    return { x: tileX, y: tileY };
}

/**
 * Draw an isometric tile
 */
function drawIsoTile(ctx, x, y, tileType, offsetX = 0, offsetY = 0) {
    const screenPos = isoToScreen(x, y);
    
    // Adjust for offset (camera position)
    screenPos.x += offsetX;
    screenPos.y += offsetY;
    
    // Determine the image to use
    const image = IMAGES[tileType] || IMAGES['empty'];
    
    // Draw the image centered at the tile position
    ctx.drawImage(
        image,
        screenPos.x - TILE_WIDTH / 2,
        screenPos.y - TILE_HEIGHT / 2,
        TILE_WIDTH,
        TILE_HEIGHT
    );
}