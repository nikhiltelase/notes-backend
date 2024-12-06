import express from 'express';
import { YoutubeTranscript } from 'youtube-transcript';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();
console.log("backend start");

const app = express();
const port = process.env.PORT || 3000;
app.use(cors({ origin: true }));
app.use(express.json());

app.get('/', (req, res) => {
  return res.json("ram ram");
});

app.get('/api/transcript/:videoId', async (req, res) => {
  try {
    const { videoId } = req.params;
    
    if (!videoId || videoId.length !== 11) {
      console.log("Invalid video ID")
      return res.status(400).json({ error: 'Invalid video ID' });
    }

    // Fetch transcript
    const transcript = await YoutubeTranscript.fetchTranscript(videoId);

    if (!transcript || transcript.length === 0) {
      console.log("No transcript found for this video")
      return res.status(404).json({ error: 'No transcript found for this video' });
    }

    // Combine all transcript parts into a single text
    const fullText = transcript
      .map(part => part.text.trim())
      .filter(text => text.length > 0)
      .join(' ');

    if (!fullText) {
      console.log("Empty transcript")
      return res.status(404).json({ error: 'Empty transcript' });
    }

    res.json(fullText);
  } catch (error) {
    console.log("Transcript fetch error")
    console.error('Transcript fetch error:', error);

    // Check for specific error indicating the transcript is disabled for the video
    if (error.message?.includes('Transcript is disabled')) {
      console.log("Transcript is disabled for this video")
      return res.status(403).json({ error: 'Transcript is disabled for this video' });
    }

    // Handle other errors
    if (error.message?.includes('Could not get transcripts')) {
      console.log("No transcript available for this video")
      return res.status(404).json({ error: 'No transcript available for this video' });
    }
    console.log("Failed to fetch transcript. Please try again.")
    res.status(500).json({ error: 'Failed to fetch transcript. Please try again.' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
