import { storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { text, voiceId } = await req.json();

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: "Invalid text input" },
        { status: 400 }
      );
    }

    if (!voiceId || typeof voiceId !== 'string') {
      return NextResponse.json(
        { error: "Invalid voice ID" },
        { status: 400 }
      );
    }

    const ELEVEN_LABS_API_KEY = process.env.ELEVEN_LABS_API_KEY;
    if (!ELEVEN_LABS_API_KEY) {
      console.error('ElevenLabs API key is missing');
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    // Call ElevenLabs API
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': ELEVEN_LABS_API_KEY
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_turbo_v2_5",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.5
          }
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ElevenLabs API error:', errorText);
      return NextResponse.json(
        { error: "Failed to generate audio" },
        { status: response.status }
      );
    }

    // Get audio data
    const audioData = await response.arrayBuffer();
    
    // Generate unique filename
    const filename = `audio_${Date.now()}_${Math.random().toString(36).substring(7)}.mp3`;
    
    try {
      // Upload to Firebase Storage
      const storageRef = ref(storage, `audio/${filename}`);
      await uploadBytes(storageRef, audioData);
      
      // Get download URL
      const downloadURL = await getDownloadURL(storageRef);
      
      return NextResponse.json({ 
        audioUrl: downloadURL,
        filename
      });
    } catch (storageError) {
      console.error('Firebase Storage error:', storageError);
      return NextResponse.json(
        { error: "Failed to store audio file" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 