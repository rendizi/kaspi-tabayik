'use client';

import { FC, useState } from "react";
import axios from "axios";

export interface QueryResponse {
    matches: QueryObject[];
}

export interface QueryObject {
    id: string;
    metadata: QueryMetadata;
}

export interface QueryMetadata {
    category: string;
    image: string;
    name: string;
    price: string;
    url: string;
}

interface FileUploadProps {
    onResponse: (data: QueryResponse) => void;
}

export const FileUpload: FC<FileUploadProps> = ({ onResponse }) => {
    const [file, setFile] = useState<File | null>(null);
    const [fileEnter, setFileEnter] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleFileUpload = async () => {
        if (!file) return;
        setLoading(true);

        const formData = new FormData();
        formData.append('image', file);

        try {
            const response = await axios.post<QueryResponse>('https://tabayik-production.up.railway.app/query-image/', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            onResponse(response.data); // Pass response data to parent component
        } catch (error) {
            console.error('Error uploading the file:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className={`${
                fileEnter ? "border-blue-500" : "border-gray-300"
            } cursor-pointer mx-auto bg-white flex flex-col w-full max-w-md h-80 border-dashed items-center justify-center rounded-lg shadow-lg transition-all duration-300 ease-in-out border-2 ${
                fileEnter ? "border-4" : ""
            }`}
            onDragOver={(e) => {
                e.preventDefault();
                setFileEnter(true);
            }}
            onDragLeave={() => {
                setFileEnter(false);
            }}
            onDrop={(e) => {
                e.preventDefault();
                setFileEnter(false);
                if (e.dataTransfer.items) {
                    [...e.dataTransfer.items].forEach((item, i) => {
                        if (item.kind === "file") {
                            const droppedFile = item.getAsFile();
                            if (droppedFile) {
                                setFile(droppedFile);
                            }
                            console.log(`items file[${i}].name = ${droppedFile?.name}`);
                        }
                    });
                } else {
                    [...e.dataTransfer.files].forEach((droppedFile, i) => {
                        console.log(`… file[${i}].name = ${droppedFile.name}`);
                    });
                }
            }}
        >
            {!file ? (
                <label
                    htmlFor="file"
                    className="flex flex-col items-center text-center text-gray-700 font-medium"
                >
                    <div className="text-lg mb-2">Click to upload or drag and drop</div>
                    <input
                        id="file"
                        type="file"
                        className="hidden"
                        onChange={(e) => {
                            const selectedFile = e.target.files?.[0];
                            if (selectedFile) {
                                setFile(selectedFile);
                            }
                        }}
                    />
                </label>
            ) : (
                <div className="flex flex-col items-center">
                    <img
                        src={URL.createObjectURL(file)}
                        alt="Preview"
                        className="rounded-lg w-full max-w-md h-60 mb-4 object-cover"
                    />
                    <div className="flex gap-4">
                        <button
                            onClick={() => setFile(null)}
                            className="px-6 py-2 uppercase font-semibold tracking-wide text-white bg-red-600 rounded-lg shadow-md hover:bg-red-700 transition duration-300 ease-in-out"
                        >
                            Reset
                        </button>
                        <button
                            onClick={handleFileUpload}
                            disabled={loading}
                            className="px-6 py-2 uppercase font-semibold tracking-wide text-white bg-blue-600 rounded-lg shadow-md hover:bg-blue-700 transition duration-300 ease-in-out disabled:bg-gray-400"
                        >
                            {loading ? "Uploading..." : "Submit"}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
