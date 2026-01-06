"use client";

import type { StartAvatarResponse } from "@heygen/streaming-avatar";
import StreamingAvatar, {
  AvatarQuality,
  StreamingEvents,
  TaskMode,
  TaskType,
} from "@heygen/streaming-avatar";
import {
  Button,
} from "@nextui-org/react";
import { useEffect, useRef, useState } from "react";
import { MicIcon, MicOffIcon, CloseIcon } from "./Icons";

const PlayIcon = ({ size = 24, fill = "currentColor", ...props }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path d="M5 3L19 12L5 21V3Z" fill={fill} stroke={fill} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export default function InteractiveAvatar() {
  const [isLoadingSession, setIsLoadingSession] = useState(false);
  const [stream, setStream] = useState<MediaStream>();
  const [data, setData] = useState<StartAvatarResponse>();
  
  const [isMicOn, setIsMicOn] = useState(false);
  const isMicOnRef = useRef(false); 

  const [isAvatarTalking, setIsAvatarTalking] = useState(false);

  // Refs for media processing
  const mediaStreamVideoRef = useRef<HTMLVideoElement>(null); 
  const canvasRef = useRef<HTMLCanvasElement>(null); 
  const avatar = useRef<StreamingAvatar | null>(null);
  const recognition = useRef<any>(null); 
  const animationFrameId = useRef<number | null>(null);

  useEffect(() => {
    isMicOnRef.current = isMicOn;
  }, [isMicOn]);

  // --- CHROMA KEY LOGIC (Removes Green Screen) ---
  const processFrame = () => {
    const video = mediaStreamVideoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas || video.paused || video.ended) {
      return;
    }

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const l = frame.data.length / 4;

    for (let i = 0; i < l; i++) {
      const r = frame.data[i * 4 + 0];
      const g = frame.data[i * 4 + 1];
      const b = frame.data[i * 4 + 2];

      // Green Screen Condition
      if (g > 90 && g > r + 20 && g > b + 20) {
        frame.data[i * 4 + 3] = 0; 
      }
    }

    ctx.putImageData(frame, 0, 0);
    animationFrameId.current = requestAnimationFrame(processFrame);
  };

  useEffect(() => {
    if (stream && mediaStreamVideoRef.current) {
      mediaStreamVideoRef.current.srcObject = stream;
      mediaStreamVideoRef.current.onloadedmetadata = () => {
        mediaStreamVideoRef.current!.play();
        processFrame();
      };
    }
    return () => {
        if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
    };
  }, [stream]);


  // --- SPEECH & AVATAR LOGIC ---
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      
      if (SpeechRecognition) {
        recognition.current = new SpeechRecognition();
        recognition.current.lang = 'ar-SA'; 
        recognition.current.continuous = false;
        recognition.current.interimResults = false;

        recognition.current.onresult = async (event: any) => {
          const transcript = event.results[0][0].transcript;
          if (transcript && transcript.trim() !== "") {
             console.log("User said:", transcript);
             recognition.current.stop();
             await handleBrainProcess(transcript);
          }
        };

        recognition.current.onerror = (event: any) => {
            if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
                setIsMicOn(false);
            }
        };
      }
    }
  }, []);

  async function handleBrainProcess(text: string) {
    try {
        const response = await fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text }),
        });
        
        if (!response.ok) {
            if (isMicOnRef.current && recognition.current) {
                try { recognition.current.start(); } catch(e) {}
            }
            return;
        }

        const data = await response.json();
        const aiReply = data.reply;

        if (aiReply && avatar.current) {
            console.log("AI Reply (Arabic):", aiReply);
            await avatar.current.speak({
                text: aiReply,
                taskType: TaskType.REPEAT, 
                taskMode: TaskMode.SYNC 
            });
        } else {
             if (isMicOnRef.current && recognition.current) {
                try { recognition.current.start(); } catch(e) {}
            }
        }
    } catch (error) {
        console.error("Error connecting to OpenAI brain:", error);
        if (isMicOnRef.current && recognition.current) {
            try { recognition.current.start(); } catch(e) {}
        }
    }
  }

  async function fetchAccessToken() {
    try {
      const response = await fetch("/api/get-access-token", {
        method: "POST",
      });
      if (!response.ok) throw new Error("Failed to fetch token");
      return await response.text();
    } catch (error) {
      console.error("Error fetching access token:", error);
      return "";
    }
  }

  async function startSession() {
    setIsLoadingSession(true);
    const newToken = await fetchAccessToken();

    if (!newToken) {
        setIsLoadingSession(false);
        return;
    }

    avatar.current = new StreamingAvatar({
      token: newToken,
    });

    avatar.current.on(StreamingEvents.AVATAR_START_TALKING, () => {
      setIsAvatarTalking(true);
      if (recognition.current) recognition.current.stop(); 
    });

    avatar.current.on(StreamingEvents.AVATAR_STOP_TALKING, () => {
      setIsAvatarTalking(false);
      console.log("Avatar stopped. Mic state is:", isMicOnRef.current);
      if (isMicOnRef.current && recognition.current) {
        setTimeout(() => {
            try { 
                recognition.current.start(); 
            } catch(e) {}
        }, 200); 
      }
    });

    avatar.current.on(StreamingEvents.STREAM_DISCONNECTED, endSession);
    avatar.current.on(StreamingEvents.STREAM_READY, (event) => setStream(event.detail));

    try {
      const res = await avatar.current.createStartAvatar({
        quality: AvatarQuality.High, 
        avatarName: "avatar id",
        knowledgeId: "Sa In", 
        disableIdleTimeout: true,
      });

      setData(res);
      setIsLoadingSession(false);
    } catch (error) {
      console.error("Error starting avatar session:", error);
      setIsLoadingSession(false);
      alert("Failed to start avatar. Check console.");
    }
  }

  async function endSession() {
    if (recognition.current) recognition.current.stop();
    await avatar.current?.stopAvatar();
    setStream(undefined);
    setIsMicOn(false);
    if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
  }

  function toggleMic() {
    if (!recognition.current) {
        alert("Microphone not supported in this browser.");
        return;
    }
    if (isMicOn) {
      recognition.current.stop();
      setIsMicOn(false);
    } else {
      try {
        recognition.current.start();
        setIsMicOn(true);
      } catch (e) {
        console.error("Could not start recognition:", e);
      }
    }
  }

  return (
    <div className="w-full h-screen overflow-hidden relative flex flex-col items-center justify-center">
      
      {/* 1. BACKGROUND VIDEO */}
      <video
        src="/background.mov" 
        autoPlay
        loop
        muted 
        playsInline
        className="absolute inset-0 w-full h-full object-cover z-0"
      />

      {/* 2. BLACK OVERLAY (Optional dimming) */}
      <div className="absolute inset-0 w-full h-full bg-black/10 z-0"></div>

      {/* 3. AVATAR LAYER (Using Canvas for Green Screen Removal) */}
      <div className="absolute inset-0 w-full h-full z-10 flex items-center justify-center pointer-events-none">
        <video
            ref={mediaStreamVideoRef}
            autoPlay
            playsInline
            className="hidden" 
             
        />
        {stream ? (
            <canvas
                ref={canvasRef}
                className="w-full h-full object-contain"
            />
        ) : null}
      </div>

      {/* 4. CONTROLS */}
      <div className="absolute bottom-10 z-50 flex flex-col items-center gap-4 w-full px-4 pointer-events-auto">
        
        {/* CUSTOM GLASS EFFECT CONTAINER - Background kept transparent as requested */}
        <div 
            className="flex items-center justify-center gap-8 p-4 bg-[rgba(128,119,119,0)] rounded-[16px] shadow-[0_4px_30px_rgba(0,0,0,0.1)] backdrop-blur-[3.7px] border border-white/20"
        >
          {!stream ? (
            <Button
              isIconOnly
              className="w-16 h-16 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 text-white shadow-lg hover:scale-105 transition-transform"
              onClick={startSession}
              isLoading={isLoadingSession}
            >
              {!isLoadingSession && <PlayIcon size={32} fill="white" />}
            </Button>
          ) : (
            <div className="flex items-center gap-2">
                <Button
                    isIconOnly
                    // UPDATED: Mic Button is now SOLID WHITE for better visibility
                    className={`w-14 h-14 rounded-full transition-all ${
                        isMicOn ? "bg-red-500 animate-pulse text-white" : "bg-white text-black hover:bg-gray-200"
                    }`}
                    onClick={toggleMic}
                    isDisabled={isAvatarTalking} 
                >
                    {isMicOn ? <MicIcon size={24} /> : <MicOffIcon size={24} />}
                </Button>
            </div>
          )}
          
          <Button
            isIconOnly
            // UPDATED: End Session Button is now SOLID RED (active) or More Visible Grey (disabled)
            className={`w-14 h-14 rounded-full border-2 ${
                stream 
                ? "bg-red-500 text-white hover:bg-red-600 border-red-500 cursor-pointer" 
                : "bg-white/10 border-white/20 text-white/50 cursor-not-allowed"
            }`}
            onClick={endSession}
            disabled={!stream}
          >
            <CloseIcon size={28} />
          </Button>
        </div>
      </div>
    </div>
  );
}
