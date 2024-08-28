'use client'

import { useState, useRef, useEffect } from "react";
import { FileUpload, QueryResponse } from "./components/FileUpload";
import { Footer } from "./components/Footer";

export default function Home() {
  const [response, setResponse] = useState<QueryResponse | null>(null);
  const responseRef = useRef<HTMLDivElement | null>(null);

  const handleResponse = (data: QueryResponse) => {
    setResponse(data);
  };

  useEffect(() => {
    if (response && response.matches && response.matches.length > 0 && responseRef.current) {
      requestAnimationFrame(() => {
        responseRef.current?.scrollIntoView({ behavior: 'smooth' });
      });
    }
  }, [response]);

  return (
    <div>
      <div className="flex flex-col items-center justify-center p-4 text-black bg-white h-screen w-full">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold">Tabayik</h1>
          <h2 className="text-xl mt-2">Poisk sredi bolee chem 400,000 tavarov</h2>
        </div>
        <FileUpload onResponse={handleResponse} />
      </div>
      {response && response.matches && response.matches.length > 0 && (
        <div className="flex flex-col justify-center items-center bg-white">
        <div
          className="mt-10 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 w-2/3 pb-6"
          ref={responseRef}
        >
          {response.matches.map((match) => (
            <div
              key={match.id}
              className="bg-white border border-gray-300 rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300 transform hover:scale-105"
            >
              <img
                src={match.metadata.image}
                alt={match.metadata.name}
                className="w-full h-64 object-contain"
              />
              <div className="p-5">
                <h3 className="text-2xl font-bold mb-3 text-gray-800">{match.metadata.name}</h3>
                <p className="text-xl text-gray-700 mb-4">{match.metadata.price}</p>
                <a
                  href={match.metadata.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block text-blue-600 hover:text-blue-800 font-semibold transition-colors duration-200"
                >
                  View Details
                </a>
              </div>
            </div>
          ))}

        </div>
      </div>
      )}
      <Footer />
    </div>
  );
}
