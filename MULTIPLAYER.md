# HTMLCity Multiplayer Implementation Guide

This document explains how the multiplayer functionality in HTMLCity is implemented and how to extend it.

## Architecture Overview

HTMLCity uses a client-server architecture for multiplayer functionality:

1. **Client**: HTML5/JavaScript frontend running in the browser
2. **Server**: Node.js backend with Express, Socket.IO, and MongoDB
3. **Database**: MongoDB for persistent storage of user accounts, cities, and trades

## Key Technologies

- **WebSockets**: Socket.IO for real-time bidirectional communication
- **JWT Authentication**: Secure token-based authentication for users
- **MongoDB**: NoSQL database for data persistence
- **Express.js**: Web framework for API endpoints
- **Browser Storage**: Local storage for client-side caching

## Server Components

### User Authentication System

- **Registration**: Create new user accounts with email, username, and password
- **Login**: Authenticate users and generate JWT tokens
- **Profile Management**: Update user information and preferences
- **Session Management**: Handle user sessions and authentication state

### City Management System

- **City Creation**: Allow users to create new cities
- **City Loading**: Load existing cities from the database
- **City Persistence**: Save city states back to the database
- **City Sharing**: Make cities visible to other players on leaderboards

### Real-time Synchronization

- **WebSocket Connections**: Manage connections for all online players
- **Action Broadcasting**: Send building placements and other actions to relevant players
- **State Synchronization**: Keep all players' views of the game world consistent
- **Conflict Resolution**: Handle conflicting actions from multiple players

### Trading System

- **Trade Proposals**: Create and send trade offers to other players
- **Trade Acceptance/Rejection**: Respond to incoming trade offers
- **Trade Execution**: Transfer resources between players when trades are accepted
- **Trade History**: Track completed trades for reference

## Client Components

### Authentication UI

- **Login Form**: Allow users to log in with their credentials
- **Registration Form**: Allow new users to create accounts
- **Profile Management**: Edit user profile information

### Dashboard UI

- **City Selection**: Choose which city to play from your created cities
- **City Creation**: Create new cities with names and starting parameters
- **Leaderboard View**: See rankings of cities by various metrics

### Game UI Enhancements

- **Player List**: Show other online players
- **Trade Interface**: Create and respond to trade offers
- **Notifications**: Display game events and trade proposals

### Multiplayer Game Logic

- **Optimistic Updates**: Apply actions locally before server confirmation
- **Rollback Mechanism**: Revert actions if server rejects them
- **Real-time Synchronization**: Apply updates from other players in real-time
- **Time Synchronization**: Ensure all players experience the same game time

## Implementation Details

### Socket.IO Event System

The multiplayer system uses a defined set of Socket.IO events:

#### Authentication Events
- `connect`: Initial connection with auth token
- `disconnect`: Player disconnection

#### City Events
- `loadCity`: Load an existing city
- `createCity`: Create a new city
- `cityLoaded`: City data sent to client
- `cityCreated`: Confirmation of city creation

#### Building Events
- `placeBuilding`: Request to place a building
- `removeBuilding`: Request to remove a building
- `buildingPlaced`: Notification of building placement
- `buildingRemoved`: Notification of building removal
- `buildingConfirmed`: Server confirmation of building action
- `buildingRejected`: Server rejection of building action

#### Player Events
- `playerJoined`: New player joined the game
- `playerLeft`: Player left the game

#### Trade Events
- `tradeOffer`: New trade offer
- `tradeOfferReceived`: Notification of incoming trade
- `tradeResponse`: Response to trade offer
- `tradeAccepted`: Trade was accepted
- `tradeRejected`: Trade was rejected
- `tradeCompleted`: Trade was executed

#### Simulation Events
- `simulationUpdate`: Regular update of simulation state
- `timeSync`: Time synchronization between server and client

### Client-Server Data Flow

1. **Player Action**:
   - Player performs an action (e.g., place a building)
   - Client applies the action locally (optimistic update)
   - Client sends the action to the server

2. **Server Validation**:
   - Server receives the action
   - Server validates the action (e.g., checks if building can be placed)
   - Server updates its own state if valid

3. **Response Flow**:
   - If valid: Server sends confirmation and broadcasts to other players
   - If invalid: Server sends rejection, client rolls back the action

4. **State Synchronization**:
   - Server sends regular state updates to all clients
   - Clients apply these updates to correct any inconsistencies

### Database Schema

#### User Collection
- `_id`: MongoDB document ID
- `username`: User's display name
- `email`: User's email address
- `password`: Hashed password
- `profile`: User profile information
- `cities`: Array of references to city documents
- `stats`: User gameplay statistics
- `friends`: Array of references to other users
- `lastActive`: Timestamp of last activity

#### City Collection
- `_id`: MongoDB document ID
- `name`: City name
- `owner`: Reference to user document
- `grid`: 2D array representing the city layout
- `resources`: Object containing city resources
- `buildings`: Count of different building types
- `stats`: City statistics
- `history`: Array of historical data points
- `createdAt`: City creation timestamp
- `lastUpdated`: Last update timestamp

#### Trade Collection
- `_id`: MongoDB document ID
- `offeredBy`: Reference to user document
- `offeredTo`: Reference to user document
- `offer`: Resources being offered
- `request`: Resources being requested
- `status`: Trade status (pending, accepted, rejected, completed)
- `message`: Optional message with the trade
- `createdAt`: Trade creation timestamp
- `completedAt`: Trade completion timestamp

## Extensions and Customization

### Adding New Multiplayer Features

To add new multiplayer features, you'll need to:

1. **Define new Socket.IO events** in both client and server code
2. **Update the database schema** if you need to store new data
3. **Create UI components** for the new features
4. **Implement server-side logic** to handle the new functionality
5. **Update client-side code** to send and respond to the new events

### Security Considerations

When extending the multiplayer functionality, consider:

- **Input validation**: Validate all data from clients on the server
- **Rate limiting**: Prevent spam and DoS attacks by limiting request rates
- **Authentication checks**: Ensure users can only access their own data
- **Data sanitization**: Clean user inputs to prevent injection attacks
- **Error handling**: Properly handle and log errors without exposing sensitive information

### Performance Optimization

For larger multiplayer games, consider:

- **Sharding**: Divide players into separate "shards" or servers
- **Interest management**: Only send updates relevant to each player
- **Delta encoding**: Only send changes, not full state
- **Data compression**: Compress data before sending over the network
- **Client-side prediction**: More sophisticated prediction algorithms to reduce perceived latency

## Troubleshooting

### Common Issues

- **WebSocket connection failures**: Check network configurations and firewalls
- **Database connection issues**: Verify MongoDB is running and accessible
- **Authentication problems**: Check JWT token validity and expiration
- **State synchronization inconsistencies**: Look for race conditions in the code

### Debugging Tools

- **Socket.IO Admin UI**: Monitor WebSocket connections and events
- **MongoDB Compass**: Inspect database collections and documents
- **Browser DevTools**: Monitor network requests and WebSocket traffic
- **Server Logs**: Enable detailed logging for Socket.IO and Express