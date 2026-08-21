"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowRight, ClipboardCheck, LockKeyhole, Search, ShieldCheck } from "lucide-react"
import { Sidebar } from "@/components/Sidebar"
import { useAuth, isAuthorizedForChecksheet } from "@/lib/auth-context"

type ChecksheetItem = { name: string; desc: string; link: string; key: string }
type Category = { title: string; tone: string; items: ChecksheetItem[] }

const ALL: Record<string, ChecksheetItem> = {
  hydrant: { name: "Inspeksi Hydrant", desc: "Kondisi fisik dan fungsi hidran", link: "inspeksi-hydrant", key: "hydrant" },
  "selang-hydrant": { name: "Fungsi dan Selang Hydrant", desc: "Tekanan air, coupling, dan nozzle", link: "selang-hydrant", key: "selang-hydrant" },
  "fire-alarm": { name: "Inspeksi Fire Alarm", desc: "Kesiapan sistem alarm kebakaran", link: "fire-alarm", key: "fire-alarm" },
  "smoke-detector": { name: "Inspeksi Smoke Detector", desc: "Fungsi smoke dan heat detector", link: "smoke-detector", key: "smoke-detector" },
  apar: { name: "Inspeksi APAR", desc: "Isi, kondisi, dan aksesibilitas APAR", link: "inspeksi-apar", key: "apar" },
  "emergency-lamp": { name: "Inspeksi Emergency Lamp", desc: "Lampu darurat dan exit lamp", link: "inspeksi-emergency", key: "emergency-lamp" },
  "exit-lamp-pintu-darurat": { name: "Exit Lamp dan Jalur Evakuasi", desc: "Pintu darurat dan jalur evakuasi", link: "exit-lamp-pintu-darurat", key: "exit-lamp-pintu-darurat" },
  "lift-barang": { name: "Pengecekan Lift Barang Daily", desc: "Limit switch, tombol, dan kabin", link: "lift-barang", key: "lift-barang" },
  "inspeksi-preventif-lift-barang": { name: "Preventif Lift Barang", desc: "Pemeliharaan preventif lift barang", link: "inspeksi-preventif-lift-barang", key: "inspeksi-preventif-lift-barang" },
  "tg-listrik": { name: "Tangga Listrik (AWP)", desc: "Hidrolik, rem darurat, dan keselamatan", link: "tg-listrik", key: "tg-listrik" },
  panel: { name: "Panel Listrik", desc: "Suhu, bau, suara, grounding, dan ELCB", link: "panel", key: "panel" },
  "form-inspeksi-stop-kontak": { name: "Stop Kontak dan Instalasi Listrik", desc: "Pemeriksaan instalasi di area kerja", link: "form-inspeksi-stop-kontak", key: "form-inspeksi-stop-kontak" },
  "e-checksheet-apd": { name: "Pengambilan APD", desc: "Distribusi dan pengambilan APD", link: "e-checksheet-apd/riwayat-apd", key: "e-checksheet-apd" },
  "inf-jalan": { name: "Inspeksi Infrastruktur Jalan", desc: "Kondisi jalan dan trotoar pabrik", link: "inf-jalan", key: "inf-jalan" },
  "inspeksi-apd": { name: "Inspeksi APD", desc: "Pengecekan penggunaan APD", link: "inspeksi-apd", key: "inspeksi-apd" },
  "checksheet-toilet": { name: "Checksheet Toilet", desc: "Patroli kebersihan toilet standar 5S", link: "checksheet-toilet", key: "checksheet-toilet" },
}

const GROUPS: { title: string; tone: string; keys: string[] }[] = [
  { title: "Proteksi kebakaran dan evakuasi", tone: "fire", keys: ["hydrant", "selang-hydrant", "fire-alarm", "smoke-detector", "apar", "emergency-lamp", "exit-lamp-pintu-darurat"] },
  { title: "Pemeliharaan peralatan", tone: "equipment", keys: ["lift-barang", "inspeksi-preventif-lift-barang", "tg-listrik"] },
  { title: "Instalasi listrik", tone: "electric", keys: ["panel", "form-inspeksi-stop-kontak"] },
  { title: "Keselamatan personal dan prasarana", tone: "safety", keys: ["e-checksheet-apd", "inf-jalan", "inspeksi-apd"] },
  { title: "Kebersihan fasilitas", tone: "facility", keys: ["checksheet-toilet"] },
]

