import React, { useState, useMemo, useRef } from 'react';
import { BrokerProfile, RoomListing } from '../types';
import { ROOM_TYPES, REGIONS_AND_DISTRICTS } from '../lib/constants';
import { uploadImageToStorage, uploadVideoToStorage, createRoomListing } from '../lib/supabaseClient';
import { validateVideoFile, compressVideoFile, generateVideoThumbnail } from '../lib/videoProcessor';
import {
  Sparkles,
  Camera,
  Video,
  UploadCloud,
  AlertCircle,
  CheckCircle2,
  Trash2,
  Play,
  Pause,
  RotateCw,
  Film,
  Scissors,
  SlidersHorizontal,
  Clock,
  AlertTriangle
} from 'lucide-react';

interface PostRoomViewProps {
  brokerProfile: BrokerProfile;
  onSuccess: (newRoom: RoomListing) => void;
  onCancel: () => void;
}

export const PostRoomView: React.FC<PostRoomViewProps> = ({
  brokerProfile,
  onSuccess,
  onCancel
}) => {
  const [roomType, setRoomType] = useState<string>(ROOM_TYPES[0]);
  const [customRoomType, setCustomRoomType] = useState('');
  const [price, setPrice] = useState('');
  const [region, setRegion] = useState('Dar es Salaam');
  const [district, setDistrict] = useState('Kinondoni');
  const [ward, setWard] = useState('');
  const [landmark, setLandmark] = useState('');
  const [phone, setPhone] = useState(brokerProfile.phone_number || '');
  const [description, setDescription] = useState('');
  const durationDays = 14; // Matangazo ya vyumba hufutika kiotomatiki baada ya wiki 2 (siku 14)

  // Image State (Mandatory)
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Video State (Optional)
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [videoThumbnailUrl, setVideoThumbnailUrl] = useState<string | null>(null);
  const [videoDuration, setVideoDuration] = useState<number | null>(null);
  const [originalVideoDuration, setOriginalVideoDuration] = useState<number | null>(null);
  const [trimStartTime, setTrimStartTime] = useState<number>(0);
  const [videoSize, setVideoSize] = useState<number | null>(null);
  const [videoTrimNotice, setVideoTrimNotice] = useState<string | null>(null);
  const previewVideoRef = useRef<HTMLVideoElement | null>(null);

  // Helper to format seconds as mm:ss
  const formatTime = (seconds: number): string => {
    const s = Math.max(0, Math.floor(seconds));
    const m = Math.floor(s / 60);
    const remS = s % 60;
    return `${m.toString().padStart(2, '0')}:${remS.toString().padStart(2, '0')}`;
  };

  // Processing & Uploading State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progressMessage, setProgressMessage] = useState('');
  const [progressPercent, setProgressPercent] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const regionNames = useMemo(() => Object.keys(REGIONS_AND_DISTRICTS).sort(), []);
  const availableDistricts = useMemo(() => {
    if (!region || !REGIONS_AND_DISTRICTS[region]) return [];
    return [...REGIONS_AND_DISTRICTS[region]].sort();
  }, [region]);

  const handleRegionChange = (newRegion: string) => {
    setRegion(newRegion);
    const dList = REGIONS_AND_DISTRICTS[newRegion] || [];
    setDistrict(dList[0] || '');
  };

  // Image selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      setErrorMessage('Tafadhali chagua picha isiyozidi ukubwa wa 8MB.');
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setErrorMessage(null);
  };

  // Video selection & validation
  const handleVideoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMessage(null);
    setProgressMessage('Inathibitisha urefu na ukubwa wa video...');

    try {
      const val = await validateVideoFile(file);
      if (!val.isValid) {
        setErrorMessage(val.error || 'Video haikubaliki.');
        setProgressMessage('');
        return;
      }

      const origDur = val.originalDuration || val.duration;
      setVideoFile(file);
      setOriginalVideoDuration(origDur);
      setTrimStartTime(0);
      setVideoDuration(Math.min(30, origDur));
      setVideoSize(file.size);
      setVideoTrimNotice(val.trimNotice || null);

      // Generate preview object url
      const preview = URL.createObjectURL(file);
      setVideoPreviewUrl(preview);

      // Generate thumbnail
      try {
        const thumb = await generateVideoThumbnail(file, 0.8);
        setVideoThumbnailUrl(thumb.dataUrl);
      } catch {
        // Thumbnail generation silent fallback
      }

      setProgressMessage('');
    } catch (err: any) {
      setErrorMessage(err.message || 'Hitilafu wakati wa kusoma video.');
      setProgressMessage('');
    }
  };

  // Slider change handler - updates preview video position instantaneously
  const handleSliderChange = (newStartTime: number) => {
    const clamped = Math.max(0, Math.min(newStartTime, Math.max(0, (originalVideoDuration || 30) - 30)));
    setTrimStartTime(clamped);
    if (previewVideoRef.current) {
      previewVideoRef.current.currentTime = clamped;
    }
  };

  const handleRemoveVideo = () => {
    if (videoPreviewUrl) {
      URL.revokeObjectURL(videoPreviewUrl);
    }
    setVideoFile(null);
    setVideoPreviewUrl(null);
    setVideoThumbnailUrl(null);
    setVideoDuration(null);
    setOriginalVideoDuration(null);
    setTrimStartTime(0);
    setVideoSize(null);
    setVideoTrimNotice(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const finalType = roomType === 'Nyingine' ? customRoomType.trim() : roomType;
    const numPrice = parseFloat(price);

    if (!finalType) {
      setErrorMessage('Tafadhali chagua au andika aina ya chumba.');
      return;
    }

    if (!price || isNaN(numPrice) || numPrice <= 0) {
      setErrorMessage('Tafadhali weka bei sahihi ya kodi ya chumba.');
      return;
    }

    if (!region || !district || !ward.trim()) {
      setErrorMessage('Tafadhali jaza eneo lote (Mkoa, Wilaya na Kata/Mtaa).');
      return;
    }

    const cleanPhone = phone.replace(/[^0-9]/g, '');
    if (cleanPhone.length < 9) {
      setErrorMessage('Namba ya simu ya mawasiliano sio sahihi (mf. 0712345678).');
      return;
    }

    if (!imageFile) {
      setErrorMessage('Picha ya chumba inahitajika. Weka picha halisi kabla ya kupakia tangazo.');
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Upload mandatory image
      setProgressMessage('Inaboresha na kupakia picha ya chumba...');
      setProgressPercent(20);
      const imageUrl = await uploadImageToStorage(imageFile);

      // 2. Upload optional video if provided
      let finalVideoUrl: string | null = null;
      let finalVideoThumb: string | null = null;
      let finalDuration = videoDuration;
      let finalSize = videoSize;

      if (videoFile) {
        try {
          const selectedClipDuration = Math.min(30, Math.max(1, (originalVideoDuration || 30) - trimStartTime));
          setProgressMessage(`Inakata kipande cha sekunde ${selectedClipDuration} (kuanzia ${formatTime(trimStartTime)})...`);
          setProgressPercent(45);

          const { compressedBlob, finalSize: compressedSize, duration } = await compressVideoFile(
            videoFile,
            {
              startTime: trimStartTime,
              duration: selectedClipDuration,
              onProgress: (msg, pct) => {
                setProgressMessage(msg);
                setProgressPercent(pct);
              }
            }
          );

          // Update thumbnail to match the snippet scene
          try {
            const thumb = await generateVideoThumbnail(videoFile, trimStartTime + 0.8);
            finalVideoThumb = thumb.dataUrl;
          } catch {
            finalVideoThumb = videoThumbnailUrl || imageUrl;
          }

          setProgressMessage('Inapakia video kwenye seva...');
          setProgressPercent(75);

          const { videoUrl: uploadedUrl, videoSize: uploadedSize } = await uploadVideoToStorage(
            compressedBlob,
            videoFile.name
          );

          finalVideoUrl = uploadedUrl;
          finalSize = uploadedSize || compressedSize;
          finalDuration = duration;
          finalVideoThumb = finalVideoThumb || videoThumbnailUrl || imageUrl;
        } catch (vidErr: any) {
          console.warn('Video upload failed, continuing with photo listing:', vidErr);
          // If video upload fails, we don't break the user's room post!
        }
      }

      // 3. Save listing into Supabase database
      setProgressMessage('Inahifadhi taarifa za chumba kwenye mfumo wa LopCampus...');
      setProgressPercent(90);

      const roomPayload = {
        broker_id: brokerProfile.id,
        room_type: finalType,
        price: numPrice,
        region,
        district,
        ward: ward.trim(),
        landmark: landmark.trim() || null,
        contact_phone: cleanPhone.startsWith('0') ? cleanPhone : '0' + cleanPhone,
        description: description.trim() || null,
        image_url: imageUrl,
        duration_days: durationDays,
        status: 'active' as const,
        video_url: finalVideoUrl,
        video_thumbnail_url: finalVideoThumb,
        video_duration: finalDuration,
        video_size: finalSize,
        video_status: finalVideoUrl ? ('ready' as const) : null
      };

      const res = await createRoomListing(roomPayload);

      if (res.error && !res.data) {
        throw new Error(res.error);
      }

      setProgressPercent(100);
      setProgressMessage('Hongera! Tangazo lako limekamilika.');

      if (res.data) {
        onSuccess(res.data);
      }
    } catch (err: any) {
      setErrorMessage(`Kosa la kupakia: ${err.message || 'Hitilafu imetokea. Tafadhali jaribu tena.'}`);
    } finally {
      setIsSubmitting(false);
      setProgressMessage('');
    }
  };

  return (
    <div className="max-w-2xl mx-auto my-4 animate-in fade-in">
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white p-5 sm:p-6 flex items-center justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-xs font-semibold mb-1">
              <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
              <span>Bure Kabisa • Hakuna Tozo Yoyote</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight">Weka Tangazo Jipya la Chumba</h2>
            <p className="text-xs sm:text-sm text-emerald-100 mt-0.5">
              Jaza taarifa sahihi zenye picha na video ya sekunde 30 ili wanafunzi wakupigie moja kwa moja
            </p>
          </div>

          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all cursor-pointer"
          >
            Ghairi
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Error Message */}
          {errorMessage && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-semibold">Tafadhali kagua:</strong>
                <span>{errorMessage}</span>
              </div>
            </div>
          )}

          {/* Section 1: Picha ya Chumba (Inahitajika) */}
          <div>
            <label className="block text-xs font-bold text-neutral-800 uppercase tracking-wider mb-2">
              Picha ya Chumba (Inahitajika) *
            </label>

            <div className="relative">
              {imagePreview ? (
                <div className="relative rounded-xl overflow-hidden border-2 border-emerald-500 max-h-72 bg-neutral-900 group">
                  <img src={imagePreview} alt="Preview" className="w-full h-64 object-cover" />
                  <label
                    htmlFor="room-file-input"
                    className="absolute inset-0 bg-black/40 hover:bg-black/60 flex flex-col items-center justify-center text-white cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Camera className="w-8 h-8 mb-1" />
                    <span className="text-xs font-bold">Bonyeza Kubadili Picha</span>
                  </label>
                </div>
              ) : (
                <label
                  htmlFor="room-file-input"
                  className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-neutral-300 hover:border-emerald-500 rounded-2xl bg-neutral-50 hover:bg-emerald-50/30 transition-all cursor-pointer text-center"
                >
                  <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mb-2">
                    <Camera className="w-6 h-6" />
                  </div>
                  <span className="text-sm font-bold text-neutral-800">Bofya hapa kupakia Picha</span>
                  <span className="text-xs text-neutral-500 mt-1">
                    Inasaidia picha za simu (JPG, PNG, WebP) hadi 8MB
                  </span>
                </label>
              )}

              <input
                id="room-file-input"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </div>
          </div>

          {/* Section 2: Video ya Chumba (HIARI / SIO LAZIMA - OPTIONAL) */}
          <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center">
                  <Film className="w-4 h-4" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-800 uppercase tracking-wider">
                    Video ya Chumba (Hiari / Sio Lazima)
                  </label>
                  <span className="text-[11px] text-neutral-500">
                    Sekunde 30 au chini • MP4 / MOV • Isizidi 15MB
                  </span>
                </div>
              </div>

              {videoFile && (
                <button
                  type="button"
                  onClick={handleRemoveVideo}
                  className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Ondoa Video</span>
                </button>
              )}
            </div>

            {videoPreviewUrl ? (
              <div className="space-y-3">
                {/* Slider juu ya video bila maelezo yoyote */}
                {originalVideoDuration && originalVideoDuration > 30 && (
                  <div className="w-full pt-1">
                    <input
                      type="range"
                      min={0}
                      max={Math.max(0, originalVideoDuration - 30)}
                      step={1}
                      value={trimStartTime}
                      onChange={(e) => handleSliderChange(Number(e.target.value))}
                      className="w-full h-2.5 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-emerald-600 focus:outline-none"
                    />
                  </div>
                )}

                {/* Video yenye kitufe kimoja tu cha kuplay */}
                <div className="relative aspect-video rounded-xl overflow-hidden bg-black border border-neutral-300">
                  <video
                    ref={previewVideoRef}
                    src={videoPreviewUrl}
                    controls
                    playsInline
                    className="w-full h-full object-contain"
                  />
                </div>

                <div className="flex items-center justify-between text-xs text-neutral-600 bg-white p-2.5 rounded-xl border border-neutral-200">
                  <span className="font-semibold text-neutral-700">
                    Kipande cha Video: <strong>{originalVideoDuration && originalVideoDuration > 30 ? '30s' : `${videoDuration || 0}s`}</strong>
                  </span>
                  <label
                    htmlFor="room-video-input"
                    className="text-blue-600 font-bold hover:underline cursor-pointer"
                  >
                    Badili Video
                  </label>
                </div>
              </div>
            ) : (
              <label
                htmlFor="room-video-input"
                className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-neutral-300 hover:border-blue-500 rounded-xl bg-white hover:bg-blue-50/30 transition-all cursor-pointer text-center"
              >
                <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-1.5">
                  <Video className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-neutral-800">
                  Bofya hapa kuchagua Video ya Chumba (Hiari)
                </span>
                <span className="text-[11px] text-neutral-500 mt-0.5">
                  Unaweza kuweka video ya urefu wowote na kutelezesha slider kuchagua sekunde 30 unazozitaka! (MP4, MOV, WebM)
                </span>
              </label>
            )}

            <input
              id="room-video-input"
              type="file"
              accept="video/mp4,video/quicktime,video/webm,video/*"
              onChange={handleVideoChange}
              className="hidden"
            />
          </div>

          {/* Section 3: Room Type & Price */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">Aina ya Chumba *</label>
              <select
                value={roomType}
                onChange={(e) => setRoomType(e.target.value)}
                className="w-full text-sm bg-neutral-50 border border-neutral-300 rounded-lg px-3 py-2 text-neutral-800 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              >
                {ROOM_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
                <option value="Nyingine">Nyingine (Andika mwenyewe)</option>
              </select>

              {roomType === 'Nyingine' && (
                <input
                  type="text"
                  placeholder="Andika aina ya chumba..."
                  value={customRoomType}
                  onChange={(e) => setCustomRoomType(e.target.value)}
                  className="mt-2 w-full text-sm bg-white border border-neutral-300 rounded-lg px-3 py-2 text-neutral-800 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">Bei ya Kodi (TZS / Mwezi) *</label>
              <input
                type="number"
                placeholder="Mf. 150000"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full text-sm bg-neutral-50 border border-neutral-300 rounded-lg px-3 py-2 text-neutral-800 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>
          </div>

          {/* Section 4: Location (Region, District, Ward) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">Mkoa *</label>
              <select
                value={region}
                onChange={(e) => handleRegionChange(e.target.value)}
                className="w-full text-sm bg-neutral-50 border border-neutral-300 rounded-lg px-3 py-2 text-neutral-800 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              >
                {regionNames.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">Wilaya *</label>
              <select
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="w-full text-sm bg-neutral-50 border border-neutral-300 rounded-lg px-3 py-2 text-neutral-800 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              >
                {availableDistricts.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">Kata / Mtaa *</label>
              <input
                type="text"
                placeholder="Mf. Mwenge / Mabibo"
                value={ward}
                onChange={(e) => setWard(e.target.value)}
                className="w-full text-sm bg-neutral-50 border border-neutral-300 rounded-lg px-3 py-2 text-neutral-800 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>
          </div>

          {/* Landmark & Contact Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">
                Eneo la Karibu / Chuo Kikuu (Landmark)
              </label>
              <input
                type="text"
                placeholder="Mf. Karibu na UDSM / IFM / Kituo cha Basi"
                value={landmark}
                onChange={(e) => setLandmark(e.target.value)}
                className="w-full text-sm bg-neutral-50 border border-neutral-300 rounded-lg px-3 py-2 text-neutral-800 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">
                Namba ya Simu ya Kupigiwa / WhatsApp *
              </label>
              <input
                type="tel"
                placeholder="0712345678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full text-sm bg-neutral-50 border border-neutral-300 rounded-lg px-3 py-2 text-neutral-800 focus:outline-none focus:ring-2 focus:ring-emerald-600 font-mono"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-1">Maelezo ya Ziada ya Chumba</label>
            <textarea
              rows={3}
              placeholder="Eleza sifa za chumba: Tiles, gypsum, fensi, maji ya DAWASA, luku ya kujitegemea, usalama n.k."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full text-sm bg-neutral-50 border border-neutral-300 rounded-lg px-3 py-2 text-neutral-800 focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
          </div>

          {/* Progress Indicator */}
          {isSubmitting && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2 animate-pulse">
              <div className="flex items-center justify-between text-xs font-bold text-emerald-800">
                <span className="flex items-center gap-1.5">
                  <RotateCw className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                  <span>{progressMessage}</span>
                </span>
                <span>{progressPercent}%</span>
              </div>
              <div className="w-full bg-emerald-200 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-600 h-full rounded-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}

          {/* Submit Buttons */}
          <div className="pt-3 border-t border-neutral-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl border border-neutral-300 text-neutral-700 text-xs font-bold hover:bg-neutral-50 cursor-pointer disabled:opacity-50"
            >
              Ghairi
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-md transition-all cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <RotateCw className="w-4 h-4 animate-spin" />
                  <span>Inapakia Tangazo...</span>
                </>
              ) : (
                <>
                  <UploadCloud className="w-4 h-4" />
                  <span>Pakia Tangazo Bure</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
