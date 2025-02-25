import { useState } from "react";
import axios from "axios";

const App = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [preprocessedImage, setPreprocessedImage] = useState(null);
  const [isPreprocessing, setIsPreprocessing] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [continuousSessionId, setContinuousSessionId] = useState(null);
  const [currentTranslation, setCurrentTranslation] = useState(null);
  const [mergedTranslation, setMergedTranslation] = useState(null);
  const [imageCount, setImageCount] = useState(0);
  const [noiseDiv, setNoiseDiv] = useState(0.9);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    setSelectedFile(file);
    setPreprocessedImage(null);
    setCurrentTranslation(null);

    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
  };

  const startNewSession = async () => {
    try {
      const response = await axios.post(
        "http://localhost:8000/start-continuous/"
      );
      setContinuousSessionId(response.data.session_id);
      setImageCount(0);
      setMergedTranslation(null);
    } catch (error) {
      console.error("Error starting new session:", error);
      alert("Failed to start new translation session");
    }
  };

  const handlePreprocess = async () => {
    if (!selectedFile) {
      alert("Please select a file first.");
      return;
    }

    if (!continuousSessionId) {
      await startNewSession();
    }

    setIsPreprocessing(true);

    const formData = new FormData();
    formData.append("file", selectedFile);
    // Use default scale value (30) - removed from frontend
    formData.append("scale", 30);
    formData.append("noise_divisor", noiseDiv);

    try {
      const response = await axios.post(
        "http://localhost:8000/preprocess/",
        formData
      );
      setPreprocessedImage(
        `data:image/png;base64,${response.data.preprocessed_image}`
      );
    } catch (error) {
      console.error("Error preprocessing file:", error);
      alert("An error occurred while preprocessing the file.");
    } finally {
      setIsPreprocessing(false);
    }
  };

  const handleTranslate = async () => {
    if (!preprocessedImage) {
      alert("Please preprocess the image first.");
      return;
    }

    setIsTranslating(true);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      // Use default scale value (30) - removed from frontend
      formData.append("scale", 30);
      formData.append("noise_divisor", noiseDiv);

      const response = await axios.post(
        `http://localhost:8000/continuous-translate/${continuousSessionId}`,
        formData
      );

      setCurrentTranslation(response.data.current_translation);
      setMergedTranslation(response.data.merged_translation);
      setImageCount(response.data.num_images);

      // Clear file selection for next image
      setSelectedFile(null);
      setPreviewUrl(null);
      setPreprocessedImage(null);
    } catch (error) {
      console.error("Error translating file:", error);
      alert("An error occurred while translating the file.");
    } finally {
      setIsTranslating(false);
    }
  };

  const handleComplete = async () => {
    if (!continuousSessionId) {
      alert("No active translation session.");
      return;
    }

    try {
      const response = await axios.post(
        `http://localhost:8000/complete-session/${continuousSessionId}`,
        {},
        { responseType: "blob" }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "final_translation.txt");
      document.body.appendChild(link);
      link.click();
      link.remove();

      // Reset state
      setContinuousSessionId(null);
      setImageCount(0);
      setMergedTranslation(null);
      setCurrentTranslation(null);
      setPreprocessedImage(null);
      setSelectedFile(null);
      setPreviewUrl(null);
    } catch (error) {
      console.error("Error completing session:", error);
      alert("Failed to complete translation session");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 py-10 px-5">
      <div className="bg-white shadow-lg rounded-lg p-6 w-full max-w-2xl">
        <h1 className="text-2xl font-bold mb-6 text-center">
          Tamil Inscription Reader
        </h1>

        <div className="space-y-6">
          {/* Session Status */}
          {continuousSessionId && (
            <div className="text-sm text-gray-600 text-center">
              Active Session: {imageCount} image(s) processed
            </div>
          )}

          {/* File Upload Section */}
          <div className="space-y-4">
            <label className="block text-sm text-center font-medium text-gray-700">
              Upload an image of Tamil stone inscription:
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>

          {/* Parameter Controls */}
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Noise Divisor ({noiseDiv})
              </label>
              <input
                type="range"
                min="0.1"
                max="10"
                step="0.1"
                value={noiseDiv}
                onChange={(e) => setNoiseDiv(Number(e.target.value))}
                className="w-full"
              />
            </div>
          </div>

          {/* Image Preview Section */}
          <div className="grid grid-cols-2 gap-4">
            {previewUrl && (
              <div>
                <p className="text-sm text-gray-600 mb-2">Original:</p>
                <img
                  src={previewUrl}
                  alt="Original"
                  className="w-full h-auto rounded-lg border border-gray-300"
                />
              </div>
            )}
            {preprocessedImage && (
              <div>
                <p className="text-sm text-gray-600 mb-2">Preprocessed:</p>
                <img
                  src={preprocessedImage}
                  alt="Preprocessed"
                  className="w-full h-auto rounded-lg border border-gray-300"
                />
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-4">
            <button
              onClick={handlePreprocess}
              disabled={isPreprocessing || !selectedFile}
              className={`flex-1 py-2 px-4 text-white rounded-lg ${
                isPreprocessing || !selectedFile
                  ? "bg-blue-300"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {isPreprocessing ? "Processing..." : "Preprocess Image"}
            </button>

            <button
              onClick={handleTranslate}
              disabled={isTranslating || !preprocessedImage}
              className={`flex-1 py-2 px-4 text-white rounded-lg ${
                isTranslating || !preprocessedImage
                  ? "bg-green-300"
                  : "bg-green-600 hover:bg-green-700"
              }`}
            >
              {isTranslating ? "Translating..." : "Translate"}
            </button>

            {continuousSessionId && (
              <button
                onClick={handleComplete}
                className="flex-1 py-2 px-4 text-white rounded-lg bg-purple-600 hover:bg-purple-700"
              >
                Complete & Download
              </button>
            )}
          </div>

          {/* Results Section */}
          {currentTranslation && (
            <div className="p-4 bg-gray-100 rounded border border-gray-300">
              <h2 className="text-lg font-bold mb-2">
                Current Image Translation:
              </h2>
              <pre className="text-sm text-gray-800 whitespace-pre-wrap break-words">
                {currentTranslation.join("\n")}
              </pre>
            </div>
          )}

          {mergedTranslation && (
            <div className="p-4 bg-gray-100 rounded border border-gray-300">
              <h2 className="text-lg font-bold mb-2">
                Merged Translation (All Images):
              </h2>
              <pre className="text-sm text-gray-800 whitespace-pre-wrap break-words">
                {mergedTranslation.join("\n")}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;
