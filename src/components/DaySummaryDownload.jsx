'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { downloadCsv, numOrEmpty } from '@/lib/download';
import Spinner from '@/components/ui/Spinner';
import { Download } from 'lucide-react';

function todayDhaka() {
    return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Dhaka' });
}

export default function DaySummaryDownload({ className = '' }) {
    const [date, setDate] = useState(todayDhaka());
    const [busy, setBusy] = useState(false);

    const run = async (mode = 'detail') => {
        setBusy(true);
        try {
            const res = await api.get(`/load/day-summary?date=${date}`);
            const data = res.data;

            if (mode === 'hourly') {
                const headers = [
                    'SN',
                    'Date',
                    'Slot',
                    'Actual_MW',
                    'Allotment_MW',
                    'Loadshed_MW',
                    'Demand_MW',
                    'PBS_MW',
                    'Submitted_SS',
                    'Total_SS',
                ];
                const rows = (data.hourly || []).map((h, i) => ({
                    SN: i + 1,
                    Date: date,
                    Slot: h.slotLabel,
                    Actual_MW: numOrEmpty(h.actualLoad?.toFixed?.(2) ?? h.actualLoad),
                    Allotment_MW: numOrEmpty(
                        h.pgcbAllotment?.toFixed?.(2) ?? h.pgcbAllotment
                    ),
                    Loadshed_MW: numOrEmpty(h.loadshed?.toFixed?.(2) ?? h.loadshed),
                    Demand_MW: numOrEmpty(h.demand?.toFixed?.(2) ?? h.demand),
                    PBS_MW: numOrEmpty(h.pbsLoad?.toFixed?.(2) ?? h.pbsLoad),
                    Submitted_SS: h.submitted,
                    Total_SS: h.totalSubstations,
                }));
                downloadCsv(`wzpdcl-hourly-${date}.csv`, headers, rows);
            } else {
                const headers = [
                    'SN',
                    'Date',
                    'Slot',
                    'Circle',
                    'Grid_SS',
                    'District',
                    'Submitted',
                    'Actual_MW',
                    'Allotment_MW',
                    'Loadshed_MW',
                    'Demand_MW',
                    'PBS_MW',
                    'Note',
                ];
                const rows = (data.rows || []).map((r) => ({
                    SN: r.sn,
                    Date: r.date,
                    Slot: r.slotLabel,
                    Circle: r.circleName,
                    Grid_SS: r.substationName,
                    District: r.district,
                    Submitted: r.submitted ? 'Yes' : 'No',
                    Actual_MW: numOrEmpty(r.actualLoad),
                    Allotment_MW: numOrEmpty(r.pgcbAllotment),
                    Loadshed_MW: numOrEmpty(r.loadshed),
                    Demand_MW: numOrEmpty(r.demand),
                    PBS_MW: numOrEmpty(r.pbsLoad),
                    Note: r.note || '',
                }));
                downloadCsv(`wzpdcl-day-detail-${date}.csv`, headers, rows);
            }
            toast.success('Download started');
        } catch (e) {
            toast.error(e.message || 'Download failed');
        } finally {
            setBusy(false);
        }
    };

    return (
        <div
            className={`flex flex-wrap items-end gap-2 bg-white/80 backdrop-blur border border-slate-200/80 rounded-2xl px-3 py-2.5 shadow-sm ${className}`}
        >
            <div>
                <label className="block text-[10px] uppercase tracking-wide text-slate-500 mb-0.5">
                    Day summary
                </label>
                <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="border border-slate-200 rounded-lg px-2 py-1.5 text-sm bg-white"
                />
            </div>
            <button
                type="button"
                disabled={busy}
                onClick={() => run('hourly')}
                className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg bg-slate-800 text-white hover:bg-slate-900 disabled:opacity-50"
            >
                {busy ? <Spinner className="w-3.5 h-3.5 text-white" /> : <Download className="w-3.5 h-3.5" />}
                Hourly CSV
            </button>
            <button
                type="button"
                disabled={busy}
                onClick={() => run('detail')}
                className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
                <Download className="w-3.5 h-3.5" />
                Full detail CSV
            </button>
        </div>
    );
}
