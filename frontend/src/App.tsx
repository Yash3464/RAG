import { useEffect, useState } from "react";
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
import DataSources from "./pages/DataSources";
import Login from "./pages/Login";
import AdminPanel from "./pages/AdminPanel";
import WorkPortal from "./pages/WorkPortal";

function App() {
  const [user, setUser] = useState<{ email: string; role: "admin" | "employee" } | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem("brained_user");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  if (!user) {
    return <Login onLoginSuccess={(u) => setUser(u)} />;
  }

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
              <Requirements />
            }
          />

          <Route
            path="/sources"
            element={
              <DataSources />
            }
          />

          <Route
            path="/admin"
            element={
              <AdminPanel />
            }
          />

          <Route
            path="/work-portal"
            element={
              <WorkPortal />
            }
          />
        </Routes>
      </MainLayout>
    </BrowserRouter>
  );
}

export default App;