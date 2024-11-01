"use client";
import { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Copy, Download, Volume2, Play, Pause, Edit, RefreshCw, Trash2 } from "lucide-react";
import { db, storage } from "@/lib/firebase"; // Import your Firebase configuration
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc } from "firebase/firestore"; // Import Firestore functions
import { ref, getDownloadURL } from "firebase/storage";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function ScriptGenerator() {
  const [input, setInput] = useState("");
  const [generatedScript, setGeneratedScript] = useState("");
  const [error, setError] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [scriptHistory, setScriptHistory] = useState([]); // State for script history
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [audioUrls, setAudioUrls] = useState([]);
  const [isPlaying, setIsPlaying] = useState({});
  const audioRefs = useRef({});
  const [generatingAudioForScript, setGeneratingAudioForScript] = useState({});
  const [currentScriptAudio, setCurrentScriptAudio] = useState(null);
  const [selectedVoice, setSelectedVoice] = useState("W0exs7yGL0OayYgDdJH7");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const voices = [
    { id: "W0exs7yGL0OayYgDdJH7", name: "Default Voice" },
    { id: "9BWtsMINqrJLrRacOk9x", name: "Aria", description: "Expressive American female" },
    { id: "CwhRBWXzGAHq8TQ4Fs17", name: "Roger", description: "Confident American male" },
    { id: "EXAVITQu4vr4xnSDxMaL", name: "Sarah", description: "Soft American female" },
    { id: "FGY2WhTYpPnrIDTdsKH5", name: "Laura", description: "Upbeat American female" },
    { id: "TX3LPaxmHKxFdv7VOQHJ", name: "Liam", description: "Articulate American male" },
    { id: "bIHbv24MWmeRgasZH58o", name: "Will", description: "Friendly American male" },
    { id: "pFZP5JQG7iQjIQuC4Bku", name: "Lily", description: "Warm British female" },
  ];

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

      // Save the generated script to Firebase
      const docRef = await addDoc(collection(db, "scripts"), {
        script: data.script,
        createdAt: new Date(),
        audioUrl: null,
        audioFilename: null,
      });

      // Update script history immediately
      setScriptHistory(prev => [{
        id: docRef.id,
        script: data.script,
        createdAt: new Date(),
        audioUrl: null,
        audioFilename: null,
      }, ...prev]);

    } catch (error) {
      console.error('Error during script generation:', error);
      setError(error.message || 'Error during script generation. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Function to format the script
  const formatScript = (script) => {
    if (!script) return null;
    
    const lines = script.split('\n');
    return (
      <div className="space-y-2">
        {lines.map((line, index) => {
          if (line.startsWith('Question:')) {
            return <p key={index} className="font-bold text-gray-900">{line}</p>;
          } else if (line.startsWith('Option')) {
            return <p key={index} className="ml-4 text-gray-700">{line}</p>;
          } else if (line.startsWith('CTA:')) {
            return <p key={index} className="font-semibold text-gray-800 mt-2">{line}</p>;
          } else if (line.trim()) { // Handle any other non-empty lines
            return <p key={index} className="text-gray-700">{line}</p>;
          }
          return null;
        }).filter(Boolean)}
      </div>
    );
  };

  // Function to copy the script to clipboard
  const copyScript = (script) => {
    navigator.clipboard.writeText(script)
      .then(() => alert('Script copied to clipboard!'))
      .catch(err => console.error('Failed to copy script: ', err));
  };

  // Fetch scripts from Firestore
  useEffect(() => {
    const fetchScripts = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "scripts"));
        const scripts = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setScriptHistory(scripts); // Set the fetched scripts to state
      } catch (error) {
        console.error("Error fetching scripts:", error);
      }
    };

    fetchScripts();
  }, []); // Empty dependency array to run once on mount

  const downloadScript = () => {
    const element = document.createElement("a");
    const file = new Blob([generatedScript], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = "generated_script.txt";
    document.body.appendChild(element);
    element.click();
  };

  const generateAudio = async () => {
    if (!generatedScript) {
      setError("Please generate a script first");
      return;
    }

    setIsGeneratingAudio(true);
    try {
      const response = await fetch('/api/generate-audio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          text: generatedScript,
          voiceId: selectedVoice 
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate audio.');
      }

      const data = await response.json();
      
      // Update the most recent script document with audio information
      const recentScript = scriptHistory[0];
      if (recentScript) {
        const scriptRef = doc(db, "scripts", recentScript.id);
        await updateDoc(scriptRef, {
          audioUrl: data.url,
          audioFilename: data.filename,
        });

        // Update local state
        setScriptHistory(prev => prev.map(script => 
          script.id === recentScript.id 
            ? { ...script, audioUrl: data.url, audioFilename: data.filename }
            : script
        ));

        // Set current script audio
        setCurrentScriptAudio({
          url: data.url,
          filename: data.filename,
        });
      }

    } catch (error) {
      console.error('Error generating audio:', error);
      setError(error.message || 'Error generating audio. Please try again.');
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  // Add these helper functions for audio playback
  const togglePlay = (audioId) => {
    const audio = audioRefs.current[audioId];
    if (!audio) return;

    if (isPlaying[audioId]) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(prev => ({
      ...prev,
      [audioId]: !prev[audioId]
    }));
  };

  const handleAudioEnd = (audioId) => {
    setIsPlaying(prev => ({
      ...prev,
      [audioId]: false
    }));
  };

  const generateAudioForScript = async (script) => {
    const scriptId = script.id;
    setGeneratingAudioForScript(prev => ({ ...prev, [scriptId]: true }));
    
    try {
      const response = await fetch('/api/generate-audio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          text: script.script,
          voiceId: selectedVoice 
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate audio.');
      }

      const data = await response.json();
      
      // Update the script document in Firestore with audio information
      const scriptRef = doc(db, "scripts", scriptId);
      await updateDoc(scriptRef, {
        audioUrl: data.url,
        audioFilename: data.filename,
      });

      // Update local state for script history
      setScriptHistory(prev => prev.map(s => 
        s.id === scriptId 
          ? { ...s, audioUrl: data.url, audioFilename: data.filename }
          : s
      ));

      // Add to audio URLs list
      setAudioUrls(prev => [...prev, {
        url: data.url,
        filename: data.filename,
        timestamp: new Date().toISOString(),
        script: script.script,
        scriptId: scriptId
      }]);

    } catch (error) {
      console.error('Error generating audio:', error);
      setError(error.message || 'Error generating audio. Please try again.');
    } finally {
      setGeneratingAudioForScript(prev => ({ ...prev, [scriptId]: false }));
    }
  };

  // Add function to find audio for a script
  const findAudioForScript = (scriptId) => {
    return audioUrls.find(audio => audio.scriptId === scriptId);
  };

  // Replace the existing downloadAudio function with this updated version
  const downloadAudio = async (audioUrl, filename) => {
    try {
      setError(""); // Clear any existing errors
      
      // Show loading state (optional)
      const loadingToast = alert("Downloading audio...");

      const response = await fetch(audioUrl, {
        method: 'GET',
        headers: {
          'Accept': 'audio/mpeg',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Get the blob from the response
      const blob = await response.blob();
      
      // Verify the blob
      if (!blob || blob.size === 0) {
        throw new Error('Received empty audio file');
      }

      // Create object URL
      const url = window.URL.createObjectURL(
        new Blob([blob], { type: 'audio/mpeg' })
      );

      // Create temporary link
      const link = document.createElement('a');
      link.href = url;
      link.download = filename || 'audio.mp3';

      // Append to document, click, and cleanup
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        document.body.removeChild(link);
      }, 100);

      // Success message (optional)
      alert("Download completed!");

    } catch (error) {
      console.error('Download error:', error);
      setError(`Failed to download audio file: ${error.message}`);
      alert("Download failed. Please try again.");
    }
  };

  const hasAudio = (script) => {
    return script.audioUrl && script.audioFilename;
  };

  // Add this function to properly format dates
  const formatDate = (timestamp) => {
    if (!timestamp) return 'Invalid Date';
    
    // Handle Firestore timestamp
    if (timestamp.seconds) {
      return new Date(timestamp.seconds * 1000).toLocaleString();
    }
    
    // Handle regular Date object or ISO string
    try {
      return new Date(timestamp).toLocaleString();
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid Date';
    }
  };

  // Add these new functions after the existing functions
  const deleteScript = async (scriptId) => {
    try {
      // Delete from Firestore
      await deleteDoc(doc(db, "scripts", scriptId));
      
      // Update local state
      setScriptHistory(prev => prev.filter(script => script.id !== scriptId));
    } catch (error) {
      console.error('Error deleting script:', error);
      setError('Failed to delete script');
    }
  };

  const regenerateScript = async (script) => {
    setError("");
    setIsGenerating(true);
    try {
      const response = await fetch('/api/generate-script', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ input: script.originalInput || "Default theme" }),
      });

      if (!response.ok) {
        throw new Error('Failed to regenerate script');
      }

      const data = await response.json();
      
      // Update in Firestore
      const scriptRef = doc(db, "scripts", script.id);
      await updateDoc(scriptRef, {
        script: data.script,
        updatedAt: new Date(),
      });

      // Update local state
      setScriptHistory(prev => prev.map(s => 
        s.id === script.id 
          ? { ...s, script: data.script, updatedAt: new Date() }
          : s
      ));

    } catch (error) {
      console.error('Error regenerating script:', error);
      setError('Failed to regenerate script');
    } finally {
      setIsGenerating(false);
    }
  };

  const [editingScript, setEditingScript] = useState(null);
  const [editedContent, setEditedContent] = useState("");

  const startEditing = (script) => {
    setEditingScript(script.id);
    setEditedContent(script.script);
  };

  const saveEdit = async (scriptId) => {
    try {
      // Update in Firestore
      const scriptRef = doc(db, "scripts", scriptId);
      await updateDoc(scriptRef, {
        script: editedContent,
        updatedAt: new Date(),
      });

      // Update local state
      setScriptHistory(prev => prev.map(s => 
        s.id === scriptId 
          ? { ...s, script: editedContent, updatedAt: new Date() }
          : s
      ));

      setEditingScript(null);
      setEditedContent("");
    } catch (error) {
      console.error('Error saving edit:', error);
      setError('Failed to save edit');
    }
  };

  // Add this function near your other state management code
  const sortedScriptHistory = [...scriptHistory].sort((a, b) => {
    const dateA = a.updatedAt || a.createdAt;
    const dateB = b.updatedAt || b.createdAt;
    return new Date(dateB?.seconds * 1000 || dateB) - new Date(dateA?.seconds * 1000 || dateA);
  });

  // Add this function to handle pagination
  const paginate = (items) => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return items.slice(startIndex, endIndex);
  };

  // Add this function to calculate total pages
  const totalPages = Math.ceil(scriptHistory.length / itemsPerPage);

  // Add pagination controls component
  const PaginationControls = () => {
    return (
      <div className="flex justify-center items-center space-x-2 mt-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
          disabled={currentPage === 1}
        >
          Previous
        </Button>
        <span className="text-sm">
          Page {currentPage} of {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
          disabled={currentPage === totalPages}
        >
          Next
        </Button>
      </div>
    );
  };

  // Modify the script history section to use pagination
  // Replace the existing script history section with this updated version
  <div className="bg-white shadow rounded-lg p-6 mt-6">
    <h2 className="text-xl font-semibold mb-4">Script History</h2>
    <div className="grid grid-cols-1 gap-4">
      {paginate([...scriptHistory].sort((a, b) => {
        const dateA = a.updatedAt || a.createdAt;
        const dateB = b.updatedAt || b.createdAt;
        return new Date(dateB?.seconds * 1000 || dateB) - new Date(dateA?.seconds * 1000 || dateA);
      })).map(script => (
        <div key={script.id} className="border rounded-lg p-4 shadow hover:shadow-lg transition-shadow duration-200">
          <div className="mb-4">
            {editingScript === script.id ? (
              <div className="space-y-2">
                <Textarea
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  className="w-full min-h-[100px]"
                />
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => saveEdit(script.id)}
                  >
                    Save
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setEditingScript(null)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              formatScript(script.script)
            )}
          </div>
          <div className="flex justify-between items-center mt-4">
            <p className="text-sm text-gray-500">
              {formatDate(script.createdAt)}
              {script.updatedAt && ` (Updated: ${formatDate(script.updatedAt)})`}
            </p>
            <div className="flex space-x-2">
              {hasAudio(script) ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => togglePlay(script.audioFilename)}
                    className="flex items-center"
                  >
                    {isPlaying[script.audioFilename] ? (
                      <Pause className="w-4 h-4" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                    <audio
                      ref={el => audioRefs.current[script.audioFilename] = el}
                      src={script.audioUrl}
                      onEnded={() => handleAudioEnd(script.audioFilename)}
                      className="hidden"
                    />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => downloadAudio(script.audioUrl, script.audioFilename)}
                    className="flex items-center"
                  >
                    <Download className="w-4 h-4 mr-2" />
                  </Button>
                </>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => generateAudioForScript(script)}
                  disabled={generatingAudioForScript[script.id]}
                  className="flex items-center"
                >
                  {generatingAudioForScript[script.id] ? (
                    <>
                      <Volume2 className="w-4 h-4 mr-2 animate-pulse" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-4 h-4 mr-2" />
                      Generate Audio
                    </>
                  )}
                </Button>
              )}
              
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => startEditing(script)}
                className="flex items-center"
                disabled={editingScript === script.id}
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => regenerateScript(script)}
                className="flex items-center"
                disabled={isGenerating}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Regenerate
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => deleteScript(script.id)}
                className="flex items-center text-red-600 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => copyScript(script.script)}
                className="flex items-center"
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
    {scriptHistory.length > itemsPerPage && <PaginationControls />}
  </div>

  // Add useEffect to handle page reset when history changes
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [scriptHistory.length]);

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

          <div className="mb-6">
            <Label htmlFor="voice" className="block text-sm font-medium text-gray-700 mb-2">
              Select Voice
            </Label>
            <Select value={selectedVoice} onValueChange={setSelectedVoice}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a voice" />
              </SelectTrigger>
              <SelectContent>
                {voices.map((voice) => (
                  <SelectItem key={voice.id} value={voice.id}>
                    {voice.name} {voice.description && `- ${voice.description}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
            <Button onClick={generateScript} className="flex-1" disabled={isGenerating}>
              {isGenerating ? 'Generating...' : 'Generate Script'}
            </Button>
            <Button 
              variant="outline" 
              className="flex items-center" 
              onClick={generateAudio}
              disabled={isGeneratingAudio || !generatedScript}
            >
              {isGeneratingAudio ? (
                <>
                  <Volume2 className="w-4 h-4 mr-2 animate-pulse" />
                  Generating...
                </>
              ) : (
                <>
                  <Volume2 className="w-4 h-4 mr-2" />
                  Generate Audio
                </>
              )}
            </Button>
          </div>
          {error && (
            <p className="text-red-500 mt-2">
              {error.includes('audio') ? '🔊 ' : '📝 '}
              {error}
            </p>
          )}
        </div>
        
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Script Preview</h2>
          <Textarea
            value={generatedScript}
            readOnly
            className="w-full h-40 mb-4 p-2 border rounded"
          />
          <div className="flex justify-end space-x-4">
            {currentScriptAudio && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => togglePlay(currentScriptAudio.filename)}
                  className="flex items-center"
                >
                  {isPlaying[currentScriptAudio.filename] ? (
                    <Pause className="w-4 h-4 mr-2" />
                  ) : (
                    <Play className="w-4 h-4 mr-2" />
                  )}
                  {isPlaying[currentScriptAudio.filename] ? 'Pause' : 'Play'}
                </Button>
                <audio
                  ref={el => audioRefs.current[currentScriptAudio.filename] = el}
                  src={currentScriptAudio.url}
                  onEnded={() => handleAudioEnd(currentScriptAudio.filename)}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => downloadAudio(currentScriptAudio.url, currentScriptAudio.filename)}
                  className="flex items-center"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Audio
                </Button>
              </>
            )}
            <Button variant="outline" size="sm" className="flex items-center" onClick={() => copyScript(generatedScript)}>
              <Copy className="w-4 h-4 mr-2" />
              Copy Script
            </Button>
            <Button variant="outline" size="sm" className="flex items-center" onClick={downloadScript}>
              <Download className="w-4 h-4 mr-2" />
              Download Script
            </Button>
          </div>
        </div>
        
        <div className="bg-white shadow rounded-lg p-6 mt-6">
          <h2 className="text-xl font-semibold mb-4">Script History</h2>
          <div className="grid grid-cols-1 gap-4">
            {paginate([...scriptHistory].sort((a, b) => {
              const dateA = a.updatedAt || a.createdAt;
              const dateB = b.updatedAt || b.createdAt;
              return new Date(dateB?.seconds * 1000 || dateB) - new Date(dateA?.seconds * 1000 || dateA);
            })).map(script => (
              <div key={script.id} className="border rounded-lg p-4 shadow hover:shadow-lg transition-shadow duration-200">
                <div className="mb-4">
                  {editingScript === script.id ? (
                    <div className="space-y-2">
                      <Textarea
                        value={editedContent}
                        onChange={(e) => setEditedContent(e.target.value)}
                        className="w-full min-h-[100px]"
                      />
                      <div className="flex space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => saveEdit(script.id)}
                        >
                          Save
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => setEditingScript(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    formatScript(script.script)
                  )}
                </div>
                <div className="flex justify-between items-center mt-4">
                  <p className="text-sm text-gray-500">
                    {formatDate(script.createdAt)}
                    {script.updatedAt && ` (Updated: ${formatDate(script.updatedAt)})`}
                  </p>
                  <div className="flex space-x-2">
                    {hasAudio(script) ? (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => togglePlay(script.audioFilename)}
                          className="flex items-center"
                        >
                          {isPlaying[script.audioFilename] ? (
                            <Pause className="w-4 h-4" />
                          ) : (
                            <Play className="w-4 h-4" />
                          )}
                          <audio
                            ref={el => audioRefs.current[script.audioFilename] = el}
                            src={script.audioUrl}
                            onEnded={() => handleAudioEnd(script.audioFilename)}
                            className="hidden"
                          />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => downloadAudio(script.audioUrl, script.audioFilename)}
                          className="flex items-center"
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => generateAudioForScript(script)}
                        disabled={generatingAudioForScript[script.id]}
                        className="flex items-center"
                      >
                        {generatingAudioForScript[script.id] ? (
                          <>
                            <Volume2 className="w-4 h-4 mr-2 animate-pulse" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Volume2 className="w-4 h-4 mr-2" />
                            Generate Audio
                          </>
                        )}
                      </Button>
                    )}
                    
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => startEditing(script)}
                      className="flex items-center"
                      disabled={editingScript === script.id}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => regenerateScript(script)}
                      className="flex items-center"
                      disabled={isGenerating}
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Regenerate
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => deleteScript(script.id)}
                      className="flex items-center text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => copyScript(script.script)}
                      className="flex items-center"
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Copy
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {scriptHistory.length > itemsPerPage && <PaginationControls />}
        </div>
        
      
      </div>
    </div>
  );
}
