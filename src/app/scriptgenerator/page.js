"use client";
import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Copy, Download, Edit, RefreshCw, Trash2, Zap } from "lucide-react";
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, where, Timestamp, orderBy, limit } from "firebase/firestore";

import AuthCheck from '@/components/auth-check';
import { useAuth } from '@/lib/auth-context';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import debounce from 'lodash/debounce';
import { db } from "@/lib/firebase"; // Ensure db is imported if not already

export default function ScriptGenerator() {
  const [input, setInput] = useState("");
  const [generatedScript, setGeneratedScript] = useState("");
  const [error, setError] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [scriptHistory, setScriptHistory] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [totalPages, setTotalPages] = useState(1);
  const [generationLimit, setGenerationLimit] = useState(null);
  const [activeSubscription, setActiveSubscription] = useState(null);
  const router = useRouter();
  const { user } = useAuth();

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

  const generateScript = useCallback(async () => {
    if (!user) return;
    if (!input || !input.trim()) {
      toast.error('Please enter a prompt first');
      return;
    }

    setIsGenerating(true);
    setError('');

    try {
      const scriptData = {
        userId: user.uid,
        input: input.trim(),
        script: '',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        status: 'generating'
      };

      const docRef = await addDoc(collection(db, 'scripts'), scriptData);

      const response = await fetch('/api/generate-script', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ input: input.trim() }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate script');
      }

      const data = await response.json();

      await updateDoc(doc(db, 'scripts', docRef.id), {
        script: data.script,
        updatedAt: Timestamp.now(),
        status: 'completed'
      });

      setGeneratedScript(data.script);
      fetchScriptHistory();
      toast.success('Script generated successfully!');

    } catch (error) {
      console.error('Error generating script:', error);
      toast.error('Failed to generate script');
    } finally {
      setIsGenerating(false);
    }
  }, [user, input, fetchScriptHistory]);

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
          } else if (line.trim()) {
            return <p key={index} className="text-gray-700">{line}</p>;
          }
          return null;
        }).filter(Boolean)}
      </div>
    );
  };

  const copyScript = (script) => {
    navigator.clipboard.writeText(script)
      .then(() => alert('Script copied to clipboard!'))
      .catch(err => console.error('Failed to copy script: ', err));
  };

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
    const file = new Blob([generatedScript], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = "generated_script.txt";
    document.body.appendChild(element);
    element.click();
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Invalid Date';

    try {
      if (timestamp.seconds) {
        return new Date(timestamp.seconds * 1000).toLocaleString();
      }
      if (timestamp instanceof Date) {
        return timestamp.toLocaleString();
      }
      return new Date(timestamp).toLocaleString();
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid Date';
    }
  };

  const deleteScript = async (scriptId) => {
    try {
      await deleteDoc(doc(db, "scripts", scriptId));
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

      const scriptRef = doc(db, "scripts", script.id);
      await updateDoc(scriptRef, {
        script: data.script,
        updatedAt: new Date(),
      });

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
      const scriptRef = doc(db, "scripts", scriptId);
      await updateDoc(scriptRef, {
        script: editedContent,
        updatedAt: new Date(),
      });

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

  const sortedScriptHistory = [...scriptHistory].sort((a, b) => {
    const getTime = (timestamp) => {
      if (!timestamp) return 0;
      if (timestamp.seconds) return timestamp.seconds * 1000;
      if (timestamp instanceof Date) return timestamp.getTime();
      return new Date(timestamp).getTime();
    };

    const timeA = getTime(a.createdAt);
    const timeB = getTime(b.createdAt);
    return timeB - timeA;
  });

  const paginate = (items) => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return items.slice(startIndex, startIndex + itemsPerPage);
  };

  useEffect(() => {
    if (scriptHistory.length > 0) {
      const calculatedTotalPages = Math.ceil(scriptHistory.length / itemsPerPage);
      setTotalPages(calculatedTotalPages);
      if (currentPage > calculatedTotalPages) {
        setCurrentPage(1);
      }
    }
  }, [scriptHistory, currentPage, itemsPerPage]);

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

  const debouncedInputChange = useCallback(
    debounce((value) => setInput(value), 300),
    []
  );

  const [isLoading, setIsLoading] = useState(true);

  return (
    <AuthCheck>
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
                    </div>
                  </div>
                  <div className="prose dark:prose-invert max-w-none text-sm sm:text-base">
                    {formatScript(generatedScript)}
                  </div>
                </div>
              )}

              {scriptHistory.length > 0 && (
                <div className="bg-white dark:bg-[#171717] rounded-lg shadow-sm p-4 sm:p-6">
                  <h2 className="text-lg sm:text-xl font-semibold mb-4">Script History</h2>
                  <div className="space-y-4">
                    {paginate(sortedScriptHistory).map(script => (
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

                            <Button
                              onClick={() => startEditing(script)}
                              size="sm"
                              variant="outline"
                              className="text-xs sm:text-sm"
                              disabled={editingScript === script.id}
                            >
                              <Edit className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                              Edit
                            </Button>
                            <Button
                              onClick={() => regenerateScript(script)}
                              size="sm"
                              variant="outline"
                              className="text-xs sm:text-sm"
                              disabled={isGenerating}
                            >
                              <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                              Regenerate
                            </Button>
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
                            <div className="prose dark:prose-invert max-w-none text-sm">
                              {formatScript(script.script)}
                            </div>
                          )}
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
    </AuthCheck>
  );
}