const ROLE_CATEGORY: Record<string, number | null> = { "inspector-ga-fire": 0, "inspector-ga-equipment": 1, "inspector-ga-electrical": 2, "inspector-ga-personal": 3, "inspector-ga-facility": 4, "inspector-ga": null, admin: null, superadmin: null }

export default function StatusGA() {
  const router = useRouter()
  const { user } = useAuth()
  const [query, setQuery] = useState("")
  const [redirected, setRedirected] = useState(false)
  useEffect(() => { if (redirected) return; if (!user) { setRedirected(true); router.push("/login-page") }; if (user && !isAuthorizedForChecksheet(user)) { setRedirected(true); router.push("/home") } }, [user, router, redirected])
  const isAdmin = !!user && ["admin", "superadmin"].includes(user.role)
  const categories = useMemo<Category[]>(() => {
    if (!user) return []
    let groups = GROUPS.map((group) => ({ ...group, items: group.keys.map((key) => ALL[key]) }))
    if (!isAdmin && user.checksheets?.length) { const allowed = new Set(user.checksheets); groups = groups.map((group) => ({ ...group, items: group.items.filter((item) => allowed.has(item.key)) })).filter((group) => group.items.length) }
    else if (!isAdmin && ROLE_CATEGORY[user.role] !== null && ROLE_CATEGORY[user.role] !== undefined) groups = [groups[ROLE_CATEGORY[user.role] as number]]
    const normalized = query.trim().toLowerCase()
    return groups.map((group) => ({ ...group, items: normalized ? group.items.filter((item) => `${item.name} ${item.desc}`.toLowerCase().includes(normalized)) : group.items })).filter((group) => group.items.length)
  }, [user, isAdmin, query])
  if (!user) return null
  const total = categories.reduce((sum, group) => sum + group.items.length, 0)
  const totalAll = Object.keys(ALL).length
  return <div className="ga-app-shell"><Sidebar userName={user.fullName} /><main className="ga-main"><header className="ga-hero"><div><p className="ga-eyebrow"><ClipboardCheck aria-hidden="true" /> General Affairs</p><h1>Checklist operasional</h1><p className="ga-subtitle">Pilih checksheet untuk mulai pemeriksaan. Semua pengisian tersimpan sesuai area dan tanggal.</p></div><div className="ga-hero-meta"><span className="ga-role"><ShieldCheck aria-hidden="true" /> {isAdmin ? "Administrator" : "Inspector GA"}</span><strong>{total}<small>/{totalAll} akses</small></strong></div></header><section className="ga-toolbar" aria-label="Pencarian checksheet"><div className="ga-search"><Search aria-hidden="true" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari checksheet atau fungsi..." aria-label="Cari checksheet" /></div><span className="ga-result-count">{total} checksheet tersedia</span></section>{!isAdmin && user.checksheets?.length ? <div className="ga-notice"><ShieldCheck aria-hidden="true" /><div><strong>Akses Anda sudah disesuaikan</strong><p>Hanya checksheet yang diberikan administrator yang ditampilkan.</p></div></div> : null}<div className="ga-groups">{categories.length ? categories.map((group) => <section className={`ga-group ga-group-${group.tone}`} key={group.title}><div className="ga-group-heading"><div><p className="ga-group-kicker">Kategori pemeriksaan</p><h2>{group.title}</h2></div><span>{group.items.length}</span></div><div className="ga-card-grid">{group.items.map((item) => <Link className="ga-check-card" href={`/status-ga/${item.link}`} key={item.key}><div className="ga-card-icon"><ClipboardCheck aria-hidden="true" /></div><div className="ga-card-copy"><h3>{item.name}</h3><p>{item.desc}</p></div><ArrowRight className="ga-card-arrow" aria-hidden="true" /></Link>)}</div></section>) : <div className="ga-empty"><LockKeyhole aria-hidden="true" /><h2>{query ? "Checksheet tidak ditemukan" : "Belum ada akses checksheet"}</h2><p>{query ? "Coba gunakan kata kunci lain." : "Hubungi administrator untuk mendapatkan akses."}</p></div>}</div></main></div>
}
