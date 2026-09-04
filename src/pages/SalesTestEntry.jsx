import React, { useEffect, useState } from "react";
import { LogOut, Plus, MapPin, Loader2, Camera } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../AuthContext";
import { COLOR, Btn, Field, Modal, Badge, EmptyState, Toast, ErrorBanner, inputStyle } from "../ui";
import { getPosition, haversineMeters, todayStr, fmtTime } from "../lib/utils";
import { Store as StoreIcon } from "lucide-react";

function StoreFormModal({ onClose, onSaved, userId }) {
  const [form, setForm] = useState({ name: "", owner_name: "", address: "", phone: "", lat: "", lng: "" });
  const [locBusy, setLocBusy] = useState(false);
  const [err, setErr] = useState("");
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const useLocation = async () => {
    setLocBusy(true);
    try {
      const pos = await getPosition();
      set("lat", pos.lat.toFixed(6));
      set("lng", pos.lng.toFixed(6));
    } catch (e) { setErr(e.message); }
    setLocBusy(false);
  };

  const save = async () => {
    setErr("");
    const { error } = await supabase.from("stores").insert({
      name: form.name.trim(), owner_name: form.owner_name.trim(), address: form.address.trim(),
      phone: form.phone.trim(), lat: form.lat || null, lng: form.lng || null, created_by: userId,
    });
    if (error) return setErr(error.message);
    onSaved();
  };

  return (
    <Modal title="Tambah toko baru" onClose={onClose}>
      <ErrorBanner message={err} />
      <Field label="Nama toko"><input style={inputStyle} value={form.name} onChange={(e) => set("name", e.target.value)} /></Field>
      <Field label="Nama pemilik"><input style={inputStyle} value={form.owner_name} onChange={(e) => set("owner_name", e.target.value)} /></Field>
      <Field label="Alamat"><textarea style={{ ...inputStyle, minHeight: 60 }} value={form.address} onChange={(e) => set("address", e.target.value)} /></Field>
      <Field label="Nomor kontak"><input style={inputStyle} value={form.phone} onChange={(e) => set("phone", e.target.value)} /></Field>
      <div style={{ display: "flex", gap: 10 }}>
        <div style={{ flex: 1 }}><Field label="Latitude"><input style={inputStyle} value={form.lat} onChange={(e) => set("lat", e.target.value)} /></Field></div>
        <div style={{ flex: 1 }}><Field label="Longitude"><input style={inputStyle} value={form.lng} onChange={(e) => set("lng", e.target.value)} /></Field></div>
      </div>
      <Btn variant="ghost" onClick={useLocation} disabled={locBusy} style={{ marginBottom: 14 }}>
        {locBusy ? <Loader2 size={14} /> : <MapPin size={14} />} Gunakan lokasi saat ini
      </Btn>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
        <Btn variant="ghost" onClick={onClose}>Batal</Btn>
        <Btn disabled={!form.name.trim()} onClick={save}>Simpan toko</Btn>
      </div>
    </Modal>
  );
}

