/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
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
  PhoneCall
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

export default function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('SEMUA');
  const [activeModalDoc, setActiveModalDoc] = useState<LegalDocument | null>(null);
  const [isCopiedToast, setIsCopiedToast] = useState(false);
  const [copiedContactToast, setCopiedContactToast] = useState<string | null>(null);

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
      <div className="relative z-10 max-w-xl mx-auto px-4 pt-8 md:pt-12 sm:px-6">

        {/* HEADER / PROFILE SECTION */}
        <header className="flex flex-col items-center text-center">
          {/* Logo with Liquid Glass Aura Ring */}
          <div className="relative group mb-4">
            <div className="absolute -inset-2 rounded-full bg-gradient-to-tr from-purple-500 via-indigo-500 to-cyan-400 opacity-60 blur-md group-hover:opacity-90 transition duration-500 animate-pulse-glow" />
            
            {/* Glass Border & Frame */}
            <div className="relative w-24 h-24 rounded-full p-2 glass-surface border border-white/30 shadow-2xl flex items-center justify-center overflow-hidden">
              {/* Circular HD Emblem Image from User Asset */}
              <div
                className="w-full h-full bg-contain bg-center bg-no-repeat transition-transform duration-500 group-hover:scale-105"
                style={{
                  backgroundImage: `url(/assets/aistudio/Logo_Sema_HD_ef634b2e.png)`,
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
        <section className="mt-6 space-y-3" aria-label="Kontak Cepat WhatsApp dan Akun Resmi SEMA">
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] uppercase tracking-wider font-bold text-slate-300 flex items-center gap-1.5">
              <PhoneCall className="w-3.5 h-3.5 text-emerald-400" />
              Kontak WhatsApp &amp; Akun Resmi SEMA
            </span>
            <span className="text-[10px] text-emerald-400 font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              Online
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* 1. WhatsApp SEMA */}
            <a
              href="https://wa.me/628212649382"
              target="_blank"
              rel="noopener noreferrer"
              className="glass-surface-interactive p-3 rounded-xl flex items-center justify-between border border-emerald-500/25 group transition-all"
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
                  <div className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors truncate">
                    SEMA Amikom
                  </div>
                  <div className="text-[10px] text-emerald-400 font-sans truncate">
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
              className="glass-surface-interactive p-3 rounded-xl flex items-center justify-between border border-cyan-500/25 group transition-all"
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
                  <div className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors truncate">
                    Narahubung (Lifa)
                  </div>
                  <div className="text-[10px] text-cyan-300 font-sans truncate">
                    wa.me/6288228951004
                  </div>
                </div>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-white transition-colors flex-shrink-0 ml-1" />
            </a>

            {/* 3. Gmail SEMA */}
            <a
              href="mailto:semamikompwt@gmail.com"
              className="glass-surface-interactive p-3 rounded-xl flex items-center justify-between border border-rose-500/25 group transition-all"
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
                  <div className="text-xs font-bold text-white group-hover:text-rose-300 transition-colors truncate">
                    Gmail Resmi SEMA
                  </div>
                  <div className="text-[10px] text-rose-300 font-sans truncate">
                    semamikompwt@gmail.com
                  </div>
                </div>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-white transition-colors flex-shrink-0 ml-1" />
            </a>

            {/* 4. Instagram Resmi SEMA */}
            <a
              href="https://www.instagram.com/sema.amikompwt?srtk=d3RzZzZvc3ZnNjNv"
              target="_blank"
              rel="noopener noreferrer"
              className="glass-surface-interactive p-3 rounded-xl flex items-center justify-between border border-fuchsia-500/25 group transition-all"
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
                  <div className="text-xs font-bold text-white group-hover:text-fuchsia-300 transition-colors truncate">
                    Instagram Resmi SEMA
                  </div>
                  <div className="text-[10px] text-fuchsia-300 font-sans truncate">
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
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari produk hukum, SK, atau regulasi..."
                className="w-full pl-10 pr-9 py-2.5 bg-black/30 rounded-xl text-xs sm:text-sm text-white placeholder-slate-400 border border-white/10 focus:outline-none focus:border-purple-400/60 focus:ring-2 focus:ring-purple-500/20 transition-all"
              />
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
                <span>
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
                      <h3 className="text-xs sm:text-sm font-bold text-white tracking-wide line-clamp-2 uppercase leading-snug">
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
                              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                                {doc.description}
                              </p>
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
          <div className="glass-surface p-3.5 rounded-2xl border border-rose-500/20 bg-gradient-to-r from-rose-950/20 via-purple-950/20 to-black/30 flex items-start gap-3">
            <div className="p-2 rounded-xl bg-rose-500/15 text-rose-300 border border-rose-500/30 flex-shrink-0">
              <ShieldCheck className="w-5 h-5 text-rose-300" />
            </div>
            <p className="text-xs text-slate-300/90 leading-relaxed pt-0.5">
              Semua dokumen tersimpan di <strong>Google Drive Resmi SEMA Amikom Purwokerto</strong> dengan hak akses <em>Read-Only</em> untuk seluruh civitas akademika.
            </p>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="mt-10 text-center space-y-1.5 border-t border-white/5 pt-6 text-[11px] text-slate-400">
          <p className="font-semibold text-slate-300">
            &copy; 2026 Senat Mahasiswa Universitas Amikom Purwokerto. All Rights Reserved.
          </p>
          <p className="text-[10px] tracking-wider text-slate-500 uppercase font-medium">
            SENAT MAHASISWA UNIVERSITAS AMIKOM PURWOKERTO
          </p>
        </footer>
      </div>

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
              <p className="text-xs text-slate-300/90 mt-1">
                {activeModalDoc.description}
              </p>
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
  );
}
