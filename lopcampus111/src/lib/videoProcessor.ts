import { MAX_VIDEO_DURATION_SECONDS, MAX_VIDEO_SIZE_BYTES } from './constants';
import { VideoValidationResult } from '../types';

/**
 * Validates a video file for duration, size, and dimensions using browser HTML5 video API.
 */
export async function validateVideoFile(file: File): Promise<VideoValidationResult> {
  const validMimeTypes = ['video/mp4', 'video/quicktime', 'video/webm', 'video/3gpp', 'video/x-m4v'];
  const ext = file.name.split('.').pop()?.toLowerCase();
  const validExtensions = ['mp4', 'mov', 'webm', '3gp', 'm4v'];

  if (!validMimeTypes.includes(file.type) && !validExtensions.includes(ext || '')) {
    return {
      isValid: false,
      duration: 0,
      size: file.size,
      width: 0,
      height: 0,
      error: 'Muundo wa video haukubaliki. Tafadhali tumia video ya MP4 au MOV (Simu).'
    };
  }

  // Check raw file size limit (allow up to 60MB for incoming uncompressed before compression)
  if (file.size > 60 * 1024 * 1024) {
    return {
      isValid: false,
      duration: 0,
      size: file.size,
      width: 0,
      height: 0,
      error: 'Video ni kubwa mno (zaidi ya 60MB). Tafadhali chagua video fupi ya simu chini ya sekunde 30.'
    };
  }

  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.playsInline = true;
    video.muted = true;
    const objectUrl = URL.createObjectURL(file);

    video.onloadedmetadata = () => {
      URL.revokeObjectURL(objectUrl);
      const duration = Math.round(video.duration);
      const width = video.videoWidth;
      const height = video.videoHeight;

      const isLongerThanLimit = video.duration > MAX_VIDEO_DURATION_SECONDS + 0.5;
      const effectiveDuration = isLongerThanLimit ? MAX_VIDEO_DURATION_SECONDS : Math.max(1, duration);

      resolve({
        isValid: true,
        duration: effectiveDuration,
        originalDuration: duration,
        needsTrim: isLongerThanLimit,
        trimNotice: isLongerThanLimit
          ? `Video ina sekunde ${duration}. Tumia kitelezi (slider) hapo chini kuchagua kipande unachotaka cha sekunde 30.`
          : undefined,
        size: file.size,
        width,
        height
      });
    };

    video.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve({
        isValid: false,
        duration: 0,
        size: file.size,
        width: 0,
        height: 0,
        error: 'Imeshindwa kusoma video. Tafadhali hakikisha video haijaharibika (corrupted).'
      });
    };

    video.src = objectUrl;
  });
}

/**
 * Extracts a high quality thumbnail from the video at 1.0 second timestamp.
 * Returns both a Blob for storage upload and a dataURL for instant local preview.
 */
export async function generateVideoThumbnail(
  file: File | Blob,
  timeInSeconds = 0.8
): Promise<{ blob: Blob; dataUrl: string; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'auto';
    video.playsInline = true;
    video.muted = true;
    const objectUrl = URL.createObjectURL(file);

    video.onloadeddata = () => {
      // Seek to specified time or half duration
      const seekTime = Math.min(timeInSeconds, video.duration > 0.5 ? video.duration / 2 : 0.1);
      video.currentTime = seekTime;
    };

    video.onseeked = () => {
      try {
        const canvas = document.createElement('canvas');
        // Max 960px width for fast loading while keeping sharp preview
        const scale = Math.min(1, 960 / (video.videoWidth || 960));
        const targetWidth = Math.round((video.videoWidth || 640) * scale);
        const targetHeight = Math.round((video.videoHeight || 480) * scale);

        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Canvas 2D context not available');

        ctx.drawImage(video, 0, 0, targetWidth, targetHeight);
        URL.revokeObjectURL(objectUrl);

        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve({ blob, dataUrl, width: targetWidth, height: targetHeight });
            } else {
              reject(new Error('Failed to create thumbnail blob'));
            }
          },
          'image/jpeg',
          0.85
        );
      } catch (err) {
        URL.revokeObjectURL(objectUrl);
        reject(err);
      }
    };

    video.onerror = (e) => {
      URL.revokeObjectURL(objectUrl);
      reject(e);
    };

    video.src = objectUrl;
  });
}

