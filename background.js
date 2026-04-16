chrome.runtime.setUninstallURL("https://forms.gle/xEnYdqNVrZeMe6LZ8");

function createContextMenu() {
  console.log("Creating context menu...");

  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: "meinKontextEintrag",
      title: "Meine Erweiterung öffnen",
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