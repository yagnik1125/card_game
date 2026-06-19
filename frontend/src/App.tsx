import { BrowserRouter, Routes, Route } from "react-router-dom";

import HomePage from "@/pages/HomePage";
import GamePage from "@/pages/GamePage";
import GameLoader from "./components/common/GameLoader";
import Team2V2GamePage from "@/pages/Team2V2GamePage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />}/>
        <Route path="/game/:gameId" element={<GamePage />}/>
        <Route path="/game/team2v2/:gameId" element={<Team2V2GamePage />}/>
        <Route path="/loader" element={<GameLoader />}/>
      </Routes>
    </BrowserRouter>
  );
}

export default App;