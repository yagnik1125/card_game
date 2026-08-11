import dotenv from "dotenv";
import { createGameServer } from "./websocket/createGameServer.js";

dotenv.config();

const PORT = process.env.PORT || 5000;

const { httpServer } = createGameServer();

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
