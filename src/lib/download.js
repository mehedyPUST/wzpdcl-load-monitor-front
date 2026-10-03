/** Build and trigger a CSV download in the browser */
export function downloadCsv(filename, headers, rows) {
    const esc = (v) => {
        if (v === null || v === undefined) return '';
        const s = String(v);
        if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
        return s;
    };
    const lines = [
        headers.map(esc).join(','),
        ...rows.map((row) => headers.map((h) => esc(row[h])).join(',')),
    ];
    const blob = new Blob(['\uFEFF' + lines.join('\n')], {
        type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

export function numOrEmpty(v) {
    if (v === null || v === undefined || v === '') return '';
    const n = Number(v);
    return Number.isFinite(n) ? n : '';
}
