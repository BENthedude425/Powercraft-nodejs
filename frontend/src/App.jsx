import {React} from "react";
import { BrowserRouter, Route, Routes, Outlet } from "react-router-dom";
import "./App.css";

// IMPORT PROTECTED ROUTE COMPONENT \\
import {ProtectedRoute} from "./ProtectedRoute";

// IMPORT PAGES \\
import Pcreate_user from "../pages/create-user";
import Plogin from "../pages/login";
import PTest from "../pages/test";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="login"       element={<Plogin />}      />
        <Route path="create-user" element={<Pcreate_user />} />
        
        
        <Route element={<ProtectedRoute />}>
          <Route path="test"        element={<PTest />} />
          <Route path="woohoo" element={<b>woohoo</b>} />
        </Route>  
      
      </Routes>
    </BrowserRouter>
  );
}

export default App;
