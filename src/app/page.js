import Link from 'next/link';
import { LOGO_URL, APP_NAME, COMPANY_NAME } from '@/lib/brand';
import { LogIn, ShieldCheck, Eye } from 'lucide-react';

export default function Home() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16 text-center">
      <div className="w-28 h-28 mx-auto bg-white rounded-2xl shadow-md border border-wzpdcl-border flex items-center justify-center mb-6">
        <img src={LOGO_URL} alt="WZPDCL" className="w-24 h-24 object-contain" />
      </div>

      <h1 className="text-4xl font-bold text-wzpdcl-blue mb-3">{APP_NAME}</h1>
      <p className="text-lg text-slate-600 mb-8">
        Hourly load collection and monitoring system for {COMPANY_NAME}.
      </p>

      <div className="flex flex-wrap justify-center gap-3">
        <Link
          href="/login"
          className="inline-flex items-center gap-2 bg-wzpdcl-blue text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-900 transition"
        >
          <LogIn className="w-5 h-5" /> Operator Login
        </Link>
        <Link
          href="/admin/login"
          className="inline-flex items-center gap-2 bg-wzpdcl-green text-white px-6 py-3 rounded-lg font-medium hover:bg-green-800 transition"
        >
          <ShieldCheck className="w-5 h-5" /> Admin Login
        </Link>
        <Link
          href="/viewer/login"
          className="inline-flex items-center gap-2 bg-slate-700 text-white px-6 py-3 rounded-lg font-medium hover:bg-slate-800 transition"
        >
          <Eye className="w-5 h-5" /> Viewer Login
        </Link>
      </div>
    </div>
  );
}