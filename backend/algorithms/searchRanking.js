const mongoose = require('mongoose');

const tokenize = (text) =>
  (text || '')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);

class SearchRankingEngine {
  /**
   * TF-IDF relevance of the query against a set of candidate products
   * (name + description). Computed in-app rather than via MongoDB's $text
   * index, so it keeps the existing partial-substring search UX (e.g. "gundr"
   * still matches "Gundruk") instead of $text's whole-word stemmed matching.
   * Returns a Map of productId -> score normalized to 0-1 against the max.
   */
  computeTfIdfScores(query, candidates) {
    const queryTerms = Array.from(new Set(tokenize(query)));
    if (queryTerms.length === 0 || candidates.length === 0) {
      return new Map(candidates.map((c) => [c._id.toString(), 0]));
    }

    const docTokens = candidates.map((c) => tokenize(`${c.name} ${c.description || ''}`));

    // IDF per query term across this candidate set.
    const idf = {};
    for (const term of queryTerms) {
      const docsWithTerm = docTokens.filter((tokens) => tokens.includes(term)).length;
      idf[term] = Math.log((candidates.length + 1) / (docsWithTerm + 1)) + 1;
    }

    const rawScores = candidates.map((candidate, i) => {
      const tokens = docTokens[i];
      if (tokens.length === 0) return 0;
      let score = 0;
      for (const term of queryTerms) {
        const termCount = tokens.filter((t) => t === term).length;
        const tf = termCount / tokens.length;
        score += tf * idf[term];
      }
      return score;
    });

    const maxScore = Math.max(...rawScores, 0);
    const scores = new Map();
    candidates.forEach((c, i) => {
      scores.set(c._id.toString(), maxScore > 0 ? rawScores[i] / maxScore : 0);
    });
    return scores;
  }

  /**
   * Popularity: 50% sales volume (log-scaled), 30% average rating, 20% review count.
   * Range: 0-1
   */
  async getPopularityScore(productId) {
    try {
      const salesCount = await mongoose.model('OrderItem').countDocuments({ productId });
      const reviews = await mongoose.model('Review').find({ productId }).select('rating').lean();

      const avgRating = reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 3;

      const salesScore = Math.min(Math.log(salesCount + 1) / Math.log(1000), 1);
      const ratingScore = avgRating / 5;
      const reviewScore = Math.min(reviews.length / 50, 1);

      const score = salesScore * 0.5 + ratingScore * 0.3 + reviewScore * 0.2;

      return { score, salesCount, avgRating, reviewCount: reviews.length };
    } catch (error) {
      console.error('Error calculating popularity:', error);
      return { score: 0.5, salesCount: 0, avgRating: 3, reviewCount: 0 };
    }
  }

  /**
   * Recency: newer products score higher. Range: 0-1
   */
  getRecencyScore(createdAt) {
    const daysOld = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24);
    if (daysOld < 7) return 1.0;
    if (daysOld < 30) return 0.9;
    if (daysOld < 90) return 0.7;
    if (daysOld < 180) return 0.4;
    if (daysOld < 365) return 0.2;
    return 0;
  }

  /**
   * Ranks a set of already-fetched products against a search query.
   * Score = (0.4 x TF-IDF) + (0.3 x Popularity) + (0.3 x Recency)
   */
  async rankProducts(query, products) {
    try {
      if (!products || products.length === 0) return [];

      const tfidfScores = this.computeTfIdfScores(query, products);

      const ranked = await Promise.all(
        products.map(async (product) => {
          const tfidf = tfidfScores.get(product._id.toString()) || 0;
          const popularity = await this.getPopularityScore(product._id);
          const recency = this.getRecencyScore(product.createdAt);
          const finalScore = tfidf * 0.4 + popularity.score * 0.3 + recency * 0.3;

          return {
            product,
            scores: { tfidf, popularity: popularity.score, recency, final: finalScore },
            details: { sales: popularity.salesCount, rating: popularity.avgRating, reviews: popularity.reviewCount },
          };
        })
      );

      ranked.sort((a, b) => b.scores.final - a.scores.final);
      return ranked;
    } catch (error) {
      console.error('Error ranking results:', error);
      return products.map((product) => ({ product, scores: null, details: null }));
    }
  }

  /**
   * Autocomplete: product names starting with the given prefix.
   */
  async getSearchSuggestions(prefix, limit = 5) {
    try {
      if (!prefix || !prefix.trim()) return [];

      const escaped = prefix.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`^${escaped}`, 'i');

      const matches = await mongoose.model('Product')
        .find({ name: regex, isActive: true })
        .select('name')
        .limit(limit * 3)
        .lean();

      const uniqueNames = Array.from(new Set(matches.map((m) => m.name)));
      return uniqueNames.slice(0, limit);
    } catch (error) {
      console.error('Error getting suggestions:', error);
      return [];
    }
  }
}

module.exports = SearchRankingEngine;
