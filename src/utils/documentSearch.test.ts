import test from 'node:test';
import assert from 'node:assert/strict';
import { DOCUMENT_CATEGORIES } from '../data/documentsData';
import {
  normalizeText,
  documentMatchesQuery,
  filterDocuments,
  getQuickStats,
} from './documentSearch';

test('normalizeText trims and lowercases accents properly', () => {
  assert.equal(normalizeText('  Undang-Undang DASAR  '), 'undang-undang dasar');
});

test('documentMatchesQuery matches title, desc, nomor and tags', () => {
  const sampleDoc = DOCUMENT_CATEGORIES[0].documents[0]; // UUD LK
  assert.equal(documentMatchesQuery(sampleDoc, 'UUD'), true);
  assert.equal(documentMatchesQuery(sampleDoc, 'Musyawarah Mahasiswa'), true);
  assert.equal(documentMatchesQuery(sampleDoc, 'Konstitusi'), true);
  assert.equal(documentMatchesQuery(sampleDoc, 'randomnonexistingkeyword123'), false);
});

test('filterDocuments returns all documents when query is empty', () => {
  const result = filterDocuments(DOCUMENT_CATEGORIES, '', 'SEMUA');
  assert.equal(result.categories.length, DOCUMENT_CATEGORIES.length);
  assert.ok(result.totalMatches >= 30);
});

test('filterDocuments accurately filters by query "PEMIRA"', () => {
  const result = filterDocuments(DOCUMENT_CATEGORIES, 'PEMIRA', 'SEMUA');
  assert.ok(result.totalMatches >= 1);
  const pemiraDoc = result.categories[0].documents.find(d => d.title.includes('Pemilihan'));
  assert.ok(pemiraDoc !== undefined);
});

test('filterDocuments filters by category code', () => {
  const result = filterDocuments(DOCUMENT_CATEGORIES, '', 'SK-SEMA');
  assert.equal(result.categories.length, 1);
  assert.equal(result.categories[0].id, 'sk-sema');
  assert.equal(result.categories[0].documents.length, 3);
});

test('getQuickStats calculates totals accurately', () => {
  const stats = getQuickStats(DOCUMENT_CATEGORIES);
  assert.equal(stats.totalCategories, 8);
  assert.ok(stats.totalDocs >= 30);
});
