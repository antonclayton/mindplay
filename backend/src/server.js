import http from 'http';
import app from './app.js';
import { connectDB } from './config/db.js';
import { env } from './config/env.js';
import { createWebSocketServer } from './websocket/index.js';

await connectDB();

const server = http.createServer(app);

createWebSocketServer(server);

server.listen(env.PORT, () => {
  console.log(`API listening on http://localhost:${env.PORT}`);
});
