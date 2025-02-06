chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.local.set({ copilotRequests: [] }, () => {
        console.log("Extension installed and storage initialized.");
    });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (request.type === "STORE_REQUEST") {
        // Retrieve existing requests from storage
        chrome.storage.local.get("copilotRequests", (data) => {
          const requests = data.copilotRequests || [];
          requests.push(request.newRequest);
    
          // Update storage
          chrome.storage.local.set({ copilotRequests: requests }, () => {
            console.log("New input stored:", request.newRequest);
          });
        });
    }
    sendResponse({ status: "ok" });
    return true;
});