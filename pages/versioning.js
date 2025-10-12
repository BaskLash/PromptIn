function showPromptVersions(promptId) {
  console.log("ID: " + promptId);
  chrome.storage.local.get(["prompts", "folders"], function (data) {
    if (chrome.runtime.lastError) {
      console.error("Error fetching data:", chrome.runtime.lastError);
      return;
    }

    const prompt = data.prompts?.[promptId];
    if (!prompt || !prompt.versions) {
      console.error(
        `Prompt with ID ${promptId} not found or no versions available`
      );
      return;
    }

    const modal = document.createElement("div");
    modal.className = "modal";

    const modalContent = document.createElement("div");
    modalContent.className = "modal-content";

    const modalHeader = document.createElement("div");
    modalHeader.className = "modal-header";

    const closeSpan = document.createElement("span");
    closeSpan.className = "close";
    closeSpan.innerHTML = "×";
    closeSpan.title = "Close modal";

    const headerTitle = document.createElement("h2");
    headerTitle.textContent = "Prompt version history";
    headerTitle.style.color = "white";
    headerTitle.title = "Shows all saved versions of this prompt";

    const modalBody = document.createElement("div");
    modalBody.className = "modal-body";

    const customDiffSection = document.createElement("div");
    customDiffSection.className = "custom-diff-section";
    customDiffSection.style.display = "none";

    const diffHeader = document.createElement("h3");
    diffHeader.className = "diff-header";
    diffHeader.textContent = "version comparison";
    diffHeader.title = "Compare two versions to see differences";
    customDiffSection.appendChild(diffHeader);

    const diffSelectWrapper = document.createElement("div");
    diffSelectWrapper.className = "diff-select-wrapper";

    const baseSelectLabel = document.createElement("label");
    baseSelectLabel.textContent = "Basic version:";
    baseSelectLabel.setAttribute("for", "baseSelect");
    diffSelectWrapper.appendChild(baseSelectLabel);

    const baseSelect = document.createElement("select");
    baseSelect.id = "baseSelect";
    baseSelect.className = "diff-select";
    const baseDefaultOption = document.createElement("option");
    baseDefaultOption.value = "";
    baseDefaultOption.textContent = "Select basic version";
    baseDefaultOption.disabled = true;
    baseDefaultOption.selected = true;
    baseSelect.appendChild(baseDefaultOption);

    const compareSelectLabel = document.createElement("label");
    compareSelectLabel.textContent = "Compare with:";
    compareSelectLabel.setAttribute("for", "compareSelect");
    diffSelectWrapper.appendChild(compareSelectLabel);

    const compareSelect = document.createElement("select");
    compareSelect.id = "compareSelect";
    compareSelect.className = "diff-select";
    const compareDefaultOption = document.createElement("option");
    compareDefaultOption.value = "";
    compareDefaultOption.textContent = "Select comparison version";
    compareDefaultOption.disabled = true;
    compareDefaultOption.selected = true;
    compareSelect.appendChild(compareDefaultOption);

    diffSelectWrapper.appendChild(baseSelect);
    diffSelectWrapper.appendChild(compareSelectLabel);
    diffSelectWrapper.appendChild(compareSelect);
    customDiffSection.appendChild(diffSelectWrapper);

    const customDiffContainer = document.createElement("div");
    customDiffContainer.className = "custom-diff-container";
    customDiffSection.appendChild(customDiffContainer);

    const timeline = document.createElement("div");
    timeline.className = "version-timeline";

    const versions = prompt.versions
      .slice()
      .sort((a, b) => b.timestamp - a.timestamp);

    versions.forEach((version, index) => {
      const optionBase = document.createElement("option");
      optionBase.value = version.versionId;
      optionBase.textContent = `Version ${versions.length - index} - ${new Date(
        version.timestamp
      ).toLocaleString()}`;
      baseSelect.appendChild(optionBase);

      const optionCompare = document.createElement("option");
      optionCompare.value = version.versionId;
      optionCompare.textContent = `Version ${
        versions.length - index
      } - ${new Date(version.timestamp).toLocaleString()}`;
      compareSelect.appendChild(optionCompare);

      const versionItem = document.createElement("div");
      versionItem.className = "version-item";
      if (index === 0) {
        versionItem.classList.add("current-version");
      }

      const versionHeader = document.createElement("div");
      versionHeader.className = "version-header";

      const versionTitleWrapper = document.createElement("div");
      versionTitleWrapper.className = "version-title-wrapper";

      const versionTitle = document.createElement("h3");
      versionTitle.textContent = `Version ${versions.length - index}`;
      versionTitleWrapper.appendChild(versionTitle);

      if (index === 0) {
        const currentBadge = document.createElement("span");
        currentBadge.className = "current-badge";
        currentBadge.textContent = "Current";
        currentBadge.title = "This is the current version of the prompt.";
        versionTitleWrapper.appendChild(currentBadge);
      }

      const versionDate = document.createElement("span");
      versionDate.className = "version-date";
      versionDate.textContent = new Date(version.timestamp).toLocaleString();
      versionDate.title = "Creation or modification date";

      versionHeader.appendChild(versionTitleWrapper);
      versionHeader.appendChild(versionDate);

      const versionContent = document.createElement("div");
      versionContent.className = "version-content";

      if (index === versions.length - 1) {
        const titleLabel = document.createElement("label");
        titleLabel.textContent = "Title:";
        const titleText = document.createElement("p");
        titleText.textContent = version.title || "Untitled";
        titleText.title = version.title || "No title specified";
        versionContent.appendChild(titleLabel);
        versionContent.appendChild(titleText);

        const descLabel = document.createElement("label");
        descLabel.textContent = "Description:";
        const descText = document.createElement("p");
        descText.textContent = version.description || "No description";
        descText.title = version.description || "No description provided";
        versionContent.appendChild(descLabel);
        versionContent.appendChild(descText);

        const contentLabel = document.createElement("label");
        contentLabel.textContent = "Contents:";
        const contentText = document.createElement("p");
        contentText.textContent = version.content || "No content";
        contentText.title = version.content || "No content specified";
        versionContent.appendChild(contentLabel);
        versionContent.appendChild(contentText);
      } else {
        const prevVersion = versions[index + 1];
        const diffWrapper = document.createElement("div");
        diffWrapper.className = "version-diff-wrapper";

        const diffTitle = document.createElement("h4");
        diffTitle.textContent = `Changes from version ${
          versions.length - (index + 1)
        } to version ${versions.length - index}`;
        diffWrapper.appendChild(diffTitle);

        const titleDiffWrapper = document.createElement("div");
        titleDiffWrapper.className = "diff-wrapper";
        const titleHeader = document.createElement("label");
        titleHeader.textContent = "Title changes:";
        titleDiffWrapper.appendChild(titleHeader);
        const titleDiffContainer = document.createElement("div");
        titleDiffContainer.className = "diff-output";
        const { diffCount: titleDiffCount } = computePromptDiff(
          version.title || "",
          prevVersion.title || "",
          titleDiffContainer
        );
        const titleSummary = document.createElement("div");
        titleSummary.className = "diff-summary";
        titleSummary.textContent = `Differences: ${titleDiffCount} words`;
        titleDiffWrapper.appendChild(titleDiffContainer);
        titleDiffWrapper.appendChild(titleSummary);
        diffWrapper.appendChild(titleDiffWrapper);

        const descDiffWrapper = document.createElement("div");
        descDiffWrapper.className = "diff-wrapper";
        const descHeader = document.createElement("label");
        descHeader.textContent = "Description Changes:";
        descDiffWrapper.appendChild(descHeader);
        const descDiffContainer = document.createElement("div");
        descDiffContainer.className = "diff-output";
        const { diffCount: descDiffCount } = computePromptDiff(
          version.description || "",
          prevVersion.description || "",
          descDiffContainer
        );
        const descSummary = document.createElement("div");
        descSummary.className = "diff-summary";
        descSummary.textContent = `Differences: ${descDiffCount} words`;
        descDiffWrapper.appendChild(descDiffContainer);
        descDiffWrapper.appendChild(descSummary);
        diffWrapper.appendChild(descDiffWrapper);

        const contentDiffWrapper = document.createElement("div");
        contentDiffWrapper.className = "diff-wrapper";
        const contentHeader = document.createElement("label");
        contentHeader.textContent = "Content changes:";
        contentDiffWrapper.appendChild(contentHeader);
        const contentDiffContainer = document.createElement("div");
        contentDiffContainer.className = "diff-output";
        const { diffCount: contentDiffCount } = computePromptDiff(
          version.content || "",
          prevVersion.content || "",
          contentDiffContainer
        );
        const contentSummary = document.createElement("div");
        contentSummary.className = "diff-summary";
        contentSummary.textContent = `Differences: ${contentDiffCount} words`;
        contentDiffWrapper.appendChild(contentDiffContainer);
        contentDiffWrapper.appendChild(contentSummary);
        diffWrapper.appendChild(contentDiffWrapper);

        versionContent.appendChild(diffWrapper);
      }

      const actions = document.createElement("div");
      actions.className = "version-actions";

      if (versions.length > 1) {
        if (index !== 0) {
          const restoreButton = document.createElement("button");
          restoreButton.textContent = "Restore";
          restoreButton.classList.add("action-btn");
          restoreButton.title = "Restore this version as the current version";
          restoreButton.addEventListener("click", () => {
            restoreVersion(promptId, version.versionId);
            modal.style.display = "none";
            document.body.removeChild(modal);
            document.head.removeChild(style);
          });
          actions.appendChild(restoreButton);
        }

        const compareButton = document.createElement("button");
        compareButton.textContent = "Compare";
        compareButton.classList.add("action-btn");
        compareButton.title = "Show differences from other versions";
        compareButton.addEventListener("click", () => {
          customDiffSection.style.display = "block";
          baseSelect.value = version.versionId;
          compareSelect.value = "";
          customDiffContainer.innerHTML = "";
          diffHeader.textContent = "version comparison";
          modalBody.scrollTop = 0;
        });
        actions.appendChild(compareButton);
      }

      versionContent.appendChild(actions);
      versionItem.appendChild(versionHeader);
      versionItem.appendChild(versionContent);
      timeline.appendChild(versionItem);
    });

    function updateCustomDiffView() {
      const baseVersionId = baseSelect.value;
      const compareVersionId = compareSelect.value;

      if (
        !baseVersionId ||
        !compareVersionId ||
        baseVersionId === compareVersionId
      ) {
        customDiffContainer.innerHTML = "";
        diffHeader.textContent = "version comparison";
        return;
      }

      const baseVersion = versions.find((v) => v.versionId === baseVersionId);
      const compareVersion = versions.find(
        (v) => v.versionId === compareVersionId
      );
      if (!baseVersion || !compareVersion) return;

      const baseVersionIndex = versions.findIndex(
        (v) => v.versionId === baseVersionId
      );
      const baseVersionNumber = versions.length - baseVersionIndex;
      const compareVersionIndex = versions.findIndex(
        (v) => v.versionId === compareVersionId
      );
      const compareVersionNumber = versions.length - compareVersionIndex;

      diffHeader.textContent = `Version ${baseVersionNumber} vs. Version ${compareVersionNumber}`;

      customDiffContainer.innerHTML = "";

      const titleWrapper = document.createElement("div");
      titleWrapper.className = "diff-wrapper";
      const titleHeader = document.createElement("h4");
      titleHeader.textContent = "Title changes";
      titleWrapper.appendChild(titleHeader);
      const titleDiffContainer = document.createElement("div");
      titleDiffContainer.className = "diff-output";
      const { diffCount: titleDiffCount } = computePromptDiff(
        baseVersion.title || "",
        compareVersion.title || "",
        titleDiffContainer
      );
      const titleSummary = document.createElement("div");
      titleSummary.className = "diff-summary";
      titleSummary.textContent = `Differences: ${titleDiffCount} words`;
      titleWrapper.appendChild(titleDiffContainer);
      titleWrapper.appendChild(titleSummary);
      customDiffContainer.appendChild(titleWrapper);

      const descWrapper = document.createElement("div");
      descWrapper.className = "diff-wrapper";
      const descHeader = document.createElement("h4");
      descHeader.textContent = "Description Changes";
      descWrapper.appendChild(descHeader);
      const descDiffContainer = document.createElement("div");
      descDiffContainer.className = "diff-output";
      const { diffCount: descDiffCount } = computePromptDiff(
        baseVersion.description || "",
        compareVersion.description || "",
        descDiffContainer
      );
      const descSummary = document.createElement("div");
      descSummary.className = "diff-summary";
      descSummary.textContent = `Differences: ${descDiffCount} words`;
      descWrapper.appendChild(descDiffContainer);
      descWrapper.appendChild(descSummary);
      customDiffContainer.appendChild(descWrapper);

      const contentWrapper = document.createElement("div");
      contentWrapper.className = "diff-wrapper";
      const contentHeader = document.createElement("h4");
      contentHeader.textContent = "Content changes";
      contentWrapper.appendChild(contentHeader);
      const contentDiffContainer = document.createElement("div");
      contentDiffContainer.className = "diff-output";
      const { diffCount: contentDiffCount } = computePromptDiff(
        baseVersion.content || "",
        compareVersion.content || "",
        contentDiffContainer
      );
      const contentSummary = document.createElement("div");
      contentSummary.className = "diff-summary";
      contentSummary.textContent = `Differences: ${contentDiffCount} words`;
      contentWrapper.appendChild(contentDiffContainer);
      contentWrapper.appendChild(contentSummary);
      customDiffContainer.appendChild(contentWrapper);
    }

    baseSelect.addEventListener("change", updateCustomDiffView);
    compareSelect.addEventListener("change", updateCustomDiffView);

    const exportContainer = document.createElement("div");
    exportContainer.style.marginTop = "15px";
    exportContainer.style.display = "flex";
    exportContainer.style.alignItems = "center";
    exportContainer.style.gap = "8px";

    const exportLabel = document.createElement("label");
    exportLabel.textContent = "Export History:";
    exportLabel.style.fontWeight = "600";
    exportLabel.style.color = "#34495e";

    const exportSelect = document.createElement("select");
    exportSelect.className = "action-btn";
    exportSelect.style.padding = "8px";
    exportSelect.style.borderRadius = "4px";
    exportSelect.style.border = "1px solid #ddd";
    exportSelect.title = "Select an export format for the version history";

    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.textContent = "Select Export Format";
    defaultOption.disabled = true;
    defaultOption.selected = true;
    exportSelect.appendChild(defaultOption);

    const exportOptions = [
      { value: "latex", text: "Export as PDF (LaTeX)" },
      { value: "json", text: "Export as JSON" },
      { value: "html", text: "Export as HTML" },
    ];

    exportOptions.forEach((opt) => {
      const option = document.createElement("option");
      option.value = opt.value;
      option.textContent = opt.text;
      exportSelect.appendChild(option);
    });

    exportSelect.addEventListener("change", () => {
      const format = exportSelect.value;
      if (format === "latex") {
        exportVersionHistory(prompt);
      } else if (format === "json") {
        exportVersionHistoryAsJson(prompt);
      } else if (format === "html") {
        exportVersionHistoryAsHtml(prompt);
      }
      exportSelect.value = "";
    });

    exportContainer.appendChild(exportLabel);
    exportContainer.appendChild(exportSelect);
    modalBody.appendChild(exportContainer);

    modalHeader.appendChild(closeSpan);
    modalHeader.appendChild(headerTitle);
    modalBody.appendChild(customDiffSection);
    modalBody.appendChild(timeline);

    modalContent.appendChild(modalHeader);
    modalContent.appendChild(modalBody);
    modal.appendChild(modalContent);

    const style = document.createElement("style");
    style.textContent = `
      .modal {
        display: block;
        position: fixed;
        z-index: 1000;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        overflow: auto;
        background: rgba(0, 0, 0, 0.7);
        backdrop-filter: blur(3px);
      }
      .modal-content {
        background: #fff;
        margin: 5% auto;
        padding: 0;
        width: 90%;
        max-width: 600px;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        overflow: hidden;
      }
      .modal-header {
        padding: 16px 24px;
        background: linear-gradient(135deg, #1e90ff, #4169e1);
        color: white;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .modal-header h2 {
        margin: 0;
        font-size: 1.6em;
        font-weight: 600;
      }
      .modal-body {
        padding: 24px;
        color: #2c3e50;
        max-height: 70vh;
        overflow-y: auto;
      }
      .version-timeline {
        position: relative;
        padding-left: 30px;
      }
      .version-item {
        position: relative;
        margin-bottom: 20px;
        padding: 16px;
        padding-left: 20px;
        border-left: 2px solid #1e90ff;
        background: #f8f9fa;
        border-radius: 4px;
        transition: background 0.2s ease;
      }
      .version-item.current-version {
        background: #e6f3ff;
        border-left-color: #28a745;
      }
      .version-item.current-version::before {
        background: #28a745;
      }
      .version-item::before {
        content: '';
        position: absolute;
        left: -9px;
        top: 16px;
        width: 16px;
        height: 16px;
        background: #1e90ff;
        border-radius: 50%;
        border: 2px solid #fff;
      }
      .version-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
      }
      .version-title-wrapper {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .version-header h3 {
        margin: 0;
        font-size: 1.2em;
        color: #1e90ff;
      }
      .current-badge {
        background: #28a745;
        color: white;
        padding: 4px 8px;
        border-radius: 12px;
        font-size: 0.8em;
        font-weight: 600;
      }
      .version-date {
        font-size: 0.9em;
        color: #666;
      }
      .version-content label {
        font-weight: 600;
        margin-top: 12px;
        margin-bottom: 6px;
        display: block;
        color: #34495e;
      }
      .version-content p {
        margin: 0 0 12px;
        padding: 8px;
        background: #fff;
        border-radius: 4px;
        word-break: break-word;
        font-size: 0.95em;
      }
      .version-actions {
        display: flex;
        gap: 12px;
        margin-top: 12px;
      }
      .action-btn {
        padding: 8px 16px;
        background: #1e90ff;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 0.9em;
        font-weight: 600;
        transition: background 0.2s ease;
      }
      .action-btn:hover {
        background: #4169e1;
      }
      .close {
        color: white;
        font-size: 28px;
        font-weight: bold;
        cursor: pointer;
        transition: transform 0.2s ease;
      }
      .close:hover,
      .close:focus {
        transform: scale(1.1);
      }
      .custom-diff-section {
        margin-bottom: 24px;
        padding: 16px;
        background: #f8f9fa;
        border-radius: 8px;
      }
      .diff-header {
        margin: 0 0 12px;
        color: #1e90ff;
        font-size: 1.3em;
        font-weight: 600;
        border-bottom: 2px solid #1e90ff;
        padding-bottom: 8px;
      }
      .diff-select-wrapper {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        margin-bottom: 12px;
        align-items: center;
      }
      .diff-select-wrapper label {
        font-weight: 600;
        margin-bottom: 8px;
        display: block;
        color: #34495e;
        flex: 0 0 120px;
      }
      .diff-select {
        width: 100%;
        padding: 10px;
        border: 1px solid #ddd;
        border-radius: 4px;
        background: #fff;
        color: #2c3e50;
        font-size: 0.95em;
        flex: 1;
        min-width: 0;
      }
      .custom-diff-container {
        max-height: 300px;
        overflow-y: auto;
        padding: 12px;
        background: #fff;
        border: 1px solid #ddd;
        border-radius: 4px;
      }
      .diff-wrapper {
        margin-bottom: 16px;
      }
      .diff-wrapper h4,
      .version-diff-wrapper h4 {
        margin: 0 0 8px;
        color: #34495e;
        font-size: 1.1em;
      }
      .diff-output {
        min-height: 50px;
        padding: 10px;
        background: #f8f9fa;
        border-radius: 4px;
        font-size: 13px;
        white-space: pre-wrap;
        line-height: 1.5;
      }
      .diff-summary {
        margin-top: 12px;
        font-weight: 600;
        color: #1e90ff;
        font-size: 0.9em;
      }
      .version-diff-wrapper {
        margin-top: 12px;
        padding: 12px;
        background: #fff;
        border: 1px solid #ddd;
        border-radius: 4px;
      }
      .diff-word.common {
        color: #2c3e50;
      }
      .diff-word.added {
        background: #e6ffed;
        color: #28a745;
      }
      .diff-word.removed {
        background: #ffe6e6;
        color: #dc3545;
      }
      .arrow {
        color: #1e90ff;
        font-weight: bold;
      }
      @media (max-width: 500px) {
        .modal-content {
          width: 95%;
          margin: 10% auto;
        }
        .modal-body {
          padding: 16px;
        }
        .version-item {
          padding: 12px;
        }
        .version-header {
          flex-direction: column;
          align-items: flex-start;
          gap: 8px;
        }
        .version-actions {
          flex-direction: column;
          gap: 8px;
        }
        .action-btn {
          width: 100%;
          text-align: center;
        }
        .action-btn select {
          background: #1e90ff;
          color: white;
          font-size: 0.9em;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s ease;
        }
        .action-btn select:hover {
          background: #4169e1;
        }
        .action-btn select option {
          background: #fff;
          color: #2c3e50;
        }
        .diff-select-wrapper {
          flex-direction: column;
        }
        .diff-select-wrapper label,
        .diff-select {
          flex: 1 1 100%;
        }
      }
    `;

    document.head.appendChild(style);
    document.body.appendChild(modal);

    closeSpan.onclick = function () {
      modal.style.display = "none";
      document.body.removeChild(modal);
      document.head.removeChild(style);
    };

    window.addEventListener(
      "click",
      function (event) {
        if (event.target === modal) {
          modal.style.display = "none";
          document.body.removeChild(modal);
          document.head.removeChild(style);
        }
      },
      { once: true }
    );
  });
}

