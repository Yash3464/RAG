import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";

import MainLayout from "./layouts/MainLayout";

import Dashboard from "./pages/Dashboard";
import Requirements from "./pages/Requirements";
import Backlog from "./pages/Backlog";
import ResolutionCenter from "./pages/ResolutionCenter";
import ImpactAnalysis from "./pages/ImpactAnalysis";
import DataSources from "./pages/DataSources";

function App() {
  return (
    <BrowserRouter>
      <MainLayout>
        <Routes>
          <Route
            path="/"
            element={<Dashboard />}
          />

          <Route
            path="/requirements"
            element={<Requirements />}
          />

          <Route
            path="/backlog"
            element={<Backlog />}
          />

          <Route
            path="/resolution"
            element={
              <ResolutionCenter />
            }
          />

          <Route
            path="/impact"
            element={
              <ImpactAnalysis />
            }
          />

          <Route
            path="/sources"
            element={
              <DataSources />
            }
          />
        </Routes>
      </MainLayout>
    </BrowserRouter>
  );
}

export default App;