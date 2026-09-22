const { levenshteinDistance, levenshteinSimilarity } = require('../utils/distanceUtils');
const FuzzyMatcher = require('../algorithms/fuzzyMatching');
const { createSeller, createProduct } = require('./helpers');

describe('distanceUtils - levenshteinDistance / levenshteinSimilarity (Sprint 5, Ticket 5.1)', () => {
  test('distance is 0 for identical strings', () => {
    expect(levenshteinDistance('tomato', 'tomato')).toBe(0);
  });

  test('distance counts a single substitution', () => {
    expect(levenshteinDistance('tomato', 'tomoto')).toBe(1);
  });

  test('distance counts a single deletion', () => {
    expect(levenshteinDistance('rice', 'rce')).toBe(1);
  });

  test('distance counts a single insertion', () => {
    expect(levenshteinDistance('milk', 'milks')).toBe(1);
  });

  test('levenshteinSimilarity matches the documented example: Tomato vs Tomoto = 0.833', () => {
    expect(levenshteinSimilarity('Tomato', 'Tomoto')).toBeCloseTo(1 - 1 / 6, 3);
  });

  test('levenshteinSimilarity is case-insensitive and trims whitespace', () => {
    expect(levenshteinSimilarity('  Rice  ', 'rice')).toBe(1);
  });

  test('levenshteinSimilarity is 1 for two empty strings', () => {
    expect(levenshteinSimilarity('', '')).toBe(1);
  });
});

describe('FuzzyMatcher - findSimilarProducts (Sprint 5, Ticket 5.1)', () => {
  let matcher;

  beforeAll(() => {
    matcher = new FuzzyMatcher();
  });

  test('finds a typo\'d product name above the threshold, ranked by similarity', async () => {
    const { seller } = await createSeller();
    await createProduct({ sellerId: seller._id, name: 'Tomato' });
    await createProduct({ sellerId: seller._id, name: 'Basmati Rice' });

    const result = await matcher.findSimilarProducts('Tomoto', 0.75, 10);

    expect(result.success).toBe(true);
    expect(result.results.length).toBe(1);
    expect(result.results[0].product.name).toBe('Tomato');
    expect(result.results[0].similarity).toBeCloseTo(1 - 1 / 6, 3);
  });

  test('excludes inactive products', async () => {
    const { seller } = await createSeller();
    await createProduct({ sellerId: seller._id, name: 'Tomato', isActive: false });

    const result = await matcher.findSimilarProducts('Tomato', 0.75, 10);
    expect(result.results).toEqual([]);
  });

  test('respects the similarity threshold', async () => {
    const { seller } = await createSeller();
    await createProduct({ sellerId: seller._id, name: 'Rice' });

    const result = await matcher.findSimilarProducts('Completely Different Item', 0.75, 10);
    expect(result.results).toEqual([]);
  });

  test('matches a typo of the core word even when the product name carries a quantity suffix', async () => {
    // Regression: comparing the typo against the *whole* name (e.g.
    // "Potato (1kg)") used to tank the similarity below any sane threshold,
    // even though "potatoe" is an obvious one-letter typo of "Potato".
    const { seller } = await createSeller();
    await createProduct({ sellerId: seller._id, name: 'Potato (1kg)' });

    const result = await matcher.findSimilarProducts('potatoe', 0.6, 10);

    expect(result.results.length).toBe(1);
    expect(result.results[0].product.name).toBe('Potato (1kg)');
    expect(result.results[0].similarity).toBeGreaterThan(0.8);
  });

  test('matches a typo buried in a multi-word name with a quantity suffix', async () => {
    const { seller } = await createSeller();
    await createProduct({ sellerId: seller._id, name: 'Raw Honey (250g)' });

    const result = await matcher.findSimilarProducts('honeyy', 0.6, 10);

    expect(result.results.length).toBe(1);
    expect(result.results[0].product.name).toBe('Raw Honey (250g)');
  });
});

describe('FuzzyMatcher - getCorrections (Sprint 5, Ticket 5.1)', () => {
  let matcher;

  beforeAll(() => {
    matcher = new FuzzyMatcher();
  });

  test('suggests the closest product name for a typo', async () => {
    const { seller } = await createSeller();
    await createProduct({ sellerId: seller._id, name: 'Mustard Oil' });

    const result = await matcher.getCorrections('Mustrd Oil');

    expect(result.success).toBe(true);
    expect(result.suggestions[0].corrected).toBe('Mustard Oil');
    expect(result.suggestions[0].confidence).toBeGreaterThan(80);
  });

  test('returns [] when nothing is similar enough', async () => {
    const result = await matcher.getCorrections('Xyzzyplugh Quorx');
    expect(result.suggestions).toEqual([]);
  });

  test('suggests a "did you mean" correction for a typo of a product with a quantity suffix', async () => {
    const { seller } = await createSeller();
    await createProduct({ sellerId: seller._id, name: 'Potato (1kg)' });

    const result = await matcher.getCorrections('potatoe');

    expect(result.suggestions.length).toBeGreaterThan(0);
    expect(result.suggestions[0].corrected).toBe('Potato (1kg)');
  });

  test('de-duplicates identical product names (same commodity, multiple sellers)', async () => {
    const { seller: sellerA } = await createSeller();
    const { seller: sellerB } = await createSeller();
    await createProduct({ sellerId: sellerA._id, name: 'Honey' });
    await createProduct({ sellerId: sellerB._id, name: 'Honey' });

    const result = await matcher.getCorrections('Honney', 5);

    const honeySuggestions = result.suggestions.filter((s) => s.corrected === 'Honey');
    expect(honeySuggestions.length).toBe(1);
  });
});
