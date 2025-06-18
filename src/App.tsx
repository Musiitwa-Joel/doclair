import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import PDFTools from "./pages/PDFTools";
import ImageTools from "./pages/ImageTools";
import ToolPage from "./pages/ToolPage";
import STRAPSecure from "./pages/STRAPSecure";
import WordToPDF from "./pages/WordToPDF";
import PDFToWord from "./pages/PDFToWord";
import ImageCrop from "./pages/ImageCrop";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/en-US" replace />} />
      <Route path="/en-US" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="pdf-tools" element={<PDFTools />} />
        <Route path="image-tools" element={<ImageTools />} />
        <Route path="strap-secure" element={<STRAPSecure />} />
        <Route path="tool/:toolId" element={<ToolPage />} />
        <Route path="tool/word-to-pdf" element={<WordToPDF />} />
        <Route path="tool/pdf-to-word" element={<PDFToWord />} />
        <Route path="tool/image-crop" element={<ImageCrop />} />
      </Route>
    </Routes>
  );
}

export default App;
// This code defines the main application structure using React Router.