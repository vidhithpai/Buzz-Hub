# ChatNexus (MERN + Socket.io)

ChatNexus is a full-stack chat application featuring private and group chats, real-time messaging, JWT auth, typing indicators, and presence.

## Tech
- MongoDB, Mongoose
- Node.js, Express
- Socket.io
- React (Vite), React Router
- Axios

## Project Structure
```
server/  # Express API + Socket.io + MongoDB models
client/  # React UI (Vite) + Socket.io client
```

## Prerequisites
- Node.js 18+
- MongoDB running locally (or a connection string)

## Setup

1) Server
```
cd server
npm i
```
Create `.env` in `server/`:
```
PORT=5000
MONGO_URI=mongodb://localhost:27017/chatnexus
JWT_SECRET=supersecretchangeme
CLIENT_ORIGIN=http://localhost:5173
```
Run:
```
npm run dev
```

2) Client
```
cd ../client
npm i
```
Optionally add `.env` in `client/` to customize API/socket URLs:
```
VITE_API_BASE=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```
Run:
```
npm run dev
```
Open the printed URL (default `http://localhost:5173`).

## Features
- JWT Auth (signup/login)
- Private and Group chats
- Real-time messages via Socket.io
- Delivery/read receipts
- Typing indicators
- Online/offline presence

## Notes
- Basic styling is inline for simplicity. You can swap for Tailwind/Chakra.
- Security hardening (rate limiting, validation, production CORS) recommended for production.

## Usage Tips
1. Run both dev servers (`server` and `client`) and open `http://localhost:5173`.
2. Sign up with two different accounts (second one can be in a private/incognito window).
3. Each logged-in user sees others in the **Contacts** list; click **Chat** next to a contact to create a direct chat and begin messaging.
4. Keep both tabs open to experience typing indicators, delivery/read receipts, and online presence in real time.




# fullstack_chat
