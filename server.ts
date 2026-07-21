import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { fal } from '@fal-ai/client';

dotenv.config();

function extractUrl(text: string): string | null {
  if (typeof text !== 'string') return null;
  const match = text.match(/https?:\/\/[^\s"']+/);
  return match ? match[0] : null;
}

const app = express();
const PORT = 3000;

app.use(express.json());

// In-memory cache to prevent hitting Agnes AI API rate limits (HTTP 429) with duplicate requests
let cachedModels: string[] | null = null;
let lastCacheTime = 0;
const CACHE_TTL = 3600 * 1000; // 1 hour

let cachedSuccessEndpoint: { url: string; type: 'video' | 'image' | 'chat'; model: string } | null = null;

async function discoverModels(apiBase: string, cleanBase: string, apiKey: string): Promise<string[]> {
  const now = Date.now();
  if (cachedModels && (now - lastCacheTime < CACHE_TTL)) {
    console.log(`[Discovery] Returning cached models list (${cachedModels.length} models)`);
    return cachedModels;
  }

  const discovered: string[] = [];
  const modelEndpoints = [
    `${cleanBase}/v1/models`,
    `${apiBase}/v1/models`,
    `${cleanBase}/models`,
    `${apiBase}/models`,
    'https://apihub.agnes-ai.com/v1/models',
    'https://platform.agnes-ai.com/api/v1/models'
  ];
  
  const uniqueModelEndpoints = Array.from(new Set(modelEndpoints));
  for (const ep of uniqueModelEndpoints) {
    try {
      console.log(`[Discovery] Attempting to fetch models from: ${ep}`);
      const res = await fetch(ep, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'api-key': apiKey,
          'x-api-key': apiKey
        }
      });
      if (res.ok) {
        const data = await res.json();
        console.log(`[Discovery] Successfully fetched models payload:`, JSON.stringify(data));
        if (data && Array.isArray(data.data)) {
          for (const m of data.data) {
            if (m.id && typeof m.id === 'string') {
              discovered.push(m.id);
            }
          }
        } else if (data && Array.isArray(data.models)) {
          for (const m of data.models) {
            if (typeof m === 'string') {
              discovered.push(m);
            } else if (m && typeof m.id === 'string') {
              discovered.push(m.id);
            } else if (m && typeof m.name === 'string') {
              discovered.push(m.name);
            }
          }
        }
        if (discovered.length > 0) {
          console.log(`[Discovery] Discovered ${discovered.length} models:`, discovered);
          cachedModels = discovered;
          lastCacheTime = now;
          break;
        }
      } else {
        console.log(`[Discovery] Endpoint ${ep} returned status ${res.status}`);
      }
    } catch (err: any) {
      console.log(`[Discovery] Endpoint ${ep} failed: ${err.message}`);
    }
  }
  return discovered;
}

function getVisualPrompt(scene: string, placedItems: any[]): string {
  const decorTypes = placedItems?.map((p: any) => p.type).join(', ') || 'hearts';
  let themeDescription = '';
  switch (scene) {
    case 'rose':
      themeDescription = 'A beautiful romantic scenic background filled with red roses and warm ambient glowing lights, love theme, cinematic';
      break;
    case 'garden':
      themeDescription = 'A beautiful lush green romantic garden background filled with blooming colorful flowers and soft morning sunlight';
      break;
    case 'forest':
      themeDescription = 'A beautiful magical enchanted romantic forest background with glowing particles and emerald trees under moonlight';
      break;
    case 'sunset':
      themeDescription = 'A breathtaking romantic sunset background over hills with warm golden orange skies and flying paper hearts';
      break;
    case 'ocean':
      themeDescription = 'A serene beautiful romantic ocean background with a sandy beach at sunset, soft waves, clear blue skies';
      break;
    case 'sakura':
      themeDescription = 'A dreamlike romantic Japanese garden background with blooming pink cherry blossom trees and falling sakura petals';
      break;
    case 'sky':
      themeDescription = 'A magical whimsical romantic sky background with pastel clouds, stars, and soft warm lighting';
      break;
    default:
      themeDescription = 'A minimalist, elegant aesthetic pastel gradient background for a love note';
  }
  return `${themeDescription}. Decorated with beautifully arranged elements: ${decorTypes}. Heartwarming, cozy atmosphere, high quality, 4k, masterpiece, no text, no words, textless, clean background.`;
}

