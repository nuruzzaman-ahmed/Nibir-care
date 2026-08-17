"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Users,
  CheckCircle,
  Clock,
  Play,
  Pause,
  SkipForward,
  UserX,
  AlertCircle,
  ChevronRight,
  Stethoscope,
  Shield,
  Activity,
  Timer,
  UserPlus,
  X,
  FileText,
  Monitor,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn, formatTime, minutesToDisplay, formatCurrency } from "@/lib/utils";
import { PrescriptionModal } from "./prescription-modal";

type Appointment = {
  id: string;
  serialNumber: number;
  status: string;
  patientNote?: string | null;
  slotTime?: string | null;
  startedAt?: string | null;
  isWalkin?: boolean;
  walkinName?: string | null;
  walkinPhone?: string | null;
  patient: {
    nameBn?: string | null;
    nameEn?: string | null;
    user: { name?: string | null; phone?: string | null };
  } | null;
};

function displayName(appt: Appointment): string {
  return appt.patient?.nameBn ?? appt.patient?.user.name ?? appt.walkinName ?? "রোগী";
}

type Queue = {
  id: string;
  chamberId: string;
  date: string;
  status: string;
  currentSerial: number;
  totalBooked: number;
  totalCompleted: number;
  totalSkipped: number;
  totalNoShow: number;
  avgConsultDuration: number;
  doctorDelayMinutes: number;
  startedAt?: string | null;
  chamber: { nameBn: string; nameEn: string; address: string };
  appointments: Appointment[];
};

type Props = {
  doctor: {
    id: string;
    nameBn: string;
    verificationStatus: string;
    specialties: { specialty: { nameBn: string } }[];
  };
  todayChambers: { id: string; nameBn: string; address: string; schedules: { startTime: string; endTime: string }[] }[];
  todayQueues: Queue[];
  stats: { totalWaiting: number; totalCompleted: number; totalBooked: number; estimatedEarnings: number };
  today: string;
};

type WalkinForm = { walkinName: string; walkinPhone: string; patientNote: string; chamberId: string };

