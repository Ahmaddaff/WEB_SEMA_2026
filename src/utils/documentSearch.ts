import { DocumentCategory, LegalDocument } from '../data/documentsData';

export interface FilterResult {
  categories: DocumentCategory[];
  totalMatches: number;
  totalAvailable: number;
}

/**
 * Normalizes query string for fuzzy/case-insensitive matching
 */
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/**
 * Checks whether a document matches the search query across title, description, nomor, and tags
 */
export function documentMatchesQuery(doc: LegalDocument, query: string): boolean {
  if (!query) return true;
  const q = normalizeText(query);
  const titleNorm = normalizeText(doc.title);
  const descNorm = normalizeText(doc.description);
  const nomorNorm = normalizeText(doc.nomor);
  const catNorm = normalizeText(doc.categoryName);
  const tagsNorm = doc.tags ? doc.tags.map(t => normalizeText(t)).join(' ') : '';

  return (
    titleNorm.includes(q) ||
    descNorm.includes(q) ||
    nomorNorm.includes(q) ||
    catNorm.includes(q) ||
    tagsNorm.includes(q)
  );
}

/**
 * Filters document categories by search term and selected category pill
 */
export function filterDocuments(
  allCategories: DocumentCategory[],
  searchQuery: string,
  selectedCategoryCode: string = 'SEMUA'
): FilterResult {
  const cleanQuery = searchQuery.trim();
  let totalMatches = 0;
  let totalAvailable = 0;

  const filteredCategories: DocumentCategory[] = allCategories
    .filter(cat => {
      totalAvailable += cat.documents.length;
      if (selectedCategoryCode === 'SEMUA') return true;
      return cat.code.toLowerCase() === selectedCategoryCode.toLowerCase() ||
             cat.id.toLowerCase() === selectedCategoryCode.toLowerCase();
    })
    .map(category => {
      const matchingDocs = category.documents.filter(doc =>
        documentMatchesQuery(doc, cleanQuery)
      );

      totalMatches += matchingDocs.length;

      return {
        ...category,
        documents: matchingDocs,
        defaultOpen: cleanQuery ? matchingDocs.length > 0 : category.defaultOpen,
      };
    })
    .filter(cat => (cleanQuery ? cat.documents.length > 0 : true));

  return {
    categories: filteredCategories,
    totalMatches,
    totalAvailable,
  };
}

/**
 * Counts statistics for UI counters
 */
export function getQuickStats(categories: DocumentCategory[]) {
  const totalCategories = categories.length;
  const totalDocs = categories.reduce((acc, c) => acc + c.documents.length, 0);
  return { totalCategories, totalDocs };
}
