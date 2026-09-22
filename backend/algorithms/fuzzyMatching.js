const mongoose = require('mongoose');
const { levenshteinDistance, levenshteinSimilarity } = require('../utils/distanceUtils');

// Splits a product name into comparable words, dropping parenthetical
// quantity/size qualifiers like "(1kg)" or "(250g)" as their own tokens too
// (e.g. "Potato (1kg)" -> ["Potato", "(1kg)", "1kg"]) so a bare unit typo
// still has something to match against.
const tokenize = (name) =>
  name
    .split(/\s+/)
    .flatMap((word) => (word.startsWith('(') && word.endsWith(')') ? [word, word.slice(1, -1)] : [word]))
    .filter(Boolean);

/**
 * Best Levenshtein similarity between inputName and a product name, checked
 * both against the full name and against each of its individual words.
 * Whole-name comparison alone unfairly penalizes multi-word names — e.g.
 * "potatoe" vs "Potato (1kg)" scores ~0.5 as a full string (well below any
 * reasonable threshold) but ~0.86 against the word "Potato" alone, which is
 * the actual match a "did you mean" feature should surface.
 */
function bestNameMatch(inputName, productName) {
  let best = { similarity: levenshteinSimilarity(inputName, productName), distance: levenshteinDistance(inputName.toLowerCase().trim(), productName.toLowerCase().trim()) };

  for (const token of tokenize(productName)) {
    const similarity = levenshteinSimilarity(inputName, token);
    if (similarity > best.similarity) {
      best = { similarity, distance: levenshteinDistance(inputName.toLowerCase().trim(), token.toLowerCase().trim()) };
    }
  }

  return best;
}

class FuzzyMatcher {
  /**
   * Finds active products whose name is similar to inputName, using
   * Levenshtein similarity. Used to power typo corrections / "did you mean".
   */
  async findSimilarProducts(inputName, threshold = 0.6, limit = 10) {
    try {
      const startTime = Date.now();

      const allProducts = await mongoose.model('Product')
        .find({ isActive: true })
        .select('_id name price')
        .lean();

      const matches = [];
      for (const product of allProducts) {
        const { similarity, distance } = bestNameMatch(inputName, product.name);
        if (similarity >= threshold) {
          matches.push({ product, similarity, distance });
        }
      }

      matches.sort((a, b) => b.similarity - a.similarity);

      return {
        success: true,
        query: inputName,
        results: matches.slice(0, limit),
        matchCount: matches.length,
        threshold,
        executionTime: Date.now() - startTime,
      };
    } catch (error) {
      console.error('Error in fuzzy matching:', error);
      return { success: false, error: error.message, results: [] };
    }
  }

  /**
   * Typo corrections for a search term that returned no (or few) results.
   * Groups near-duplicate product names (e.g. the same commodity listed by
   * several sellers) into one suggestion, keeping the closest match's name.
   */
  async getCorrections(typo, limit = 5) {
    try {
      const result = await this.findSimilarProducts(typo, 0.6, limit * 4);
      if (!result.success || result.results.length === 0) {
        return { success: true, typo, suggestions: [] };
      }

      const seenNames = new Set();
      const suggestions = [];
      for (const r of result.results) {
        const key = r.product.name.toLowerCase();
        if (seenNames.has(key)) continue;
        seenNames.add(key);
        suggestions.push({
          corrected: r.product.name,
          confidence: Math.round(r.similarity * 1000) / 10,
          distance: r.distance,
        });
        if (suggestions.length >= limit) break;
      }

      return { success: true, typo, suggestions };
    } catch (error) {
      console.error('Error getting corrections:', error);
      return { success: false, error: error.message, suggestions: [] };
    }
  }
}

module.exports = FuzzyMatcher;
