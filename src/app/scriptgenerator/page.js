"use client";
import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Copy, Download, Volume2, Play, Pause, Edit, RefreshCw, Trash2, Zap } from "lucide-react";
import { db, storage } from "@/lib/firebase"; // Import your Firebase configuration
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, where, Timestamp, orderBy, limit } from "firebase/firestore"; // Import Firestore functions
import { ref, getDownloadURL } from "firebase/storage";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AuthCheck from '@/components/auth-check';
import { useAuth } from '@/lib/auth-context';
import SubscriptionCheck from '@/components/subscription-check';
import { checkScriptGenerationLimit } from '@/lib/script-limits';
import { getUserSubscription } from '@/lib/subscription';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import debounce from 'lodash/debounce';

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
  const [selectedVoice, setSelectedVoice] = useState("9BWtsMINqrJLrRacOk9x");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [totalPages, setTotalPages] = useState(1);
  const [generationLimit, setGenerationLimit] = useState(null);
  const [activeSubscription, setActiveSubscription] = useState(null);
  const router = useRouter();
  const { user } = useAuth();

  // Function to fetch script history - moved to top
  const fetchScriptHistory = useCallback(async () => {
    if (!user) return;
    
    try {
      const scriptsRef = collection(db, "scripts");
      const q = query(
        scriptsRef, 
        where("userId", "==", user.uid),
        orderBy("createdAt", "desc"),
        limit(10)
      );
      
      const querySnapshot = await getDocs(q);
      const scripts = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setScriptHistory(scripts);
    } catch (error) {
      console.error("Error fetching scripts:", error);
      toast.error("Failed to load script history");
    }
  }, [user]);

  const voices = useMemo(() => [
    { id: "9BWtsMINqrJLrRacOk9x", name: "Default Voice", description: "Expressive American female" },
    { id: "CwhRBWXzGAHq8TQ4Fs17", name: "Roger", description: "Confident American male" },
    { id: "EXAVITQu4vr4xnSDxMaL", name: "Sarah", description: "Soft American female" },
    { id: "FGY2WhTYpPnrIDTdsKH5", name: "Laura", description: "Upbeat American female" },
    { id: "TX3LPaxmHKxFdv7VOQHJ", name: "Liam", description: "Articulate American male" },
    { id: "bIHbv24MWmeRgasZH58o", name: "Will", description: "Friendly American male" },
    { id: "pFZP5JQG7iQjIQuC4Bku", name: "Lily", description: "Warm British female" },
  ], []);

  // Add this new useEffect to monitor generationLimit changes
  useEffect(() => {
    console.log('Generation limit state updated:', generationLimit);
  }, [generationLimit]);

  // Restore subscription and limits effect
  useEffect(() => {
    const fetchSubscriptionAndLimits = async () => {
      if (!user) return;

      try {
        // Add a small delay to ensure auth is fully initialized
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Get user's active subscription with forced refresh
        const subscription = await getUserSubscription(user.uid, true);
        console.log('Debug - Fetched Subscription:', subscription);
        
        // Always ensure we have valid plan details
        if (!subscription.planDetails || subscription.planDetails.name !== subscription.planName) {
          subscription.planDetails = PLAN_DETAILS[subscription.planName || 'Free'];
        }
        
        setActiveSubscription(subscription);

        // Check generation limits with the corrected subscription
        const limits = await checkScriptGenerationLimit(user.uid);
        console.log('Debug - Generation limits:', limits);
        
        setGenerationLimit(limits);
      } catch (error) {
        console.error('Error fetching subscription data:', error);
        // Set default free plan on error
        const defaultSubscription = {
          userId: user.uid,
          planName: 'Free',
          planDetails: PLAN_DETAILS['Free'],
          status: 'active'
        };
        setActiveSubscription(defaultSubscription);
        setGenerationLimit({
          total: 5,
          used: 0,
          remaining: 5,
          limitType: 'total'
        });
        toast.error('Error loading subscription. Using free plan limits.');
      }
    };

    if (user) {
      fetchSubscriptionAndLimits();
    }
  }, [user]);

  const generateScript = useCallback(async () => {
    if (!user) return;
    setIsGenerating(true);
    setError('');
    
    try {
      const limits = await checkScriptGenerationLimit(user.uid);
      if (limits.remaining === 0) {
        toast.error(limits.limitType === 'total' 
          ? `You've reached your total limit of ${limits.total} scripts.`
          : `You've reached your daily limit of ${limits.total} scripts.`);
        return;
      }

      // Add timestamp to the script data
      const scriptData = {
        userId: user.uid,
        input: input,
        script: '', // Will be updated after generation
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        status: 'generating'
      };

      // Add the script to Firestore first
      const docRef = await addDoc(collection(db, 'scripts'), scriptData);

      // Generate the script
      const response = await fetch('/api/generate-script', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: input }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate script');
      }

      const data = await response.json();
      
      // Update the script document with the generated content
      await updateDoc(doc(db, 'scripts', docRef.id), {
        script: data.script,
        updatedAt: Timestamp.now(),
        status: 'completed'
      });

      setGeneratedScript(data.script);
      
      // Update limits after successful generation
      const newLimits = await checkScriptGenerationLimit(user.uid);
      setGenerationLimit(newLimits);

      // Refresh script history
      fetchScriptHistory();
      
      // Show success message
      toast.success('Script generated successfully!');
      
    } catch (error) {
      console.error('Error generating script:', error);
      toast.error('Failed to generate script');
    } finally {
      setIsGenerating(false);
    }
  }, [user, input, fetchScriptHistory]);

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

  const generateAudio = async (scriptText, scriptId) => {
    if (!scriptText) {
      toast.error("Please generate a script first");
      return;
    }

    try {
      setGeneratingAudioForScript(prev => ({ ...prev, [scriptId]: true }));
      
      const response = await fetch('/api/generate-audio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          text: scriptText,
          voiceId: selectedVoice 
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate audio.');
      }

      const data = await response.json();
      
      // Update the script document with audio information
      if (scriptId) {
        const scriptRef = doc(db, "scripts", scriptId);
        await updateDoc(scriptRef, {
          audioUrl: data.url,
          audioFilename: data.filename,
          voiceId: selectedVoice,
          updatedAt: Timestamp.now()
        });

        // Refresh script history to show new audio
        fetchScriptHistory();
      }

      toast.success('Audio generated successfully!');
      return data;
    } catch (error) {
      console.error('Error generating audio:', error);
      toast.error(error.message || 'Failed to generate audio');
    } finally {
      setGeneratingAudioForScript(prev => ({ ...prev, [scriptId]: false }));
    }
  };

  // Fetch script history on mount and when user changes
  useEffect(() => {
    fetchScriptHistory();
  }, [fetchScriptHistory]);

  // Add these helper functions for audio playback
  const togglePlay = (audioId) => {
    const audio = audioRefs.current[audioId];
    if (!audio) return;

    if (isPlaying[audioId]) {
      audio.pause();
    } else {
      // Pause any currently playing audio
      Object.keys(audioRefs.current).forEach(key => {
        if (key !== audioId && audioRefs.current[key]) {
          audioRefs.current[key].pause();
          setIsPlaying(prev => ({ ...prev, [key]: false }));
        }
      });
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
                  onClick={() => generateAudio(script.script, script.id)}
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

  // Add debounce for input changes
  const debouncedInputChange = useCallback(
    debounce((value) => setInput(value), 300),
    []
  );

  // Add loading state for initial data fetch
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchInitialData = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        
        // Fetch subscription and limits in parallel
        const [subscription, limits] = await Promise.all([
          getUserSubscription(user.uid, true),
          checkScriptGenerationLimit(user.uid)
        ]);
        
        setActiveSubscription(subscription);
        setGenerationLimit(limits);
        
        // Fetch script history
        const scriptsRef = collection(db, 'scripts');
        const q = query(
          scriptsRef,
          where('userId', '==', user.uid),
          orderBy('createdAt', 'desc'),
          limit(itemsPerPage)
        );
        
        const querySnapshot = await getDocs(q);
        const scripts = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setScriptHistory(scripts);
        
      } catch (error) {
        console.error('Error fetching initial data:', error);
        toast.error('Failed to load data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialData();
  }, [user]);

  return (
    <AuthCheck>
      <SubscriptionCheck>
        <div className="min-h-screen bg-gray-50 dark:bg-[#121212] p-4 sm:p-6">
          <div className="max-w-7xl mx-auto">
            <div className="container mx-auto px-4">
              <div className="max-w-4xl mx-auto">
                <h1 className="text-4xl font-bold text-center mb-12 bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-orange-600">
                  Youtube CTA Shorts Script Generator
                </h1>
                
                <div className="bg-white dark:bg-[#171717] rounded-lg shadow-sm p-4 sm:p-6 mb-6">
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm sm:text-base mb-2 block">Enter your prompt</Label>
                      <Textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Enter your prompt here..."
                        className="w-full min-h-[100px] text-sm sm:text-base"
                      />
                    </div>
                    
                    <div className="space-y-3 sm:space-y-0 sm:flex sm:items-center sm:space-x-4">
                      <Select value={selectedVoice} onValueChange={setSelectedVoice}>
                        <SelectTrigger className="w-full sm:w-[200px] text-sm sm:text-base">
                          <SelectValue placeholder="Select voice" />
                        </SelectTrigger>
                        <SelectContent>
                          {voices.map((voice) => (
                            <SelectItem key={voice.id} value={voice.id} className="text-sm sm:text-base">
                              {voice.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Button
                        onClick={generateScript}
                        disabled={isGenerating || !input.trim()}
                        className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600 text-white text-sm sm:text-base"
                      >
                        {isGenerating ? (
                          <div className="flex items-center space-x-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            <span>Generating...</span>
                          </div>
                        ) : (
                          'Generate Script'
                        )}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Generated Script Section */}
                {generatedScript && (
                  <div className="bg-white dark:bg-[#171717] rounded-lg shadow-sm p-4 sm:p-6 mb-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
                      <h2 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-0">Generated Script</h2>
                      <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                        <Button
                          onClick={() => copyScript(generatedScript)}
                          className="w-full sm:w-auto text-sm sm:text-base"
                          variant="outline"
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          Copy
                        </Button>
                        <Button
                          onClick={downloadScript}
                          className="w-full sm:w-auto text-sm sm:text-base"
                          variant="outline"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                        <Button
                          onClick={() => generateAudio(generatedScript, scriptHistory[0]?.id)}
                          disabled={isGeneratingAudio}
                          className="w-full sm:w-auto text-sm sm:text-base"
                          variant="outline"
                        >
                          <Volume2 className="h-4 w-4 mr-2" />
                          {isGeneratingAudio ? 'Generating Audio...' : 'Generate Audio'}
                        </Button>
                      </div>
                    </div>
                    <div className="prose dark:prose-invert max-w-none text-sm sm:text-base">
                      {formatScript(generatedScript)}
                    </div>
                  </div>
                )}

                {/* Script History Section */}
                {scriptHistory.length > 0 && (
                  <div className="bg-white dark:bg-[#171717] rounded-lg shadow-sm p-4 sm:p-6">
                    <h2 className="text-lg sm:text-xl font-semibold mb-4">Script History</h2>
                    <div className="space-y-4">
                      {scriptHistory.map((script) => (
                        <div
                          key={script.id}
                          className="border dark:border-gray-700 rounded-lg p-3 sm:p-4"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2">
                            <div className="flex flex-col mb-2 sm:mb-0">
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                {script.createdAt?.toDate?.() ? new Date(script.createdAt.toDate()).toLocaleString() : 'Unknown date'}
                              </p>
                              {script.status === 'generating' && (
                                <span className="inline-flex items-center text-xs text-orange-500">
                                  <span className="mr-1">●</span> Generating...
                                </span>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <Button
                                onClick={() => copyScript(script.script)}
                                size="sm"
                                variant="outline"
                                className="text-xs sm:text-sm"
                              >
                                <Copy className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                                Copy
                              </Button>
                              {hasAudio(script) ? (
                                <>
                                  <Button
                                    onClick={() => togglePlay(script.id)}
                                    size="sm"
                                    variant="outline"
                                    className="text-xs sm:text-sm"
                                  >
                                    {isPlaying[script.id] ? (
                                      <>
                                        <Pause className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                                        Pause
                                      </>
                                    ) : (
                                      <>
                                        <Play className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                                        Play
                                      </>
                                    )}
                                  </Button>
                                  <audio
                                    ref={el => audioRefs.current[script.id] = el}
                                    src={script.audioUrl}
                                    onEnded={() => handleAudioEnd(script.id)}
                                    className="hidden"
                                  />
                                  <Button
                                    onClick={() => downloadAudio(script.audioUrl, script.audioFilename)}
                                    size="sm"
                                    variant="outline"
                                    className="text-xs sm:text-sm"
                                  >
                                    <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                                    Audio
                                  </Button>
                                </>
                              ) : (
                                <Button
                                  onClick={() => generateAudio(script.script, script.id)}
                                  size="sm"
                                  variant="outline"
                                  className="text-xs sm:text-sm"
                                  disabled={generatingAudioForScript[script.id]}
                                >
                                  <Volume2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                                  {generatingAudioForScript[script.id] ? 'Generating...' : 'Generate Audio'}
                                </Button>
                              )}
                              <Button
                                onClick={() => deleteScript(script.id)}
                                size="sm"
                                variant="outline"
                                className="text-xs sm:text-sm text-red-500 hover:text-red-600"
                              >
                                <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                                Delete
                              </Button>
                            </div>
                          </div>
                          <div className="prose dark:prose-invert max-w-none text-sm">
                            {formatScript(script.script)}
                          </div>
                        </div>
                      ))}
                    </div>
                    <PaginationControls />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </SubscriptionCheck>
    </AuthCheck>
  );
}
