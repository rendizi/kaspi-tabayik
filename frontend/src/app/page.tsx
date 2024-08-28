import { useState } from "react";
import axios from "axios";

export default function Home() {
  const [image, setImage] = useState<File | null>(null);
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) {
      setImage(file);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const handleSearch = async () => {
    if (!image) return;

    setLoading(true);

    const formData = new FormData();
    formData.append("image", image);

    try {
      const response = await axios.post("http://localhost:8000/query-image/", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      setResults(response.data);
    } catch (error) {
      console.error("Error uploading image", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className="border-2 border-dashed border-gray-300 p-4 text-center mb-4"
      >
        {image ? (
          <p>File: {image.name}</p>
        ) : (
          <p>Drag & drop an image here, or click to select one</p>
        )}
      </div>

      <button
        onClick={handleSearch}
        className="bg-blue-500 text-white py-2 px-4 rounded"
        disabled={loading}
      >
        {loading ? "Searching..." : "Search"}
      </button>

      {results && (
        <div className="mt-4">
          <h2 className="text-lg font-bold">Results:</h2>
          <ul>
            {results.matches.map((match: any) => (
              <li key={match.id} className="border-b py-2">
                <a href={match.metadata.url} target="_blank" rel="noopener noreferrer" className="text-blue-500">
                  {match.metadata.name} - {match.metadata.price}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
