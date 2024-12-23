import { useState } from "react";
import axios from "axios";

const App = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [downloadLink, setDownloadLink] = useState(null);
  const [fileContent, setFileContent] = useState(null);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    setSelectedFile(file);
    setDownloadLink(null);
    setFileContent(null);

    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      alert("Please select a file first.");
      return;
    }

    setIsLoading(true);

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const response = await axios.post(
        "http://localhost:8000/predict/",
        formData,
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
      console.error("Error uploading file:", error);
      alert("An error occurred while processing the file.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 py-10 px-5">
      <div className="bg-white shadow-lg rounded-lg p-6 w-full max-w-md">
        <h1 className="text-2xl font-bold mb-4 text-center">
          Tamil Inscription Reader
        </h1>

        <div className="mb-4">
          <label
            htmlFor="fileInput"
            className="block text-sm text-center font-medium text-gray-700 mb-2"
          >
            Upload an image of Tamil stone inscription:
          </label>
          <input
            type="file"
            id="fileInput"
            accept="image/*"
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            onChange={handleFileChange}
          />
        </div>

        {previewUrl && (
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">Preview:</p>
            <img
              src={previewUrl}
              alt="Uploaded preview"
              className="w-full h-auto rounded-lg border border-gray-300"
            />
          </div>
        )}

        <button
          onClick={handleUpload}
          className={`w-full py-2 px-4 text-white rounded-lg ${
            isLoading ? "bg-blue-300" : "bg-blue-600 hover:bg-blue-700"
          }`}
          disabled={isLoading}
        >
          {isLoading ? "Processing..." : "Upload and Translate"}
        </button>

        {downloadLink && (
          <div className="mt-4 text-center">
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
          <div className="mt-4 p-4 bg-gray-100 rounded border border-gray-300">
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
  );
};

export default App;
