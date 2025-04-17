# HTMLCity - Web-Based City Builder

A browser-based city builder game. Build and manage your city while balancing resources and challenges in both standalone and multiplayer modes.

## Standalone Version

The standalone version runs completely in your browser with no server dependencies!

### Standalone Features

- **Seasons**: Experience spring, summer, fall, and winter with unique gameplay effects
- **Natural Disasters**: Face fires, floods, earthquakes, and tornados
- **Achievements**: Unlock achievements as your city grows and thrives
- **City Growth**: Watch your population grow based on happiness and resources
- **Isometric City Building**: Rich, detailed graphics with various building types
- **Resource Management**: Balance money, population, happiness, power, water, and more
- **Advanced Game Mechanics**: Complex simulation with jobs, residential, commercial and industrial zones

### Running the Standalone Version

1. Simply open `standalone.html` in any modern web browser
2. No installation or server setup required!
3. Your progress is saved to your browser's local storage

## Multiplayer Version (Server Required)

The full multiplayer version requires setting up the server environment.

### Multiplayer Features

- **Real-time Multiplayer**: Build cities in a shared world with other players
- **User Accounts**: Create profiles, save progress, and compete on leaderboards
- **Trading System**: Exchange resources with other players
- **Dynamic Economy**: Prices fluctuate based on supply and demand
- **All Standalone Features**: Includes all features from the standalone version

### Playing Multiplayer

1. Set up the server (see Development section)
2. Create an account or login
3. Start a new city or continue with your existing one
4. Build and manage your city's infrastructure
5. Trade with other players to gain advantages
6. Expand your influence and climb the leaderboards

## Building Types

- **Residential**: Various housing types from small houses to luxury condos
- **Commercial**: Shops, malls, offices and entertainment venues
- **Industrial**: Factories, warehouses, and specialized industry
- **Utilities**: Power plants, water treatment, waste management
- **Special**: Parks, schools, hospitals, fire stations, police stations
- **Transportation**: Roads, bridges, public transit
- **Decorative**: Trees, fountains, statues, and other decorations

## Technical Details

- **Frontend**: HTML5 Canvas, CSS, JavaScript
- **Backend**: Node.js with Express and Socket.IO
- **Database**: MongoDB for user accounts and game persistence
- **Real-time Communication**: WebSockets for synchronous gameplay
- **Graphics**: High-quality isometric sprites with smooth animations

## Development

### Setup Development Environment

1. Clone this repository
2. Install dependencies with `npm install`
3. Start the development server with `npm run dev`
4. Open your browser to `http://localhost:3000`

### Building for Production

1. Build the project with `npm run build`
2. Start the production server with `npm start`

## Credits

Inspired by classic city builder games like SimCity. Graphics assets from various open-source contributors.

## License

MIT License - See LICENSE file for details