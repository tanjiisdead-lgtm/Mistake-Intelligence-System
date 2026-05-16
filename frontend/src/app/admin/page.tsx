"use client";

import React, { useState } from "react";
import { Upload, CheckCircle, Loader2 } from "lucide-react";

export default function AdminPage() {
  const [file, setFile] = useState<File | null>(null);
  const [apiKey, setApiKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleUpload = async () => {
    if (!file || !apiKey) return;
    setLoading(true);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("api_key", apiKey);

    try {
      const res = await fetch("/api/upload-question/", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      setResult(data);
    } catch (err) {
      console.error("Upload failed", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="bg-white p-8 rounded-2xl shadow-md border border-slate-100">
          <h1 className="text-2xl font-bold text-slate-800 mb-6">Question Creator (AI OCR)</h1>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Google Gemini API Key</label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter your API key"
                className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div className="border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center hover:border-blue-400 transition-colors">
              <input
                type="file"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
                <Upload className="w-12 h-12 text-slate-400 mb-2" />
                <span className="text-slate-600 font-medium">
                  {file ? file.name : "Click to upload question image"}
                </span>
              </label>
            </div>

            <button
              onClick={handleUpload}
              disabled={loading || !file || !apiKey}
              className="w-full py-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all disabled:bg-slate-300 flex items-center justify-center space-x-2"
            >
              {loading ? <Loader2 className="animate-spin" /> : <Upload className="w-4 h-4" />}
              <span>{loading ? "Processing with AI..." : "Upload & Parse Question"}</span>
            </button>
          </div>
        </div>

        {result && (
          <div className="bg-white p-8 rounded-2xl shadow-md border border-green-100 animate-in zoom-in-95">
            <div className="flex items-center space-x-2 text-green-600 mb-4 font-bold">
              <CheckCircle className="w-5 h-5" />
              <span>Question Created Successfully</span>
            </div>
            <div className="space-y-2 text-sm">
              <p><strong>Code:</strong> {result.question_code}</p>
              <p><strong>Subject:</strong> {result.subject}</p>
              <p><strong>Chapter:</strong> {result.chapter}</p>
              <p><strong>Text:</strong> {result.text}</p>
              <p><strong>Options:</strong> {result.options.join(", ")}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
