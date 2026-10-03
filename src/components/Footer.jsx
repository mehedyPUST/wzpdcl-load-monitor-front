export default function Footer() {
    return (
        <footer className="no-print border-t border-slate-200/80 bg-white/70 backdrop-blur mt-auto">
            <div className="max-w-7xl mx-auto px-4 py-5 text-sm flex flex-col md:flex-row justify-between gap-2 text-slate-500">
                <div>
                    © {new Date().getFullYear()} West Zone Power Distribution Company Limited (WZPDCL)
                </div>
                <div className="flex gap-4 text-slate-400">
                    <span>Load Monitoring System</span>
                    <span>v1.1</span>
                </div>
            </div>
        </footer>
    );
}
