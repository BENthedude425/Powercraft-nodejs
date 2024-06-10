import React from "react";
import {BrowserRouter, Route, Routes } from "react-router-dom";
import "./App.css";
import Pcreate_user from "../public/pages/create-user";


function App() {
  return (
    <BrowserRouter>
      <Routes>
          <Route path="create-user" element={<Pcreate_user />}/>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
