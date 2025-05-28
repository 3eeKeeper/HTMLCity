/**
 * Renderer class for the city builder game
 */
class Renderer {
    constructor(canvasId, city) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.city = city;
        
        // Camera/viewport settings
        this.offsetX = 0;
        this.offsetY = 0;
        this.dragging = false;
        this.lastMouseX = 0;
        this.lastMouseY = 0;
        
        // Hover state
        this.hoveredTile = { x: -1, y: -1 };
        
        // Resize canvas to fill container
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        
        // Set up event listeners
        this.setupEventListeners();
    }
    
    /**
     * Resize canvas to fill its container
     */
    resizeCanvas() {
        const container = this.canvas.parentElement;
        this.canvas.width = container.clientWidth;
        this.canvas.height = container.clientHeight;
        
        // Center the view
        if (this.offsetX === 0 && this.offsetY === 0) {
            this.centerView();
        }
        
        this.render();
    }
    
    /**
     * Center the view on the city
     */
    centerView() {
        const centerX = this.city.width / 2;
        const centerY = this.city.height / 2;
        const screenPos = isoToScreen(centerX, centerY);
        
        this.offsetX = this.canvas.width / 2 - screenPos.x;
        this.offsetY = this.canvas.height / 3; // Position city in upper part of the screen
    }
    
    /**
     * Set up mouse and touch event listeners
     */
    setupEventListeners() {
        // Mouse down event
        this.canvas.addEventListener('mousedown', (e) => {
            this.handleMouseDown(e.clientX, e.clientY);
        });
        
        // Touch start event
        this.canvas.addEventListener('touchstart', (e) => {
            if (e.touches.length === 1) {
                e.preventDefault();
                const touch = e.touches[0];
                this.handleMouseDown(touch.clientX, touch.clientY);
            }
        });
        
        // Mouse move event
        this.canvas.addEventListener('mousemove', (e) => {
            this.handleMouseMove(e.clientX, e.clientY);
        });
        
        // Touch move event
        this.canvas.addEventListener('touchmove', (e) => {
            if (e.touches.length === 1) {
                e.preventDefault();
                const touch = e.touches[0];
                this.handleMouseMove(touch.clientX, touch.clientY);
            }
        });
        
        // Mouse up event
        window.addEventListener('mouseup', () => {
            this.handleMouseUp();
        });
        
        // Touch end event
        window.addEventListener('touchend', () => {
            this.handleMouseUp();
        });
        
        // Mouse click event
        this.canvas.addEventListener('click', (e) => {
            this.handleClick(e.clientX, e.clientY);
        });
        
        // Touch tap event
        this.canvas.addEventListener('touchend', (e) => {
            if (e.changedTouches.length === 1 && !this.dragging) {
                e.preventDefault();
                const touch = e.changedTouches[0];
                this.handleClick(touch.clientX, touch.clientY);
            }
        });
    }
    
    /**
     * Handle mouse down or touch start
     */
    handleMouseDown(clientX, clientY) {
        const rect = this.canvas.getBoundingClientRect();
        const x = clientX - rect.left;
        const y = clientY - rect.top;
        
        this.dragging = true;
        this.lastMouseX = x;
        this.lastMouseY = y;
    }
    
    /**
     * Handle mouse move or touch move
     */
    handleMouseMove(clientX, clientY) {
        const rect = this.canvas.getBoundingClientRect();
        const x = clientX - rect.left;
        const y = clientY - rect.top;
        
        // Update the hovered tile
        const isoPos = screenToIso(x, y, this.offsetX, this.offsetY);
        if (isoPos.x >= 0 && isoPos.x < this.city.width && 
            isoPos.y >= 0 && isoPos.y < this.city.height) {
            this.hoveredTile = isoPos;
        } else {
            this.hoveredTile = { x: -1, y: -1 };
        }
        
        // Handle dragging (panning the view)
        if (this.dragging) {
            const dx = x - this.lastMouseX;
            const dy = y - this.lastMouseY;
            
            this.offsetX += dx;
            this.offsetY += dy;
            
            this.lastMouseX = x;
            this.lastMouseY = y;
            
            // Redraw the scene with the new offset
            this.render();
        } else {
            // Just redraw for hover effects
            this.render();
        }
    }
    
    /**
     * Handle mouse up or touch end
     */
    handleMouseUp() {
        this.dragging = false;
    }
    
    /**
     * Handle click or tap
     */
    handleClick(clientX, clientY) {
        const rect = this.canvas.getBoundingClientRect();
        const x = clientX - rect.left;
        const y = clientY - rect.top;
        
        const isoPos = screenToIso(x, y, this.offsetX, this.offsetY);
        
        // Check if the click is within the grid
        if (isoPos.x >= 0 && isoPos.x < this.city.width && 
            isoPos.y >= 0 && isoPos.y < this.city.height) {
            
            // If bulldozer mode is active, remove building
            if (this.city.bulldozerMode) {
                this.city.removeBuilding(isoPos.x, isoPos.y);
                this.render();
                return;
            }
            
            // If a building is selected, place it
            if (this.city.selectedBuilding) {
                const buildingType = this.city.selectedBuilding.type;
                const cost = this.city.selectedBuilding.cost;
                
                if (this.city.placeBuilding(isoPos.x, isoPos.y, buildingType, cost)) {
                    // Building placed successfully
                    this.render();
                }
            }
        }
    }
    
    /**
     * Render the city
     */
    render() {
        // Clear the canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Prepare cells for rendering (sort by position for correct overlap)
        const renderCells = [];
        for (let y = 0; y < this.city.height; y++) {
            for (let x = 0; x < this.city.width; x++) {
                const cell = this.city.getCell(x, y);
                renderCells.push(cell);
            }
        }
        
        // Sort cells for proper rendering (back to front)
        renderCells.sort((a, b) => {
            return (a.x + a.y) - (b.x + b.y);
        });
        
        // Render all cells
        for (const cell of renderCells) {
            // First, draw the base terrain (grass or water)
            let baseTileType = 'grass';
            if (cell.type === 'water') {
                baseTileType = 'water';
            }
            
            drawIsoTile(this.ctx, cell.x, cell.y, baseTileType, this.offsetX, this.offsetY);
            
            // Then, if it has a building, draw the building on top
            if (cell.occupied && cell.type !== 'grass' && cell.type !== 'water') {
                //drawBuilding(this.ctx, cell.x, cell.y, cell.type, this.offsetX, this.offsetY);
                drawBuildingPlaceholder(this.ctx, cell.x, cell.y, TILE_WIDTH, TILE_HEIGHT, cell.type, '#8e44ad');
            }
            
            // Draw hover effect if this is the hovered tile
            if (cell.x === this.hoveredTile.x && cell.y === this.hoveredTile.y) {
                this.drawHoverEffect(cell);
            }
        }
    }
    
    /**
     * Draw hover effect over a tile
     */
    drawHoverEffect(cell) {
        const screenPos = isoToScreen(cell.x, cell.y);
        screenPos.x += this.offsetX;
        screenPos.y += this.offsetY;
        
        // Draw a semi-transparent highlight over the tile
        this.ctx.beginPath();
        this.ctx.moveTo(screenPos.x, screenPos.y - TILE_HEIGHT / 2);
        this.ctx.lineTo(screenPos.x + TILE_WIDTH / 2, screenPos.y);
        this.ctx.lineTo(screenPos.x, screenPos.y + TILE_HEIGHT / 2);
        this.ctx.lineTo(screenPos.x - TILE_WIDTH / 2, screenPos.y);
        this.ctx.closePath();
        
        if (this.city.bulldozerMode) {
            // Red highlight for bulldozer mode
            this.ctx.fillStyle = 'rgba(231, 76, 60, 0.3)';
        } else if (this.city.selectedBuilding) {
            // Green highlight for building placement
            this.ctx.fillStyle = 'rgba(46, 204, 113, 0.3)';
        } else {
            // Blue highlight for normal hover
            this.ctx.fillStyle = 'rgba(52, 152, 219, 0.3)';
        }
        
        this.ctx.fill();
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
    }
}

// Add this function to draw buildings without images
function drawBuildingPlaceholder(ctx, x, y, width, height, buildingType, color) {
    // Draw building base
    ctx.fillStyle = color;
    ctx.fillRect(x, y, width, height);
    
    // Draw building outline
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, width, height);
    
    // Add building type indicator
    ctx.fillStyle = '#fff';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    const labels = {
        'residential_small': '🏠',
        'residential_medium': '🏢',
        'commercial_small': '🏪',
        'commercial_medium': '🏬',
        'industrial_small': '🏭',
        'industrial_medium': '🏭',
        'power_plant': '⚡',
        'water_plant': '💧',
        'park': '🌳',
        'police_station': '🚓'
    };
    
    ctx.fillText(labels[buildingType] || '🏗️', x + width/2, y + height/2);
}

// Update the image loading code to use placeholders if images fail
// ...existing code...