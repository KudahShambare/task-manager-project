import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import { Login } from "./pages/Auth";

// Pages

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route exact path="/" element={<Home />} />

        <Route path="/login" element={<Login/>} />

        {/* 404 Route */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
