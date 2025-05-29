document.addEventListener("DOMContentLoaded", () => {
  const searchInput = document.getElementById("search");
  const faqList = document.getElementById("faq-list");
  const faqItems = Array.from(document.querySelectorAll(".faq-item"));
  const noResults = document.createElement("p");
  noResults.textContent = "No exact matches found. Showing related results.";
  noResults.style.color = "#4b5563";
  noResults.style.display = "none";
  faqList.appendChild(noResults);

  // Toggle FAQ answers
  document.querySelectorAll(".faq-question").forEach((button) => {
    button.addEventListener("click", () => {
      const isExpanded = button.getAttribute("aria-expanded") === "true";
      button.setAttribute("aria-expanded", !isExpanded);
      const answer = button.nextElementSibling;
      answer.setAttribute("aria-hidden", isExpanded);
    });
  });

  // Levenshtein distance function for fuzzy matching
  function levenshtein(a, b) {
    const matrix = [];
    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }
    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    return matrix[b.length][a.length];
  }

  // Search functionality with improved fuzzy matching and sorting
  searchInput.addEventListener("input", () => {
    const searchTerm = searchInput.value.toLowerCase().trim();
    const results = [];

    faqItems.forEach((item) => {
      const question = item
        .querySelector(".faq-question")
        .textContent.toLowerCase();
      const answer = item
        .querySelector(".faq-answer")
        .textContent.toLowerCase();
      const tags = item.getAttribute("data-tags").toLowerCase();

      // Split search term into words for more flexible matching
      const searchWords = searchTerm
        .split(/\s+/)
        .filter((word) => word.length > 2); // Ignore short words like "and"

      // Calculate relevance score
      let score = 0;
      if (searchTerm) {
        // Exact matches for individual search words
        let exactMatches = 0;
        searchWords.forEach((word) => {
          if (question.includes(word)) {
            exactMatches += 50; // High weight for question matches
          }
          if (answer.includes(word)) {
            exactMatches += 40; // Slightly lower weight for answer matches
          }
          if (tags.includes(word)) {
            exactMatches += 20; // Lower weight for tag matches
          }
        });

        // If no exact matches, use Levenshtein distance for fuzzy matching
        if (exactMatches === 0) {
          const questionWords = question.split(/\s+/);
          const answerWords = answer.split(/\s+/);
          const tagWords = tags.split(",");

          let totalDistance = 0;
          let matches = 0;
          searchWords.forEach((searchWord) => {
            let minDistance = Infinity;
            questionWords.forEach((word) => {
              if (word.length > 2) {
                minDistance = Math.min(
                  minDistance,
                  levenshtein(searchWord, word)
                );
              }
            });
            answerWords.forEach((word) => {
              if (word.length > 2) {
                minDistance = Math.min(
                  minDistance,
                  levenshtein(searchWord, word)
                );
              }
            });
            tagWords.forEach((word) => {
              if (word.length > 2) {
                minDistance = Math.min(
                  minDistance,
                  levenshtein(searchWord, word)
                );
              }
            });
            if (minDistance !== Infinity) {
              totalDistance += minDistance;
              matches++;
            }
          });

          // Calculate fuzzy score: lower distance means higher score
          if (matches > 0) {
            score = Math.max(0, 80 - (totalDistance / matches) * 10);
          }
        } else {
          score = exactMatches;
        }
      } else {
        // No search term: show all with neutral score
        score = 50;
      }

      results.push({ item, score });
    });

    // Sort results by score (descending) and re-append to DOM
    results.sort(
      (a, b) =>
        b.score - a.score || faqItems.indexOf(a.item) - faqItems.indexOf(b.item)
    ); // Stable sort
    faqList.innerHTML = "";
    faqList.appendChild(noResults);
    results.forEach((result) => {
      faqList.appendChild(result.item);
    });

    // Show all results, with "no exact matches" message if no close matches
    const hasCloseMatches = results.some((result) => result.score >= 80);
    noResults.style.display = searchTerm && !hasCloseMatches ? "block" : "none";
  });
});
