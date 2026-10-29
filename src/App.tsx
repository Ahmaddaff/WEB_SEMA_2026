/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Search,
  X,
  ExternalLink,
  ShieldCheck,
  ChevronDown,
  FileCheck2,
  Copy,
  Check,
  Download,
  FileSpreadsheet,
  PhoneCall,
  ArrowUp
} from 'lucide-react';
import { DOCUMENT_CATEGORIES, LegalDocument } from './data/documentsData';
import { filterDocuments, normalizeText } from './utils/documentSearch';

/**
 * Logo brand resmi. Aset sudah diproses dari sumber aslinya:
 * background putih dibuang, di-crop ke konten, disimpan di /public/assets/brand.
 */
const BRAND_ASSETS = {
  whatsapp: '/assets/brand/whatsapp.png',
  gmail: '/assets/brand/gmail.png',
  instagram: '/assets/brand/instagram.png',
  lembagaKemahasiswaan: '/assets/brand/lembaga-kemahasiswaan.png',
  semaHd: '/assets/brand/sema-hd.png',
} as const;

/**
 * Logo resmi per kategori dokumen:
 * - 4 kategori produk Lembaga Kemahasiswaan -> Logo Lembaga Kemahasiswaan
 * - 4 kategori produk/internal SEMA           -> Logo SEMA HD
 */
const CATEGORY_LOGOS: Record<string, string> = {
  uud: BRAND_ASSETS.lembagaKemahasiswaan,
  'uu-turunan': BRAND_ASSETS.lembagaKemahasiswaan,
  'regulasi-turunan': BRAND_ASSETS.lembagaKemahasiswaan,
  'tap-muswa': BRAND_ASSETS.lembagaKemahasiswaan,
  'internal-sema': BRAND_ASSETS.semaHd,
  'tap-sema': BRAND_ASSETS.semaHd,
  'sk-sema': BRAND_ASSETS.semaHd,
  'sk-ketua-umum-sema': BRAND_ASSETS.semaHd,
};

/**
 * Keliling cincin progres preloader (r = 78 pada viewBox 168x168).
 * Dipakai untuk menghitung stroke-dashoffset dari persentase.
 */
const PRELOADER_ARC = 2 * Math.PI * 78;

/** Durasi tampil preloader sebelum mulai menutup (ms). */
const PRELOADER_DURATION = 1600;

/** Lama animasi keluar; harus selaras dengan durasi di index.css. */
const PRELOADER_EXIT_MS = 760;

/** Lama emblem terbang dari tengah layar ke logo header. */
const PRELOADER_FLY_MS = 700;

