function removeElement() {
  if (window.location.hostname === "github.com") {
    // Remove News Elements
    // Hide the right sidebar
    const sidebar = document.querySelector(".feed-right-sidebar");
    if (sidebar) {
      sidebar.style.display = "none";
    }

    // Hide the feed container for 'for-you' topic
    const feedContainer = document.querySelector(
      "feed-container[data-active-topic='for-you']"
    );
    if (feedContainer) {
      feedContainer.style.display = "none";
    }

    // Hide Footer container
    const footer = document.querySelector("footer");
    if (footer) {
      footer.style.display = "none";
    }
  }
  if (window.location.hostname === "perplexity.ai") {
    const allElements = document.querySelectorAll(".relative");

    const targetElements = Array.from(allElements).filter((el) => {
      return (
        Array.from(el.classList).some((cls) => cls.startsWith("col-span-")) &&
        Array.from(el.classList).some((cls) => cls.startsWith("row-span-"))
      );
    });

    targetElements.forEach((el) => el.remove()); // or do whatever you need
  }
}
