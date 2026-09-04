import React, { useEffect, useState, useCallback } from "react";
import {
  LayoutDashboard, Store, ClipboardList, Camera, Users, Package, Download,
  LogOut, Menu, Search, Plus, Pencil, History, X, AlertTriangle, ImageOff, Check,
} from "lucide-react";
import { supabase } from "../../lib/supabaseClient";
import { useAuth } from "../../AuthContext";
import { COLOR, Btn, Field, Modal, Badge, EmptyState, Toast, ErrorBanner, inputStyle, RADIUS_LIMIT_M } from "../../ui";
import { fmtDateTime, fmtTime, todayStr, downloadWorkbook } from "../../lib/utils";

const NAV = [
  { id: "overview", label: "Ringkasan", icon: LayoutDashboard },
  { id: "stores", label: "Toko", icon: Store },
  { id: "sales", label: "Laporan Penjualan", icon: ClipboardList },
  { id: "attendance", label: "Absensi", icon: Camera },
  { id: "team", label: "Tim Sales", icon: Users },
  { id: "catalog", label: "Katalog Produk", icon: Package },
  { id: "export", label: "Ekspor", icon: Download },
];

// ---------- OVERVIEW ----------
function OverviewView({ refreshKey }) {
  const [stores, setStores] = useState([]);
  const [reps, setReps] = useState([]);
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [{ data: s }, { data: r }, { data: v }] = await Promise.all([
        supabase.from("stores").select("id"),
        supabase.from("profiles").select("id").eq("role", "sales"),
        supabase.from("visits").select("id, visit_date, status, checkin_at, checkout_at, store:stores(name), sales:profiles(name), visit_items(qty)").order("checkin_at", { ascending: false }).limit(200),
      ]);
      setStores(s || []); setReps(r || []); setVisits(v || []);
      setLoading(false);
    })();
  }, [refreshKey]);

  if (loading) return <div style={{ color: COLOR.muted, fontSize: 13.5 }}>Memuat\u2026</div>;

  const today = todayStr();
  const visitsToday = visits.filter((v) => v.visit_date === today);
  const soldToday = visitsToday.filter((v) => v.status === "sale");
  const unitsToday = soldToday.reduce((s, v) => s + (v.visit_items || []).reduce((a, i) => a + Number(i.qty || 0), 0), 0);
  const activeReps = new Set(visitsToday.map((v) => v.sales?.name)).size;

  const stats = [
    { label: "Total toko terdaftar", value: stores.length },
    { label: "Kunjungan hari ini", value: visitsToday.length },
    { label: "Transaksi hari ini", value: soldToday.length },
    { label: "Unit terjual hari ini", value: unitsToday },
    { label: "Sales aktif hari ini", value: activeReps + " / " + reps.length },
  ];

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 1, background: COLOR.line, border: "1px solid " + COLOR.line, marginBottom: 24 }}>
        {stats.map((s) => (
          <div key={s.label} style={{ background: "#fff", padding: "16px 18px" }}>
            <div style={{ fontSize: 12, color: COLOR.muted, marginBottom: 6 }}>{s.label}</div>
            <div className="mono" style={{ fontSize: 24, fontWeight: 500 }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ background: COLOR.amberBg, border: "1px solid #E3CE97", borderRadius: 4, padding: "14px 16px", marginBottom: 24, display: "flex", gap: 10 }}>
        <AlertTriangle size={17} color={COLOR.amber} style={{ flexShrink: 0, marginTop: 1 }} />
        <div style={{ fontSize: 13, color: "#5C4816" }}>
          <b>Kebijakan yang masih menunggu konfirmasi:</b> radius maksimal check-in (saat ini diasumsikan {RADIUS_LIMIT_M}m), penggunaan IMEI perangkat, mode offline, dan apakah laporan dapat diedit setelah check-out.
        </div>
      </div>

      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>Aktivitas terbaru</div>
      {visits.length === 0 ? (
        <EmptyState icon={ClipboardList} title="Belum ada aktivitas" body="Kunjungan yang dicatat oleh tim Sales akan muncul di sini secara real-time." />
      ) : (
        <div style={{ border: "1px solid " + COLOR.line, borderRadius: 4, overflow: "hidden" }}>
          {visits.slice(0, 8).map((v, i) => (
            <div key={v.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 14px", borderTop: i ? "1px solid " + COLOR.lineSoft : "none" }}>
              <div className="mono" style={{ fontSize: 11.5, color: COLOR.muted, width: 90, flexShrink: 0 }}>{fmtTime(v.checkin_at)}</div>
              <div style={{ flex: 1, fontSize: 13.5 }}><b>{v.sales?.name}</b> mengunjungi <b>{v.store?.name}</b></div>
              <Badge tone={v.status === "sale" ? "sale" : "none"}>{v.status === "sale" ? "Penjualan" : "Tidak terjual"}</Badge>
              {!v.checkout_at && <Badge tone="amber">Belum check-out</Badge>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------- STORES ----------
function StoreHistoryModal({ store, onClose }) {
  const [history, setHistory] = useState(null);
  useEffect(() => {
    supabase.from("store_history").select("*, changer:profiles(name)").eq("store_id", store.id).order("changed_at", { ascending: false })
      .then(({ data }) => setHistory(data || []));
  }, [store.id]);

  return (
    <Modal title={"Riwayat perubahan \u2014 " + store.name} onClose={onClose} width={520}>
      {history === null ? (
        <div style={{ fontSize: 13.5, color: COLOR.muted }}>Memuat\u2026</div>
      ) : history.length === 0 ? (
        <div style={{ fontSize: 13.5, color: COLOR.muted }}>Belum ada perubahan yang tercatat untuk toko ini.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 400, overflowY: "auto" }}>
          {history.map((h) => (
            <div key={h.id} style={{ borderLeft: "2px solid " + COLOR.steel, paddingLeft: 12 }}>
              <div className="mono" style={{ fontSize: 11.5, color: COLOR.muted }}>{fmtDateTime(h.changed_at)} \u00b7 oleh {h.changer?.name || "sistem"}</div>
              <div style={{ fontSize: 13, marginTop: 3 }}>
                <b>{h.field}</b>: <span style={{ color: COLOR.danger }}>{h.old_value || "(kosong)"}</span> {"\u2192"} <span style={{ color: COLOR.sale }}>{h.new_value}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}

function StoreFormModal({ initial, onClose, onSaved }) {
  const [form, setForm] = useState(initial || { name: "", owner_name: "", address: "", phone: "", lat: "", lng: "" });
  const [err, setErr] = useState("");
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    setErr("");
    const payload = {
      name: form.name.trim(), owner_name: form.owner_name?.trim() || "", address: form.address?.trim() || "",
      phone: form.phone?.trim() || "", lat: form.lat || null, lng: form.lng || null,
    };
    const q = initial ? supabase.from("stores").update(payload).eq("id", initial.id) : supabase.from("stores").insert(payload);
    const { error } = await q;
    if (error) return setErr(error.message);
    onSaved();
  };

  return (
    <Modal title={initial ? "Ubah data toko" : "Tambah toko baru"} onClose={onClose}>
      <ErrorBanner message={err} />
      <Field label="Nama toko"><input style={inputStyle} value={form.name} onChange={(e) => set("name", e.target.value)} /></Field>
      <Field label="Nama pemilik"><input style={inputStyle} value={form.owner_name} onChange={(e) => set("owner_name", e.target.value)} /></Field>
      <Field label="Alamat"><textarea style={{ ...inputStyle, minHeight: 60 }} value={form.address} onChange={(e) => set("address", e.target.value)} /></Field>
      <Field label="Nomor kontak"><input style={inputStyle} value={form.phone} onChange={(e) => set("phone", e.target.value)} /></Field>
      <div style={{ display: "flex", gap: 10, marginBottom: 6 }}>
        <div style={{ flex: 1 }}><Field label="Latitude"><input style={inputStyle} value={form.lat ?? ""} onChange={(e) => set("lat", e.target.value)} /></Field></div>
        <div style={{ flex: 1 }}><Field label="Longitude"><input style={inputStyle} value={form.lng ?? ""} onChange={(e) => set("lng", e.target.value)} /></Field></div>
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 10 }}>
        <Btn variant="ghost" onClick={onClose}>Batal</Btn>
        <Btn disabled={!form.name.trim()} onClick={save}>Simpan toko</Btn>
      </div>
    </Modal>
  );
}

function StoresView({ refreshKey }) {
  const [stores, setStores] = useState([]);
  const [visitCounts, setVisitCounts] = useState({});
  const [q, setQ] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [history, setHistory] = useState(null);
  const [toast, setToast] = useState("");

  const load = useCallback(async () => {
    const { data } = await supabase.from("stores").select("*").order("name");
    setStores(data || []);
    const { data: visits } = await supabase.from("visits").select("store_id");
    const counts = {};
    (visits || []).forEach((v) => { counts[v.store_id] = (counts[v.store_id] || 0) + 1; });
    setVisitCounts(counts);
  }, []);

  useEffect(() => { load(); }, [load, refreshKey]);

  const filtered = stores.filter((s) => (s.name + (s.owner_name || "") + (s.address || "")).toLowerCase().includes(q.toLowerCase()));

  const exportStores = () => downloadWorkbook([{
    name: "Toko", rows: stores.map((s) => ({ Nama: s.name, Pemilik: s.owner_name, Alamat: s.address, "No. Kontak": s.phone, Latitude: s.lat ?? "", Longitude: s.lng ?? "" })),
  }], "toko.xlsx");

  return (
    <div>
      <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
        <div style={{ position: "relative", flex: 1 }}>
          <Search size={14} style={{ position: "absolute", left: 10, top: 11, color: COLOR.muted }} />
          <input style={{ ...inputStyle, paddingLeft: 30 }} placeholder="Cari toko\u2026" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <Btn onClick={() => setShowForm(true)}><Plus size={14} />Tambah toko</Btn>
        <Btn variant="ghost" onClick={exportStores}><Download size={14} />Ekspor</Btn>
      </div>
      {filtered.length === 0 ? (
        <EmptyState icon={Store} title="Belum ada toko" body="Toko akan muncul di sini setelah ditambahkan lewat aplikasi Sales atau langsung dari sini." actionLabel="Tambah toko" onAction={() => setShowForm(true)} />
      ) : (
        <div style={{ border: "1px solid " + COLOR.line, borderRadius: 4, overflow: "hidden" }}>
          {filtered.map((s, i) => (
            <div key={s.id} style={{ padding: "13px 14px", borderTop: i ? "1px solid " + COLOR.lineSoft : "none", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{s.name}</div>
                <div style={{ fontSize: 12.5, color: COLOR.muted, marginTop: 2 }}>{s.owner_name} \u00b7 {s.address}</div>
                <div className="mono" style={{ fontSize: 11, color: COLOR.muted, marginTop: 3 }}>
                  {s.lat ? `${s.lat}, ${s.lng}` : "lokasi belum diatur"} \u00b7 {visitCounts[s.id] || 0} kunjungan tercatat
                </div>
              </div>
              <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                <Btn variant="ghost" onClick={() => setHistory(s)}><History size={13} /></Btn>
                <Btn variant="ghost" onClick={() => setEditing(s)}><Pencil size={13} /></Btn>
              </div>
            </div>
          ))}
        </div>
      )}
      {showForm && <StoreFormModal onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); load(); setToast("Toko ditambahkan"); }} />}
      {editing && <StoreFormModal initial={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load(); setToast("Data toko diperbarui"); }} />}
      {history && <StoreHistoryModal store={history} onClose={() => setHistory(null)} />}
      <Toast msg={toast} />
    </div>
  );
}

// ---------- SALES REPORTS ----------
function SalesReportsView({ refreshKey }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("visits")
        .select("id, visit_date, notes, store:stores(name), sales:profiles(name), visit_items(qty, product:products(name))")
        .eq("status", "sale")
        .order("visit_date", { ascending: false });
      const flat = [];
      (data || []).forEach((v) => (v.visit_items || []).forEach((it) => flat.push({ v, it })));
      setRows(flat);
      setLoading(false);
    })();
  }, [refreshKey]);

  const exportRows = () => downloadWorkbook([{
    name: "Penjualan", rows: rows.map(({ v, it }) => ({ Tanggal: v.visit_date, Toko: v.store?.name, Sales: v.sales?.name, Produk: it.product?.name, Jumlah: it.qty, Catatan: v.notes || "" })),
  }], "laporan-penjualan.xlsx");

  if (loading) return <div style={{ color: COLOR.muted, fontSize: 13.5 }}>Memuat\u2026</div>;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 14 }}>
        <Btn variant="ghost" onClick={exportRows}><Download size={14} />Ekspor</Btn>
      </div>
      {rows.length === 0 ? (
        <EmptyState icon={ClipboardList} title="Belum ada laporan penjualan" body="Laporan akan muncul setelah tim Sales mencatat kunjungan dengan hasil penjualan." />
      ) : (
        <div style={{ border: "1px solid " + COLOR.line, borderRadius: 4, overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "100px 1.3fr 1fr 1.5fr 70px", gap: 8, padding: "9px 14px", background: COLOR.lineSoft, fontSize: 11.5, color: COLOR.muted }}>
            <div>Tanggal</div><div>Toko</div><div>Sales</div><div>Produk</div><div>Qty</div>
          </div>
          {rows.map(({ v, it }, i) => (
            <div key={v.id + i} style={{ display: "grid", gridTemplateColumns: "100px 1.3fr 1fr 1.5fr 70px", gap: 8, padding: "10px 14px", borderTop: "1px solid " + COLOR.lineSoft, fontSize: 13 }}>
              <div className="mono" style={{ fontSize: 12 }}>{v.visit_date}</div>
              <div>{v.store?.name}</div><div>{v.sales?.name}</div><div>{it.product?.name}</div>
              <div className="mono">{it.qty}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------- ATTENDANCE ----------
function PhotoModal({ path, onClose }) {
  const [url, setUrl] = useState(null);
  useEffect(() => {
    supabase.storage.from("checkin-photos").createSignedUrl(path, 120).then(({ data }) => setUrl(data?.signedUrl || null));
  }, [path]);
  return (
    <Modal title="Foto bukti kunjungan" onClose={onClose} width={420}>
      {url ? <img src={url} alt="Bukti kunjungan" style={{ width: "100%", borderRadius: 4, border: "1px solid " + COLOR.line }} /> : <div style={{ color: COLOR.muted, fontSize: 13 }}>Memuat foto\u2026</div>}
    </Modal>
  );
}

function AttendanceRow({ v }) {
  const [thumb, setThumb] = useState(null);
  useEffect(() => {
    if (v.checkin_photo_url) {
      supabase.storage.from("checkin-photos").createSignedUrl(v.checkin_photo_url, 120).then(({ data }) => setThumb(data?.signedUrl || null));
    }
  }, [v.checkin_photo_url]);
  const [showPhoto, setShowPhoto] = useState(false);
  const over = v.checkin_distance_m != null && v.checkin_distance_m > RADIUS_LIMIT_M;

  return (
    <div style={{ display: "flex", gap: 12, padding: "12px 14px", alignItems: "center" }}>
      <button onClick={() => v.checkin_photo_url && setShowPhoto(true)} style={{ width: 44, height: 44, borderRadius: 3, background: COLOR.lineSoft, border: "none", flexShrink: 0, overflow: "hidden", padding: 0 }}>
        {thumb ? <img src={thumb} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <ImageOff size={16} color={COLOR.muted} style={{ margin: 14 }} />}
      </button>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13.5 }}><b>{v.sales?.name}</b> \u00b7 {v.store?.name}</div>
        <div className="mono" style={{ fontSize: 11.5, color: COLOR.muted, marginTop: 2 }}>
          in {fmtTime(v.checkin_at)} \u2192 out {v.checkout_at ? fmtTime(v.checkout_at) : "\u2014"} \u00b7 {v.checkin_lat?.toFixed?.(4)}, {v.checkin_lng?.toFixed?.(4)}
        </div>
      </div>
      {v.checkin_distance_m != null && <Badge tone={over ? "amber" : "sale"}>{v.checkin_distance_m}m dari toko</Badge>}
      {!v.checkout_at && <Badge tone="amber">Belum check-out</Badge>}
      {showPhoto && <PhotoModal path={v.checkin_photo_url} onClose={() => setShowPhoto(false)} />}
    </div>
  );
}

function AttendanceView({ refreshKey }) {
  const [visits, setVisits] = useState([]);
  useEffect(() => {
    supabase.from("visits").select("*, store:stores(name), sales:profiles(name)").order("checkin_at", { ascending: false }).limit(100)
      .then(({ data }) => setVisits(data || []));
  }, [refreshKey]);

  const exportRows = () => downloadWorkbook([{
    name: "Absensi", rows: visits.map((v) => ({
      Tanggal: v.visit_date, Sales: v.sales?.name, Toko: v.store?.name, "Jam Check-in": fmtTime(v.checkin_at),
      "Jarak (m)": v.checkin_distance_m ?? "", "Jam Check-out": fmtTime(v.checkout_at),
    })),
  }], "absensi.xlsx");

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 14 }}>
        <Btn variant="ghost" onClick={exportRows}><Download size={14} />Ekspor</Btn>
      </div>
      {visits.length === 0 ? (
        <EmptyState icon={Camera} title="Belum ada data absensi" body="Riwayat check-in dan check-out tim Sales akan tampil di sini." />
      ) : (
        <div style={{ border: "1px solid " + COLOR.line, borderRadius: 4, overflow: "hidden" }}>
          {visits.map((v, i) => (
            <div key={v.id} style={{ borderTop: i ? "1px solid " + COLOR.lineSoft : "none" }}><AttendanceRow v={v} /></div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------- TEAM ----------
function TeamView({ refreshKey }) {
  const [reps, setReps] = useState([]);
  const [counts, setCounts] = useState({});
  const [error, setError] = useState("");
  useEffect(() => {
    (async () => {
      setError("");
      const [{ data: r, error: repsError }, { data: v, error: visitsError }] = await Promise.all([
        supabase.from("profiles").select("*").eq("role", "sales").order("name"),
        supabase.from("visits").select("sales_id, status"),
      ]);
      if (repsError || visitsError) {
        setError(repsError?.message || visitsError?.message || "Gagal memuat data tim.");
        return;
      }
      setReps(r || []);
      const c = {};
      (v || []).forEach((row) => {
        c[row.sales_id] = c[row.sales_id] || { total: 0, sold: 0 };
        c[row.sales_id].total++;
        if (row.status === "sale") c[row.sales_id].sold++;
      });
      setCounts(c);
    })();
  }, [refreshKey]);

  return (
    <div>
      <ErrorBanner message={error} />
      <div style={{ fontSize: 12.5, color: COLOR.muted, marginBottom: 14 }}>
        Anggota tim mendaftar sendiri lewat halaman login (nomor telepon adalah identitas akun mereka).
      </div>
      {reps.length === 0 ? (
        <EmptyState icon={Users} title="Belum ada anggota tim" body="Sales akan muncul di sini setelah mereka mendaftar." />
      ) : (
        <div style={{ border: "1px solid " + COLOR.line, borderRadius: 4, overflow: "hidden" }}>
          {reps.map((r, i) => (
            <div key={r.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 14px", borderTop: i ? "1px solid " + COLOR.lineSoft : "none" }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{r.name}</div>
                <div className="mono" style={{ fontSize: 12, color: COLOR.muted }}>{r.phone}</div>
              </div>
              <div style={{ fontSize: 12.5, color: COLOR.muted }}>{counts[r.id]?.total || 0} kunjungan \u00b7 {counts[r.id]?.sold || 0} penjualan</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------- CATALOG ----------
function CatalogView({ refreshKey }) {
  const [products, setProducts] = useState([]);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    const { data } = await supabase.from("products").select("*").order("name");
    setProducts(data || []);
  }, []);
  useEffect(() => { load(); }, [load, refreshKey]);

  const add = async () => {
    setErr("");
    const { error } = await supabase.from("products").insert({ name: name.trim(), price: price || null });
    if (error) return setErr(error.message);
    setName(""); setPrice(""); load();
  };
  const remove = async (id) => {
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (!error) load();
  };

  return (
    <div>
      <ErrorBanner message={err} />
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <input style={{ ...inputStyle, flex: 1 }} placeholder="Nama produk" value={name} onChange={(e) => setName(e.target.value)} />
        <input style={{ ...inputStyle, width: 140 }} placeholder="Harga (opsional)" value={price} onChange={(e) => setPrice(e.target.value)} />
        <Btn disabled={!name.trim()} onClick={add}><Plus size={14} />Tambah</Btn>
      </div>
      {products.length === 0 ? (
        <EmptyState icon={Package} title="Katalog masih kosong" body="Tambahkan produk agar tim Sales bisa memilihnya saat mencatat penjualan." />
      ) : (
        <div style={{ border: "1px solid " + COLOR.line, borderRadius: 4, overflow: "hidden" }}>
          {products.map((p, i) => (
            <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", borderTop: i ? "1px solid " + COLOR.lineSoft : "none" }}>
              <div style={{ fontSize: 13.5 }}>{p.name} {p.price && <span className="mono" style={{ color: COLOR.muted, fontSize: 12 }}> \u00b7 Rp{p.price}</span>}</div>
              <Btn variant="ghost" onClick={() => remove(p.id)}><X size={13} /></Btn>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------- EXPORT ----------
function ExportView() {
  const buildAll = async () => {
    const [{ data: stores }, { data: visits }, { data: reps }] = await Promise.all([
      supabase.from("stores").select("*"),
      supabase.from("visits").select("*, store:stores(name), sales:profiles(name), visit_items(qty, product:products(name))"),
      supabase.from("profiles").select("*").eq("role", "sales"),
    ]);
    const penjualan = [];
    (visits || []).forEach((v) => {
      if (v.status === "sale") (v.visit_items || []).forEach((it) => penjualan.push({
        Tanggal: v.visit_date, Toko: v.store?.name, Sales: v.sales?.name, Produk: it.product?.name, Jumlah: it.qty, Catatan: v.notes || "",
      }));
    });
    const tokoRows = (stores || []).map((s) => ({ Nama: s.name, Pemilik: s.owner_name, Alamat: s.address, "No. Kontak": s.phone, Latitude: s.lat ?? "", Longitude: s.lng ?? "" }));
    const kunjunganRows = (visits || []).map((v) => ({
      Tanggal: v.visit_date, Toko: v.store?.name, Sales: v.sales?.name,
      Status: v.status === "sale" ? "Terjadi Penjualan" : "Tidak Ada Penjualan",
      "Check-in": fmtTime(v.checkin_at), "Check-out": fmtTime(v.checkout_at), Catatan: v.notes || "",
    }));
    const absensiRows = (visits || []).map((v) => ({
      Tanggal: v.visit_date, Sales: v.sales?.name, Toko: v.store?.name, "Jam Check-in": fmtTime(v.checkin_at),
      "Jarak (m)": v.checkin_distance_m ?? "", "Jam Check-out": fmtTime(v.checkout_at), "Ada Foto": v.checkin_photo_url ? "Ya" : "Tidak",
    }));
    const aktivitasRows = (reps || []).map((r) => {
      const rv = (visits || []).filter((v) => v.sales_id === r.id);
      return { Nama: r.name, Telepon: r.phone, "Total Kunjungan": rv.length, "Kunjungan Terjadi Penjualan": rv.filter((v) => v.status === "sale").length };
    });
    return [
      { name: "Penjualan", rows: penjualan }, { name: "Toko", rows: tokoRows }, { name: "Kunjungan", rows: kunjunganRows },
      { name: "Absensi", rows: absensiRows }, { name: "Aktivitas Sales", rows: aktivitasRows },
    ];
  };

  const [busy, setBusy] = useState(false);
  const exportOne = async (idx, filename) => {
    setBusy(true);
    const sheets = await buildAll();
    downloadWorkbook([sheets[idx]], filename);
    setBusy(false);
  };
  const exportAll = async () => {
    setBusy(true);
    const sheets = await buildAll();
    downloadWorkbook(sheets, "sales-reporting-lengkap.xlsx");
    setBusy(false);
  };

  const names = ["Penjualan", "Toko", "Kunjungan", "Absensi", "Aktivitas Sales"];

  return (
    <div>
      <div style={{ fontSize: 13.5, color: COLOR.muted, marginBottom: 18, maxWidth: 460 }}>
        Unduh data mentah ke Microsoft Excel (.xlsx). Setiap tombol menghasilkan satu file; gunakan "Ekspor semua" untuk satu file berisi lima sheet sekaligus.
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 1, background: COLOR.line, border: "1px solid " + COLOR.line, marginBottom: 14 }}>
        {names.map((n, idx) => (
          <div key={n} style={{ background: "#fff", padding: "13px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontWeight: 600, fontSize: 14 }}>{n}</div>
            <Btn variant="ghost" disabled={busy} onClick={() => exportOne(idx, n.toLowerCase().replace(/\s+/g, "-") + ".xlsx")}><Download size={14} />Ekspor</Btn>
          </div>
        ))}
      </div>
      <Btn disabled={busy} onClick={exportAll}><Download size={14} />Ekspor semua (5 sheet)</Btn>
    </div>
  );
}

// ---------- SHELL ----------
export default function OwnerDashboard() {
  const { profile, signOut } = useAuth();
  const [view, setView] = useState("overview");
  const [navOpen, setNavOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const label = NAV.find((n) => n.id === view)?.label;

  useEffect(() => {
    const channel = supabase
      .channel("realtime-visits")
      .on("postgres_changes", { event: "*", schema: "public", table: "visits" }, () => setRefreshKey((k) => k + 1))
      .on("postgres_changes", { event: "*", schema: "public", table: "stores" }, () => setRefreshKey((k) => k + 1))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  return (
    <div style={{ minHeight: "100vh", display: "flex" }}>
      <div style={{
        width: 210, background: COLOR.ink, color: "#fff", flexShrink: 0, display: navOpen ? "flex" : "none",
        flexDirection: "column", position: "fixed", top: 0, bottom: 0, left: 0, zIndex: 40,
      }} className="owner-sidebar">
        <div style={{ padding: "18px 18px 14px" }}>
          <div className="mono" style={{ fontSize: 11, opacity: 0.55, letterSpacing: 1 }}>sales reporting</div>
          <div style={{ fontSize: 18, fontWeight: 600 }}>Rute</div>
        </div>
        <div style={{ flex: 1, padding: "4px 8px" }}>
          {NAV.map((n) => (
            <button key={n.id} onClick={() => { setView(n.id); setNavOpen(false); }} style={{
              width: "100%", textAlign: "left", background: view === n.id ? COLOR.inkSoft : "transparent", border: "none",
              color: "#fff", padding: "9px 10px", borderRadius: 3, fontSize: 13.5, display: "flex", alignItems: "center", gap: 9, marginBottom: 2,
            }}>
              <n.icon size={15} style={{ opacity: 0.85 }} />{n.label}
            </button>
          ))}
        </div>
        <div style={{ margin: 14, fontSize: 12, opacity: 0.7 }}>{profile?.name}</div>
        <button onClick={signOut} style={{ margin: "0 14px 14px", background: "none", border: "1px solid rgba(255,255,255,.2)", color: "#fff", padding: "9px 10px", borderRadius: 3, fontSize: 12.5, display: "flex", alignItems: "center", gap: 6 }}>
          <LogOut size={13} />Keluar
        </button>
      </div>

      <div style={{ flex: 1, minWidth: 0 }} className="owner-main">
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 22px", borderBottom: "1px solid " + COLOR.line, background: "#fff" }}>
          <button className="owner-menu-btn" onClick={() => setNavOpen((v) => !v)} style={{ background: "none", border: "1px solid " + COLOR.line, borderRadius: 3, padding: 6, display: "none" }}>
            <Menu size={16} />
          </button>
          <div style={{ fontSize: 15, fontWeight: 600 }}>{label}</div>
        </div>
        <div style={{ padding: 22, maxWidth: 980 }}>
          {view === "overview" && <OverviewView refreshKey={refreshKey} />}
          {view === "stores" && <StoresView refreshKey={refreshKey} />}
          {view === "sales" && <SalesReportsView refreshKey={refreshKey} />}
          {view === "attendance" && <AttendanceView refreshKey={refreshKey} />}
          {view === "team" && <TeamView refreshKey={refreshKey} />}
          {view === "catalog" && <CatalogView refreshKey={refreshKey} />}
          {view === "export" && <ExportView />}
        </div>
      </div>
      <style>{`
        @media (max-width: 760px) {
          .owner-sidebar { top: 0 !important; }
          .owner-menu-btn { display: inline-flex !important; }
        }
        @media (min-width: 761px) {
          .owner-sidebar { display: flex !important; position: sticky !important; }
        }
      `}</style>
    </div>
  );
}
