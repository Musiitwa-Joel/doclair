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
import ImageResize from "./pages/ImageResize";
import ImageRotateFlip from "./pages/ImageRotateFlip";
import ImageBrightnessContrast from "./pages/ImageBrightnessContrast";
import ImageColorBalance from "./pages/ImageColorBalance";
import ImageSharpenBlur from "./pages/ImageSharpenBlur";
import ImageAutoEnhance from "./pages/ImageAutoEnhance";
import ImagePerspectiveCorrect from "./pages/ImagePerspectiveCorrect";
import BackgroundRemove from "./pages/BackgroundRemove";
import RestoreOldPhotos from "./pages/RestoreOldPhotos";
import UnblurImage from "./pages/UnblurImage";
import RemoveScratches from "./pages/RemoveScratches";
import ColorRestoration from "./pages/ColorRestoration";
import ArtisticFilters from "./pages/ArtisticFilters";
import VintageEffects from "./pages/VintageEffects";

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
        <Route path="tool/image-resize" element={<ImageResize />} />
        <Route path="tool/image-rotate" element={<ImageRotateFlip />} />
        <Route path="tool/image-adjust" element={<ImageBrightnessContrast />} />
        <Route path="tool/color-balance" element={<ImageColorBalance />} />
        <Route path="tool/image-filter" element={<ImageSharpenBlur />} />
        <Route path="tool/auto-enhance" element={<ImageAutoEnhance />} />
        <Route
          path="tool/perspective-correct"
          element={<ImagePerspectiveCorrect />}
        />
        <Route path="tool/background-remove" element={<BackgroundRemove />} />
        <Route path="tool/photo-restore" element={<RestoreOldPhotos />} />
        <Route path="tool/image-unblur" element={<UnblurImage />} />
        <Route path="tool/scratch-remove" element={<RemoveScratches />} />
        <Route path="tool/color-restore" element={<ColorRestoration />} />
        <Route path="tool/artistic-filters" element={<ArtisticFilters />} />
        <Route path="tool/vintage-effects" element={<VintageEffects />} />
        <Route path="*" element={<Navigate to="/en-US" replace />} />
      </Route>
    </Routes>
  );
}

export default App;
// This code defines the main application structure using React Router.
