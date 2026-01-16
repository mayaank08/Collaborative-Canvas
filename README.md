# Real-Time Collaborative Drawing Canvas

A multi-user drawing application with real-time synchronization, showcasing raw Canvas API mastery and efficient WebSocket state management.

## 🚀 Setup Instructions

1. **Install Dependencies**
   ```bash
   npm install
   ```
   (This installs dependencies for both client and server)

2. **Run the Application**
   ```bash
   npm start
   ```
   This command starts both the Backend Server (port 3000) and the Frontend Client (Vite dev server).

3. **Open in Browser**
   - Open [http://localhost:5173](http://localhost:5173) (or the port shown in the terminal) in multiple tabs/windows to test collaboration.

## 🧪 Testing with Multiple Users

1. Open the application in one browser window (User A).
2. Open the same URL in a second browser window (User B) or even a mobile device on the same network.
3. Draw in Window A -> Window B sees the stroke appearing in real-time.
4. Draw simultaneously in both windows.
5. Click **Undo** in Window A -> The last stroke (globally) disappears from both windows.
6. Click **Clear** -> Canvas clears for everyone.

## ✨ Features

### Core Features
- **Real-time Drawing**: Smooth, synchronized drawing across all clients.
- **Global Undo/Redo**: Shared history state managed by the server.
- **User Cursors**: See where others are drawing.
- **Customizable Tools**: Color picker and adjustable stroke width.
- **Responsive**: Canvas resizes to fit the window.

### Bonus Features ⭐
- **Performance Metrics**: Live FPS counter and network latency (ping) display.
- **Room System**: Create and join multiple isolated drawing rooms.
- **Mobile Support**: Full touch event support for drawing on mobile devices.
- **Shape Tools**: Rectangle, Circle, and Line drawing capabilities (in progress).

## 🔧 Technology Stack

- **Frontend**: Vanilla TypeScript + Vite (No drawing libraries used).
- **Backend**: Node.js + Express + Socket.io + TypeScript.
- **Protocol**: Custom WebSocket event stream (`start-stroke`, `draw-point`, `end-stroke`).

## 🐞 Known Limitations

- **Latency**: Optimization for extremely high latency (>500ms) could be improved with interpolation, though current "mid-point" smoothing handles jitter well.
- **Undo Granularity**: Currently undo removes the very last global action. Conflict resolution for "undoing simultaneous actions" relies on server-time ordering.

## ⏳ Time Spent
- 10 hours