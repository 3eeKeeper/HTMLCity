# HTMLCity Setup Guide

This document provides instructions for setting up the HTMLCity multiplayer city builder game.

## Prerequisites

Before you begin, ensure you have the following installed:

- [Node.js](https://nodejs.org/) (v14 or newer)
- [MongoDB](https://www.mongodb.com/try/download/community) (for user accounts and game persistence)
- [Git](https://git-scm.com/) (optional, for version control)

## Installation

1. Clone or download this repository
   ```
   git clone https://github.com/your-username/htmlcity.git
   cd htmlcity
   ```

2. Install dependencies
   ```
   npm install
   ```

3. Create environment variables
   - Copy the `.env.example` file to `.env` (or create it if it doesn't exist)
   - Update the variables as needed, particularly the JWT and session secrets

4. Make sure MongoDB is running
   ```
   # On most systems:
   sudo service mongod start
   # Or
   sudo systemctl start mongod
   ```

## Running the Game

### Development Mode

To start the game in development mode with automatic reloading:

```
npm run dev
```

This will start the server on http://localhost:3000 (or the port you specified in the .env file).

### Production Mode

For production deployment:

1. Build the project
   ```
   npm run build
   ```

2. Start the server
   ```
   npm start
   ```

## Game Assets

The game uses various graphical assets for buildings, terrain, and UI elements:

- Building images should be placed in `/assets/buildings/`
- Terrain tiles should be placed in `/assets/tiles/`
- UI elements should be placed in `/assets/ui/`

If you want to add your own assets, you can place them in these directories and update the code to reference them.

## Customizing the Game

### Adding New Building Types

To add new building types, modify the `js/buildings.js` file:

1. Add a new building definition to the `BUILDINGS` object
2. Add the corresponding image to the `/assets/buildings/` directory
3. Update the UI in `index.html` to show the new building type

### Changing Map Size

By default, the game uses a 20x20 grid. You can change this by:

1. Updating the `.env` file's `DEFAULT_GRID_SIZE` setting
2. The city constructor in `js/city.js` will use this value

## Multiplayer Features

HTMLCity supports the following multiplayer features:

- User accounts with authentication
- Persistent cities stored in MongoDB
- Real-time multiplayer with other players
- Trading resources with other players
- Leaderboards and city rankings

## Development Notes

- The server uses Express.js for the API endpoints
- Socket.IO powers the real-time multiplayer functionality
- MongoDB stores user accounts, cities, and trading data
- The frontend uses pure HTML5, CSS, and JavaScript with Canvas for rendering

## Troubleshooting

- If you encounter a "MongoDB connection error," make sure MongoDB is running on your system
- If WebSocket connections fail, check if your firewall allows connections on the server port
- For any other issues, check the server logs for detailed error messages

## License

This project is available under the MIT License. See the LICENSE file for details.