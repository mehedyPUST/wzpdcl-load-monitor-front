export default function Footer() {
    return (
        <footer className="no-print bg-slate-800 text-slate-300 mt-auto">
            <div className="max-w-7xl mx-auto px-4 py-6 text-sm flex flex-col md:flex-row justify-between gap-3">
                <div>
                    © {new Date().getFullYear()} West Zone Power Distribution Company Limited (WZPDCL)
                </div>
                <div className="flex gap-4">
                    <span>Load Monitoring System</span>
                    <span className="opacity-60">v1.0</span>
                </div>
            </div>
        </footer>
    );
}