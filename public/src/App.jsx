import React, { useState } from "react";
import axios from "axios";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import Description from "./pages/Description";
import ImageIdentifier from "./pages/ImageIdentifier";
import ExplainImage from "./pages/ExplainImage";
import ExplainCamera from "./pages/ExplainCamera";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Home />} path={"/"} />
        <Route element={<Description />} path="/desc" />
        <Route element={<ImageIdentifier />} path="/image" />
        <Route element={<ExplainImage />} path="/explainimg" />
        <Route element={<ExplainCamera />} path="/explaincamera" />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