export function DoctorDashboardClient({ doctor, todayChambers, todayQueues: initialQueues, stats, today }: Props) {
  const [queues, setQueues] = useState<Queue[]>(initialQueues);
  const [activeQueueId, setActiveQueueId] = useState<string | null>(
    initialQueues.find((q) => q.status === "RUNNING")?.id ?? initialQueues[0]?.id ?? null
  );
  const [loading, setLoading] = useState<string | null>(null);
  const [delayMinutes, setDelayMinutes] = useState(15);
  const [error, setError] = useState("");

  // Prescription modal
  const [showRx, setShowRx] = useState(false);

  // Walk-in modal
  const [showWalkin, setShowWalkin] = useState(false);
  const [walkinForm, setWalkinForm] = useState<WalkinForm>({
    walkinName: "",
    walkinPhone: "",
    patientNote: "",
    chamberId: todayChambers[0]?.id ?? "",
  });
  const [walkinLoading, setWalkinLoading] = useState(false);
  const [walkinError, setWalkinError] = useState("");
  const [walkinSuccess, setWalkinSuccess] = useState("");

  const activeQueue = queues.find((q) => q.id === activeQueueId);
  const currentAppt = activeQueue?.appointments.find((a) => a.status === "CURRENT");
  const waitingAppts = activeQueue?.appointments
    .filter((a) => a.status === "WAITING" || a.status === "BOOKED")
    .sort((a, b) => a.serialNumber - b.serialNumber) ?? [];

  const refreshQueue = useCallback(async () => {
    if (!activeQueueId) return;
    const res = await fetch(`/api/queue/${activeQueueId}/summary`);
    if (res.ok) {
      const data = await res.json();
      setQueues((prev) => prev.map((q) => (q.id === activeQueueId ? { ...q, ...data.queue } : q)));
    }
  }, [activeQueueId]);

  // Auto-refresh every 15 seconds
  useEffect(() => {
    const interval = setInterval(refreshQueue, 15000);
    return () => clearInterval(interval);
  }, [refreshQueue]);

  const doAction = async (action: string, params: Record<string, unknown> = {}) => {
    setError("");
    setLoading(action);
    try {
      const res = await fetch(`/api/queue/${activeQueueId}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...params }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "একটি সমস্যা হয়েছে");
      } else {
        await refreshQueue();
      }
    } catch {
      setError("সংযোগ সমস্যা");
    } finally {
      setLoading(null);
    }
  };

  const handleWalkinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!walkinForm.walkinName.trim()) { setWalkinError("রোগীর নাম দিন"); return; }
    if (!walkinForm.chamberId) { setWalkinError("চেম্বার বেছে নিন"); return; }
    setWalkinLoading(true);
    setWalkinError("");
    setWalkinSuccess("");
    try {
      const res = await fetch("/api/appointments/walkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(walkinForm),
      });
      const data = await res.json();
      if (!res.ok) {
        setWalkinError(data.error ?? "সিরিয়াল যোগ করতে সমস্যা হয়েছে");
      } else {
        setWalkinSuccess(`সিরিয়াল #${data.serialNumber} সফলভাবে যোগ হয়েছে`);
        setWalkinForm({ walkinName: "", walkinPhone: "", patientNote: "", chamberId: todayChambers[0]?.id ?? "" });
        await refreshQueue();
        setTimeout(() => { setShowWalkin(false); setWalkinSuccess(""); }, 1800);
      }
    } finally {
      setWalkinLoading(false);
    }
  };

  const startQueue = () => doAction("start");
  const nextPatient = () => doAction("next");
  const skipPatient = () => doAction("skip", { appointmentId: currentAppt?.id });
  const markNoShow = () => doAction("noshow", { appointmentId: currentAppt?.id });
  const pauseQueue = () => doAction("pause");
  const resumeQueue = () => doAction("resume");
  const setDelay = () => doAction("delay", { delayMinutes });

  const statusBadge = (status: string) => {
    const map: Record<string, { label: string; cls: string }> = {
      NOT_STARTED: { label: "শুরু হয়নি", cls: "bg-gray-100 text-gray-600" },
      RUNNING: { label: "চলছে", cls: "bg-emerald-100 text-emerald-700" },
      PAUSED: { label: "বিরতি", cls: "bg-amber-100 text-amber-700" },
      COMPLETED: { label: "সম্পন্ন", cls: "bg-blue-100 text-blue-700" },
      CANCELLED: { label: "বাতিল", cls: "bg-red-100 text-red-700" },
    };
    const s = map[status] ?? { label: status, cls: "bg-gray-100 text-gray-600" };
    return <span className={cn("px-2.5 py-0.5 rounded-full text-xs font-semibold", s.cls)}>{s.label}</span>;
  };

  return (
    <div className="space-y-4 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">আজকের চেম্বার</h1>
          <p className="text-sm text-gray-500">{today}</p>
        </div>
        <div className="flex items-center gap-2">
          {todayChambers.length > 0 && (
            <Button
              size="sm"
              onClick={() => setShowWalkin(true)}
              className="gap-1.5 bg-teal-600 hover:bg-teal-700 text-white text-[13px] h-8 px-3"
            >
              <UserPlus className="h-3.5 w-3.5" />
              রোগী যোগ করুন
            </Button>
          )}
          {doctor.verificationStatus === "VERIFIED" && (
            <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full border border-emerald-200 text-xs font-semibold">
              <Shield className="h-3 w-3" />
              যাচাইকৃত
            </div>
          )}
        </div>
      </div>

      {/* Prescription modal */}
      {showRx && currentAppt && (
        <PrescriptionModal
          appointmentId={currentAppt.id}
          patientName={displayName(currentAppt)}
          serialNumber={currentAppt.serialNumber}
          onClose={() => setShowRx(false)}
          onSaved={() => setShowRx(false)}
        />
      )}

      {/* Walk-in modal */}
      {showWalkin && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-slide-down">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="font-bold text-gray-900">ওয়াক-ইন রোগী যোগ করুন</h2>
                <p className="text-xs text-gray-400 mt-0.5">সরাসরি আসা রোগীকে কিউতে যোগ করুন</p>
              </div>
              <button onClick={() => { setShowWalkin(false); setWalkinError(""); setWalkinSuccess(""); }} className="h-8 w-8 flex items-center justify-center rounded-xl text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleWalkinSubmit} className="p-5 space-y-4">
              {todayChambers.length > 1 && (
                <div>
                  <label className="block text-[12px] font-semibold text-gray-600 mb-1.5">চেম্বার *</label>
                  <select
                    value={walkinForm.chamberId}
                    onChange={(e) => setWalkinForm((f) => ({ ...f, chamberId: e.target.value }))}
                    className="w-full px-3.5 py-2.5 text-[13px] border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    {todayChambers.map((c) => (
                      <option key={c.id} value={c.id}>{c.nameBn}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-[12px] font-semibold text-gray-600 mb-1.5">রোগীর নাম *</label>
                <input
                  type="text"
                  placeholder="রোগীর নাম লিখুন..."
                  value={walkinForm.walkinName}
                  onChange={(e) => setWalkinForm((f) => ({ ...f, walkinName: e.target.value }))}
                  autoFocus
                  className="w-full px-3.5 py-2.5 text-[13px] border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-gray-600 mb-1.5">ফোন নম্বর</label>
                <input
                  type="tel"
                  placeholder="01XXXXXXXXX"
                  value={walkinForm.walkinPhone}
                  onChange={(e) => setWalkinForm((f) => ({ ...f, walkinPhone: e.target.value }))}
                  className="w-full px-3.5 py-2.5 text-[13px] border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-gray-600 mb-1.5">নোট</label>
                <textarea
                  placeholder="রোগীর সমস্যা বা বিশেষ টীকা..."
                  value={walkinForm.patientNote}
                  onChange={(e) => setWalkinForm((f) => ({ ...f, patientNote: e.target.value }))}
                  rows={2}
                  className="w-full px-3.5 py-2.5 text-[13px] border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                />
              </div>

              {walkinError && (
                <p className="text-[12px] text-red-600 bg-red-50 rounded-lg px-3 py-2">{walkinError}</p>
              )}
              {walkinSuccess && (
                <p className="text-[12px] text-emerald-700 bg-emerald-50 rounded-lg px-3 py-2 font-semibold">{walkinSuccess}</p>
              )}

              <Button type="submit" className="w-full gap-2 h-10 bg-teal-600 hover:bg-teal-700" disabled={walkinLoading}>
                <UserPlus className="h-4 w-4" />
                {walkinLoading ? "যোগ হচ্ছে..." : "কিউতে যোগ করুন"}
              </Button>
            </form>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-600 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "মোট বুকিং", value: stats.totalBooked, icon: Users, color: "text-blue-600 bg-blue-50" },
          { label: "অপেক্ষারত", value: stats.totalWaiting, icon: Clock, color: "text-amber-600 bg-amber-50" },
          { label: "সম্পন্ন", value: stats.totalCompleted, icon: CheckCircle, color: "text-emerald-600 bg-emerald-50" },
          { label: "আনুমানিক আয়", value: formatCurrency(stats.estimatedEarnings), icon: Activity, color: "text-purple-600 bg-purple-50" },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center shrink-0", stat.color)}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-2xl font-bold text-gray-900 truncate">{stat.value}</div>
                  <div className="text-xs text-gray-500">{stat.label}</div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Chamber selector */}
      {queues.length > 1 && (
        <div className="flex gap-2 overflow-x-auto">
          {queues.map((q) => (
            <button
              key={q.id}
              onClick={() => setActiveQueueId(q.id)}
              className={cn(
                "shrink-0 px-4 py-2 rounded-xl text-sm font-medium border-2 transition-all",
                activeQueueId === q.id
                  ? "border-teal-500 bg-teal-50 text-teal-700"
                  : "border-gray-100 text-gray-600 hover:border-gray-200"
              )}
            >
              {q.chamber.nameBn}
              <span className="ml-1.5 text-xs opacity-70">({q.totalBooked})</span>
            </button>
          ))}
        </div>
      )}

      {todayChambers.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Stethoscope className="h-12 w-12 mx-auto mb-3 text-gray-200" />
            <h3 className="font-semibold text-gray-600 mb-1">আজ কোনো চেম্বার নেই</h3>
            <p className="text-sm text-gray-400">চেম্বার সেটআপ করতে চেম্বার মেনুতে যান</p>
          </CardContent>
        </Card>
      ) : activeQueue ? (
        <div className="grid lg:grid-cols-2 gap-4">
          {/* Current patient / Queue controls */}
          <div className="space-y-4">
            {/* Queue status */}
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-gray-900">{activeQueue.chamber.nameBn}</h3>
                    <p className="text-xs text-gray-500">{activeQueue.chamber.address}</p>
                  </div>
                  {statusBadge(activeQueue.status)}
                </div>

                {/* Current serial display */}
                <div className="text-center bg-gray-50 rounded-2xl p-5 mb-4">
                  <p className="text-xs text-gray-400 mb-1">বর্তমানে চলছে</p>
                  <div className="text-6xl font-black text-teal-600">
                    {activeQueue.currentSerial > 0 ? `#${activeQueue.currentSerial}` : "—"}
                  </div>
                  {currentAppt && (
                    <>
                      <p className="text-sm font-medium text-gray-700 mt-2 flex items-center justify-center gap-1.5">
                        {displayName(currentAppt)}
                        {currentAppt.isWalkin && (
                          <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-full">ওয়াক-ইন</span>
                        )}
                      </p>
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-3 gap-1.5 text-[12px] h-7 border-teal-200 text-teal-700 hover:bg-teal-50"
                        onClick={() => setShowRx(true)}
                      >
                        <FileText className="h-3 w-3" />
                        প্রেসক্রিপশন লিখুন
                      </Button>
                    </>
                  )}
                </div>

                {/* Queue display screen link */}
                <div className="mb-3">
                  <a
                    href={`/queue-display/${activeQueue.chamberId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-2 text-[12px] text-gray-500 hover:text-teal-600 hover:bg-teal-50 rounded-xl transition-colors border border-dashed border-gray-200 hover:border-teal-200"
                  >
                    <Monitor className="h-3.5 w-3.5" />
                    টিভি ডিসপ্লে স্ক্রিন খুলুন
                  </a>
                </div>

                {/* Queue controls */}
                {activeQueue.status === "NOT_STARTED" ? (
                  <Button className="w-full h-13 text-base gap-2" onClick={startQueue} loading={loading === "start"}>
                    <Play className="h-5 w-5" />
                    কিউ শুরু করুন
                  </Button>
                ) : activeQueue.status === "RUNNING" ? (
                  <div className="space-y-3">
                    {/* NEXT PATIENT - main action */}
                    <Button
                      className="w-full h-16 text-xl font-black gap-3 shadow-lg"
                      onClick={nextPatient}
                      loading={loading === "next"}
                    >
                      <Activity className="h-6 w-6" />
                      পরবর্তী রোগী
                    </Button>

                    {/* Secondary actions */}
                    {currentAppt && (
                      <div className="grid grid-cols-3 gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-col h-14 gap-1 text-xs"
                          onClick={skipPatient}
                          loading={loading === "skip"}
                        >
                          <SkipForward className="h-4 w-4" />
                          বাদ দিন
                        </Button>
                        <Button
                          variant="warning"
                          size="sm"
                          className="flex-col h-14 gap-1 text-xs"
                          onClick={markNoShow}
                          loading={loading === "noshow"}
                        >
                          <UserX className="h-4 w-4" />
                          অনুপস্থিত
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-col h-14 gap-1 text-xs"
                          onClick={pauseQueue}
                          loading={loading === "pause"}
                        >
                          <Pause className="h-4 w-4" />
                          বিরতি
                        </Button>
                      </div>
                    )}
                  </div>
                ) : activeQueue.status === "PAUSED" ? (
                  <Button
                    className="w-full h-13 gap-2"
                    variant="success"
                    onClick={resumeQueue}
                    loading={loading === "resume"}
                  >
                    <Play className="h-5 w-5" />
                    কিউ পুনরায় শুরু
                  </Button>
                ) : null}

                {/* Delay settings */}
                {(activeQueue.status === "RUNNING" || activeQueue.status === "NOT_STARTED") && (
                  <div className="mt-4 flex items-center gap-2 bg-amber-50 rounded-xl p-3">
                    <Timer className="h-4 w-4 text-amber-600 shrink-0" />
                    <span className="text-xs text-amber-700">দেরি:</span>
                    <input
                      type="number"
                      min={0}
                      max={120}
                      value={delayMinutes}
                      onChange={(e) => setDelayMinutes(Number(e.target.value))}
                      className="w-12 text-center text-sm font-bold bg-white rounded-lg border border-amber-200 p-1"
                    />
                    <span className="text-xs text-amber-700">মিনিট</span>
                    <Button
                      variant="warning"
                      size="sm"
                      className="ml-auto text-xs h-7"
                      onClick={setDelay}
                      loading={loading === "delay"}
                    >
                      সেট করুন
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* ETA info */}
            {activeQueue.status === "RUNNING" && (
              <Card>
                <CardContent className="p-4">
                  <div className="grid grid-cols-2 gap-3 text-center">
                    <div className="bg-gray-50 rounded-xl p-3">
                      <div className="text-sm font-bold text-gray-900">{waitingAppts.length} জন</div>
                      <div className="text-xs text-gray-500">অপেক্ষারত</div>
                    </div>
                    <div className="bg-teal-50 rounded-xl p-3">
                      <div className="text-sm font-bold text-teal-700">
                        ~{Math.round(activeQueue.avgConsultDuration)} মিনিট
                      </div>
                      <div className="text-xs text-gray-500">গড় সময়</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Waiting list */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-base">
                <span>অপেক্ষার তালিকা</span>
                <Badge variant="default">{waitingAppts.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0">
              {waitingAppts.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <Users className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">কোনো রোগী অপেক্ষায় নেই</p>
                </div>
              ) : (
                <div className="space-y-1.5 max-h-96 overflow-y-auto">
                  {waitingAppts.map((appt, idx) => {
                    const eta = idx * Math.round(activeQueue.avgConsultDuration) + activeQueue.doctorDelayMinutes;
                    return (
                      <div
                        key={appt.id}
                        className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
                      >
                        <div className="h-9 w-9 rounded-full bg-teal-100 flex items-center justify-center text-sm font-bold text-teal-700 shrink-0">
                          {appt.serialNumber}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate flex items-center gap-1.5">
                            {displayName(appt)}
                            {appt.isWalkin && (
                              <span className="text-[9px] font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-full shrink-0">ওয়াক-ইন</span>
                            )}
                          </p>
                          <p className="text-xs text-gray-400">
                            ~{minutesToDisplay(eta)} পরে
                          </p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-gray-300 shrink-0" />
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <Clock className="h-12 w-12 mx-auto mb-3 text-gray-200" />
            <h3 className="font-semibold text-gray-600 mb-1">আজ কোনো বুকিং নেই</h3>
            <p className="text-sm text-gray-400">রোগীরা সিরিয়াল নিলে এখানে দেখাবে</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