function VisitFormModal({ store, userId, onClose, onSaved }) {
  const [status, setStatus] = useState("sale");
  const [notes, setNotes] = useState("");
  const [products, setProducts] = useState([]);
  const [items, setItems] = useState([]);
  const [pickProd, setPickProd] = useState("");
  const [pickQty, setPickQty] = useState("1");
  const [newProdName, setNewProdName] = useState("");
  const [photoFile, setPhotoFile] = useState(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.from("products").select("*").order("name").then(({ data }) => setProducts(data || []));
  }, []);

  const addQuickProduct = async () => {
    if (!newProdName.trim()) return;
    const { data, error } = await supabase.from("products").insert({ name: newProdName.trim() }).select().single();
    if (error) return setErr(error.message);
    setProducts((p) => [...p, data]);
    setNewProdName("");
  };

  const addItem = () => {
    const prod = products.find((p) => p.id === pickProd);
    if (!prod || Number(pickQty) <= 0) return;
    setItems((it) => [...it, { productId: prod.id, name: prod.name, qty: Number(pickQty) }]);
    setPickProd(""); setPickQty("1");
  };

  const save = async () => {
    setErr(""); setBusy(true);
    try {
      let lat = null, lng = null, distanceM = null;
      try {
        const pos = await getPosition();
        lat = pos.lat; lng = pos.lng;
        if (store.lat) distanceM = haversineMeters(lat, lng, store.lat, store.lng);
      } catch { /* location optional for this test tool */ }

      let photoPath = null;
      if (photoFile) {
        const ext = photoFile.name.split(".").pop() || "jpg";
        photoPath = `${userId}/${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage.from("checkin-photos").upload(photoPath, photoFile);
        if (upErr) throw upErr;
      }

      const now = new Date().toISOString();
      const { data: visit, error: visitErr } = await supabase
        .from("visits")
        .insert({
          store_id: store.id, sales_id: userId, visit_date: todayStr(), status, notes,
          checkin_at: now, checkin_lat: lat, checkin_lng: lng, checkin_photo_url: photoPath, checkin_distance_m: distanceM,
          checkout_at: now, checkout_lat: lat, checkout_lng: lng,
        })
        .select()
        .single();

      if (visitErr) {
        if (visitErr.code === "23505") throw new Error("Sudah ada kunjungan tercatat untuk toko ini hari ini.");
        throw visitErr;
      }

      if (status === "sale" && items.length) {
        const rows = items.map((it) => ({ visit_id: visit.id, product_id: it.productId, qty: it.qty }));
        const { error: itemsErr } = await supabase.from("visit_items").insert(rows);
        if (itemsErr) throw itemsErr;
      }

      onSaved();
    } catch (e) {
      setErr(e.message);
    }
    setBusy(false);
  };

  return (
    <Modal title={"Kunjungan test \u2014 " + store.name} onClose={onClose}>
      <ErrorBanner message={err} />
      <Field label="Hasil kunjungan">
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setStatus("sale")} style={{ flex: 1, padding: 10, borderRadius: 3, border: "1px solid " + (status === "sale" ? COLOR.sale : COLOR.line), background: status === "sale" ? COLOR.saleBg : "#fff", color: status === "sale" ? COLOR.sale : COLOR.text, fontSize: 13, fontWeight: 500 }}>Terjadi penjualan</button>
          <button onClick={() => setStatus("no_sale")} style={{ flex: 1, padding: 10, borderRadius: 3, border: "1px solid " + (status === "no_sale" ? COLOR.none : COLOR.line), background: status === "no_sale" ? COLOR.noneBg : "#fff", color: status === "no_sale" ? COLOR.none : COLOR.text, fontSize: 13, fontWeight: 500 }}>Tidak ada penjualan</button>
        </div>
      </Field>

      {status === "sale" && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 12.5, color: COLOR.muted, marginBottom: 5 }}>Produk terjual</div>
          {items.map((it, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "6px 0", borderBottom: "1px solid " + COLOR.lineSoft }}>
              <span>{it.name}</span><span className="mono">x{it.qty}</span>
            </div>
          ))}
          <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
            <select style={{ ...inputStyle, flex: 1 }} value={pickProd} onChange={(e) => setPickProd(e.target.value)}>
              <option value="">Pilih produk\u2026</option>
              {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <input style={{ ...inputStyle, width: 64 }} type="number" min="1" value={pickQty} onChange={(e) => setPickQty(e.target.value)} />
            <Btn variant="ghost" onClick={addItem} disabled={!pickProd}><Plus size={14} /></Btn>
          </div>
          <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
            <input style={{ ...inputStyle, flex: 1 }} placeholder="Produk baru\u2026" value={newProdName} onChange={(e) => setNewProdName(e.target.value)} />
            <Btn variant="ghost" disabled={!newProdName.trim()} onClick={addQuickProduct}>Tambah</Btn>
          </div>
        </div>
      )}

      <Field label="Catatan (opsional)"><textarea style={{ ...inputStyle, minHeight: 50 }} value={notes} onChange={(e) => setNotes(e.target.value)} /></Field>
      <Field label="Foto (opsional, untuk simulasi bukti kunjungan)">
        <input type="file" accept="image/*" onChange={(e) => setPhotoFile(e.target.files?.[0] || null)} />
      </Field>

      <div style={{ fontSize: 11.5, color: COLOR.muted, marginBottom: 12 }}>
        Lokasi diambil otomatis dari browser jika diizinkan, lalu dibandingkan dengan koordinat toko.
      </div>

      <Btn disabled={busy} onClick={save} style={{ width: "100%", justifyContent: "center" }}>
        {busy ? "Menyimpan\u2026" : "Simpan kunjungan test"}
      </Btn>
    </Modal>
  );
}

export default function SalesTestEntry() {
  const { profile, signOut } = useAuth();
  const [stores, setStores] = useState([]);
  const [visits, setVisits] = useState([]);
  const [showStoreForm, setShowStoreForm] = useState(false);
  const [activeStore, setActiveStore] = useState(null);
  const [toast, setToast] = useState("");

  const load = async () => {
    const { data: s } = await supabase.from("stores").select("*").order("name");
    setStores(s || []);
    const { data: v } = await supabase
      .from("visits")
      .select("id, visit_date, status, checkin_at, checkout_at, store:stores(name)")
      .eq("sales_id", profile.id)
      .order("checkin_at", { ascending: false })
      .limit(10);
    setVisits(v || []);
  };

  useEffect(() => { if (profile) load(); }, [profile]);

  const showToast = (m) => { setToast(m); setTimeout(() => setToast(""), 2200); };

  if (!profile) return null;

  return (
    <div style={{ minHeight: "100vh" }}>
      <div style={{ background: COLOR.ink, color: "#fff", padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div className="mono" style={{ fontSize: 11, opacity: 0.6 }}>tim sales &middot; mode test entry (sementara, sebelum aplikasi Android tersedia)</div>
          <div style={{ fontSize: 15, fontWeight: 600 }}>{profile.name}</div>
        </div>
        <button onClick={signOut} style={{ background: "none", border: "none", color: "#fff", opacity: 0.8, display: "flex", alignItems: "center", gap: 5, fontSize: 12.5 }}>
          <LogOut size={14} />Keluar
        </button>
      </div>

      <div style={{ padding: 20, maxWidth: 640, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div style={{ fontSize: 15, fontWeight: 600 }}>Toko</div>
          <Btn onClick={() => setShowStoreForm(true)}><Plus size={14} />Tambah toko</Btn>
        </div>

        {stores.length === 0 ? (
          <EmptyState icon={StoreIcon} title="Belum ada toko" body="Tambahkan toko untuk mulai membuat kunjungan test." actionLabel="Tambah toko" onAction={() => setShowStoreForm(true)} />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 28 }}>
            {stores.map((s) => (
              <button key={s.id} onClick={() => setActiveStore(s)} style={{ textAlign: "left", background: "#fff", border: "1px solid " + COLOR.line, borderRadius: 4, padding: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{s.name}</div>
                  <div style={{ fontSize: 12.5, color: COLOR.muted }}>{s.address}</div>
                </div>
                <Badge tone="steel">Buat kunjungan</Badge>
              </button>
            ))}
          </div>
        )}

        <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 10 }}>Kunjungan test terbaru</div>
        {visits.length === 0 ? (
          <div style={{ fontSize: 13, color: COLOR.muted }}>Belum ada kunjungan.</div>
        ) : (
          <div style={{ border: "1px solid " + COLOR.line, borderRadius: 4, overflow: "hidden" }}>
            {visits.map((v, i) => (
              <div key={v.id} style={{ padding: "10px 14px", borderTop: i ? "1px solid " + COLOR.lineSoft : "none", display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                <span>{v.store?.name} &middot; <span className="mono" style={{ fontSize: 11.5, color: COLOR.muted }}>{fmtTime(v.checkin_at)}</span></span>
                <Badge tone={v.status === "sale" ? "sale" : "none"}>{v.status === "sale" ? "Penjualan" : "Tidak terjual"}</Badge>
              </div>
            ))}
          </div>
        )}
      </div>

      {showStoreForm && <StoreFormModal userId={profile.id} onClose={() => setShowStoreForm(false)} onSaved={() => { setShowStoreForm(false); load(); showToast("Toko ditambahkan"); }} />}
      {activeStore && <VisitFormModal store={activeStore} userId={profile.id} onClose={() => setActiveStore(null)} onSaved={() => { setActiveStore(null); load(); showToast("Kunjungan tersimpan"); }} />}
      <Toast msg={toast} />
    </div>
  );
}
