import http from 'http';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Server as SocketIOServer } from 'socket.io';
import { connectToDatabase } from './lib/db.js';
import authRouter from './routes/auth.routes.js';
import chatRouter from './routes/chat.routes.js';
import messageRouter from './routes/message.routes.js';
import { registerSocketHandlers } from './socket/index.js';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.CLIENT_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    credentials: true
  }
});

// Middleware
app.use(cors({ origin: process.env.CLIENT_ORIGIN || '*', credentials: true }));
app.use(express.json());

// Health
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'ChatNexus API' });
});

// Routes
app.use('/api/auth', authRouter);
app.use('/api/chats', chatRouter);
app.use('/api/messages', messageRouter);

// Socket.io
registerSocketHandlers(io);

// Startup
const PORT = process.env.PORT || 5000;
await connectToDatabase(process.env.MONGO_URI);
server.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`ChatNexus server listening on http://localhost:${PORT}`);
});




