import dotenv from "dotenv";
import app from "./app.js";

dotenv.config();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});


// import dotenv from "dotenv";
// import http from "http";
// import { Server } from "socket.io";

// import app from "./app";
// import { GameGateway } from "./websocket/GameGateway";
// import { TurnScheduler } from "./services/TurnScheduler";

// dotenv.config();

// const PORT = process.env.PORT || 5000;

// const httpServer = http.createServer(app);

// const io = new Server(httpServer, {
//   cors: {
//     origin: "*"
//   }
// });

// GameGateway.initialize(io);

// io.on("connection", socket => {
//   console.log("Socket Connected", socket.id);

//   socket.on("JOIN_GAME", (gameId: string) => {
//     socket.join(gameId);
//     console.log(`${socket.id} joined ${gameId}`);
//   });

//   socket.on("PLAY_CARD", payload => {
//     TurnScheduler.playerPlay(
//       payload.gameId,
//       payload.playerId,
//       payload.cardId
//     );
//   });

//   socket.on("disconnect", () => {
//     console.log("Socket Disconnected", socket.id);
//   });
// });

// httpServer.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });