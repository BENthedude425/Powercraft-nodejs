import { React } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import "./assets/app.css";

// IMPORT PROTECTED ROUTE COMPONENT \\
import { ProtectedRoute } from "./ProtectedRoute";

// IMPORT PAGES \\
import PIndex from "../pages/index";
import Pcreate_user from "../pages/create-user";
import Plogin from "../pages/login";
import PDashboard from "../pages/dashboard";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PIndex />} />
        <Route path="login" element={<Plogin />} />
        <Route path="create-user" element={<Pcreate_user />} />

        <Route element={<ProtectedRoute />}>
          <Route path="dashboard" element={<PDashboard />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
