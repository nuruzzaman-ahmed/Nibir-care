"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Maximize2, Volume2, VolumeX, Wifi, WifiOff, Stethoscope } from "lucide-react";

type SlotInfo = { serial: number; name: string | null } | null;

type Props = {
  chamberId: string;
  queueId: string | null;
  chamberName: string;
  doctorName: string;
  specialty: string;
  initialCurrent: SlotInfo;
  initialNext: SlotInfo;
  initialStatus: string;
  totalBooked: number;
  totalCompleted: number;
  waiting: number;
  avgDuration: number;
};

// Convert English digits to Bengali
function toBn(n: number | string): string {
  return String(n).replace(/\d/g, (d) => "০১২৩৪৫৬৭৮৯"[parseInt(d)]);
}

function announce(text: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utt = new SpeechSynthesisUtterance(text);
  utt.lang = "bn-BD";
  utt.rate = 0.85;
  utt.pitch = 1.0;
  utt.volume = 1.0;

  // Try to find Bengali voice; fall back to any available
  const voices = window.speechSynthesis.getVoices();
  const bnVoice = voices.find((v) => v.lang.startsWith("bn")) ??
    voices.find((v) => v.lang.startsWith("hi")) ??
    voices[0];
  if (bnVoice) utt.voice = bnVoice;

  window.speechSynthesis.speak(utt);
}

