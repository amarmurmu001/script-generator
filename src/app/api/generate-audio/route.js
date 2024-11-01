import { NextResponse } from 'next/server';
import { storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export async function POST(req) {
  try {
    const { text, voiceId = '9BWtsMINqrJLrRacOk9x' } = await req.json();

    console.log('Received text for audio generation:', text);
    console.log('Using voice ID:', voiceId);
    console.log('Using API key:', process.env.ELEVEN_LABS_API_KEY ? 'API key exists' : 'No API key found');
    console.log('Making request to Eleven Labs API...');

    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': process.env.ELEVEN_LABS_API_KEY
      },
      body: JSON.stringify({
        text: text,
        model_id: "eleven_monolingual_v1",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.5
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail?.message || 'Failed to generate audio');
    }

    const audioBuffer = await response.arrayBuffer();
    
    if (!audioBuffer || audioBuffer.byteLength === 0) {
      throw new Error('No audio data received');
    }

    // Create a unique filename
    const filename = `audio_${Date.now()}.mp3`;
    const storageRef = ref(storage, `audio/${filename}`);

    // Upload to Firebase Storage
    const audioBlob = new Blob([audioBuffer], { type: 'audio/mpeg' });
    await uploadBytes(storageRef, audioBlob);

    // Get the download URL
    const downloadURL = await getDownloadURL(storageRef);

    return NextResponse.json({
      url: downloadURL,
      filename: filename
    }, { 
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    });
  } catch (error) {
    console.error('Error details:', error);
    return NextResponse.json({ 
      error: 'Error generating audio: ' + (error.message || 'Unknown error'),
      details: error.toString()
    }, { 
      status: 500 
    });
  }
} 