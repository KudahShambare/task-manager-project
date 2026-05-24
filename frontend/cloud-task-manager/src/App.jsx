import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import Auth from "./pages/Auth";
import Teams from "./pages/Teams";
import Tasks from "./pages/Tasks";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import Projects from "./pages/Projects";

// Pages

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route exact path="/" element={<Home />} />

        <Route path="/auth" element={<Auth />} />

        <Route path="/teams" element={<Teams />} />

        <Route exact path="/tasks" element={<Tasks />} />

        <Route exact path="/dashboard" element={<Dashboard />} />
                <Route exact path="/profile" element={<Profile />} />

                                <Route exact path="/projects" element={<Projects />} />



        {/* 404 Route */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
