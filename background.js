chrome.runtime.setUninstallURL("https://forms.gle/xEnYdqNVrZeMe6LZ8");

function createContextMenu() {
  console.log("Creating context menu...");

  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: "meinKontextEintrag",
      title: "Open PromptIn Side Panel",
      contexts: ["all"]
    }, () => {
      if (chrome.runtime.lastError) {
        console.error(chrome.runtime.lastError);
      } else {
        console.log("Context menu created!");
      }
    });
  });
}

chrome.runtime.onInstalled.addListener(createContextMenu);
chrome.runtime.onStartup.addListener(createContextMenu);

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "meinKontextEintrag") {
    if (!tab?.id) return;

    chrome.sidePanel.open({ tabId: tab.id }).catch((err) => {
      console.error("Failed to open side panel:", err);
    });
  }
});

// --- Message relay between side panel and content scripts ---
// The side panel cannot talk directly to content scripts.
// Background acts as the bridge.

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Side panel -> content script: user selected a prompt or workflow
  if (message.type === "PROMPT_SELECTED") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tabId = tabs[0]?.id;
      if (!tabId) {
        console.warn("No active tab found to relay PROMPT_SELECTED");
        return;
      }
      chrome.tabs.sendMessage(tabId, {
        type: "INSERT_PROMPT",
        promptContent: message.promptContent || "",
        promptId: message.promptId || null,
        category: message.category || "",
        workflowId: message.workflowId || null,
      }).catch((err) => {
        console.warn("Content script not reachable:", err.message);
      });
    });
    return false;
  }

  // Content script -> side panel: open panel with query context
  if (message.type === "OPEN_SIDEPANEL") {
    const tabId = sender.tab?.id;
    if (!tabId) return;

    chrome.sidePanel.open({ tabId }).then(() => {
      // Brief delay for panel to initialize before sending state
      setTimeout(() => {
        chrome.runtime.sendMessage({
          type: "SIDEPANEL_STATE",
          query: message.query || "",
          domain: message.domain || "",
        }).catch(() => {
          // Side panel may not have its listener ready yet, retry once
          setTimeout(() => {
            chrome.runtime.sendMessage({
              type: "SIDEPANEL_STATE",
              query: message.query || "",
              domain: message.domain || "",
            }).catch(() => {});
          }, 300);
        });
      }, 150);
    }).catch((err) => {
      console.error("Failed to open side panel:", err);
    });
    return true;
  }

  // Content script -> side panel: search query updated
  if (message.type === "SIDEPANEL_QUERY_UPDATE") {
    chrome.runtime.sendMessage({
      type: "SIDEPANEL_STATE",
      query: message.query || "",
      domain: message.domain || "",
    }).catch(() => {
      // Side panel not open, ignore
    });
    return false;
  }

  // Content script -> side panel: close/hide
  if (message.type === "CLOSE_SIDEPANEL") {
    chrome.runtime.sendMessage({ type: "SIDEPANEL_HIDE" }).catch(() => {});
    return false;
  }
});