export default function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('SEMUA');
  const [activeModalDoc, setActiveModalDoc] = useState<LegalDocument | null>(null);
  const [isCopiedToast, setIsCopiedToast] = useState(false);
  const [copiedContactToast, setCopiedContactToast] = useState<string | null>(null);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // ---- Layar pembuka (preloader) ----
  const [booting, setBooting] = useState(true);
  const [bootProgress, setBootProgress] = useState(0);
  const [bootExiting, setBootExiting] = useState(false);
  const preloaderLogoRef = useRef<HTMLDivElement>(null);
  const headerLogoRef = useRef<HTMLDivElement>(null);

  // Jalankan progres 0 -> 100 lalu tutup layar pembuka
  useEffect(() => {
    // Hormati preferensi minim gerakan: lewati saja
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setBootProgress(100);
      setBooting(false);
      return;
    }

    const start = performance.now();
    let raf = 0;
    let exitTimer = 0;
    let doneTimer = 0;

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / PRELOADER_DURATION);
      // ease-out cubic: cepat di awal, melambat menjelang akhir
      const eased = 1 - Math.pow(1 - t, 3);
      setBootProgress(eased * 100);

      if (t < 1) {
        raf = requestAnimationFrame(tick);
        return;
      }

      exitTimer = window.setTimeout(() => {
        setBootExiting(true);
        doneTimer = window.setTimeout(() => setBooting(false), PRELOADER_EXIT_MS);
      }, 170);
    };

    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(exitTimer);
      window.clearTimeout(doneTimer);
    };
  }, []);

  // Kunci gulir selama layar pembuka masih menutup halaman.
  // Posisi juga dikembalikan ke atas supaya logo tujuan tetap terlihat
  // kalau halaman di-refresh dalam keadaan sudah tergulir.
  useEffect(() => {
    if (!booting) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    return () => {
      document.body.style.overflow = previous;
    };
  }, [booting]);

  /**
   * Emblem "tertarik" dari tengah layar ke logo di header.
   * Posisi tujuan diukur saat runtime (FLIP), jadi tetap presisi di
   * segala ukuran layar. Emblem di header disembunyikan selama ini
   * dan baru muncul tepat saat animasi selesai, sehingga pergantiannya
   * tidak terlihat.
   */
  useEffect(() => {
    if (!bootExiting) return;

    const from = preloaderLogoRef.current;
    const to = headerLogoRef.current;
    if (!from || !to) return;

    const a = from.getBoundingClientRect();
    const b = to.getBoundingClientRect();

    // Rasio skala dari induk (panggung diperbesar 1.3x di layar lebar),
    // supaya jarak tempuh tetap akurat secara visual.
    const parentScale = from.offsetWidth ? a.width / from.offsetWidth : 1;
    const dx = (b.left + b.width / 2 - (a.left + a.width / 2)) / parentScale;
    const dy = (b.top + b.height / 2 - (a.top + a.height / 2)) / parentScale;
    const scale = a.width ? b.width / a.width : 1;

    if (typeof from.animate !== 'function') return;

    const flight = from.animate(
      [
        {
          transform: 'translate(0px, 0px) scale(1)',
          easing: 'cubic-bezier(0.42, 0.02, 0.62, 0.98)',
          offset: 0,
        },
        {
          // Sedikit melampaui ukuran target sebelum mengendap, supaya
          // terasa punya bobot dan tidak berhenti mendadak.
          transform: `translate(${dx * 0.985}px, ${dy * 0.985}px) scale(${scale * 1.025})`,
          easing: 'cubic-bezier(0.33, 1, 0.68, 1)',
          offset: 0.78,
        },
        {
          transform: `translate(${dx}px, ${dy}px) scale(${scale})`,
          offset: 1,
        },
      ],
      {
        duration: PRELOADER_FLY_MS,
        fill: 'forwards',
      }
    );

    return () => flight.cancel();
  }, [bootExiting]);

  // Tombol "kembali ke atas" muncul setelah menggulir cukup jauh
  useEffect(() => {
    const onScroll = () => setShowBackToTop(window.scrollY > 480);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Pintasan papan tombol: "/" fokus ke pencarian, "Esc" bersihkan/tutup
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const typing =
        !!target &&
        (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);

      if (e.key === '/' && !typing) {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
        return;
      }

      if (e.key === 'Escape') {
        if (activeModalDoc) {
          setActiveModalDoc(null);
        } else if (searchQuery) {
          setSearchQuery('');
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeModalDoc, searchQuery]);

  // Statistik ringkas untuk footer
  const libraryStats = useMemo(() => {
    const documents = DOCUMENT_CATEGORIES.reduce((sum, cat) => sum + cat.documents.length, 0);
    return { documents, categories: DOCUMENT_CATEGORIES.length };
  }, []);

  // Category filter chips (includes new category 8)
  const categoryPills = [
    { label: 'Semua', value: 'SEMUA' },
    { label: 'UUD', value: 'UUD' },
    { label: 'UU Turunan', value: 'UU Turunan' },
    { label: 'Regulasi', value: 'Regulasi' },
    { label: 'TAP-MUSWA', value: 'TAP-MUSWA' },
    { label: 'SEMA 2026', value: 'SEMA 2026' },
    { label: 'TAP-SEMA', value: 'TAP-SEMA' },
    { label: 'SK-SEMA', value: 'SK-SEMA' },
    { label: 'SK-Ketum', value: 'SK-Ketum' },
  ];

  // Perform search and filter
  const { categories: filteredCategories, totalMatches } = useMemo(() => {
    return filterDocuments(DOCUMENT_CATEGORIES, searchQuery, selectedCategory);
  }, [searchQuery, selectedCategory]);

  const handleCopyLink = (doc: LegalDocument) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(doc.driveUrl);
    }
    setIsCopiedToast(true);
    setTimeout(() => setIsCopiedToast(false), 2500);
  };

  const copyTextToClipboard = (text: string, label: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
    }
    setCopiedContactToast(label);
    setTimeout(() => setCopiedContactToast(null), 2500);
  };

  const getCategoryLogo = (categoryId: string) => CATEGORY_LOGOS[categoryId] ?? BRAND_ASSETS.semaHd;

  // Highlighting matched text in title
  const renderHighlightedText = (text: string, query: string) => {
    if (!query.trim()) return text;
    const parts = text.split(new RegExp(`(${query.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')})`, 'gi'));
    return (
      <>
        {parts.map((part, idx) =>
          normalizeText(part) === normalizeText(query) ? (
            <span key={idx} className="bg-purple-500/30 text-purple-200 px-1 py-0.5 rounded font-semibold border border-purple-400/30">
              {part}
            </span>
          ) : (
            part
          )
        )}
      </>
    );
  };

  return (
    <>
      {/* ============ LAYAR PEMBUKA ============ */}
      {booting && (
        <div
          className={`preloader${bootExiting ? ' is-exiting' : ''}`}
          role="status"
          aria-live="polite"
          aria-label="Memuat halaman JDIH Senat Mahasiswa"
        >
          <div className="preloader__veil" aria-hidden="true" />
          <div className="preloader__glow preloader__glow--a" aria-hidden="true" />
          <div className="preloader__glow preloader__glow--b" aria-hidden="true" />

          <div className="preloader__stage">
            {/* Cincin progres */}
            <svg className="preloader__arc" viewBox="0 0 168 168" aria-hidden="true">
              <defs>
                <linearGradient id="preloaderArcGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#a855f7" />
                  <stop offset="50%" stopColor="#6366f1" />
                  <stop offset="100%" stopColor="#22d3ee" />
                </linearGradient>
              </defs>
              <circle className="preloader__arc-track" cx="84" cy="84" r="78" />
              <circle
                className="preloader__arc-fill"
                cx="84"
                cy="84"
                r="78"
                stroke="url(#preloaderArcGrad)"
                strokeDasharray={PRELOADER_ARC}
                strokeDashoffset={PRELOADER_ARC - (PRELOADER_ARC * bootProgress) / 100}
              />
            </svg>

            {/* Aura berputar + satelit orbit */}
            <div className="preloader__aura" aria-hidden="true" />
            <div className="preloader__ping" aria-hidden="true" />
            <div className="preloader__ping preloader__ping--delay" aria-hidden="true" />
            <div className="preloader__orbit" aria-hidden="true">
              <span className="preloader__orbit-dot" />
            </div>

            {/* Emblem SEMA */}
            <div className="preloader__logo" ref={preloaderLogoRef}>
              <div
                className="preloader__logo-img"
                style={{ backgroundImage: 'url(/assets/aistudio/Logo_Sema_HD_ef634b2e.png)' }}
                role="img"
                aria-label="Logo Senat Mahasiswa Universitas Amikom Purwokerto"
              />
            </div>
          </div>

          <div className="preloader__meta">
            <p className="preloader__wordmark" aria-hidden="true">
              {['J', 'D', 'I', 'H'].map((char, index) => (
                <span key={char} style={{ animationDelay: `${0.22 + index * 0.08}s` }}>
                  {char}
                </span>
              ))}
            </p>
            <p className="preloader__sub">Senat Mahasiswa Universitas Amikom Purwokerto</p>
            <div className="preloader__bar" aria-hidden="true">
              <span className="preloader__bar-fill" style={{ width: `${bootProgress}%` }} />
            </div>
            <p className="preloader__pct" aria-hidden="true">
              {Math.round(bootProgress)}%
            </p>
          </div>
        </div>
      )}

      <div className="relative min-h-screen w-full bg-[#080915] text-slate-100 overflow-x-hidden pb-16 selection:bg-purple-500/30 selection:text-purple-200">
      {/* Liquid Fluid Background Mesh & Glowing Ambient Orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute inset-0 animate-liquid-bg opacity-75" />
        
        {/* Floating Fluid Glass Orbs */}
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-gradient-to-tr from-purple-700/35 to-indigo-600/30 blur-[100px] animate-orb-1" />
        <div className="absolute top-1/3 -right-24 w-80 h-80 rounded-full bg-gradient-to-br from-blue-600/25 to-cyan-500/25 blur-[110px] animate-orb-2" />
        <div className="absolute top-2/3 left-1/4 w-[420px] h-[420px] rounded-full bg-gradient-to-r from-violet-600/20 to-fuchsia-600/20 blur-[120px] animate-orb-3" />
        <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full bg-gradient-to-t from-cyan-600/20 to-blue-800/20 blur-[100px] animate-pulse-glow" />

        {/* Subtle glass reflection overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/[0.04] via-transparent to-black/60 pointer-events-none" />
      </div>

      {/* Main Content Container - Mobile First (Max 580px width) */}
      <div className="relative z-10 max-w-xl mx-auto px-4 pt-8 md:pt-12 sm:px-6 page-enter">

        {/* HEADER / PROFILE SECTION */}
        <header className="flex flex-col items-center text-center">
          {/* Logo with Liquid Glass Aura Ring.
              Frame-nya disembunyikan selama preloader; aura & glow baru
              menyala lembut setelah emblem mendarat, supaya tidak "ngepop". */}
          <div className="relative group mb-5">
            {/* Aura & glow: memudar masuk setelah emblem tiba */}
            <div
              className={`pointer-events-none absolute inset-0 transition-opacity duration-500 ease-out motion-reduce:transition-none ${
                booting ? 'opacity-0' : 'opacity-100'
              }`}
              aria-hidden="true"
            >
              {/* Rotating conic aura ring */}
              <div className="absolute -inset-3 rounded-full bg-[conic-gradient(from_0deg,#a855f7,#6366f1,#22d3ee,#a855f7)] opacity-50 blur-lg animate-aura-spin transition-opacity duration-500 group-hover:opacity-80" />
              {/* Soft ambient glow */}
              <div className="absolute -inset-7 rounded-full bg-purple-500/25 blur-2xl animate-pulse-glow" />
            </div>

            {/* Glass Border & Frame */}
            <div
              ref={headerLogoRef}
              className={`relative w-32 h-32 sm:w-36 sm:h-36 rounded-full p-2.5 glass-surface border border-white/35 shadow-[0_22px_55px_-18px_rgba(139,92,246,0.75)] flex items-center justify-center overflow-hidden ${
                booting ? 'invisible' : 'visible'
              }`}
            >
              {/* Inner hairline ring */}
              <div className="pointer-events-none absolute inset-1.5 rounded-full border border-white/15" />
              {/* Circular HD Emblem Image from User Asset */}
              <div
                className="relative w-full h-full bg-contain bg-center bg-no-repeat animate-heartbeat"
                style={{
                  backgroundImage: `url(/assets/aistudio/Logo_Sema_HD_ef634b2e.png)`,
                  backgroundSize: '94%',
                  backgroundPosition: 'center',
                }}
                role="img"
                aria-label="Logo Senat Mahasiswa Universitas Amikom Purwokerto"
              />
            </div>
          </div>

          {/* SEMA Handle & Campus Pill */}
          <div className="flex flex-col items-center">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full glass-pill text-xs font-semibold tracking-wide text-white/90 shadow-sm border border-white/15">
              <span className="text-purple-400">@</span>sema.amikompwt
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </div>
          </div>

          {/* Title & Description */}
          <h1 className="mt-3.5 text-2xl sm:text-3xl font-extrabold text-white tracking-tight drop-shadow-md">
            Jaringan Dokumentasi & Informasi Hukum (JDIH)
          </h1>
          <p className="mt-1.5 text-xs sm:text-sm text-slate-300/90 max-w-md font-medium">
            Official Portal of Senat Mahasiswa Universitas Amikom Purwokerto
          </p>
          <p className="mt-0.5 text-xs sm:text-sm text-slate-300/90 max-w-md font-medium">
            Periode 2025/2026
          </p>
        </header>

        {/* QUICK CONTACTS & WHATSAPP / GMAIL SECTION */}
        <section className="mt-7 space-y-3" aria-label="Media resmi Senat Mahasiswa">
          <div className="flex items-center px-1">
            <span className="text-[11px] uppercase tracking-wider font-bold text-slate-300 flex items-center gap-1.5">
              <PhoneCall className="w-3.5 h-3.5 text-purple-300" />
              Media resmi Senat Mahasiswa
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* 1. WhatsApp SEMA */}
            <a
              href="https://wa.me/628212649382"
              target="_blank"
              rel="noopener noreferrer"
              className="contact-card p-3 rounded-xl flex items-center justify-between border border-white/10 group"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="brand-icon">
                  <img
                    src={BRAND_ASSETS.whatsapp}
                    alt="WhatsApp"
                    className="h-full w-full object-contain"
                    loading="lazy"
                  />
                </span>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-white group-hover:text-purple-300 transition-colors truncate">
                    SEMA Amikom
                  </div>
                  <div className="text-[10px] text-purple-300 font-sans truncate">
                    wa.me/628212649382
                  </div>
                </div>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-white transition-colors flex-shrink-0 ml-1" />
            </a>

            {/* 2. WhatsApp Narahubung (Lifa) */}
            <a
              href="https://wa.me/6288228951004"
              target="_blank"
              rel="noopener noreferrer"
              className="contact-card p-3 rounded-xl flex items-center justify-between border border-white/10 group"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="brand-icon">
                  <img
                    src={BRAND_ASSETS.whatsapp}
                    alt="WhatsApp"
                    className="h-full w-full object-contain"
                    loading="lazy"
                  />
                </span>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-white group-hover:text-purple-300 transition-colors truncate">
                    Narahubung (Lifa)
                  </div>
                  <div className="text-[10px] text-purple-300 font-sans truncate">
                    wa.me/6288228951004
                  </div>
                </div>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-white transition-colors flex-shrink-0 ml-1" />
            </a>

            {/* 3. Gmail SEMA */}
            <a
              href="mailto:semamikompwt@gmail.com"
              className="contact-card p-3 rounded-xl flex items-center justify-between border border-white/10 group"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="brand-icon">
                  <img
                    src={BRAND_ASSETS.gmail}
                    alt="Gmail"
                    className="h-full w-full object-contain"
                    loading="lazy"
                  />
                </span>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-white group-hover:text-purple-300 transition-colors truncate">
                    Gmail SEMA
                  </div>
                  <div className="text-[10px] text-purple-300 font-sans truncate">
                    semamikompwt@gmail.com
                  </div>
                </div>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-white transition-colors flex-shrink-0 ml-1" />
            </a>

            {/* 4. Instagram SEMA */}
            <a
              href="https://www.instagram.com/sema.amikompwt?srtk=d3RzZzZvc3ZnNjNv"
              target="_blank"
              rel="noopener noreferrer"
              className="contact-card p-3 rounded-xl flex items-center justify-between border border-white/10 group"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="brand-icon">
                  <img
                    src={BRAND_ASSETS.instagram}
                    alt="Instagram"
                    className="h-full w-full object-contain"
                    loading="lazy"
                  />
                </span>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-white group-hover:text-purple-300 transition-colors truncate">
                    Instagram SEMA
                  </div>
                  <div className="text-[10px] text-purple-300 font-sans truncate">
                    @sema.amikompwt
                  </div>
                </div>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-white transition-colors flex-shrink-0 ml-1" />
            </a>
          </div>

          {copiedContactToast && (
            <div className="text-center text-[11px] text-emerald-300 bg-emerald-950/60 border border-emerald-500/30 py-1 px-3 rounded-lg animate-in fade-in">
              {copiedContactToast} berhasil disalin!
            </div>
          )}
        </section>

        {/* REAL-TIME SEARCH & FILTER CONTROLS */}
        <section className="mt-5 sticky top-2 z-20" aria-label="Pencarian dan Filter Dokumen">
          <div className="glass-surface p-2.5 rounded-2xl border border-white/15 shadow-xl backdrop-blur-2xl">
            {/* Search Input Box */}
            <div className="relative flex items-center">
              <label htmlFor="search-input" className="sr-only">Cari produk hukum, SK, atau regulasi</label>
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
              <input
                id="search-input"
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari produk hukum, SK, atau regulasi..."
                aria-describedby="search-hint"
                className="w-full pl-10 pr-9 py-2.5 bg-black/30 rounded-xl text-xs sm:text-sm text-white placeholder-slate-400 border border-white/10 focus:outline-none focus:border-purple-400/60 focus:ring-2 focus:ring-purple-500/20 transition-all"
              />
              <span id="search-hint" className="sr-only">
                Tekan garis miring untuk langsung fokus ke kolom pencarian, Escape untuk menghapus kata kunci.
              </span>
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  aria-label="Hapus kata kunci pencarian"
                  className="absolute right-2.5 p-1 rounded-md text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              {!searchQuery && (
                <kbd
                  aria-hidden="true"
                  className="pointer-events-none absolute right-2.5 hidden h-5 min-w-[1.35rem] items-center justify-center rounded-md border border-white/15 bg-white/5 px-1 text-[10px] font-semibold text-slate-400 sm:inline-flex"
                >
                  /
                </kbd>
              )}
            </div>

            {/* Category Filter Pills (Horizontal Scrollable) */}
            <div className="flex items-center gap-1.5 overflow-x-auto pt-2 pb-0.5 no-scrollbar scroll-smooth" tabIndex={0} aria-label="Filter kategori dokumen">
              {categoryPills.map((pill) => {
                const isActive = selectedCategory === pill.value;
                return (
                  <button
                    key={pill.value}
                    type="button"
                    onClick={() => setSelectedCategory(pill.value)}
                    aria-pressed={isActive}
                    className={`whitespace-nowrap px-3 py-1 rounded-lg text-[11px] font-medium transition-all duration-200 border ${
                      isActive
                        ? 'bg-purple-600/35 text-white border-purple-400/50 shadow-sm shadow-purple-500/20 font-semibold'
                        : 'bg-white/5 text-slate-300 hover:text-white border-white/10 hover:border-white/20'
                    }`}
                  >
                    {pill.label}
                  </button>
                );
              })}
            </div>

            {/* Search feedback counter */}
            {(searchQuery.trim() || selectedCategory !== 'SEMUA') && (
              <div className="flex items-center justify-between px-1 pt-2 text-[11px] text-slate-400 border-t border-white/5 mt-2">
                <span aria-live="polite">
                  Hasil:{' '}
                  <strong className="text-purple-300">{totalMatches}</strong> dokumen ditemukan
                </span>
                {(searchQuery || selectedCategory !== 'SEMUA') && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedCategory('SEMUA');
                    }}
                    className="text-purple-400 hover:text-purple-300 font-semibold underline underline-offset-2"
                  >
                    Reset Filter
                  </button>
                )}
              </div>
            )}
          </div>
        </section>

        {/* ACCORDION CATEGORIES (<details> & <summary> Native Implementation) */}
        <main className="mt-5 space-y-3.5" aria-label="Daftar Dokumen Hukum">
          {filteredCategories.length === 0 ? (
            /* Empty State */
            <div className="glass-surface p-8 rounded-2xl text-center border border-white/10 space-y-3">
              <div className="w-12 h-12 rounded-full bg-purple-500/10 text-purple-400 mx-auto flex items-center justify-center border border-purple-500/20">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white">Tidak ada dokumen ditemukan</h3>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                Kata kunci &ldquo;{searchQuery}&rdquo; tidak cocok dengan judul, nomor, atau tag dokumen manapun.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('SEMUA');
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600/40 hover:bg-purple-600/60 text-white text-xs font-semibold border border-purple-400/30 transition-all"
              >
                Tampilkan Semua Dokumen
              </button>
            </div>
          ) : (
            filteredCategories.map((category) => (
              <details
                key={category.id}
                open={category.defaultOpen}
                className="group glass-surface rounded-2xl border border-white/12 overflow-hidden transition-all duration-300 shadow-lg"
              >
                {/* Native Accordion Summary */}
                <summary className="p-4 flex items-center justify-between gap-3 select-none cursor-pointer hover:bg-white/[0.03] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400">
                  <div className="flex items-center gap-3 min-w-0 pr-1">
                    <span className="category-logo">
                      <img
                        src={getCategoryLogo(category.id)}
                        alt={`Logo resmi ${category.title}`}
                        className="h-full w-full object-contain"
                        loading="lazy"
                      />
                    </span>
                    <div className="min-w-0 text-left">
                      <h3 className="text-xs sm:text-sm font-bold text-white tracking-wide uppercase leading-snug">
                        {category.title}
                      </h3>
                      <p className="text-[11px] text-slate-400 line-clamp-2 mt-0.5 leading-relaxed">
                        {category.subtitle}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/5 text-slate-300 border border-white/10 whitespace-nowrap">
                      {`${category.documents.length} Dokumen`}
                    </span>
                    <div className="p-1 rounded-md text-slate-400 group-hover:text-white transition-colors">
                      <ChevronDown className="w-4 h-4 accordion-chevron" />
                    </div>
                  </div>
                </summary>

                {/* Accordion Content Panel (Document Cards) */}
                <div className="px-3 pb-3.5 pt-1 space-y-2.5 border-t border-white/5 bg-black/15">
                  {category.documents.map((doc) => (
                    <article
                      key={doc.id}
                      className="p-3.5 rounded-xl glass-subcard group/item relative overflow-hidden"
                    >
                      <div className="flex flex-col gap-2.5">
                        {/* Title & Description */}
                        <div
                          className="flex-1 min-w-0 cursor-pointer"
                          onClick={() => setActiveModalDoc(doc)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setActiveModalDoc(doc); }}
                          aria-label={`Lihat detail dokumen ${doc.title}`}
                        >
                          <div className="flex items-start gap-2.5">
                            <div className="mt-0.5 text-purple-400 flex-shrink-0">
                              <FileSpreadsheet className="w-4 h-4 opacity-80" />
                            </div>
                            <div>
                              <h4 className="text-xs sm:text-sm font-semibold text-white/95 leading-snug group-hover/item:text-purple-200 transition-colors">
                                {renderHighlightedText(doc.title, searchQuery)}
                              </h4>
                              {doc.description && (
                                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                                  {doc.description}
                                </p>
                              )}
                              {doc.updatedAt && (
                                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                                  Diperbarui: {doc.updatedAt}
                                </p>
                              )}
                              {doc.tags && (
                                <div className="flex flex-wrap gap-1 mt-1.5">
                                  {doc.tags.slice(0, 3).map((tag, i) => (
                                    <span key={i} className="text-[9px] px-1.5 py-0.2 rounded bg-white/5 text-slate-400 border border-white/5">
                                      #{tag}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Status Badge & Google Drive Action Button */}
                        <div className="flex items-center gap-2 flex-wrap flex-shrink-0">
                          <span className="text-[10px] font-bold px-2 py-1 rounded-md bg-white/5 text-slate-300 border border-white/10 tracking-wider whitespace-nowrap">
                            {doc.status}
                          </span>
                          <a
                            href={doc.driveUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="glass-btn-drive px-3 py-1.5 rounded-lg text-xs font-semibold text-white inline-flex items-center gap-1.5 whitespace-nowrap"
                            aria-label={`Buka di Google Drive: ${doc.title}`}
                          >
                            <span className="text-rose-300 font-bold text-xs">▲</span>
                            <span>Buka di Google Drive</span>
                          </a>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </details>
            ))
          )}
        </main>

        {/* NOTICE / DISCLAIMER BANNER */}
        <section className="mt-6" aria-label="Pemberitahuan Hak Cipta & Akses">
          <div className="flex items-start gap-2.5 rounded-lg border-l-[3px] border-rose-400/70 bg-rose-500/[0.07] py-3 pl-3.5 pr-3">
            <ShieldCheck className="mt-0.5 h-4 w-4 flex-shrink-0 text-rose-300" />
            <p className="text-[11px] leading-relaxed text-slate-300/85">
              Semua dokumen tersimpan di{' '}
              <strong className="font-semibold text-white/90">Google Drive Resmi SEMA Amikom Purwokerto</strong> dengan
              hak akses <em>Read-Only</em> untuk seluruh civitas akademika.
            </p>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="mt-10 text-center space-y-1.5 border-t border-white/5 pt-6 text-[11px] text-slate-400">
          <div className="mb-3 flex items-center justify-center gap-2 text-[10px] font-medium tracking-wide text-slate-400">
            <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1">
              {libraryStats.documents} dokumen
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1">
              {libraryStats.categories} kategori
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1">
              Akses Read-Only
            </span>
          </div>
          <p className="font-semibold text-slate-300">
            &copy; 2026 Senat Mahasiswa Universitas Amikom Purwokerto. All Rights Reserved.
          </p>
          <p className="text-[10px] tracking-wider text-slate-500 uppercase font-medium">
            SENAT MAHASISWA UNIVERSITAS AMIKOM PURWOKERTO
          </p>
        </footer>
      </div>

      {/* BACK TO TOP */}
      <button
        type="button"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        aria-label="Kembali ke atas halaman"
        className={`fixed bottom-5 right-5 z-40 flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-[#151731]/90 text-slate-200 shadow-[0_10px_30px_-8px_rgba(0,0,0,0.9)] backdrop-blur-xl transition-all duration-300 hover:border-purple-400/50 hover:text-white hover:shadow-[0_10px_30px_-6px_rgba(139,92,246,0.5)] ${
          showBackToTop ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-3 opacity-0'
        }`}
      >
        <ArrowUp className="h-4 w-4" />
      </button>

      {/* DOCUMENT PREVIEW MODAL */}
      {activeModalDoc && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-doc-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
        >
          <div className="relative w-full max-w-md glass-surface rounded-2xl border border-white/20 p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  <FileCheck2 className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-purple-300">
                    {activeModalDoc.categoryName}
                  </span>
                  <div className="text-xs font-medium text-slate-400">
                    Nomor: {activeModalDoc.nomor}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveModalDoc(null)}
                aria-label="Tutup jendela dokumen"
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Document Title */}
            <div>
              <h3 id="modal-doc-title" className="text-base font-bold text-white leading-snug">
                {activeModalDoc.title}
              </h3>
              {activeModalDoc.description && (
                <p className="text-xs text-slate-300/90 mt-1">
                  {activeModalDoc.description}
                </p>
              )}
              {activeModalDoc.updatedAt && (
                <p className="text-xs text-slate-400 mt-1">
                  Diperbarui: {activeModalDoc.updatedAt}
                </p>
              )}
            </div>

            {/* Document Attributes */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 space-y-0.5">
                <span className="text-[10px] text-slate-400 block">Tahun / Tanggal</span>
                <span className="font-semibold text-slate-200">{activeModalDoc.datePublished}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 space-y-0.5">
                <span className="text-[10px] text-slate-400 block">Status Regulasi</span>
                <span className="font-semibold text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  {activeModalDoc.status} (Resmi)
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 space-y-0.5">
                <span className="text-[10px] text-slate-400 block">Format Dokumen</span>
                <span className="font-semibold text-slate-200">{activeModalDoc.fileSize}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 space-y-0.5">
                <span className="text-[10px] text-slate-400 block">Penerbit Resmi</span>
                <span className="font-semibold text-slate-200">SEMA UAP 2025/2026</span>
              </div>
            </div>

            {/* Simulated Document Preview Window */}
            <div className="p-4 rounded-xl bg-black/50 border border-white/10 text-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-rose-500/10 text-rose-400 mx-auto flex items-center justify-center border border-rose-500/20">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <p className="text-xs font-medium text-slate-200">
                Arsip Terenkripsi Google Drive SEMA UAP
              </p>
              <p className="text-[11px] text-slate-400">
                Dokumen ini telah disahkan dan diarsipkan dalam folder cloud resmi Senat Mahasiswa Universitas Amikom Purwokerto.
              </p>
            </div>

            {/* Actions */}
            <div className="space-y-2 pt-2">
              <a
                href={activeModalDoc.driveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-rose-600 via-pink-600 to-purple-600 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-rose-900/30 hover:opacity-95 transition-all"
              >
                <span>Buka Dokumen di Google Drive</span>
                <ExternalLink className="w-4 h-4" />
              </a>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleCopyLink(activeModalDoc)}
                  className="py-2 px-3 rounded-xl glass-pill text-xs font-medium text-slate-200 hover:text-white flex items-center justify-center gap-1.5 transition-all"
                >
                  {isCopiedToast ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                  <span>{isCopiedToast ? 'Tersalin!' : 'Salin Tautan'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const blob = new Blob([
                      `JDIH SENAT MAHASISWA UNIVERSITAS AMIKOM PURWOKERTO\n\nJudul: ${activeModalDoc.title}\nNomor: ${activeModalDoc.nomor}\nKategori: ${activeModalDoc.categoryName}\nTanggal: ${activeModalDoc.datePublished}\nStatus: ${activeModalDoc.status}\nLink Drive: ${activeModalDoc.driveUrl}\n\nTransparansi Regulasi Kampus Berkemajuan.`
                    ], { type: 'text/plain' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `${activeModalDoc.id}-meta.txt`;
                    a.click();
                  }}
                  className="py-2 px-3 rounded-xl glass-pill text-xs font-medium text-slate-200 hover:text-white flex items-center justify-center gap-1.5 transition-all"
                >
                  <Download className="w-3.5 h-3.5 text-slate-400" />
                  <span>Unduh Metadata</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </>
  );
}
