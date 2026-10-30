import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());

// Initialize Google Gen AI client with required header
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

export interface MapsGroundingLink {
  title: string;
  uri: string;
  reviewSnippet?: string;
}

/**
 * Endpoint for Google Maps Grounded Transit & Route Analysis
 * Uses gemini-3.8-flash with googleMaps tool.
 */
app.post('/api/maps/transit-intelligence', async (req, res) => {
  try {
    const {
      fromStation,
      toStation,
      campusOrCollegeName,
      userLocation,
    } = req.body;

    if (!toStation && !campusOrCollegeName) {
      return res.status(400).json({
        error: 'Destination station or college/campus name is required.',
      });
    }

    const collegeQuery = campusOrCollegeName || 'University Campus';
    const stationQuery = toStation || 'Railway Station';

    const prompt = `You are a railway commuter transit assistant. Provide accurate transit information grounded in Google Maps for college students commuting between "${stationQuery}" (railway station) and "${collegeQuery}" (college/campus).

1. What is the typical travel duration and distance from ${stationQuery} to ${collegeQuery}?
2. Breakdown the main commute modes: Walking, Public Bus, or Auto-rickshaw/Cab.
3. Clearly suggest the estimated transit duration in minutes (e.g. 12 mins by auto, 25 mins walking) so the student knows how much transit time to budget before lectures.
4. Mention key landmarks, station exits, or transit hubs nearby.

Keep the advice concise, practical, and commuter-focused.`;

    const config: any = {
      tools: [{ googleMaps: {} }],
    };

    if (userLocation && typeof userLocation.latitude === 'number' && typeof userLocation.longitude === 'number') {
      config.toolConfig = {
        retrievalConfig: {
          latLng: {
            latitude: userLocation.latitude,
            longitude: userLocation.longitude,
          },
        },
      };
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config,
    });

    const text = response.text || 'No transit details found.';

    // Extract Google Maps grounding links as mandated by the skill
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const mapsLinks: MapsGroundingLink[] = [];

    for (const chunk of groundingChunks) {
      if (chunk.maps) {
        const title = chunk.maps.title || 'Google Maps Location';
        const uri = chunk.maps.uri;
        let reviewSnippet: string | undefined;

        if (
          chunk.maps.placeAnswerSources &&
          Array.isArray(chunk.maps.placeAnswerSources.reviewSnippets) &&
          chunk.maps.placeAnswerSources.reviewSnippets.length > 0
        ) {
          const rawSnippet: any = chunk.maps.placeAnswerSources.reviewSnippets[0];
          reviewSnippet = typeof rawSnippet === 'string' ? rawSnippet : (rawSnippet?.snippet || rawSnippet?.text || rawSnippet?.reviewText);
        }

        if (uri) {
          mapsLinks.push({ title, uri, reviewSnippet });
        }
      }
    }

    // Try to extract an estimated transit duration in minutes from text (for auto-filling journey planner)
    let suggestedMinutes = 15;
    const match = text.match(/(\d{1,2})\s*(?:-|to)?\s*(\d{1,2})?\s*(?:minutes|mins|min)/i);
    if (match) {
      const val = parseInt(match[2] || match[1], 10);
      if (val >= 5 && val <= 90) {
        suggestedMinutes = val;
      }
    }

    res.json({
      summary: text,
      suggestedMinutes,
      mapsLinks,
      source: 'Google Maps Grounding (gemini-3.8-flash)',
    });
  } catch (err: any) {
    console.error('Error in /api/maps/transit-intelligence:', err);
    res.status(500).json({
      error: err?.message || 'Failed to retrieve transit intelligence with Google Maps Grounding.',
    });
  }
});

// Mount Vite or serve static assets
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`RailMate server running on port ${PORT}`);
  });
}

startServer();
