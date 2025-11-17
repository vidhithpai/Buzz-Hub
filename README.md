# BuzzHub (MERN + Socket.io)

Deployed at:https://buzz-hub.onrender.com/

BuzzHub is a full-stack chat platform built for real-time conversations, rapid onboarding, and slick UI experiences across web and mobile breakpoints.

## Tech Stack
- MongoDB + Mongoose for persistence
- Node.js + Express with Socket.io for the API and realtime layer
- React (Vite) + React Router for the client
- Axios for data fetching

## Features
- Unique username and email validation during signup (letters, numbers, underscores allowed).
- Contacts searchable by username.
- Group chat messages clearly surface `senderName` to avoid ambiguity.
- Sidebar fixed on the left with user info pinned at the top.
- “Type a message” input bar fixed at the bottom of the chat window.
- Real-time private and group chats with typing indicators and presence updates.

## Project Structure
```
server/  # BuzzHub Express API + Socket.io + MongoDB models
client/  # BuzzHub React UI (Vite) + Socket.io client
```

## Prerequisites
- Node.js 18+
- MongoDB running locally or accessible via connection string

## Installation & Running
### Backend (server)
```bash
cd server
npm install
cp .env.example .env # if you keep an example file
```
Create or update `.env` inside `server/`:
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/buzzhub
JWT_SECRET=supersecretchangeme
CLIENT_ORIGIN=http://localhost:5173
```
Start the API:
```bash
npm start     # runs node src/index.js
# npm run dev # optional: hot reloading with nodemon
```

### Frontend (client)
```bash
cd ../client
npm install
```
Optional `.env` overrides for the client:
```env
VITE_API_BASE=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```
Launch the Vite dev server:
```bash
npm start     # runs vite
# npm run dev # identical alias if you prefer
```
Open the printed URL (default `http://localhost:5173`) to explore BuzzHub.



## Contribution Guidelines
- Follow the existing lint rules and keep styles consistent with the active theme.
- Use `senderName` (not `senderUsername`) when surfacing message authors.
- Prefer descriptive commit messages (`feat:`, `fix:`, etc.).
- Please open an issue before major refactors or feature work.

## Usage Tips
1. Run both servers and sign into two different accounts (use an incognito window for the second user).
2. Start a direct chat or create a group; BuzzHub broadcasts typing and presence states in real time.

Happy chatting with **BuzzHub**!
