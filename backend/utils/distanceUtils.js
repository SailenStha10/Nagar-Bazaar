/**
 * Levenshtein distance: the minimum number of single-character edits
 * (insertions, deletions, substitutions) to turn str1 into str2.
 */
function levenshteinDistance(str1, str2) {
  const len1 = str1.length;
  const len2 = str2.length;

  const matrix = Array(len2 + 1)
    .fill(null)
    .map(() => Array(len1 + 1).fill(0));

  for (let i = 0; i <= len1; i++) matrix[0][i] = i;
  for (let j = 0; j <= len2; j++) matrix[j][0] = j;

  for (let j = 1; j <= len2; j++) {
    for (let i = 1; i <= len1; i++) {
      if (str1[i - 1] === str2[j - 1]) {
        matrix[j][i] = matrix[j - 1][i - 1];
      } else {
        matrix[j][i] = Math.min(
          matrix[j - 1][i - 1] + 1, // substitution
          matrix[j][i - 1] + 1, // insertion
          matrix[j - 1][i] + 1 // deletion
        );
      }
    }
  }

  return matrix[len2][len1];
}

/**
 * Similarity score derived from Levenshtein distance.
 * Range: 0-1 (1 = identical, 0 = completely different)
 */
function levenshteinSimilarity(str1, str2) {
  const a = str1.toLowerCase().trim();
  const b = str2.toLowerCase().trim();

  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;

  return 1 - levenshteinDistance(a, b) / maxLen;
}

module.exports = { levenshteinDistance, levenshteinSimilarity };
