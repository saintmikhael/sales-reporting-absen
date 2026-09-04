import * as XLSX from "xlsx";

export function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export function fmtDateTime(iso) {
  if (!iso) return "\u2014";
  const d = new Date(iso);
  return (
    d.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" }) +
    " \u00b7 " +
    d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
  );
}

export function fmtTime(iso) {
  if (!iso) return "\u2014";
  return new Date(iso).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
}

export function haversineMeters(lat1, lng1, lat2, lng2) {
  if ([lat1, lng1, lat2, lng2].some((v) => v === null || v === undefined || Number.isNaN(Number(v)))) {
    return null;
  }
  const R = 6371000;
  const toRad = (v) => (Number(v) * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

export function getPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error("Geolocation tidak tersedia di perangkat/browser ini."));
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => reject(new Error("Tidak bisa mengambil lokasi (" + err.message + "). Isi manual di bawah.")),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  });
}

export function downloadWorkbook(sheets, filename) {
  const wb = XLSX.utils.book_new();
  sheets.forEach(({ name, rows }) => {
    const ws = XLSX.utils.json_to_sheet(rows.length ? rows : [{ "Tidak ada data": "" }]);
    XLSX.utils.book_append_sheet(wb, ws, name.slice(0, 31));
  });
  const out = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const blob = new Blob([out], { type: "application/octet-stream" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
