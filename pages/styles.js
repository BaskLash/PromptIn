// Inject CSS styles dynamically
function injectStyles() {
  const style = document.createElement("style");
  style.textContent = `
    /* Highlight for top search results */
    .highlight {
      background-color: #e6f3ff;
      border-left: 3px solid #1e90ff;
    }

    /* Ensure accordion items and folder list items are styled appropriately */
    .accordion-content li.highlight,
    .folder-list li.highlight {
      padding-left: 5px;
    }
    /* Bestehende Stile */
    .modal {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 2000;
    }
    .execute-workflow-step {
      margin-bottom: 15px;
      padding: 10px;
      border: 1px solid #ddd;
      border-radius: 4px;
    }
    .execute-workflow-step label {
      font-weight: bold;
      display: block;
      margin-bottom: 5px;
    }
    .execute-workflow-step textarea {
      width: 100%;
      padding: 8px;
      margin-bottom: 10px;
      border: 1px solid #ddd;
      border-radius: 4px;
      min-height: 80px;
    }
    .execute-workflow-step button {
      margin-right: 10px;
    }
    .prompt-actions {
      display: flex;
      align-items: center;
    }
    .prompt-type {
      display: flex;
      gap: 15px;
      margin-bottom: 15px;
    }
    .prompt-type label {
      display: flex;
      align-items: center;
      gap: 5px;
      font-weight: normal;
    }
    .action-btn {
      background: #1e90ff;
      color: white;
      border: none;
      padding: 8px 12px;
      border-radius: 4px;
      cursor: pointer;
      margin-right: 8px;
    }
    .action-btn:hover {
      background: #187bcd;
    }
    .menu-btn {
      font-weight: bold;
    }
    .dropdown-menu {
      display: none;
      position: absolute;
      background: #fff;
      border: 1px solid #ddd;
      border-radius: 4px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      z-index: 1000;
      min-width: 150px;
      right: 0;
    }
    .dropdown-item {
      padding: 8px 12px;
      cursor: pointer;
      font-size: 0.9em;
      color: #333;
    }
    .dropdown-item:hover {
      background: #f0f0f0;
    }
    .details-sidebar {
      position: fixed;
      right: 0;
      top: 0;
      width: 350px;
      height: 100%;
      background: #fff;
      border-left: 1px solid #ddd;
      box-shadow: -2px 0 8px rgba(0,0,0,0.1);
      transform: translateX(100%);
      transition: transform 0.3s ease;
      z-index: 1000;
      overflow-y: auto;
    }
    .details-sidebar.open {
      transform: translateX(0);
    }
    .sidebar-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 15px;
      border-bottom: 1px solid #ddd;
    }
    .sidebar-header h2 {
      margin: 0;
      font-size: 1.5em;
    }
    .close-sidebar {
      cursor: pointer;
      font-size: 24px;
      color: #aaa;
    }
    .close-sidebar:hover {
      color: #000;
    }
    .sidebar-content {
      padding: 20px;
    }
    .sidebar-content label {
      display: block;
      margin-bottom: 5px;
      font-weight: bold;
    }
    .sidebar-content input,
    .sidebar-content textarea,
    .sidebar-content select {
      width: 100%;
      padding: 8px;
      margin-bottom: 15px;
      border: 1px solid #ddd;
      border-radius: 4px;
    }
    .sidebar-content textarea {
      min-height: 100px;
    }
    .sidebar-content .step-list {
      list-style: none;
      padding: 0;
    }
    .sidebar-content .step-item {
      margin-bottom: 10px;
      padding: 10px;
      border: 1px solid #ddd;
      border-radius: 4px;
    }
    .edit-btn {
      background: #28a745;
      color: white;
      border: none;
      padding: 8px 12px;
      border-radius: 4px;
      cursor: pointer;
    }
    .edit-btn:hover {
      background: #218838;
    }
    .save-btn {
      background: #28a745;
      color: white;
      border: none;
      padding: 8px 12px;
      border-radius: 4px;
      cursor: pointer;
      margin-right: 10px;
    }
    .save-btn:hover {
      background: #218838;
    }
    .cancel-btn {
      background: #dc3545;
      color: white;
      border: none;
      padding: 8px 12px;
      border-radius: 4px;
      cursor: pointer;
    }
    .cancel-btn:hover {
      background: #c82333;
    }
    .modal {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 2000;
    }
    .modal-content {
      background: #fff;
      padding: 20px;
      border-radius: 8px;
      width: 100%;
      max-width: 500px;
      max-height: 80vh;
      overflow-y: auto;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
      position: relative;
    }
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid var(--border-color);
      padding-bottom: 10px;
      margin-bottom: 15px;
    }
    .modal-header h2 {
      margin: 0;
      font-size: 1.5em;
      color: var(--primary-color);
    }
    .modal .close {
      cursor: pointer;
      font-size: 24px;
      color: #aaa;
      transition: color 0.2s ease;
    }
    .modal .close:hover {
      color: var(--primary-color);
    }
    .modal-body {
      padding: 10px 0;
    }
    .modal-body label {
      display: block;
      margin-bottom: 5px;
      font-weight: bold;
      color: var(--primary-color);
    }
    .modal-body input,
    .modal-body textarea,
    .modal-body select {
      width: 100%;
      padding: 8px;
      margin-bottom: 15px;
      border: 1px solid var(--border-color);
      border-radius: 4px;
      font-size: 14px;
    }
    .modal-body textarea {
      min-height: 100px;
      resize: vertical;
    }
    .modal-body select[multiple] {
      height: 120px;
      padding: 5px;
    }
    .modal-body .checkbox-group {
      max-height: 150px;
      overflow-y: auto;
      border: 1px solid var(--border-color);
      border-radius: 4px;
      padding: 10px;
      margin-bottom: 15px;
    }
    .modal-body .checkbox-group label {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
      font-weight: normal;
      cursor: pointer;
    }
    .modal-body .checkbox-group input[type="checkbox"] {
      width: auto;
      margin: 0;
    }
    .modal-body .action-btn {
      background: #1e90ff;
      color: white;
      border: none;
      padding: 10px 16px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      margin-top: 10px;
      display: block;
      width: 100%;
    }
    .modal-body .action-btn:hover {
      background: #187bcd;
    }
    .sidebar-content .checkbox-group {
      max-height: 150px;
      overflow-y: auto;
      border: 1px solid var(--border-color);
      border-radius: 4px;
      padding: 10px;
      margin-bottom: 15px;
    }
    .sidebar-content .checkbox-group label {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
      font-weight: normal;
      cursor: pointer;
    }
    .sidebar-content .checkbox-group input[type="checkbox"] {
      width: auto;
      margin: 0;
    }
    @media (max-width: 600px) {
      .modal-content {
        width: 90%;
        max-height: 90vh;
      }
      .modal-body select[multiple] {
        height: 80px;
      }
      .modal-body .checkbox-group {
        max-height: 100px;
      }
      .sidebar-content .checkbox-group {
        max-height: 100px;
      }
    }
    .dropdown-menu {
      max-height: 300px;
      overflow-y: auto;
    }
    .step-list pre {
      white-space: pre-wrap;
      word-break: break-word;
    }
  `;
  document.head.appendChild(style);
}
