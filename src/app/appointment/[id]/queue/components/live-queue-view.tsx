"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  MapPin,
  RefreshCw,
  Bell,
  ArrowLeft,
  CheckCircle,
  Clock,
  Users,
  Stethoscope,
  AlertCircle,
  XCircle,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn, minutesToDisplay } from "@/lib/utils";

type Props = {
  appointment: {
    id: string;
    serialNumber: number;
    status: string;
    date: string;
    slotTime?: string | null;
  };
  queue: {
    id: string;
    currentSerial: number;
    status: string;
    avgConsultDuration: number;
    doctorDelayMinutes: number;
    note?: string | null;
    updatedAt: string;
  };
  doctor: { nameBn: string; specialty: string };
  chamber: { nameBn: string; address: string };
  initialETA: number;
  initialPatientsAhead: number;
};

function patientsAheadCount(patientSerial: number, currentSerial: number): number {
  return Math.max(0, patientSerial - currentSerial - 1);
}

function etaCalc(ahead: number, avgDuration: number, delay: number): number {
  return ahead * avgDuration + delay;
}

export function LiveQueueView({
  appointment,
  queue: initialQueue,
  doctor,
  chamber,
  initialETA,
  initialPatientsAhead,
}: Props) {
  const [liveQueue, setLiveQueue] = useState(initialQueue);
  const [apptStatus, setApptStatus] = useState(appointment.status);
  const [lastUpdated, setLastUpdated] = useState(new Date(initialQueue.updatedAt));
  const [isConnected, setIsConnected] = useState(false);

  const ahead = patientsAheadCount(appointment.serialNumber, liveQueue.currentSerial);
  const eta = etaCalc(ahead, liveQueue.avgConsultDuration, liveQueue.doctorDelayMinutes);

  // SSE connection
  useEffect(() => {
    if (apptStatus === "COMPLETED" || apptStatus === "CANCELLED" || liveQueue.status === "COMPLETED") {
      return;
    }

    const eventSource = new EventSource(`/api/queue/${liveQueue.id}/stream`);

    eventSource.onopen = () => setIsConnected(true);

    eventSource.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.type === "QUEUE_UPDATE" && data.queue) {
          const q = data.queue;
          setLiveQueue({
            id: q.id,
            currentSerial: q.currentSerial,
            status: q.status,
            avgConsultDuration: q.avgConsultDuration,
            doctorDelayMinutes: q.doctorDelayMinutes,
            note: q.note ?? null,
            updatedAt: q.updatedAt,
          });
          setLastUpdated(new Date());

          // Update appointment status from the queue data
          const myAppt = q.appointments?.find((a: { id: string }) => a.id === appointment.id);
          if (myAppt) setApptStatus(myAppt.status);
        }
      } catch { /* ignore parse errors */ }
    };

    eventSource.onerror = () => setIsConnected(false);

    return () => eventSource.close();
  }, [liveQueue.id, apptStatus, liveQueue.status]);

  const isCurrent = apptStatus === "CURRENT" || appointment.serialNumber === liveQueue.currentSerial;
  const isCompleted = apptStatus === "COMPLETED";
  const isCancelled = apptStatus === "CANCELLED" || apptStatus === "NO_SHOW";
  const isRunning = liveQueue.status === "RUNNING";

  const bgClass = isCurrent
    ? "bg-gradient-to-br from-teal-500 to-teal-700"
    : isCompleted
    ? "bg-gradient-to-br from-emerald-500 to-emerald-700"
    : "bg-gradient-to-br from-gray-700 to-gray-900";

  return (
    <div className="w-full max-w-sm animate-fade-in">
      {/* Card */}
      <div className={cn("rounded-3xl text-white overflow-hidden shadow-2xl", bgClass)}>
        {/* Header */}
        <div className="p-6 pb-4">
          <div className="flex items-center justify-between mb-4">
            <Link href="/dashboard" className="flex items-center gap-2 text-white/80 hover:text-white text-sm">
              <ArrowLeft className="h-4 w-4" />
              ড্যাশবোর্ড
            </Link>
            <div className={cn("flex items-center gap-1.5 text-xs px-2 py-1 rounded-full", isConnected ? "bg-white/20" : "bg-white/10")}>
              <span className={cn("h-2 w-2 rounded-full", isConnected ? "bg-emerald-400 animate-pulse" : "bg-gray-400")} />
              {isConnected ? "সংযুক্ত" : "সংযোগ নেই"}
            </div>
          </div>

          {/* Doctor info */}
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-white/20 flex items-center justify-center">
              <Stethoscope className="h-6 w-6" />
            </div>
            <div>
              <h2 className="font-bold text-lg leading-tight">{doctor.nameBn}</h2>
              <p className="text-white/70 text-sm">{doctor.specialty}</p>
            </div>
          </div>
        </div>

        {/* Main serial display */}
        <div className="px-6 pb-6">
          {isCurrent ? (
            /* Currently being served */
            <div className="text-center py-8 animate-pulse-ring">
              <div className="h-24 w-24 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-12 w-12 text-white" />
              </div>
              <h3 className="text-2xl font-black mb-2">আপনার পালা!</h3>
              <p className="text-white/80">অনুগ্রহ করে চেম্বারে প্রবেশ করুন</p>
            </div>
          ) : isCompleted ? (
            <div className="text-center py-8">
              <CheckCircle className="h-16 w-16 mx-auto mb-3 text-white" />
              <h3 className="text-xl font-bold">সম্পন্ন হয়েছে</h3>
              <p className="text-white/70 text-sm mt-1">আপনার অ্যাপয়েন্টমেন্ট শেষ হয়েছে</p>
            </div>
          ) : isCancelled ? (
            <div className="text-center py-8">
              <XCircle className="h-16 w-16 mx-auto mb-3 text-white/70" />
              <h3 className="text-xl font-bold">বাতিল হয়েছে</h3>
            </div>
          ) : (
            /* Waiting */
            <div className="space-y-4">
              {/* Queue numbers */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/10 rounded-2xl p-4 text-center">
                  <p className="text-white/60 text-xs mb-1">বর্তমানে চলছে</p>
                  <p className="text-4xl font-black">
                    {liveQueue.currentSerial > 0 ? `#${liveQueue.currentSerial}` : "—"}
                  </p>
                </div>
                <div className="bg-white/20 rounded-2xl p-4 text-center border-2 border-white/30">
                  <p className="text-white/60 text-xs mb-1">আপনার নম্বর</p>
                  <p className="text-4xl font-black">#{appointment.serialNumber}</p>
                </div>
              </div>

              {/* Ahead count */}
              <div className="bg-white/10 rounded-2xl p-4 text-center">
                <div className="flex items-center justify-center gap-2 text-white/70 text-sm mb-1">
                  <Users className="h-4 w-4" />
                  <span>আপনার আগে</span>
                </div>
                <p className="text-3xl font-black">{ahead} জন</p>
              </div>

              {/* ETA */}
              <div className="bg-white/10 rounded-2xl p-4 text-center">
                <div className="flex items-center justify-center gap-2 text-white/70 text-sm mb-1">
                  <Clock className="h-4 w-4" />
                  <span>আনুমানিক সময়</span>
                </div>
                <p className="text-2xl font-black">
                  {ahead === 0 ? "শীঘ্রই" : `~${minutesToDisplay(eta)}`}
                </p>
              </div>

              {/* Queue status */}
              {liveQueue.status === "PAUSED" && (
                <div className="bg-amber-500/30 rounded-xl px-4 py-3 flex items-center gap-2 text-sm">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>কিউ সাময়িক বিরতিতে আছে</span>
                </div>
              )}

              {liveQueue.note && (
                <div className="bg-white/10 rounded-xl px-4 py-3 flex items-center gap-2 text-sm">
                  <Info className="h-4 w-4 shrink-0 text-white/60" />
                  <span className="text-white/80">{liveQueue.note}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Meta info */}
      <div className="mt-4 bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-2">
        <div className="flex items-start gap-2 text-sm text-gray-600">
          <MapPin className="h-4 w-4 mt-0.5 text-gray-400 shrink-0" />
          <div>
            <p className="font-medium text-gray-900">{chamber.nameBn}</p>
            <p className="text-xs text-gray-400">{chamber.address}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <RefreshCw className="h-3 w-3" />
          সর্বশেষ আপডেট: {lastUpdated.toLocaleTimeString("bn-BD")}
        </div>
      </div>

      {/* Actions */}
      {!isCompleted && !isCancelled && (
        <div className="mt-4 space-y-2">
          {isCurrent ? null : (
            <Link href="/dashboard">
              <Button variant="outline" className="w-full" size="sm">
                ড্যাশবোর্ডে যান
              </Button>
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