export function TVDisplay({
  chamberId,
  queueId: initialQueueId,
  chamberName,
  doctorName,
  specialty,
  initialCurrent,
  initialNext,
  initialStatus,
  totalBooked,
  totalCompleted,
  waiting,
  avgDuration,
}: Props) {
  const [current, setCurrent] = useState<SlotInfo>(initialCurrent);
  const [next, setNext] = useState<SlotInfo>(initialNext);
  const [status, setStatus] = useState(initialStatus);
  const [booked, setBooked] = useState(totalBooked);
  const [completed, setCompleted] = useState(totalCompleted);
  const [waitingCount, setWaitingCount] = useState(waiting);
  const [avg, setAvg] = useState(avgDuration);
  const [connected, setConnected] = useState(false);
  const [muted, setMuted] = useState(false);
  const [flash, setFlash] = useState(false);
  const [time, setTime] = useState(new Date());
  const prevSerial = useRef<number | null>(initialCurrent?.serial ?? null);
  const muteRef = useRef(muted);
  muteRef.current = muted;

  // Clock
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Poll for updates (SSE or polling)
  const poll = useCallback(async () => {
    try {
      const res = await fetch(`/api/chamber/${chamberId}/today`);
      if (!res.ok) return;
      const data = await res.json();
      setStatus(data.queue?.status ?? "NOT_STARTED");
      setBooked(data.queue?.totalBooked ?? 0);
      setCompleted(data.queue?.totalCompleted ?? 0);
      setWaitingCount(data.queue?.waiting ?? 0);
      setAvg(data.queue?.avgConsultDuration ?? 10);

      const newCurrent: SlotInfo = data.current;
      const newNext: SlotInfo = data.next;

      setCurrent(newCurrent);
      setNext(newNext);

      // Detect serial change → flash + voice
      if (newCurrent && newCurrent.serial !== prevSerial.current) {
        prevSerial.current = newCurrent.serial;
        setFlash(true);
        setTimeout(() => setFlash(false), 2000);

        if (!muteRef.current) {
          const currentText = `এখন চলছে সিরিয়াল নম্বর ${toBn(newCurrent.serial)}।`;
          const nextText = newNext
            ? ` পরবর্তী সিরিয়াল ${toBn(newNext.serial)}, ${newNext.name ?? "রোগী"}। প্রস্তুত থাকুন।`
            : "";
          setTimeout(() => announce(currentText + nextText), 300);
        }
      }
      setConnected(true);
    } catch {
      setConnected(false);
    }
  }, [chamberId]);

  useEffect(() => {
    poll();
    const interval = setInterval(poll, 8000); // poll every 8 seconds
    return () => clearInterval(interval);
  }, [poll]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  const formatTime = (d: Date) =>
    d.toLocaleTimeString("bn-BD", { hour: "2-digit", minute: "2-digit" });

  const statusLabel: Record<string, string> = {
    NOT_STARTED: "শুরু হয়নি",
    RUNNING: "চলছে",
    PAUSED: "বিরতি",
    COMPLETED: "সম্পন্ন",
  };

  const isPaused = status === "PAUSED";
  const isRunning = status === "RUNNING";

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col select-none overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center justify-between px-8 py-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-teal-500 flex items-center justify-center">
            <Stethoscope className="h-4 w-4 text-white" strokeWidth={2.5} />
          </div>
          <span className="font-bold text-lg text-white">DOC<span className="text-teal-400">&amp;</span>TEST</span>
        </div>

        <div className="text-center">
          <p className="font-bold text-white text-lg">{doctorName}</p>
          <p className="text-gray-400 text-sm">{chamberName} · {specialty}</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-2xl font-mono font-bold text-teal-300">{formatTime(time)}</p>
            <div className="flex items-center justify-end gap-1.5">
              {connected ? (
                <><Wifi className="h-3 w-3 text-emerald-400" /><span className="text-[11px] text-emerald-400">লাইভ</span></>
              ) : (
                <><WifiOff className="h-3 w-3 text-red-400" /><span className="text-[11px] text-red-400">অফলাইন</span></>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setMuted(!muted)}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors">
              {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </button>
            <button onClick={toggleFullscreen}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors">
              <Maximize2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center gap-8 px-8 py-10">
        {isPaused ? (
          <div className="text-center">
            <div className="text-6xl mb-4">⏸</div>
            <p className="text-3xl font-bold text-amber-400">সাময়িক বিরতি</p>
            <p className="text-gray-400 mt-2">অনুগ্রহ করে অপেক্ষা করুন</p>
          </div>
        ) : status === "NOT_STARTED" ? (
          <div className="text-center">
            <div className="text-6xl mb-4">🏥</div>
            <p className="text-3xl font-bold text-gray-300">চেম্বার শুরু হয়নি</p>
            <p className="text-gray-500 mt-2">ডাক্তার শীঘ্রই চেম্বার শুরু করবেন</p>
          </div>
        ) : status === "COMPLETED" ? (
          <div className="text-center">
            <div className="text-6xl mb-4">✅</div>
            <p className="text-3xl font-bold text-emerald-400">চেম্বার সম্পন্ন</p>
            <p className="text-gray-400 mt-2">আজকের সব রোগী দেখা হয়ে গেছে</p>
          </div>
        ) : (
          <>
            {/* CURRENT SERIAL — hero */}
            <div className={`text-center transition-all duration-500 ${flash ? "scale-110" : "scale-100"}`}>
              <p className="text-gray-400 text-xl font-medium tracking-widest uppercase mb-3">
                এখন চলছে
              </p>
              <div className={`relative inline-block ${flash ? "animate-pulse-glow" : ""}`}>
                <div className={`text-[180px] sm:text-[240px] font-black leading-none tabular-nums transition-colors duration-500 ${
                  flash ? "text-teal-300" : "text-white"
                }`}>
                  {current ? toBn(current.serial) : "—"}
                </div>
              </div>
              {current?.name && (
                <p className="text-2xl text-gray-300 mt-2 font-medium">{current.name}</p>
              )}
            </div>

            {/* NEXT SERIAL */}
            <div className="bg-white/5 border border-white/10 rounded-3xl px-12 py-6 text-center min-w-[360px]">
              <p className="text-gray-400 text-sm font-medium uppercase tracking-widest mb-2">পরবর্তী সিরিয়াল</p>
              {next ? (
                <>
                  <p className="text-7xl font-black text-teal-400 tabular-nums">{toBn(next.serial)}</p>
                  {next.name && (
                    <p className="text-xl text-gray-300 mt-2 font-medium">{next.name}</p>
                  )}
                  <p className="text-amber-400 text-sm mt-3 font-semibold animate-pulse">প্রস্তুত থাকুন ↑</p>
                </>
              ) : (
                <p className="text-3xl text-gray-500">—</p>
              )}
            </div>
          </>
        )}
      </div>

      {/* Bottom stats bar */}
      <div className="border-t border-white/10 px-8 py-4">
        <div className="flex items-center justify-center gap-12 flex-wrap">
          {[
            { label: "মোট বুকিং", value: toBn(booked), color: "text-blue-300" },
            { label: "সম্পন্ন", value: toBn(completed), color: "text-emerald-300" },
            { label: "অপেক্ষারত", value: toBn(waitingCount), color: "text-amber-300" },
            { label: "গড় সময়", value: `~${toBn(Math.round(avg))} মিনিট`, color: "text-teal-300" },
            {
              label: "অবস্থা",
              value: statusLabel[status] ?? status,
              color: isRunning ? "text-emerald-300" : isPaused ? "text-amber-300" : "text-gray-400",
            },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