export interface CompressVideoOptions {
  startTime?: number; // In seconds (from slider)
  duration?: number; // Clip length in seconds (max 30s)
  onProgress?: (message: string, percent: number) => void;
}

/**
 * Compresses and trims video client-side according to broker's slider selection.
 * Supports sliding to any 30s portion of the video.
 * If file is already below MAX_VIDEO_SIZE_BYTES (~15MB) and <= 30s without trim offset,
 * passes through quickly.
 */
export async function compressVideoFile(
  file: File,
  optionsOrProgress?: CompressVideoOptions | ((message: string, percent: number) => void)
): Promise<{ compressedBlob: Blob; finalSize: number; duration: number }> {
  let startTime = 0;
  let targetDuration = MAX_VIDEO_DURATION_SECONDS;
  let onProgress: ((message: string, percent: number) => void) | undefined;

  if (typeof optionsOrProgress === 'function') {
    onProgress = optionsOrProgress;
  } else if (optionsOrProgress) {
    startTime = Math.max(0, optionsOrProgress.startTime || 0);
    if (optionsOrProgress.duration !== undefined) {
      targetDuration = Math.min(MAX_VIDEO_DURATION_SECONDS, Math.max(1, optionsOrProgress.duration));
    }
    onProgress = optionsOrProgress.onProgress;
  }

  onProgress?.('Inachakata sifa za video...', 15);

  const validation = await validateVideoFile(file);
  if (!validation.isValid) {
    throw new Error(validation.error || 'Video validation failed');
  }

  const rawDuration = validation.originalDuration || validation.duration;
  const needsTrim = startTime > 0 || rawDuration > targetDuration;
  const needsCompression = file.size > MAX_VIDEO_SIZE_BYTES;

  // If under 15MB, duration <= 30s, and no slider offset applied, pass through directly
  if (!needsTrim && !needsCompression && startTime === 0) {
    onProgress?.('Ukubwa na urefu wa video viko sawa (Chini ya 30s & 15MB)...', 70);
    await new Promise((r) => setTimeout(r, 150));
    return {
      compressedBlob: file,
      finalSize: file.size,
      duration: validation.duration
    };
  }

  // Video needs trimming according to slider or compression
  if (needsTrim) {
    onProgress?.(`Inakata kipande cha sekunde ${targetDuration} kuanzia ${Math.round(startTime)}s...`, 25);
  } else {
    onProgress?.('Inabana ukubwa wa video kwa matumizi mepesi ya simu...', 25);
  }

  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.src = URL.createObjectURL(file);
    video.muted = true;
    video.playsInline = true;

    video.onloadedmetadata = () => {
      const maxDim = 720; // 720p is crisp and very lightweight for 30s clips
      let targetW = video.videoWidth || 640;
      let targetH = video.videoHeight || 480;

      if (targetW > maxDim || targetH > maxDim) {
        if (targetW > targetH) {
          targetH = Math.round((targetH * maxDim) / targetW);
          targetW = maxDim;
        } else {
          targetW = Math.round((targetW * maxDim) / targetH);
          targetH = maxDim;
        }
      }

      // Check MediaRecorder support
      if (typeof MediaRecorder === 'undefined' || typeof (HTMLCanvasElement.prototype as any).captureStream === 'undefined') {
        // Fallback: If browser doesn't support canvas stream transcoding, verify if raw file is acceptable
        if (file.size <= 25 * 1024 * 1024 && startTime === 0) {
          URL.revokeObjectURL(video.src);
          resolve({ compressedBlob: file, finalSize: file.size, duration: validation.duration });
          return;
        }
        URL.revokeObjectURL(video.src);
        reject(new Error('Kivinjari hiki hakina uwezo wa kukata video kiotomatiki. Tafadhali rekodi video fupi chini ya sekunde 30.'));
        return;
      }

      const canvas = document.createElement('canvas');
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext('2d')!;

      // Capture canvas stream at 24fps
      const canvasStream = canvas.captureStream(24);

      // Attempt to include audio from video element if captureStream is available
      try {
        const vidStream = (video as any).captureStream
          ? (video as any).captureStream()
          : (video as any).mozCaptureStream
          ? (video as any).mozCaptureStream()
          : null;
        if (vidStream) {
          const audioTracks = vidStream.getAudioTracks();
          if (audioTracks && audioTracks.length > 0) {
            canvasStream.addTrack(audioTracks[0]);
          }
        }
      } catch {
        // Audio attachment fallback
      }

      let mimeType = 'video/webm;codecs=vp8';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/mp4';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = '';
        }
      }

      try {
        const recorder = new MediaRecorder(canvasStream, {
          mimeType: mimeType || undefined,
          videoBitsPerSecond: 1200000 // 1.2 Mbps = ~4.5MB for 30 seconds
        });

        const chunks: Blob[] = [];
        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) chunks.push(e.data);
        };

        const totalVideoLength = video.duration || rawDuration || 30;
        const availableFromStart = Math.max(1, totalVideoLength - startTime);
        const actualClipDuration = Math.min(targetDuration, availableFromStart);
        const stopTime = startTime + actualClipDuration;

        recorder.onstop = () => {
          URL.revokeObjectURL(video.src);
          const finalBlob = new Blob(chunks, { type: mimeType || 'video/webm' });
          onProgress?.(`Kipande cha sekunde ${Math.round(actualClipDuration)} kimekatwa na kubanwa kikamilifu!`, 95);
          resolve({
            compressedBlob: finalBlob,
            finalSize: finalBlob.size,
            duration: Math.round(actualClipDuration)
          });
        };

        let isRecording = false;

        const startRecording = () => {
          if (isRecording) return;
          isRecording = true;
          recorder.start(100);
          video.play().catch(() => {});

          const drawFrame = () => {
            if (video.currentTime >= stopTime || video.paused || video.ended) {
              if (recorder.state === 'recording') recorder.stop();
              return;
            }
            ctx.drawImage(video, 0, 0, targetW, targetH);
            const elapsed = Math.max(0, video.currentTime - startTime);
            const pct = Math.min(92, 25 + Math.round((elapsed / actualClipDuration) * 65));
            if (needsTrim) {
              onProgress?.(`Inakata sehemu uliyochagua: ${Math.round(elapsed)}s / ${Math.round(actualClipDuration)}s (${pct}%)...`, pct);
            } else {
              onProgress?.(`Inabana video: ${pct}%...`, pct);
            }
            requestAnimationFrame(drawFrame);
          };

          requestAnimationFrame(drawFrame);
        };

        video.ontimeupdate = () => {
          if (video.currentTime >= stopTime) {
            video.pause();
            if (recorder.state === 'recording') {
              recorder.stop();
            }
          }
        };

        video.onended = () => {
          if (recorder.state === 'recording') recorder.stop();
        };

        video.onerror = () => {
          URL.revokeObjectURL(video.src);
          reject(new Error('Hitilafu wakati wa kukata na kubana video'));
        };

        // If startTime is greater than 0, seek to startTime before recording
        if (startTime > 0) {
          let hasStarted = false;
          const onSeekedHandler = () => {
            video.removeEventListener('seeked', onSeekedHandler);
            if (!hasStarted) {
              hasStarted = true;
              startRecording();
            }
          };
          video.addEventListener('seeked', onSeekedHandler);
          // Safety timeout in case seeked doesn't fire
          setTimeout(() => {
            if (!hasStarted) {
              hasStarted = true;
              video.removeEventListener('seeked', onSeekedHandler);
              startRecording();
            }
          }, 800);
          video.currentTime = startTime;
        } else {
          startRecording();
        }
      } catch (recErr) {
        URL.revokeObjectURL(video.src);
        if (file.size <= 25 * 1024 * 1024 && startTime === 0) {
          resolve({ compressedBlob: file, finalSize: file.size, duration: validation.duration });
        } else {
          reject(new Error('Hitilafu ya kukata video. Tafadhali hakikisha video inafanya kazi vizuri.'));
        }
      }
    };

    video.onerror = () => {
      URL.revokeObjectURL(video.src);
      reject(new Error('Imeshindwa kusoma video'));
    };
  });
}