function restoreVersion(promptId, versionId) {
  chrome.storage.local.get(["prompts", "folders"], function (data) {
    if (chrome.runtime.lastError) {
      console.error("Error fetching data:", chrome.runtime.lastError);
      alert("Error fetching prompt data.");
      return;
    }

    const prompts = data.prompts || {};
    const folders = data.folders || {};
    const prompt = prompts[promptId];
    if (!prompt || !prompt.versions) {
      console.error(`Prompt with ID ${promptId} not found or no versions available`);
      alert(`Prompt with ID ${promptId} not found or no versions available.`);
      return;
    }

    const version = prompt.versions.find((v) => v.versionId === versionId);
    if (!version) {
      console.error(`Version ${versionId} not found for prompt ${promptId}`);
      alert(`Version ${versionId} not found.`);
      return;
    }

    // Always save current state as a new version before restoring
    prompt.versions.push({
      versionId: `${Date.now()}_${generateUUID()}`,
      title: prompt.title,
      description: prompt.description || "",
      content: prompt.content,
      timestamp: Date.now(),
    });

    // Always log changes in metaChangeLog
    prompt.metaChangeLog.push({
      timestamp: Date.now(),
      changes: {
        title: { from: prompt.title, to: version.title },
        description: { from: prompt.description || "", to: version.description || "" },
        content: { from: prompt.content, to: version.content },
      },
    });

    // Update prompt to selected version
    prompt.title = version.title;
    prompt.description = version.description || "";
    prompt.content = version.content;
    prompt.updatedAt = Date.now();

    // Enforce version limit
    if (prompt.versions.length > 50) {
      prompt.versions.shift();
    }

    // Save updated prompts back to storage
    chrome.storage.local.set({ prompts, folders }, function () {
      if (chrome.runtime.lastError) {
        console.error("Error restoring version:", chrome.runtime.lastError);
        alert("Error restoring version.");
      } else {
        console.log(`Version ${versionId} restored for prompt ${promptId}`);
        alert("Version restored successfully!");
        // Update UI to reflect the restored version
        if (typeof updateTable === "function") {
          updateTable(prompt, folders);
        }
      }
    });
  });
}

