"use client";
import { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Copy, Download, Volume2, Play, Pause, Edit, RefreshCw, Trash2 } from "lucide-react";
import { db, storage } from "@/lib/firebase"; // Import your Firebase configuration
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, where } from "firebase/firestore"; // Import Firestore functions
import { ref, getDownloadURL } from "firebase/storage";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AuthCheck from '@/components/auth-check';
import { useAuth } from '@/lib/auth-context';

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
  const [selectedVoice, setSelectedVoice] = useState("9BWtsMINqrJLrRacOk9x");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [totalPages, setTotalPages] = useState(1);

  const voices = [
    { id: "9BWtsMINqrJLrRacOk9x", name: "Default Voice", description: "Expressive American female" },
    { id: "CwhRBWXzGAHq8TQ4Fs17", name: "Roger", description: "Confident American male" },
    { id: "EXAVITQu4vr4xnSDxMaL", name: "Sarah", description: "Soft American female" },
    { id: "FGY2WhTYpPnrIDTdsKH5", name: "Laura", description: "Upbeat American female" },
    { id: "TX3LPaxmHKxFdv7VOQHJ", name: "Liam", description: "Articulate American male" },
    { id: "bIHbv24MWmeRgasZH58o", name: "Will", description: "Friendly American male" },
    { id: "pFZP5JQG7iQjIQuC4Bku", name: "Lily", description: "Warm British female" },
  ];

  const { user } = useAuth();

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
        userId: user.uid
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
      if (!user) return;
      
      try {
        const scriptsRef = collection(db, "scripts");
        const q = query(scriptsRef, where("userId", "==", user.uid));
        const querySnapshot = await getDocs(q);
        const scripts = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setScriptHistory(scripts);
      } catch (error) {
        console.error("Error fetching scripts:", error);
      }
    };

    fetchScripts();
  }, [user]);

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
    
    try {
      // Handle Firestore timestamp
      if (timestamp.seconds) {
        return new Date(timestamp.seconds * 1000).toLocaleString();
      }
      
      // Handle Date object
      if (timestamp instanceof Date) {
        return timestamp.toLocaleString();
      }
      
      // Handle string or number
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

  // Add these functions near the top of your component, after the state declarations
  const sortedScriptHistory = [...scriptHistory].sort((a, b) => {
    // Handle Firestore timestamps
    const getTime = (timestamp) => {
      if (!timestamp) return 0;
      if (timestamp.seconds) return timestamp.seconds * 1000;
      if (timestamp instanceof Date) return timestamp.getTime();
      return new Date(timestamp).getTime();
    };

    const timeA = getTime(a.createdAt);
    const timeB = getTime(b.createdAt);
    return timeB - timeA; // Changed the order here to sort descending (newest first)
  });

  const paginate = (items) => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return items.slice(startIndex, startIndex + itemsPerPage);
  };

  // Update the useEffect for pagination
  useEffect(() => {
    if (scriptHistory.length > 0) {
      const calculatedTotalPages = Math.ceil(scriptHistory.length / itemsPerPage);
      setTotalPages(calculatedTotalPages);
      if (currentPage > calculatedTotalPages) {
        setCurrentPage(1);
      }
    }
  }, [scriptHistory, currentPage, itemsPerPage]);

  // Keep the PaginationControls component
  const PaginationControls = () => {
    if (scriptHistory.length <= itemsPerPage) return null;
    
    return (
      <div className="flex justify-center items-center space-x-2 mt-6">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
          disabled={currentPage === 1}
          className="text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          Previous
        </Button>
        <span className="text-sm text-gray-700 dark:text-gray-200">
          Page {currentPage} of {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
          disabled={currentPage === totalPages}
          className="text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          Next
        </Button>
      </div>
    );
  };

  // Update the script history section in your JSX
  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 mt-6">
    <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Script History</h2>
    <div className="grid grid-cols-1 gap-4">
      {paginate(sortedScriptHistory).map(script => (
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
    <PaginationControls />
  </div>

  return (
    <AuthCheck>
      <div className="min-h-screen bg-white dark:bg-[#121212] py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl font-bold text-center mb-12 bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-orange-600">
              Youtube CTA Shorts Script Generator
            </h1>
            
            <div className="bg-white dark:bg-[#121212] border border-gray-200 dark:border-gray-800 rounded-lg p-8 mb-8 shadow-lg">
              <div className="space-y-6">
                <div>
                  <Label htmlFor="input" className="block text-sm font-medium text-black dark:text-white mb-2">
                    Enter Theme, Title, or Keyword
                  </Label>
                  <Input
                    id="input"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Enter your theme, title, or keyword..."
                    className="w-full dark:bg-[#121212] dark:border-gray-700 text-white placeholder-gray-400"
                  />
                </div>
                
                <div>
                  <Label className="block text-sm font-medium text-black dark:text-white mb-2">
                    Select Voice
                  </Label>
                  <Select value={selectedVoice} onValueChange={setSelectedVoice}>
                    <SelectTrigger className="w-full dark:bg-[#121212] border-gray-300 dark:border-gray-700 text-white">
                      <SelectValue placeholder="Select a voice" />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                      {voices.map((voice) => (
                        <SelectItem 
                          key={voice.id} 
                          value={voice.id}
                          className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          {voice.name} {voice.description && `- ${voice.description}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button 
                  onClick={generateScript}
                  disabled={isGenerating || !input.trim()}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                >
                  {isGenerating ? "Generating..." : "Generate Script"}
                </Button>
              </div>
            </div>

            {generatedScript && (
              <div className="bg-white dark:bg-[#121212] border border-gray-200 dark:border-gray-800 rounded-lg p-8 mb-8 shadow-lg">
                <h2 className="text-xl font-bold mb-6 text-white">Script Preview</h2>
                <Textarea
                  value={generatedScript}
                  readOnly
                  className="w-full h-40 mb-4 p-2 border rounded bg-gray-50 dark:bg-[#121212] text-gray-900 dark:text-white border-gray-300 dark:border-gray-700"
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
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex items-center text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() => copyScript(generatedScript)}
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Script
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex items-center text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={downloadScript}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download Script
                  </Button>
                </div>
              </div>
            )}

            <div className="bg-white dark:bg-[#121212] border border-gray-200 dark:border-gray-800 rounded-lg p-8 shadow-lg">
              <h2 className="text-xl font-bold mb-6 text-black dark:text-white">Script History</h2>
              <div className="grid grid-cols-1 gap-4">
                {paginate(sortedScriptHistory).map(script => (
                  <div key={script.id} className="border  border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-[#121212] hover:bg-gray-100 dark:hover:bg-[#00000038] transition-colors duration-200">
                    <div className="mb-4 ">
                      {editingScript === script.id ? (
                        <div className="space-y-2 ">
                          <Textarea
                            value={editedContent}
                            onChange={(e) => setEditedContent(e.target.value)}
                            className="w-full min-h-[100px] "
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
                      <p className="text-sm text-">
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
                              className="flex items-center  text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#121212]"
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
                              className="flex items-center  text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
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
                            className="flex items-center  text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700" 
                          >
                            {generatingAudioForScript[script.id] ? (
                              <>
                                <Volume2 className="w-4 h-4 mr-2 animate-pulse  text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700" />
                                Generating...
                              </>
                            ) : (
                              <>
                                <Volume2 className="w-4 h-4 mr-2  text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700" />
                                Generate Audio
                              </>
                            )}
                          </Button>
                        )}
                        
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="flex items-center text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                          onClick={() => startEditing(script)}
                          disabled={editingScript === script.id}
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="flex items-center text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                          onClick={() => regenerateScript(script)}
                          disabled={isGenerating}
                        >
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Regenerate
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="flex items-center text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-500/10"
                          onClick={() => deleteScript(script.id)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="flex items-center text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                          onClick={() => copyScript(script.script)}
                        >
                          <Copy className="w-4 h-4 mr-2" />
                          Copy
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthCheck>
  );
}
