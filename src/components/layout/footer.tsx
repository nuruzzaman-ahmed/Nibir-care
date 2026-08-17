import Link from "next/link";
import { Stethoscope } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-gray-950 text-gray-400 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6">

          {/* Brand */}
          <div className="flex flex-col items-center sm:items-start gap-2">
            <Link href="/" className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-teal-600 flex items-center justify-center">
                <Stethoscope className="h-3.5 w-3.5 text-white" strokeWidth={2.5} />
              </div>
              <span className="font-bold text-[15px] text-white">
                DOC<span className="text-teal-400">&amp;</span>TEST
              </span>
            </Link>
            <p className="text-[12px] text-gray-500 text-center sm:text-left max-w-[220px]">
              বাংলাদেশের নির্ভরযোগ্য স্বাস্থ্যসেবা প্ল্যাটফর্ম
            </p>
          </div>

          {/* Links */}
          <div className="flex items-center gap-6 text-[13px]">
            <Link href="/doctors" className="hover:text-teal-400 transition-colors">ডাক্তার</Link>
            <Link href="/diagnostic-centers" className="hover:text-teal-400 transition-colors">ডায়াগনস্টিক</Link>
            <Link href="/privacy" className="hover:text-teal-400 transition-colors">গোপনীয়তা</Link>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-6 pt-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-[12px] text-gray-600">
          <p>© ২০২৬ DOC&amp;TEST। সর্বস্বত্ব সংরক্ষিত।</p>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              সার্ভিস সচল
            </span>
            <span>হেল্পলাইন: ১৬১০৫</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