// Utility function to generate UUID
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}
// Function to compute the diff between two texts (adapted from promptSaver's computePromptDiff)
function computePromptDiff(currentPrompt, selectedPrompt, diffContainer) {
  diffContainer.innerHTML = ""; // Clear the container

  // Normalize whitespace and split into words
  const words1 = (selectedPrompt || "")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter((w) => w);
  const words2 = (currentPrompt || "")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter((w) => w);

  // Compute diff
  let i = 0,
    j = 0;
  const unifiedDiff = [];
  let diffCount = 0; // Count differences

  while (i < words1.length || j < words2.length) {
    if (i < words1.length && j < words2.length && words1[i] === words2[j]) {
      unifiedDiff.push({ value: words1[i], type: "common" });
      i++;
      j++;
    } else {
      let foundMatch = false;
      for (let k = j; k < Math.min(words2.length, j + 3); k++) {
        for (let m = i; m < Math.min(words1.length, i + 3); m++) {
          if (words1[m] === words2[k]) {
            while (i < m) {
              unifiedDiff.push({ value: words1[i], type: "removed" });
              diffCount++;
              i++;
            }
            while (j < k) {
              unifiedDiff.push({ value: words2[j], type: "added" });
              diffCount++;
              j++;
            }
            unifiedDiff.push({ value: words1[m], type: "common" });
            i++;
            j++;
            foundMatch = true;
            break;
          }
        }
        if (foundMatch) break;
      }
      if (!foundMatch) {
        if (i < words1.length) {
          unifiedDiff.push({ value: words1[i], type: "removed" });
          diffCount++;
          i++;
        }
        if (j < words2.length) {
          unifiedDiff.push({ value: words2[j], type: "added" });
          diffCount++;
          j++;
        }
      }
    }
  }

  // Render diff
  let lastWasRemoved = false;
  unifiedDiff.forEach((part, index) => {
    const span = document.createElement("span");
    span.className = `diff-word ${part.type}`;
    span.textContent = part.value + " ";

    if (lastWasRemoved && part.type === "added") {
      const prevPart = unifiedDiff[index - 1];
      if (prevPart && prevPart.type === "removed") {
        const arrow = document.createElement("span");
        arrow.textContent = "→ ";
        arrow.className = "arrow";
        diffContainer.appendChild(arrow);
      }
    }

    diffContainer.appendChild(span);
    lastWasRemoved = part.type === "removed";
  });

  return { diffCount };
}
