import React from "react";
import {BrowserRouter, Route, Routes } from "react-router-dom";
import "./App.css";

// IMPORT PAGES \\
import Pcreate_user from "../pages/create-user";
import Plogin from "../pages/login";


function App() {
  return (
    <BrowserRouter>
      <Routes>
          <Route path="login" element={<Plogin />} />
          <Route path="create-user" element={<Pcreate_user />}/>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
