import { useState } from "react";
import axios from "axios";

const App = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [preprocessedImage, setPreprocessedImage] = useState(null);
  const [isPreprocessing, setIsPreprocessing] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [downloadLink, setDownloadLink] = useState(null);
  const [fileContent, setFileContent] = useState(null);
  const [scale, setScale] = useState(30);
  const [noiseDiv, setNoiseDiv] = useState(0.9);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    setSelectedFile(file);
    setPreprocessedImage(null);
    setSessionId(null);
    setDownloadLink(null);
    setFileContent(null);

    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
  };

  const handlePreprocess = async () => {
    if (!selectedFile) {
      alert("Please select a file first.");
      return;
    }
    setPreprocessedImage(null);
    setSessionId(null);
    setDownloadLink(null);
    setFileContent(null);
    setIsPreprocessing(true);

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("scale", scale);
    formData.append("noise_divisor", noiseDiv);

    try {
      const response = await axios.post(
        "http://localhost:8000/preprocess/",
        formData
      );

      setSessionId(response.data.session_id);
      setPreprocessedImage(
        `data:image/png;base64,${response.data.preprocessed_image}`
      );
    } catch (error) {
      console.log("Error preprocessing file:", error);
      alert("An error occurred while preprocessing the file.");
    } finally {
      setIsPreprocessing(false);
    }
  };

  const handleTranslate = async () => {
    if (!sessionId) {
      alert("Please preprocess the image first.");
      return;
    }

    setIsTranslating(true);

    try {
      const response = await axios.post(
        `http://localhost:8000/translate/${sessionId}`,
        {},
        {
          responseType: "blob",
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      setDownloadLink(url);

      const reader = new FileReader();
      reader.onload = () => {
        setFileContent(reader.result);
      };
      reader.readAsText(response.data);
    } catch (error) {
      console.log("Error translating file:", error);
      alert("An error occurred while translating the file.");
    } finally {
      setIsTranslating(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 py-10 px-5">
      <div className="bg-white shadow-lg rounded-lg p-6 w-full max-w-2xl">
        <h1 className="text-2xl font-bold mb-6 text-center">
          Tamil Inscription Reader
        </h1>

        <div className="space-y-6">
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
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Image Size Scale ({scale}%)
              </label>
              <input
                type="range"
                min="10"
                max="100"
                value={scale}
                onChange={(e) => setScale(Number(e.target.value))}
                className="w-full"
              />
            </div>
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
          <div className="flex gap-4">
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
              disabled={isTranslating || !sessionId}
              className={`flex-1 py-2 px-4 text-white rounded-lg ${
                isTranslating || !sessionId
                  ? "bg-green-300"
                  : "bg-green-600 hover:bg-green-700"
              }`}
            >
              {isTranslating ? "Translating..." : "Translate"}
            </button>
          </div>

          {/* Results Section */}
          {downloadLink && (
            <div className="text-center">
              <a
                href={downloadLink}
                download="translation.txt"
                className="text-blue-600 underline hover:text-blue-800"
              >
                Download Translation
              </a>
            </div>
          )}

          {fileContent && (
            <div className="p-4 bg-gray-100 rounded border border-gray-300">
              <h2 className="text-lg font-bold mb-2">
                Transliterated text in modern Tamil:
              </h2>
              <pre className="text-sm text-gray-800 whitespace-pre-wrap break-words">
                {fileContent}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;
