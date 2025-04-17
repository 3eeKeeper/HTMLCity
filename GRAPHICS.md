# HTMLCity Graphics Resources

This document provides information on graphics resources for HTMLCity and how to implement them in the game.

## Graphics Assets Sources

Here are some recommended sources for free, high-quality isometric game assets that can be used with HTMLCity:

1. **Kenney's Game Assets** (https://kenney.nl/assets)
   - Isometric City Set: Contains over 150 isometric city tiles
   - License: CC0 (Public Domain)
   - Format: PNG with transparency
   - Recommended for: Base terrain, simple buildings, and roads

2. **Reiner's Tilesets** (https://www.reinerstilesets.de/graphics/isometric-citys/)
   - Large collection of isometric buildings and terrain
   - License: Free for commercial and non-commercial use with attribution
   - Format: BMP and PNG
   - Recommended for: Detailed buildings and decorative elements

3. **OpenGameArt.org**
   - Various isometric city assets by different artists
   - License: Varies (check individual assets, but many are CC-BY or CC0)
   - Format: Mostly PNG
   - Recommended for: Supplementary and specialty buildings

4. **Game-Icons.net**
   - Icons for UI elements
   - License: CC BY 3.0
   - Format: SVG (can be converted to PNG)
   - Recommended for: UI elements and menu icons

5. **Craftpix.net Free Game Assets**
   - Some free isometric tile sets available
   - License: Free for personal and commercial use
   - Format: PNG
   - Recommended for: High-quality buildings and terrain

## Asset Integration Guide

### Preparing Assets

1. **Size Consistency**: All building assets should maintain consistent proportions:
   - Base tile size: 64x32 pixels for standard isometric tiles
   - Building heights should be proportional to their importance/size in the game

2. **File Format**: 
   - PNG is preferred for all assets (with transparency)
   - SVG can be used for UI elements
   - All filenames should use lowercase and underscores (e.g., `residential_small.png`)

3. **File Organization**:
   - Place all building assets in `/assets/buildings/`
   - Place terrain tiles in `/assets/tiles/`
   - Place UI elements in `/assets/ui/`

### Adding New Building Graphics

To add a new building graphic:

1. Create or obtain an isometric building image in PNG format
2. Place the image in `/assets/buildings/` with an appropriate name (e.g., `residential_large.png`)
3. In `js/buildings.js`, update the building definition to reference the image:

```javascript
'residential_large': {
    name: 'Luxury Condo',
    category: 'residential',
    // ... other properties ...
    texturePath: 'assets/buildings/residential_large.png'
}
```

### Adding New Terrain Graphics

To add new terrain types:

1. Create or obtain an isometric terrain tile in PNG format
2. Place the image in `/assets/tiles/` (e.g., `desert.png`)
3. In `js/tiles.js`, update the tile definitions to include the new terrain type

### Using SVG Fallbacks

The game uses embedded SVG data as fallbacks if PNG assets fail to load. To create a new SVG fallback:

1. Create an SVG representation of your asset
2. Convert it to a Base64-encoded data URL
3. Add it to the `DEFAULT_BUILDING_SVG` object in `js/buildings.js`

## Recommended Asset Dimensions

- **Terrain Tiles**: 64x32 pixels (base size for isometric tiles)
- **Small Buildings**: 64x64 pixels 
- **Medium Buildings**: 64x96 pixels
- **Large Buildings**: 64x128 pixels
- **UI Icons**: 32x32 pixels

## Creating Custom Graphics

If you want to create your own isometric assets:

1. Use a 2:1 ratio for the base (width:height)
2. Use a 30-degree isometric projection
3. Create a consistent light source (typically top-left)
4. Use a consistent color palette across all assets
5. Export with transparency as PNG

## Asset Conversion Tools

- **Sprite Sheet Packer**: Create sprite sheets from individual images
- **ImageMagick**: Batch processing of images (resizing, converting)
- **Inkscape**: Create and edit SVG graphics
- **GIMP/Photoshop**: Edit and prepare PNG assets

## Legal Considerations

When using graphics from various sources:

1. Always check the license of assets you're using
2. Give proper attribution when required
3. Keep a record of where each asset came from
4. Prefer assets with permissive licenses (CC0, CC-BY) for open source projects