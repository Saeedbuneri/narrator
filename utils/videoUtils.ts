
import { ProcessedFrame } from "../types";

export const extractFrames = async (
  videoFile: File, 
  onProgress: (progress: number) => void
): Promise<ProcessedFrame[]> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const frames: ProcessedFrame[] = [];
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const url = URL.createObjectURL(videoFile);

    video.src = url;
    video.muted = true;
    video.playsInline = true;

    video.onloadedmetadata = async () => {
      canvas.width = video.videoWidth / 2; // Downscale for performance/token efficiency
      canvas.height = video.videoHeight / 2;
      
      // REMOVED 60s LIMIT: Now supports full duration
      const duration = video.duration; 
      
      // Dynamic Interval: 
      // For short videos (< 1 min): 1 FPS
      // For medium videos (1-5 mins): 0.5 FPS (1 frame every 2s)
      // For long videos (> 5 mins): 0.2 FPS (1 frame every 5s)
      let interval = 1;
      if (duration > 300) interval = 5;
      else if (duration > 60) interval = 2;

      let currentTime = 0;
      let idCounter = 0;

      const processNextFrame = async () => {
        if (currentTime >= duration) {
          URL.revokeObjectURL(url);
          resolve(frames);
          return;
        }

        video.currentTime = currentTime;
      };

      video.onseeked = async () => {
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.7); // slightly compressed jpeg
          
          frames.push({
            id: idCounter++,
            time: Math.floor(currentTime),
            dataUrl,
            status: 'pending'
          });

          onProgress(Math.min(100, (currentTime / duration) * 100));
          currentTime += interval;
          processNextFrame();
        }
      };

      video.onerror = (e) => {
        URL.revokeObjectURL(url);
        reject(e);
      };

      // Start processing
      processNextFrame();
    };
    
    video.load();
  });
};
