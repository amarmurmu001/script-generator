"use client";
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Copy, Download, Volume2 } from "lucide-react";

export default function ScriptGenerator() {
  const [input, setInput] = useState("");
  const [generatedScript, setGeneratedScript] = useState("");
  const [error, setError] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const generateScript = async () => {
    setError("");
    setIsGenerating(true);
    try {
      const response = await fetch('/api/generate-script', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ input }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate script.');
      }

      const data = await response.json();
      if (!data.script) {
        throw new Error('No script generated.');
      }
      setGeneratedScript(data.script);
    } catch (error) {
      console.error('Error during script generation:', error);
      setError(error.message || 'Error during script generation. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyScript = () => {
    navigator.clipboard.writeText(generatedScript)
      .then(() => alert('Script copied to clipboard!'))
      .catch(err => console.error('Failed to copy script: ', err));
  };

  const downloadScript = () => {
    const element = document.createElement("a");
    const file = new Blob([generatedScript], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = "generated_script.txt";
    document.body.appendChild(element);
    element.click();
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center text-gray-900 mb-8">Youtube CTA Shorts Script Generator</h1>
        
        <div className="bg-white shadow rounded-lg p-6 mb-8">
          <div className="mb-6">
            <Label htmlFor="input" className="block text-sm font-medium text-gray-700 mb-2">
              Enter Theme, Title, or Keyword
            </Label>
            <Input
              id="input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Enter your theme, title, or keyword..."
              className="w-full"
            />
          </div>

          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
            <Button onClick={generateScript} className="flex-1" disabled={isGenerating}>
              {isGenerating ? 'Generating...' : 'Generate Script'}
            </Button>
            <Button variant="outline" className="flex items-center" disabled>
              <Volume2 className="w-4 h-4 mr-2" />
              Generate Audio
            </Button>
          </div>
          {error && <p className="text-red-500 mt-2">{error}</p>}
        </div>
        
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Script Preview</h2>
          <Textarea
            value={generatedScript}
            readOnly
            className="w-full h-40 mb-4 p-2 border rounded"
          />
          <div className="flex justify-end space-x-4">
            <Button variant="outline" size="sm" className="flex items-center" onClick={copyScript}>
              <Copy className="w-4 h-4 mr-2" />
              Copy Script
            </Button>
            <Button variant="outline" size="sm" className="flex items-center" onClick={downloadScript}>
              <Download className="w-4 h-4 mr-2" />
              Download Script
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
