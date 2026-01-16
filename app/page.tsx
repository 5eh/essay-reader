"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import Reader from "@/components/reader";

export default function Home() {
  const [text, setText] = useState("");
  const [wpm, setWpm] = useState(300);
  const [isReading, setIsReading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check for mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleStart = () => {
    if (text.trim()) {
      setIsReading(true);
    }
  };

  const handleExit = () => {
    setIsReading(false);
  };

  // Mobile warning screen
  if (isMobile) {
    return (
      <main className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center p-8">
        <p
          className="text-white text-xl text-center mb-12"
          style={{ fontFamily: "Times New Roman, serif" }}
        >
          Please use Desktop for the best experience
        </p>
        <Link href="https://arthurlabs.net/">
          <Image
            src="/logo.png"
            alt="Arthur Labs"
            width={48}
            height={48}
            className="opacity-70 hover:opacity-100 transition-opacity"
          />
        </Link>
      </main>
    );
  }

  if (isReading) {
    return <Reader text={text} initialWpm={wpm} onExit={handleExit} />;
  }

  return (
    <main className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-8">
      <div className="w-full max-w-3xl">
        {/* Title */}
        <h1
          className="text-4xl font-bold text-white text-center mb-2"
          style={{ fontFamily: "Times New Roman, serif" }}
        >
          SPEED READER
        </h1>

        {/* Accent line */}
        <div className="w-24 h-0.5 bg-[#ff3b3b] mx-auto mb-8" />

        {/* Instructions */}
        <p
          className="text-[#4a4a4a] text-center mb-6"
          style={{ fontFamily: "Times New Roman, serif" }}
        >
          Paste your text below
        </p>

        {/* Text input */}
        <div className="border border-[#252525] rounded-lg overflow-hidden mb-8">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste text here..."
            className="w-full h-64 bg-[#1a1a1a] text-white p-6 resize-none focus:outline-none placeholder-[#4a4a4a]"
            style={{ fontFamily: "Times New Roman, serif", fontSize: "16px" }}
          />
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4">
          {/* WPM input */}
          <div className="text-center">
            <label
              className="block text-[#4a4a4a] text-sm mb-2"
              style={{ fontFamily: "Times New Roman, serif" }}
            >
              WPM
            </label>
            <input
              type="number"
              value={wpm}
              onChange={(e) =>
                setWpm(
                  Math.max(50, Math.min(1500, parseInt(e.target.value) || 300)),
                )
              }
              className="w-full h-12 bg-[#1a1a1a] text-white text-center text-xl rounded border border-[#252525] focus:outline-none focus:border-[#ff3b3b]"
              style={{ fontFamily: "Times New Roman, serif" }}
            />
          </div>

          {/* Start button */}
          <button
            onClick={handleStart}
            disabled={!text.trim()}
            className="h-12 mt-6 bg-[#ff3b3b] hover:bg-[#ff6b4a] disabled:bg-[#333] disabled:cursor-not-allowed text-white font-bold text-lg px-10 rounded transition-colors"
            style={{ fontFamily: "Times New Roman, serif" }}
          >
            START READING
          </button>
        </div>

        {/* Hint */}
        <p
          className="text-[#2a2a2a] text-sm text-center mt-8"
          style={{ fontFamily: "Times New Roman, serif" }}
        >
          TIP: Press SPACE to pause/resume during reading
        </p>

        {/* Logo */}
        <div className="flex justify-center mt-12">
          <Link href="https://arthurlabs.net/">
            <Image
              src="/logo.png"
              alt="Arthur Labs"
              width={48}
              height={48}
              className="opacity-30 hover:opacity-70 transition-opacity"
            />
          </Link>
        </div>
      </div>
    </main>
  );
}
