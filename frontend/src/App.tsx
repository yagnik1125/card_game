import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import GameLoader from "./components/common/GameLoader";

const HomePage = lazy(() => import("@/pages/HomePage"));
const GamePage = lazy(() => import("@/pages/GamePage"));
const Team2V2GamePage = lazy(() => import("@/pages/Team2V2GamePage"));
const WsHomePage = lazy(() => import("@/ws/pages/WsHomePage"));
const WsGamePage = lazy(() => import("@/ws/pages/WsGamePage"));
const WsTeam2V2GamePage = lazy(() => import("@/ws/pages/WsTeam2V2GamePage"));

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<GameLoader />}>
        <Routes>
          <Route path="/" element={<HomePage />}/>
          <Route path="/game/:gameId" element={<GamePage />}/>
          <Route path="/game/team2v2/:gameId" element={<Team2V2GamePage />}/>
          <Route path="/ws" element={<WsHomePage />}/>
          <Route path="/ws/game/:gameId" element={<WsGamePage />}/>
          <Route path="/ws/game/team2v2/:gameId" element={<WsTeam2V2GamePage />}/>
          <Route path="/loader" element={<GameLoader />}/>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