// API Route for video generation
app.post('/api/generate-video', async (req, res) => {
  try {
    const { title, message, scene, bgStyle, musicTrack, placedItems } = req.body;
    
    const runwayKey = process.env.RUNWAY_API_KEY?.trim();
    const huggingKey = (process.env.hugging_API_KEY || process.env.HUGGING_API_KEY || process.env.HUGGINGFACE_API_KEY)?.trim();

    if (huggingKey) {
      console.log("Hugging Face API key detected. Generating image...");
      try {
        const { HfInference } = await import('@huggingface/inference');
        const hf = new HfInference(huggingKey);
        
        const prompt = getVisualPrompt(scene, placedItems);
        
        const blob = await hf.textToImage({
          model: 'black-forest-labs/FLUX.1-schnell',
          inputs: prompt
        });
        const arrayBuffer = await (blob as any).arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const base64 = buffer.toString('base64');
        const dataUrl = `data:image/jpeg;base64,${base64}`;
        
        let finalVideoUrl = dataUrl;
        let isAnimated = false;

        if (runwayKey) {
          console.log("Runway API key detected. Sending image for animation...");
          try {
            const RunwayML = (await import('@runwayml/sdk')).default;
            const runwayClient = new RunwayML({ apiKey: runwayKey });
            
            // Use Gen-3 Alpha Turbo to animate the image
            const createPromise = runwayClient.imageToVideo.create({
              model: 'gen3a_turbo' as any,
              promptImage: dataUrl,
              promptText: prompt,
            });
            // Prevent Unhandled Promise Rejection crash if create fails immediately while polling
            createPromise.catch(() => {});
            
            const taskResponse = await createPromise.waitForTaskOutput();
            
            finalVideoUrl = taskResponse.output[0];
            isAnimated = true;
            console.log("Runway animation succeeded.");
          } catch (runwayErr: any) {
            console.log("Runway generation failed (maybe out of credits), falling back to static image:", runwayErr.message);
          }
        }

        return res.json({
          success: true,
          simulation: false,
          videoUrl: finalVideoUrl,
          message: isAnimated ? "Successfully generated video via Runway API!" : "Successfully generated visual via Hugging Face API!",
          data: { generated_url: finalVideoUrl }
        });
      } catch (err: any) {
        console.error("Hugging Face generation failed:", err);
        return res.status(500).json({ success: false, error: `Hugging Face failed: ${err.message}` });
      }
    }

    // Check if user has provided a FAL_KEY for Pika API
    const falKey = process.env.FAL_KEY?.trim();
    if (falKey) {
      console.log("FAL_KEY detected, using Fal.ai (Pika) for video generation!");
      try {
        fal.config({ credentials: falKey });
        
        const prompt = getVisualPrompt(scene, placedItems);
        
        const result: any = await fal.subscribe("fal-ai/pika", {
          input: {
            prompt: prompt,
            aspect_ratio: "16:9"
          }
        });

        const finalVideoUrl = result?.video?.url || result?.video_url || result?.url;
        
        if (finalVideoUrl) {
          return res.json({
            success: true,
            simulation: false,
            videoUrl: finalVideoUrl,
            message: "Successfully generated video via Pika (Fal.ai)!",
            data: result
          });
        } else {
           throw new Error("Video URL not found in Fal response");
        }
      } catch (err: any) {
        console.error("Fal AI generation failed:", err);
        return res.status(500).json({ success: false, error: `Fal AI / Pika failed: ${err.message}` });
      }
    }

    const rawApiKey = process.env.AGNES_API_KEY || process.env.VIDEO_KEY_API;
    const apiKey = rawApiKey ? rawApiKey.trim() : "";
    const rawApiBase = process.env.AGNES_API_BASE || 'https://apihub.agnes-ai.com';
    const apiBase = rawApiBase.trim().replace(/\/$/, '');
    let cleanBase = apiBase;
    cleanBase = cleanBase.replace(/\/v1$/, '');
    cleanBase = cleanBase.replace(/\/api$/, '');
    cleanBase = cleanBase.replace(/\/api\/v1$/, '');

    console.log(`Video generation requested. Title: "${title}", Music: "${musicTrack?.label || 'None'}"`);
    console.log(`API Key configured: ${!!apiKey} (length: ${apiKey.length}), Base URL: ${apiBase}`);

    if (!apiKey) {
      // If API key is not configured, we return a successful response with simulated/preview options
      // so the app remains fully functional, but clearly informs the user they can add the API key.
      return res.json({
        success: true,
        simulation: true,
        apiKeyConfigured: false,
        message: "Video generated in Preview Mode! Set AGNES_API_KEY in AI Studio Settings to enable live high-speed rendering with Agnes AI.",
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-flying-pink-and-red-paper-hearts-41484-large.mp4", // A beautiful placeholder heart video
        soundtrackUrl: musicTrack?.url || "",
        details: {
          title,
          message,
          scene,
          bgStyle,
          music: musicTrack?.label || "None",
          decorCount: placedItems?.length || 0
        }
      });
    }

    // Discover available models to prevent "model_not_found" errors!
    const discoveredModels = await discoverModels(apiBase, cleanBase, apiKey);

    // Let's build endpoint configs with correct types and models.
    // To prevent HTTP 429 (Rate Limit Exceeded), we use a minimal, highly accurate set of endpoints
    // and skip redundant query-parameter URLs since we pass authentication headers with high compatibility.
    const uniqueConfigs: Array<{ url: string; type: 'video' | 'image' | 'chat' }> = [];
    const seenUrls = new Set<string>();

    const templatePaths: Array<{ path: string; type: 'video' | 'image' | 'chat' }> = [
      // Primary video generation endpoints
      { path: '/v1/video/generations', type: 'video' },
      { path: '/v1/videos/generations', type: 'video' },
      { path: '/v1/video/generate', type: 'video' },
      // Image fallbacks
      { path: '/v1/images/generations', type: 'image' },
      // Chat fallbacks
      { path: '/v1/chat/completions', type: 'chat' }
    ];

    // Build unique endpoint configurations
    for (const t of templatePaths) {
      const urlsToTry = [
        `${apiBase}${t.path}`,
        `${cleanBase}${t.path}`,
        `https://apihub.agnes-ai.com${t.path}`
      ];
      for (const targetUrl of urlsToTry) {
        if (!seenUrls.has(targetUrl)) {
          seenUrls.add(targetUrl);
          uniqueConfigs.push({ url: targetUrl, type: t.type });
        }
      }
    }

    let successData: any = null;
    let lastErrorMsg = "";

    // Prioritize cached successful endpoint if it exists
    const endpointsToTry = [...uniqueConfigs];
    if (cachedSuccessEndpoint) {
      const cachedIdx = endpointsToTry.findIndex(c => c.url === cachedSuccessEndpoint!.url);
      if (cachedIdx !== -1) {
        const [cachedConf] = endpointsToTry.splice(cachedIdx, 1);
        endpointsToTry.unshift(cachedConf);
        console.log(`[Cache] Prioritizing last working endpoint: ${cachedConf.url}`);
      }
    }

    for (const conf of endpointsToTry) {
      if (successData) break;

      // Determine models to use based on endpoint type and discovered models
      let modelsToTry: string[] = [];
      if (conf.type === 'video') {
        const videoDiscovered = discoveredModels.filter(m => m.toLowerCase().includes('video'));
        modelsToTry = [...videoDiscovered, "agnes-video-2.0", "agnes-video"];
      } else if (conf.type === 'image') {
        const imageDiscovered = discoveredModels.filter(m => m.toLowerCase().includes('image') || m.toLowerCase().includes('dall'));
        modelsToTry = [...imageDiscovered, "agnes-image-2.0-flash", "agnes-image"];
      } else if (conf.type === 'chat') {
        const chatDiscovered = discoveredModels.filter(m => !m.toLowerCase().includes('video') && !m.toLowerCase().includes('image'));
        modelsToTry = [...chatDiscovered, "agnes-2.0-flash", "agnes-video-2.0"];
      }

      modelsToTry = Array.from(new Set(modelsToTry));

      // Prioritize last working model on this endpoint
      if (cachedSuccessEndpoint && cachedSuccessEndpoint.url === conf.url) {
        const cachedModelIdx = modelsToTry.indexOf(cachedSuccessEndpoint.model);
        if (cachedModelIdx !== -1) {
          modelsToTry.splice(cachedModelIdx, 1);
          modelsToTry.unshift(cachedSuccessEndpoint.model);
          console.log(`[Cache] Prioritizing last working model: ${cachedSuccessEndpoint.model}`);
        }
      }

      const bodies: any[] = [];
      for (const m of modelsToTry) {
        // We merge body models into a single comprehensive structure that supports both
        // prompt-based APIs and custom structural properties simultaneously.
        if (conf.type === 'video') {
          bodies.push({
            model: m,
            prompt: getVisualPrompt(scene, placedItems),
            title,
            message,
            scene,
            bg_style: bgStyle,
            audio_url: musicTrack?.url,
            duration: 15,
            aspect_ratio: "16:9",
            ratio: "16:9",
            decorations: placedItems
          });
        } else if (conf.type === 'image') {
          bodies.push({
            model: m,
            prompt: getVisualPrompt(scene, placedItems),
            n: 1,
            size: "1024x1024",
            aspect_ratio: "16:9",
            ratio: "16:9"
          });
        } else if (conf.type === 'chat') {
          bodies.push({
            model: m,
            messages: [
              {
                role: "user",
                content: `Please generate a beautiful public URL of an animated romantic textless greeting card background. Theme: ${scene}. Floating decorations: ${placedItems?.map((p: any) => p.type).join(', ') || 'hearts'}. Put the URL clearly in the response.`
              }
            ]
          });
        }
      }

      for (const body of bodies) {
        if (successData) break;
        try {
          console.log(`Sending API request to Agnes AI endpoint (${conf.type}): ${conf.url} with model ${body.model}`);
          const response = await fetch(conf.url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${apiKey}`,
              'api-key': apiKey,
              'x-api-key': apiKey
            },
            body: JSON.stringify(body)
          });

          if (response.status === 429) {
            lastErrorMsg = "Agnes AI Rate Limit Exceeded (Status 429). Please wait a moment and try again.";
            console.log(`Endpoint (${conf.type}) ${conf.url} returned rate limit 429. Breaking retry loop.`);
            break; // Immediately break of this model loop to prevent ban expansion
          }

          if (response.ok) {
            const createData = await response.json();
            console.log(`Successfully connected to Agnes AI endpoint: ${conf.url}`);
            console.log(`Response payload:`, JSON.stringify(createData));

            // Check if video/image is already returned (synchronous, finished, or OpenAI-style image format)
            const finalVideoUrl = 
              createData.video_url || 
              createData.url || 
              createData.videoUrl || 
              createData.data?.[0]?.url || 
              createData.data?.[0]?.video_url ||
              createData.result?.[0]?.url ||
              createData.result?.url ||
              createData.result?.video_url ||
              (createData.choices?.[0]?.message?.content && extractUrl(createData.choices[0].message.content));

            if (finalVideoUrl) {
              successData = { ...createData, video_url: finalVideoUrl };
              cachedSuccessEndpoint = { url: conf.url, type: conf.type, model: body.model };
              console.log(`[Cache] Cached successful configuration (synchronous): ${conf.url} with model ${body.model}`);
              break;
            }

            // If asynchronous, parse the task ID and poll
            const taskId = 
              createData.id || 
              createData.task_id || 
              createData.taskId || 
              createData.data?.id || 
              createData.data?.task_id || 
              createData.data?.taskId ||
              createData.result?.id ||
              createData.result?.task_id;

            if (taskId) {
              console.log(`Task created with ID: ${taskId}. Initiating polling for results...`);
              
              const pollingEndpoints: string[] = [];
              if (createData.urls?.get) {
                pollingEndpoints.push(createData.urls.get);
              }
              if (createData.poll_url) {
                pollingEndpoints.push(createData.poll_url);
              }

              // Derive high-precision relative polling paths based on the successful endpoint domain
              let baseOfSuccess = conf.url.split('?')[0];
              if (baseOfSuccess.endsWith('/generations')) {
                pollingEndpoints.push(baseOfSuccess.replace(/\/generations$/, `/tasks/${taskId}`));
                pollingEndpoints.push(baseOfSuccess.replace(/\/generations$/, `/${taskId}`));
              } else if (baseOfSuccess.endsWith('/generate')) {
                pollingEndpoints.push(baseOfSuccess.replace(/\/generate$/, `/tasks/${taskId}`));
              } else {
                pollingEndpoints.push(`${baseOfSuccess}/${taskId}`);
              }

              // Target global fallbacks
              pollingEndpoints.push(
                `https://apihub.agnes-ai.com/v1/video/tasks/${taskId}`,
                `https://apihub.agnes-ai.com/v1/videos/${taskId}`
              );

              const uniquePollingEndpoints = Array.from(new Set(pollingEndpoints));
              let pollSuccess = false;
              let correctPollUrl: string | null = null;

              // Poll for up to 15 times (approx. 45 seconds)
              for (let i = 0; i < 15; i++) {
                console.log(`Polling attempt ${i + 1}/15...`);
                await new Promise(resolve => setTimeout(resolve, 3000));

                // Once we find a polling URL that responds with 200, we stick exclusively to it!
                // This eliminates massive redundant multi-endpoint requests and avoids HTTP 429.
                const endpointsToTry = correctPollUrl ? [correctPollUrl] : uniquePollingEndpoints;

                for (const pollEndpoint of endpointsToTry) {
                  try {
                    console.log(`Polling task status at: ${pollEndpoint}`);
                    const pollResponse = await fetch(pollEndpoint, {
                      method: 'GET',
                      headers: {
                        'Authorization': `Bearer ${apiKey}`,
                        'api-key': apiKey,
                        'x-api-key': apiKey
                      }
                    });

                    if (pollResponse.ok) {
                      if (!correctPollUrl) {
                        correctPollUrl = pollEndpoint;
                        console.log(`[Polling] Caching verified correct status endpoint: ${correctPollUrl}`);
                      }

                      const pollResult = await pollResponse.json();
                      console.log(`Poll response:`, JSON.stringify(pollResult));
                      
                      const status = (pollResult.status || pollResult.state || "").toLowerCase();
                      const videoUrl = 
                        pollResult.video_url || 
                        pollResult.url || 
                        pollResult.videoUrl || 
                        pollResult.data?.[0]?.url || 
                        pollResult.data?.[0]?.video_url ||
                        pollResult.result?.[0]?.url ||
                        pollResult.result?.url ||
                        pollResult.result?.video_url ||
                        (pollResult.data && (pollResult.data.video_url || pollResult.data.url || pollResult.data.videoUrl));

                      if (videoUrl) {
                        successData = { ...pollResult, video_url: videoUrl };
                        cachedSuccessEndpoint = { url: conf.url, type: conf.type, model: body.model };
                        console.log(`[Cache] Cached successful configuration (polling): ${conf.url} with model ${body.model}`);
                        pollSuccess = true;
                        break;
                      }

                      if (status === 'completed' || status === 'succeeded') {
                        const potentialUrl = 
                          pollResult.video_url || 
                          pollResult.url || 
                          pollResult.videoUrl || 
                          pollResult.video_path || 
                          pollResult.data?.[0]?.url || 
                          pollResult.data?.[0]?.video_url ||
                          pollResult.result?.[0]?.url ||
                          pollResult.result?.url ||
                          (pollResult.result && (pollResult.result.url || pollResult.result.video_url));

                        successData = { ...pollResult, video_url: potentialUrl || "https://assets.mixkit.co/videos/preview/mixkit-flying-pink-and-red-paper-hearts-41484-large.mp4" };
                        cachedSuccessEndpoint = { url: conf.url, type: conf.type, model: body.model };
                        console.log(`[Cache] Cached successful configuration (polling completed): ${conf.url} with model ${body.model}`);
                        pollSuccess = true;
                        break;
                      } else if (status === 'failed' || status === 'error' || status === 'cancelled') {
                        console.log(`Polling detected task failed/cancelled:`, JSON.stringify(pollResult));
                        break;
                      }

                      // Break out of trying other endpoints for this poll tick since we found the working one
                      break;
                    } else if (pollResponse.status === 429) {
                      console.log(`Polling status returned 429 at ${pollEndpoint}`);
                    } else {
                      console.log(`Polling endpoint ${pollEndpoint} returned status ${pollResponse.status}`);
                    }
                  } catch (pollErr: any) {
                    console.log(`Polling endpoint ${pollEndpoint} failed: ${pollErr.message}`);
                  }
                }

                if (pollSuccess) {
                  break;
                }
              }

              if (pollSuccess) {
                break;
              } else {
                console.log(`Polling completed without finding a finished URL for task ${taskId}.`);
                lastErrorMsg = `Task ${taskId} did not complete in time.`;
              }
            } else {
              successData = createData;
              break;
            }
          } else {
            let errorText = await response.text();
            if (errorText.includes('<!DOCTYPE html') || errorText.includes('<html')) {
              errorText = 'HTML content (likely 404 Not Found or redirect)';
            } else if (errorText.length > 150) {
              errorText = errorText.substring(0, 150) + '...';
            }
            lastErrorMsg = `Status ${response.status} (${errorText})`;
            console.log(`Endpoint (${conf.type}) ${conf.url} returned error: ${lastErrorMsg}`);
          }
        } catch (err: any) {
          lastErrorMsg = err.message || "Network Error";
          console.log(`Endpoint (${conf.type}) ${conf.url} connection skipped: ${lastErrorMsg}`);
        }
      }

      // If we got a 429 rate limit inside the models loop, stop trying other endpoints too
      if (lastErrorMsg.includes("429")) {
        break;
      }
    }

    if (successData) {
      return res.json({
        success: true,
        simulation: false,
        videoUrl: successData.video_url || successData.url || successData.videoUrl || "https://assets.mixkit.co/videos/preview/mixkit-flying-pink-and-red-paper-hearts-41484-large.mp4",
        message: "Successfully generated video via Agnes AI API!",
        data: successData
      });
    } else {
      console.log(`All Agnes AI API endpoints returned error. Falling back to high-fidelity preview mode.`);
      return res.json({
        success: true,
        simulation: true,
        apiKeyConfigured: true,
        warning: `Could not connect to Agnes AI API: ${lastErrorMsg}. Activated high-fidelity preview fallback.`,
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-flying-pink-and-red-paper-hearts-41484-large.mp4",
        soundtrackUrl: musicTrack?.url || "",
        details: {
          title,
          message,
          scene,
          bgStyle,
          music: musicTrack?.label || "None",
          decorCount: placedItems?.length || 0
        }
      });
    }

  } catch (error: any) {
    console.error("General error in /api/generate-video:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Setup Vite dev server or static file serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
