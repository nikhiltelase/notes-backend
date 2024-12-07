import express from 'express';
import ytdl from 'ytdl-core';
import axios from 'axios';
import cors from 'cors';
import dotenv from 'dotenv';
import { XMLParser } from 'fast-xml-parser';

dotenv.config();
console.log("Backend started");

const app = express();
const port = process.env.PORT || 3000;

app.use(cors({ origin: true }));
app.use(express.json());

// Helper function to fetch and clean transcript
const fetchTranscript = async (videoId) => {
  try {
    const videoInfo = await ytdl.getInfo(videoId);

    // Check if captions are available
    const tracks = videoInfo.player_response?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
    if (!tracks || tracks.length === 0) {
      throw new Error('No transcripts available for this video');
    }

    // Find English captions or default to the first available language
    const englishTrack = tracks.find(track => track.languageCode === 'en') || tracks[0];

    if (!englishTrack) {
      throw new Error('No suitable transcript found');
    }

    // Fetch the transcript XML
    const response = await axios.get(englishTrack.baseUrl);
    const transcriptXml = response.data;

    // Parse the XML to extract clean text
    const parser = new XMLParser({ ignoreAttributes: true });
    const transcriptJson = parser.parse(transcriptXml);

    const transcriptTexts = transcriptJson.transcript.text;

    // Combine all text parts into a single string
    const fullTranscript = Array.isArray(transcriptTexts)
      ? transcriptTexts.map((text) => text.replace(/\s+/g, ' ').trim()).join(' ')
      : transcriptTexts.replace(/\s+/g, ' ').trim();

    return fullTranscript || 'Transcript is empty';
  } catch (error) {
    throw new Error(error.message || 'Failed to fetch transcript');
  }
};

// Default route
app.get('/', (req, res) => {
  return res.json("Ram Ram");
});

// API route to fetch clean transcript
app.get('/api/transcript/:videoId', async (req, res) => {
  const { videoId } = req.params;

  if (!videoId || videoId.length !== 11) {
    return res.status(400).json({ error: 'Invalid video ID' });
  }

  try {
    const transcript = await fetchTranscript(videoId);
    res.json({ transcript });
  } catch (error) {
    console.error('Transcript fetch error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
