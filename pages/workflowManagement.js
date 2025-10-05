function initializeWorkflows() {
  const workflowView = document.getElementById("workflow-view");
  const workflowContainer = document.getElementById("workflow-container");
  const addWorkflowBtn = document.getElementById("addWorkflowBtn");

  // Inject styles
  const style = document.createElement("style");
  style.textContent = `
    #workflow-view {
      padding: 20px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    .main-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 30px;
      animation: fadeIn 0.5s ease-in;
    }
    .main-header h1 {
      font-size: 28px;
      color: #1a1a1a;
      margin: 0;
    }
    #addWorkflowBtn {
      background: #4a90e2;
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 8px;
      cursor: pointer;
      font-size: 16px;
      transition: transform 0.2s ease, background 0.3s ease;
    }
    #addWorkflowBtn:hover {
      background: #357abd;
      transform: scale(1.05);
    }
    #addWorkflowBtn:active {
      transform: scale(0.95);
    }
    .workflow-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 20px;
      padding: 10px;
    }
    .workflow-card {
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      padding: 20px;
      transition: transform 0.3s ease, box-shadow 0.3s ease;
      position: relative;
      overflow: hidden;
      animation: slideUp 0.5s ease-out;
    }
    .workflow-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
    }
    .workflow-card h3 {
      margin: 0 0 10px;
      font-size: 20px;
      color: #333;
    }
      .workflow-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 4px;
      background: linear-gradient(90deg, #4a90e2, #28a745);
      transition: height 0.3s ease;
    }
    .workflow-card:hover::before {
      height: 8px;
    }
    .workflow-info {
      font-size: 14px;
      color: #666;
      margin-bottom: 15px;
    }
    .workflow-info span {
      display: block;
      margin-bottom: 5px;
    }
    .workflow-actions {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    }
    .action-btn {
      padding: 8px 12px;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      transition: background 0.2s ease, transform 0.2s ease;
    }
    .execute-btn {
      background: #28a745;
      color: white;
    }
    .execute-btn:hover {
      background: #218838;
    }
    .edit-btn {
      background: #4a90e2;
      color: white;
    }
    .edit-btn:hover {
      background: #357abd;
    }
    .copy-btn {
      background: #6c757d;
      color: white;
    }
    .copy-btn:hover {
      background: #5a6268;
    }
    .export-btn {
      background: #17a2b8;
      color: white;
    }
    .export-btn:hover {
      background: #138496;
    }
    .delete-btn {
      background: #dc3545;
      color: white;
    }
    .delete-btn:hover {
      background: #c82333;
    }
    .action-btn:active {
      transform: scale(0.95);
    }
    .no-workflows {
      text-align: center;
      color: #666;
      font-size: 18px;
      margin-top: 50px;
      animation: fadeIn 0.5s ease-in;
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
      z-index: 1000;
      animation: fadeIn 0.3s ease-in;
    }
    .modal-content {
      background: white;
      border-radius: 12px;
      width: 90%;
      max-width: 600px;
      max-height: 80vh;
      overflow-y: auto;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
      animation: slideUpModal 0.3s ease-out;
      padding: 20px;
    }
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }
    .modal-header h2 {
      margin: 0;
      font-size: 24px;
      color: #1a1a1a;
    }
    .modal-header .close {
      cursor: pointer;
      font-size: 24px;
      color: #666;
      transition: color 0.2s ease;
    }
    .modal-header .close:hover {
      color: #333;
    }
    .modal-body {
      display: flex;
      flex-direction: column;
      gap: 15px;
    }
    .modal-body label {
      font-size: 14px;
      color: #333;
      margin-bottom: 5px;
      display: block;
    }
    .modal-body input, .modal-body select, .modal-body textarea {
      width: 100%;
      padding: 10px;
      border: 1px solid #ddd;
      border-radius: 6px;
      font-size: 14px;
      transition: border-color 0.2s ease;
    }
    .modal-body input:focus, .modal-body select:focus, .modal-body textarea:focus {
      border-color: #4a90e2;
      outline: none;
    }
    .modal-body textarea {
      resize: vertical;
      min-height: 100px;
    }
    .step-item {
      background: #f9f9f9;
      padding: 15px;
      border-radius: 8px;
      margin-bottom: 15px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
      transition: transform 0.2s ease;
    }
    .step-item:hover {
      transform: translateY(-2px);
    }
    .prompt-type-container {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 15px;
    }
    .prompt-type {
      display: flex;
      gap: 15px;
      align-items: center;
    }
    .radio-group {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .radio-group label {
      font-size: 14px;
      white-space: nowrap;
    }
    .checkbox-group {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .prompt-content-display {
      background: #f0f0f0;
      border: 1px solid #ddd;
      border-radius: 6px;
      padding: 10px;
      font-size: 14px;
      color: #333;
      resize: none;
    }
    .dynamic-notice {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 14px;
      color: #555;
      margin-top: 10px;
    }
    .dynamic-notice button {
      padding: 5px 10px;
      font-size: 14px;
      background: #4a90e2;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
    }
    .dynamic-notice button:hover {
      background: #357abd;
    }
    .save-btn, .cancel-btn, #add-step {
      padding: 10px 20px;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      transition: background 0.2s ease, transform 0.2s ease;
    }
    .save-btn {
      background: #28a745;
      color: white;
    }
    .save-btn:hover {
      background: #218838;
    }
    .cancel-btn {
      background: #6c757d;
      color: white;
    }
    .cancel-btn:hover {
      background: #5a6268;
    }
    #add-step {
      background: #4a90e2;
      color: white;
    }
    #add-step:hover {
      background: #357abd;
    }
    .remove-step {
      background: #dc3545;
      color: white;
      padding: 8px 12px;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      transition: background 0.2s ease;
    }
    .remove-step:hover {
      background: #c82333;
    }
    .remove-step:disabled {
      background: #e0e0e0;
      cursor: not-allowed;
      opacity: 0.5;
    }
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes slideUp {
      from { transform: translateY(20px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
    @keyframes slideUpModal {
      from { transform: translateY(50px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
  `;
  document.head.appendChild(style);

  // Render workflows
  function renderWorkflows() {
    chrome.storage.local.get(["workflows"], (data) => {
      workflowContainer.innerHTML = "";
      const workflows = data.workflows || {};
      const workflowList = Object.entries(workflows).map(([id, workflow]) => ({
        id,
        ...workflow,
      }));

      if (workflowList.length === 0) {
        const noWorkflows = document.createElement("div");
        noWorkflows.className = "no-workflows";
        noWorkflows.textContent =
          "No workflows available. Create one to get started!";
        workflowContainer.appendChild(noWorkflows);
        return;
      }

      const grid = document.createElement("div");
      grid.className = "workflow-grid";

      workflowList.forEach((workflow, index) => {
        const card = document.createElement("div");
        card.className = "workflow-card";
        card.style.animationDelay = `${index * 0.1}s`;

        const title = document.createElement("h3");
        title.textContent = workflow.name || "Untitled Workflow";

        const info = document.createElement("div");
        info.className = "workflow-info";
        info.innerHTML = `
  <span>Steps: ${
    Array.isArray(workflow.steps) ? workflow.steps.length : 0
  }</span>
  <span>Created: ${
    workflow.createdAt
      ? new Date(workflow.createdAt).toLocaleDateString()
      : "Unknown"
  }</span>
  <span>Last Used: ${
    workflow.lastUsed
      ? new Date(workflow.lastUsed).toLocaleDateString()
      : "Never"
  }</span>
`;

        const actions = document.createElement("div");
        actions.className = "workflow-actions";

        // const executeBtn = document.createElement("button");
        // executeBtn.className = "action-btn execute-btn";
        // executeBtn.textContent = "Execute";
        // executeBtn.onclick = () => executeWorkflow(workflow.id);

        const editBtn = document.createElement("button");
        editBtn.className = "action-btn edit-btn";
        editBtn.textContent = "Edit";
        editBtn.onclick = () => showEditWorkflowModal(workflow.id, workflow);

        const copyBtn = document.createElement("button");
        copyBtn.className = "action-btn copy-btn";
        copyBtn.textContent = "Copy";
        copyBtn.onclick = () => copyWorkflow(workflow.id);

        const exportBtn = document.createElement("button");
        exportBtn.className = "action-btn export-btn";
        exportBtn.textContent = "Export";
        exportBtn.onclick = () => exportWorkflow(workflow, workflow.id);

        const deleteBtn = document.createElement("button");
        deleteBtn.className = "action-btn delete-btn";
        deleteBtn.textContent = "Delete";
        deleteBtn.onclick = () =>
          deleteWorkflow(workflow.id, card, workflowList);

        actions.append(editBtn, copyBtn, exportBtn, deleteBtn);
        card.append(title, info, actions);
        grid.appendChild(card);
      });

      workflowContainer.appendChild(grid);
    });
  }

  // New function to show edit workflow modal
  function showEditWorkflowModal(workflowId, workflow) {
    const aiOptions = {
      grok: "Grok",
      gemini: "Gemini",
      chatgpt: "ChatGPT",
      claude: "Claude",
      blackbox: "BlackBox",
      githubCopilot: "GitHub Copilot",
      microsoftCopilot: "Microsoft Copilot",
      mistral: "Mistral",
      duckduckgo: "DuckDuckGo",
      perplexity: "Perplexity",
      deepseek: "DeepSeek",
      deepai: "Deepai",
      qwenAi: "Qwen AI",
    };

    const aiModelOptions = Object.entries(aiOptions)
      .map(([key, name]) => `<option value="${key}">${name}</option>`)
      .join("");

    const modal = document.createElement("div");
    modal.className = "modal";

    const modalContent = document.createElement("div");
    modalContent.className = "modal-content";

    const modalHeader = document.createElement("div");
    modalHeader.className = "modal-header";

    const closeSpan = document.createElement("span");
    closeSpan.className = "close";
    closeSpan.innerHTML = "×";

    const headerTitle = document.createElement("h2");
    headerTitle.textContent = `Edit Workflow: ${workflow.name}`;

    const modalBody = document.createElement("div");
    modalBody.className = "modal-body";

    modalBody.innerHTML = `
      <label>Name</label>
      <input type="text" id="edit-name" value="${
        workflow.name || ""
      }" placeholder="Enter workflow name" required>
      <div id="edit-steps"></div>
      <button class="action-btn" id="add-step">Add Step</button>
      <div style="display: flex; gap: 10px; margin-top: 20px;">
        <button class="save-btn">Save</button>
        <button class="cancel-btn">Cancel</button>
      </div>
    `;

    const stepsContainer = modalBody.querySelector("#edit-steps");
    let steps = workflow.steps.map((s) => ({
      ...s,
      staticState: { promptId: s.promptId || null, content: s.content || "" },
      dynamicState: {
        promptId: s.promptId || null,
        content: s.content || "",
        parameters: s.parameters || {},
      },
      customState: {
        customPrompt: s.customPrompt || "",
        parameters: s.parameters || {},
      },
    }));

    const lastStepDefaults = {
      aiModel: "",
      promptType: "static",
      isDynamic: false,
      useCustomPrompt: false,
      openInNewTab: false,
      customPrompt: "",
      promptId: null,
      parameters: {},
      staticState: { promptId: null, content: "" },
      dynamicState: { promptId: null, content: "", parameters: {} },
      customState: { customPrompt: "", parameters: {} },
    };

    const updateRemoveButtons = () => {
      const removeBtns = stepsContainer.querySelectorAll(".remove-step");
      removeBtns.forEach((btn) => {
        btn.disabled = steps.length === 1;
        btn.style.opacity = steps.length === 1 ? "0.5" : "1";
        btn.style.cursor = steps.length === 1 ? "not-allowed" : "pointer";
      });
    };

    const addStepToEdit = (rawStepData, index, container, stepsArray) => {
      const stepData = {
        title: "",
        promptId: null,
        customPrompt: "",
        parameters: {},
        ...lastStepDefaults,
        ...rawStepData,
      };

      const isDynamic =
        stepData.promptType === "dynamic" ||
        stepData.isDynamic ||
        (stepData.useCustomPrompt && /\{[^}]+\}/.test(stepData.customPrompt));
      const useCustomPrompt =
        stepData.promptType === "custom" || stepData.useCustomPrompt;

      const stepLabel = document.createElement("h2");
      stepLabel.textContent = `Step ${index + 1}:`;
      stepLabel.style.margin = "10px 0 5px";
      container.appendChild(stepLabel);

      const stepDiv = document.createElement("div");
      stepDiv.className = "step-item";
      stepDiv.dataset.stepIndex = index;

      stepDiv.innerHTML = `
        <label>Step Title</label>
        <input type="text" class="step-title" value="${
          stepData.title || ""
        }" placeholder="Enter step title">
        <label>AI Model</label>
        <select class="step-ai-model" required>
          <option value="" disabled ${
            !stepData.aiModel ? "selected" : ""
          }>Choose a model</option>
          ${aiModelOptions}
        </select>
        <label for="new-tab-${index}">Open in New Tab</label>
        <div class="checkbox-group">
          <input type="checkbox" id="new-tab-${index}" class="step-new-tab" ${
        stepData.openInNewTab ? "checked" : ""
      }>
          <label for="new-tab-${index}">Open AI in new tab</label>
        </div>
        <div class="prompt-type-container">
          <div>
            <label>Prompt Type</label>
            <div class="prompt-type">
              <div class="radio-group">
                <input type="radio" id="static-${index}" name="prompt-type-${index}" value="static" ${
        !isDynamic && !useCustomPrompt ? "checked" : ""
      }>
                <label for="static-${index}">Static</label>
              </div>
              <div class="radio-group">
                <input type="radio" id="dynamic-${index}" name="prompt-type-${index}" value="dynamic" ${
        isDynamic && !useCustomPrompt ? "checked" : ""
      }>
                <label for="dynamic-${index}">Dynamic</label>
              </div>
              <div class="radio-group">
                <input type="radio" id="custom-${index}" name="prompt-type-${index}" value="custom" ${
        useCustomPrompt ? "checked" : ""
      }>
                <label for="custom-${index}">Use custom prompt</label>
              </div>
            </div>
          </div>
        </div>
        <label class="prompt-label" style="display: ${
          useCustomPrompt ? "none" : "block"
        }">Select Prompt</label>
        <select class="step-prompt" style="display: ${
          useCustomPrompt ? "none" : "block"
        }"></select>
        <label class="prompt-content-label" style="display: ${
          useCustomPrompt ? "none" : "block"
        }">Prompt Content</label>
        <textarea class="prompt-content-display" readonly style="display: ${
          useCustomPrompt ? "none" : "block"
        }" placeholder="Prompt content will appear here">${
        stepData.content || ""
      }</textarea>
        <label class="custom-prompt-label" style="display: ${
          useCustomPrompt ? "block" : "none"
        }">Custom Prompt</label>
        <textarea class="step-custom-prompt-text" style="display: ${
          useCustomPrompt ? "block" : "none"
        }" placeholder="Enter custom prompt">${
        stepData.customPrompt || ""
      }</textarea>
        <div class="dynamic-notice" style="display: ${
          useCustomPrompt ? "block" : "none"
        }">
          <span>Any value written in the format {{variable}} will be treated as a dynamic parameter and used during workflow execution.</span>
          <button type="button" class="action-btn" id="insert-variable-btn-${index}">{{Set Variable}}</button>
        </div>
        <label class="params-label" style="display: ${
          isDynamic && !useCustomPrompt ? "block" : "none"
        }">Parameters (JSON)</label>
        <textarea class="step-params" readonly style="display: ${
          isDynamic && !useCustomPrompt ? "block" : "none"
        }" placeholder='{"key": "value"}'>${JSON.stringify(
        stepData.parameters || {},
        null,
        2
      )}</textarea>
        <button class="action-btn remove-step">Remove Step</button>
      `;

      container.appendChild(stepDiv);

      const aiModelSelect = stepDiv.querySelector(".step-ai-model");
      const newTabCheckbox = stepDiv.querySelector(".step-new-tab");
      const radioButtons = stepDiv.querySelectorAll(
        `input[name="prompt-type-${index}"]`
      );
      const promptSelect = stepDiv.querySelector(".step-prompt");
      const promptContentDisplay = stepDiv.querySelector(
        ".prompt-content-display"
      );
      const paramsTextarea = stepDiv.querySelector(".step-params");
      const paramsLabel = stepDiv.querySelector(".params-label");
      const customPromptTextarea = stepDiv.querySelector(
        ".step-custom-prompt-text"
      );
      const customPromptLabel = stepDiv.querySelector(".custom-prompt-label");
      const promptLabel = stepDiv.querySelector(".prompt-label");
      const promptContentLabel = stepDiv.querySelector(".prompt-content-label");
      const insertVariableBtn = stepDiv.querySelector(
        `#insert-variable-btn-${index}`
      );
      const dynamicNotice = stepDiv.querySelector(".dynamic-notice");

      if (stepData.aiModel) {
        aiModelSelect.value = stepData.aiModel;
      }

      const loadPrompts = (type) => {
        chrome.storage.local.get(["prompts"], (data) => {
          const allPrompts = data.prompts || {};
          promptSelect.innerHTML = "";
          const defaultOption = document.createElement("option");
          defaultOption.value = "";
          defaultOption.textContent = "Select a prompt";
          defaultOption.disabled = true;
          defaultOption.selected =
            !stepData[type === "static" ? "staticState" : "dynamicState"]
              .promptId;
          promptSelect.appendChild(defaultOption);

          Object.entries(allPrompts).forEach(([promptId, prompt]) => {
            const isDynamicPrompt =
              typeof prompt.content === "string" &&
              /\{\{[^}]+\}\}/.test(prompt.content);
            const matchesType =
              (type === "dynamic" && isDynamicPrompt) ||
              (type === "static" && !isDynamicPrompt);
            if (matchesType) {
              const option = document.createElement("option");
              option.value = promptId;
              option.textContent = prompt.title || "Untitled Prompt";
              if (
                stepData[type === "static" ? "staticState" : "dynamicState"]
                  .promptId === promptId
              ) {
                option.selected = true;
              }
              promptSelect.appendChild(option);
            }
          });

          const selectedId =
            stepData[type === "static" ? "staticState" : "dynamicState"]
              .promptId;
          if (selectedId) {
            promptSelect.value = selectedId;
            promptSelect.dispatchEvent(new Event("change"));
          }
        });
      };

      if (useCustomPrompt) {
        customPromptTextarea.value = stepData.customState.customPrompt;
        promptSelect.style.display = "none";
        promptLabel.style.display = "none";
        promptContentDisplay.style.display = "none";
        promptContentLabel.style.display = "none";
      } else {
        promptContentDisplay.value =
          stepData[isDynamic ? "dynamicState" : "staticState"].content;
        paramsTextarea.value = JSON.stringify(
          stepData.dynamicState.parameters,
          null,
          2
        );
        loadPrompts(isDynamic ? "dynamic" : "static");
      }

      radioButtons.forEach((radio) => {
        radio.addEventListener("change", () => {
          const pt = radio.value;
          const custom = pt === "custom";
          const dynamic = pt === "dynamic";
          promptSelect.style.display = custom ? "none" : "block";
          promptLabel.style.display = custom ? "none" : "block";
          promptContentDisplay.style.display = custom ? "none" : "block";
          promptContentLabel.style.display = custom ? "none" : "block";
          customPromptTextarea.style.display = custom ? "block" : "none";
          customPromptLabel.style.display = custom ? "block" : "none";
          dynamicNotice.style.display = custom ? "block" : "none";
          paramsLabel.style.display = dynamic && !custom ? "block" : "none";
          paramsTextarea.style.display = dynamic && !custom ? "block" : "none";

          if (custom) {
            customPromptTextarea.value = stepData.customState.customPrompt;
            paramsTextarea.value = JSON.stringify(
              stepData.customState.parameters,
              null,
              2
            );
          } else if (dynamic) {
            promptContentDisplay.value = stepData.dynamicState.content;
            paramsTextarea.value = JSON.stringify(
              stepData.dynamicState.parameters,
              null,
              2
            );
            loadPrompts("dynamic");
          } else {
            promptContentDisplay.value = stepData.staticState.content;
            loadPrompts("static");
          }

          lastStepDefaults.promptType = pt;
          lastStepDefaults.isDynamic = dynamic;
          lastStepDefaults.useCustomPrompt = custom;
          stepData.promptType = pt;
          stepData.isDynamic = dynamic;
          stepData.useCustomPrompt = custom;
        });
      });

      aiModelSelect.addEventListener("change", (e) => {
        lastStepDefaults.aiModel = e.target.value;
        stepData.aiModel = e.target.value;
      });

      newTabCheckbox.addEventListener("change", (e) => {
        lastStepDefaults.openInNewTab = e.target.checked;
        stepData.openInNewTab = e.target.checked;
      });

      customPromptTextarea.addEventListener("input", () => {
        stepData.customState.customPrompt = customPromptTextarea.value;
        lastStepDefaults.customPrompt = customPromptTextarea.value;
        if (/\{[^}]+\}/.test(customPromptTextarea.value)) {
          const placeholders = [
            ...customPromptTextarea.value.matchAll(/\{\{([^}]+)\}\}/g),
          ].map((m) => m[1]);
          const params = {};
          placeholders.forEach(
            (key) => (params[key] = stepData.customState.parameters[key] || "")
          );
          stepData.customState.parameters = params;
          paramsTextarea.value = JSON.stringify(params, null, 2);
        } else {
          stepData.customState.parameters = {};
          paramsTextarea.value = JSON.stringify({}, null, 2);
        }
      });

      promptSelect.addEventListener("change", () => {
        const selId = promptSelect.value;
        const dynamicChecked = radioButtons[1].checked;
        const stateKey = dynamicChecked ? "dynamicState" : "staticState";

        stepData[stateKey].promptId = selId;

        if (!selId) {
          stepData[stateKey].content = "";
          stepData[stateKey].parameters = {};
          promptContentDisplay.value = "";
          paramsTextarea.value = JSON.stringify({}, null, 2);
          return;
        }

        chrome.storage.local.get(["prompts"], (data) => {
          const prompt = data.prompts?.[selId];
          if (prompt) {
            stepData[stateKey].content = prompt.content;
            promptContentDisplay.value = prompt.content;
            if (dynamicChecked && /\{[^}]+\}/.test(prompt.content)) {
              const placeholders = [
                ...prompt.content.matchAll(/\{\{([^}]+)\}\}/g),
              ].map((m) => m[1]);
              const params = {};
              placeholders.forEach(
                (key) =>
                  (params[key] = stepData.dynamicState.parameters[key] || "")
              );
              stepData.dynamicState.parameters = params;
              paramsTextarea.value = JSON.stringify(params, null, 2);
            } else {
              stepData[stateKey].parameters = {};
              paramsTextarea.value = JSON.stringify({}, null, 2);
            }
          }
        });
      });

      insertVariableBtn.addEventListener("click", () => {
        const startPos = customPromptTextarea.selectionStart;
        const endPos = customPromptTextarea.selectionEnd;
        const text = customPromptTextarea.value;
        const variableText = "{{variable}}";
        customPromptTextarea.value =
          text.substring(0, startPos) + variableText + text.substring(endPos);
        customPromptTextarea.focus();
        customPromptTextarea.setSelectionRange(
          startPos + variableText.length,
          startPos + variableText.length
        );
        customPromptTextarea.dispatchEvent(new Event("input"));
      });

      stepDiv.querySelector(".remove-step").addEventListener("click", () => {
        if (steps.length <= 1) return;
        container.removeChild(stepLabel);
        container.removeChild(stepDiv);
        steps.splice(index, 1);
        [...container.children].forEach((child, idx) => {
          if (child.tagName === "H2") {
            child.textContent = `Step ${Math.floor(idx / 2) + 1}:`;
          } else if (child.classList.contains("step-item")) {
            child.dataset.stepIndex = Math.floor(idx / 2);
          }
        });
        updateRemoveButtons();
      });

      stepsArray[index] = { ...stepData, stepDiv };
      updateRemoveButtons();
    };

    steps.forEach((step, idx) =>
      addStepToEdit(step, idx, stepsContainer, steps)
    );

    modalBody.querySelector("#add-step").addEventListener("click", () => {
      addStepToEdit({}, steps.length, stepsContainer, steps);
      const newStepLabel = stepsContainer.querySelector(
        `h2:nth-of-type(${steps.length})`
      );
      if (newStepLabel) newStepLabel.scrollIntoView({ behavior: "smooth" });
    });

    modalBody.querySelector(".save-btn").addEventListener("click", async () => {
      try {
        const nameInput = modalBody.querySelector("#edit-name");
        if (!nameInput.value.trim()) {
          nameInput.style.border = "2px solid red";
          alert("Please enter a workflow name.");
          return;
        }

        const updatedSteps = await Promise.all(
          steps.map(async (_, index) => {
            const idx = _.stepDiv.dataset.stepIndex;
            const sd = _.stepDiv;
            const title = sd.querySelector(".step-title").value.trim();
            const pType = sd.querySelector(
              `input[name="prompt-type-${idx}"]:checked`
            )?.value;
            const isDyn =
              pType === "dynamic" ||
              (pType === "custom" &&
                /\{[^}]+\}/.test(_.customState.customPrompt));
            const useCust = pType === "custom";
            const aiModel = sd.querySelector(".step-ai-model").value;
            const openInNewTab = sd.querySelector(".step-new-tab").checked;

            let promptId, customPrompt, parameters;
            if (useCust) {
              promptId = null;
              customPrompt = _.customState.customPrompt;
              parameters = _.customState.parameters;
            } else if (pType === "dynamic") {
              promptId = _.dynamicState.promptId;
              customPrompt = null;
              parameters = _.dynamicState.parameters;
            } else {
              promptId = _.staticState.promptId;
              customPrompt = null;
              parameters = {};
            }

            if (!aiModel)
              throw new Error(`Step ${+idx + 1}: No AI model chosen`);
            if (!promptId && !useCust)
              throw new Error(`Step ${+idx + 1}: No prompt selected/provided`);

            const step = {
              title: title || `Step ${+idx + 1}`,
              aiModel,
              openInNewTab,
              isDynamic: isDyn,
              useCustomPrompt: useCust,
              promptType: pType,
              parameters,
              promptId,
              customPrompt,
            };

            if (useCust && customPrompt) {
              const promptTitle =
                customPrompt.length > 5
                  ? customPrompt.substring(0, 5)
                  : customPrompt;

              const newPrompt = {
                promptId: `${Date.now()}_${generateUUID()}`,
                title: promptTitle,
                description: "",
                content: customPrompt,
                type: "",
                compatibleModels: [],
                incompatibleModels: [],
                tags: [],
                isFavorite: false,
                folderId: null,
                folderName: "",
                createdAt: Date.now(),
                updatedAt: Date.now(),
                usageCount: 0,
                lastUsed: null,
                notes: "",
                versions: [
                  {
                    versionId: `${Date.now()}_${generateUUID()}`,
                    title: promptTitle,
                    description: "",
                    content: customPrompt,
                    timestamp: Date.now(),
                  },
                ],
                metaChangeLog: [
                  {
                    timestamp: Date.now(),
                    changes: {
                      title: { from: null, to: promptTitle },
                      description: { from: null, to: "" },
                      content: { from: null, to: customPrompt },
                      type: { from: null, to: "" },
                      compatibleModels: { from: [], to: [] },
                      incompatibleModels: { from: [], to: [] },
                      tags: { from: [], to: [] },
                      isFavorite: { from: false, to: false },
                      folderId: { from: null, to: null },
                      folderName: { from: null, to: null },
                      notes: { from: null, to: "" },
                    },
                  },
                ],
                performanceHistory: [],
              };

              await new Promise((resolve, reject) => {
                chrome.storage.local.get(["prompts"], (data) => {
                  const prompts = data.prompts || {};
                  prompts[newPrompt.id] = newPrompt;
                  chrome.storage.local.set({ prompts }, () => {
                    if (chrome.runtime.lastError) {
                      reject(
                        new Error(
                          `Step ${+idx + 1}: Error saving custom prompt`
                        )
                      );
                    } else {
                      resolve();
                    }
                  });
                });
              });

              step.promptId = newPrompt.id;
              step.isHidden = true; // Kann genutzt werden für „Single Prompt“-Darstellung
            } else {
              step.isHidden = false;
            }

            return step;
          })
        );

        // Lade aktuelle Workflows
        const storageData = await new Promise((resolve) => {
          chrome.storage.local.get(["workflows"], resolve);
        });

        const workflows = storageData.workflows || {};
        const workflowId = workflow.id; // workflow muss im Scope sein

        const updatedWorkflow = {
          ...workflow,
          name: nameInput.value.trim(),
          steps: updatedSteps,
          updatedAt: Date.now(),
        };

        workflows[workflowId] = updatedWorkflow;

        await new Promise((resolve, reject) => {
          chrome.storage.local.set({ workflows }, () => {
            if (chrome.runtime.lastError) {
              reject(new Error("Error saving workflow."));
            } else {
              resolve();
            }
          });
        });

        modal.remove();
        renderWorkflows();
      } catch (err) {
        alert(`Error: ${err.message}`);
      }
    });

    modalBody
      .querySelector(".cancel-btn")
      .addEventListener("click", () => modal.remove());

    modalHeader.appendChild(closeSpan);
    modalHeader.appendChild(headerTitle);
    modalContent.appendChild(modalHeader);
    modalContent.appendChild(modalBody);
    modal.appendChild(modalContent);
    document.body.appendChild(modal);

    closeSpan.onclick = () => modal.remove();
  }

  // Initialize
  addWorkflowBtn.onclick = showCreateWorkflowModal;
  workflowView.style.display = "block";
  renderWorkflows();

  // Refresh workflows on storage change
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "local" && changes.workflows) {
      renderWorkflows();
    }
  });
}

function showCreateWorkflowModal() {
  const modal = document.createElement("div");
  modal.className = "modal";

  const modalContent = document.createElement("div");
  modalContent.className = "modal-content";

  const modalHeader = document.createElement("div");
  modalHeader.className = "modal-header";

  const closeSpan = document.createElement("span");
  closeSpan.className = "close";
  closeSpan.innerHTML = "×";

  const headerTitle = document.createElement("h2");
  headerTitle.textContent = "Create New Workflow";

  const modalBody = document.createElement("div");
  modalBody.className = "modal-body";

  const form = document.createElement("form");

  const aiOptions = {
    grok: "Grok",
    gemini: "Gemini",
    chatgpt: "ChatGPT",
    claude: "Claude",
    blackbox: "BlackBox",
    githubCopilot: "GitHub Copilot",
    microsoftCopilot: "Microsoft Copilot",
    mistral: "Mistral",
    duckduckgo: "DuckDuckGo",
    perplexity: "Perplexity",
    deepseek: "DeepSeek",
    deepai: "Deepai",
    qwenAi: "Qwen AI",
  };

  const aiModelOptions = Object.entries(aiOptions)
    .map(([key, name]) => `<option value="${key}">${name}</option>`)
    .join("");

  form.innerHTML = `
    <label>Name:</label>
    <input type="text" id="workflow-name" placeholder="Workflow name" required>
    <div id="workflow-steps"></div>
    <button type="button" class="action-btn" id="add-step-btn">Add Step</button>
    <button type="submit" class="action-btn">Create Workflow</button>
  `;

  modalHeader.appendChild(closeSpan);
  modalHeader.appendChild(headerTitle);
  modalBody.appendChild(form);
  modalContent.appendChild(modalHeader);
  modalContent.appendChild(modalBody);
  modal.appendChild(modalContent);
  document.body.appendChild(modal);

  const stepsContainer = form.querySelector("#workflow-steps");
  let steps = [];
  let lastStepConfig = {
    aiModel: "",
    openInNewTab: false,
    isDynamic: true,
    useCustomPrompt: false,
    customPrompt: "",
    parameters: {},
  };

  const updateRemoveButtons = () => {
    const removeButtons = stepsContainer.querySelectorAll(".remove-step");
    removeButtons.forEach((btn, idx) => {
      btn.disabled = steps.length === 1;
      btn.style.opacity = steps.length === 1 ? "0.5" : "1";
      btn.style.cursor = steps.length === 1 ? "not-allowed" : "pointer";
    });
  };

  const maintainScrollPosition = (callback) => {
    const scrollPosition = modalBody.scrollTop;
    callback();
    modalBody.scrollTop = scrollPosition;
  };

  const addStep = (stepData = {}, index) => {
    const stepDiv = document.createElement("div");
    stepDiv.className = "step-item";
    stepDiv.dataset.stepIndex = index;

    const stepLabel = document.createElement("h2");
    stepLabel.textContent = `Step ${index + 1}:`;
    stepsContainer.appendChild(stepLabel);

    const isDynamic = stepData.isDynamic ?? lastStepConfig.isDynamic;
    const useCustomPrompt =
      stepData.useCustomPrompt ?? lastStepConfig.useCustomPrompt;
    const customPrompt = useCustomPrompt
      ? stepData.customPrompt ?? ""
      : lastStepConfig.customPrompt;
    let parameters = stepData.parameters ?? lastStepConfig.parameters;

    // Initialize parameters for custom prompts with variables
    if (useCustomPrompt && customPrompt && /\{[^}]+\}/.test(customPrompt)) {
      const placeholders = [...customPrompt.matchAll(/\{\{([^}]+)\}\}/g)].map(
        (m) => m[1]
      );
      parameters = {};
      placeholders.forEach((key) => (parameters[key] = ""));
    }

    stepDiv.innerHTML = `
      <style>
        .prompt-type-container {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
        }
        .prompt-type {
          display: flex;
          gap: 15px;
          align-items: center;
        }
        .custom-prompt-container {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
        }
        .radio-group {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 5px 10px;
        }
        .radio-group label {
          margin-left: 5px;
          font-size: 14px;
          white-space: nowrap;
        }
        .checkbox-group {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 5px 10px;
        }
        .prompt-content-display {
          width: 100%;
          margin-top: 10px;
          margin-bottom: 15px;
          padding: 10px;
          border: 1px solid #ccc;
          border-radius: 4px;
          background-color: #f9f9f9;
          font-size: 14px;
          color: #333;
          resize: none;
        }
      </style>
      <label>Step Title</label>
      <input type="text" class="step-title" value="${
        stepData.title || ""
      }" placeholder="Enter step title">
      <label>AI Model</label>
      <select class="step-ai-model" required>
        <option value="" disabled ${
          !stepData.aiModel ? "selected" : ""
        }>Choose a model</option>
        ${aiModelOptions}
      </select>
      <label for="new-tab-${index}">Open in New Tab</label>
      <div class="checkbox-group">
        <input type="checkbox" id="new-tab-${index}" class="step-new-tab" ${
      stepData.openInNewTab ?? lastStepConfig.openInNewTab ? "checked" : ""
    }>
        <label for="new-tab-${index}">Open AI in new tab</label>
      </div>
      <div class="prompt-type-container">
        <div>
          <label>Prompt Type</label>
          <div class="prompt-type">
            <div class="radio-group">
              <input type="radio" id="static-${index}" name="prompt-type-${index}" value="static" ${
      !isDynamic && !useCustomPrompt ? "checked" : ""
    }>
              <label for="static-${index}">Static</label>
            </div>
            <div class="radio-group">
              <input type="radio" id="dynamic-${index}" name="prompt-type-${index}" value="dynamic" ${
      isDynamic && !useCustomPrompt ? "checked" : ""
    }>
              <label for="dynamic-${index}">Dynamic</label>
            </div>
            <div class="radio-group">
              <input type="radio" id="custom-${index}" name="prompt-type-${index}" value="custom" ${
      useCustomPrompt ? "checked" : ""
    }>
              <label for="custom-${index}">Use custom prompt</label>
            </div>
          </div>
        </div>
      </div>
      <label class="prompt-label" style="display: ${
        useCustomPrompt ? "none" : "block"
      }">Select Prompt</label>
      <select class="step-prompt" style="display: ${
        useCustomPrompt ? "none" : "block"
      }"></select>
      <label class="prompt-content-label" style="display: ${
        useCustomPrompt ? "none" : "block"
      }">Prompt Content</label>
      <textarea class="prompt-content-display" readonly style="display: ${
        useCustomPrompt ? "none" : "block"
      }" placeholder="Prompt content will appear here"></textarea>
      <label class="custom-prompt-text-label" style="display: ${
        useCustomPrompt ? "block" : "none"
      }">Custom Prompt</label>
      <textarea class="step-custom-prompt-text" style="display: ${
        useCustomPrompt ? "block" : "none"
      }" placeholder="Enter custom prompt">${customPrompt}</textarea>
      <label class="params-label" style="display: ${
        isDynamic && !useCustomPrompt ? "block" : "none"
      }">Parameters (JSON)</label>
      <textarea class="step-params" readonly style="display: ${
        isDynamic && !useCustomPrompt ? "block" : "none"
      }" placeholder='{"key": "value"}'>${JSON.stringify(
      parameters,
      null,
      2
    )}</textarea>
      <button class="action-btn remove-step">Remove Step</button>
    `;

    const promptSelect = stepDiv.querySelector(".step-prompt");
    const promptContentDisplay = stepDiv.querySelector(
      ".prompt-content-display"
    );
    const promptContentLabel = stepDiv.querySelector(".prompt-content-label");
    const paramsTextarea = stepDiv.querySelector(".step-params");
    const paramsLabel = stepDiv.querySelector(".params-label");
    const customPromptTextarea = stepDiv.querySelector(
      ".step-custom-prompt-text"
    );
    const customPromptLabel = stepDiv.querySelector(
      ".custom-prompt-text-label"
    );
    const promptLabel = stepDiv.querySelector(".prompt-label");
    const radioButtons = stepDiv.querySelectorAll(
      `input[name="prompt-type-${index}"]`
    );
    const aiModelSelect = stepDiv.querySelector(".step-ai-model");
    const newTabCheckbox = stepDiv.querySelector(".step-new-tab");

    if (stepData.aiModel) {
      aiModelSelect.value = stepData.aiModel;
    } else if (lastStepConfig.aiModel && aiOptions[lastStepConfig.aiModel]) {
      aiModelSelect.value = lastStepConfig.aiModel;
    }

    const loadPrompts = (type) => {
      chrome.storage.local.get(["prompts"], (data) => {
        const prompts = data.prompts || {};
        promptSelect.innerHTML = "";

        const defaultOption = document.createElement("option");
        defaultOption.value = "";
        defaultOption.textContent = "Select a prompt";
        promptSelect.appendChild(defaultOption);

        Object.entries(prompts).forEach(([promptId, prompt]) => {
          const isDynamicPrompt =
            typeof prompt.content === "string" &&
            /\{[^}]+\}/.test(prompt.content);

          if (
            (type === "dynamic" && isDynamicPrompt) ||
            (type === "static" && !isDynamicPrompt)
          ) {
            const option = document.createElement("option");
            option.value = promptId;
            option.textContent = prompt.title || `Prompt`;
            if (stepData.promptId === promptId) option.selected = true;
            promptSelect.appendChild(option);
          }
        });

        if (stepData.promptId && type === "dynamic" && !useCustomPrompt) {
          promptSelect.value = stepData.promptId;
          promptSelect.dispatchEvent(new Event("change"));
        }
      });
    };

    loadPrompts(isDynamic && !useCustomPrompt ? "dynamic" : "static");

    radioButtons.forEach((radio) => {
      radio.addEventListener("change", () => {
        maintainScrollPosition(() => {
          const selectedType = radio.value;
          const isCustom = selectedType === "custom";
          const dynamic = selectedType === "dynamic";
          promptSelect.style.display = isCustom ? "none" : "block";
          promptLabel.style.display = isCustom ? "none" : "block";
          promptContentLabel.style.display = isCustom ? "none" : "block";
          promptContentDisplay.style.display = isCustom ? "none" : "block";
          customPromptTextarea.style.display = isCustom ? "block" : "none";
          customPromptLabel.style.display = isCustom ? "block" : "none";
          paramsLabel.style.display = dynamic && !isCustom ? "block" : "none";
          paramsTextarea.style.display =
            dynamic && !isCustom ? "block" : "none";
          if (!dynamic && !isCustom) {
            paramsTextarea.value = JSON.stringify({}, null, 2);
            steps[index].parameters = {};
          }
          if (!isCustom) {
            loadPrompts(selectedType);
            promptContentDisplay.value = "";
          }
          lastStepConfig.isDynamic = dynamic;
          lastStepConfig.useCustomPrompt = isCustom;
          steps[index].isDynamic = dynamic;
          steps[index].useCustomPrompt = isCustom;
          if (isCustom) {
            paramsTextarea.value = JSON.stringify({}, null, 2);
            steps[index].parameters = {};
          }
        });
      });
    });

    promptSelect.addEventListener("change", () => {
      const selectedPromptId = promptSelect.value;
      const dynamicChecked = radioButtons[1].checked;

      if (!selectedPromptId || radioButtons[2].checked) {
        promptContentDisplay.value = "";
        paramsTextarea.value = JSON.stringify({}, null, 2);
        lastStepConfig.parameters = {};
        steps[index].parameters = {};
        steps[index].promptId = selectedPromptId;
        return;
      }

      chrome.storage.local.get(["prompts"], (data) => {
        const selectedPrompt = data.prompts?.[selectedPromptId];
        const selectedPromptContent = selectedPrompt?.content || "";

        promptContentDisplay.value = selectedPromptContent;

        if (selectedPromptContent && dynamicChecked) {
          const placeholders = [
            ...selectedPromptContent.matchAll(/\{\{([^}]+)\}\}/g),
          ].map((m) => m[1]);
          const params = {};
          placeholders.forEach((key) => (params[key] = ""));
          paramsTextarea.value = JSON.stringify(params, null, 2);
          lastStepConfig.parameters = params;
          steps[index].parameters = params;
        } else {
          paramsTextarea.value = JSON.stringify({}, null, 2);
          lastStepConfig.parameters = {};
          steps[index].parameters = {};
        }

        steps[index].promptId = selectedPromptId;
      });
    });

    aiModelSelect.addEventListener("change", () => {
      lastStepConfig.aiModel = aiModelSelect.value;
      steps[index].aiModel = aiModelSelect.value;
    });

    newTabCheckbox.addEventListener("change", () => {
      lastStepConfig.openInNewTab = newTabCheckbox.checked;
      steps[index].openInNewTab = newTabCheckbox.checked;
    });

    customPromptTextarea.addEventListener("input", () => {
      lastStepConfig.customPrompt = customPromptTextarea.value;
      steps[index].customPrompt = customPromptTextarea.value;
      if (
        steps[index].useCustomPrompt &&
        /\{[^}]+\}/.test(customPromptTextarea.value)
      ) {
        const placeholders = [
          ...customPromptTextarea.value.matchAll(/\{\{([^}]+)\}\}/g),
        ].map((m) => m[1]);
        const params = {};
        placeholders.forEach((key) => (params[key] = ""));
        steps[index].parameters = params;
      } else {
        steps[index].parameters = {};
      }
    });

    stepDiv.querySelector(".remove-step").addEventListener("click", () => {
      if (steps.length <= 1) return;
      stepsContainer.removeChild(stepLabel);
      stepsContainer.removeChild(stepDiv);
      steps.splice(index, 1);
      [...stepsContainer.children].forEach((child, idx) => {
        if (child.tagName === "H2") {
          child.textContent = `Step ${Math.floor(idx / 2) + 1}:`;
        } else if (child.classList.contains("step-item")) {
          child.dataset.stepIndex = Math.floor(idx / 2);
        }
      });
      updateRemoveButtons();
    });

    stepsContainer.appendChild(stepDiv);
    steps[index] = {
      ...stepData,
      stepDiv,
      isDynamic,
      useCustomPrompt,
      customPrompt,
      parameters,
      aiModel: aiModelSelect.value,
      openInNewTab: newTabCheckbox.checked,
      promptId: promptSelect.value,
    };
    updateRemoveButtons();
  };

  addStep({}, 0);

  form.querySelector("#add-step-btn").addEventListener("click", () => {
    const lastStepIndex = steps.length - 1;
    if (lastStepIndex >= 0) {
      const lastStepDiv = stepsContainer.querySelector(
        `[data-step-index="${lastStepIndex}"]`
      );
      lastStepConfig.aiModel =
        lastStepDiv.querySelector(".step-ai-model").value;
      lastStepConfig.openInNewTab =
        lastStepDiv.querySelector(".step-new-tab").checked;
      lastStepConfig.isDynamic =
        lastStepDiv.querySelector(
          `input[name="prompt-type-${lastStepIndex}"]:checked`
        )?.value === "dynamic";
      lastStepConfig.useCustomPrompt =
        lastStepDiv.querySelector(
          `input[name="prompt-type-${lastStepIndex}"]:checked`
        )?.value === "custom";
      lastStepConfig.customPrompt = lastStepConfig.useCustomPrompt
        ? lastStepDiv.querySelector(".step-custom-prompt-text").value
        : "";
      const customPromptText = lastStepDiv.querySelector(
        ".step-custom-prompt-text"
      ).value;
      if (
        lastStepConfig.useCustomPrompt &&
        /\{[^}]+\}/.test(customPromptText)
      ) {
        const placeholders = [
          ...customPromptText.matchAll(/\{\{([^}]+)\}\}/g),
        ].map((m) => m[1]);
        const params = {};
        placeholders.forEach((key) => (params[key] = ""));
        lastStepConfig.parameters = params;
        steps[lastStepIndex].parameters = params;
      } else {
        lastStepConfig.parameters = {};
        steps[lastStepIndex].parameters = {};
      }
    }
    addStep({}, steps.length);
    const newStepLabel = stepsContainer.querySelector(
      `h2:nth-child(${steps.length * 2 - 1})`
    );
    if (newStepLabel) {
      newStepLabel.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = form.querySelector("#workflow-name").value.trim();

    try {
      // 1️⃣ Lade bestehende Prompts einmal vorab
      const promptsData = await new Promise((resolve, reject) => {
        chrome.storage.local.get(["prompts"], (data) => {
          if (chrome.runtime.lastError) {
            console.error("Error loading prompts:", chrome.runtime.lastError);
            reject(new Error("Fehler beim Laden der Prompts."));
          } else {
            resolve(data.prompts || {});
          }
        });
      });

      const workflowSteps = await Promise.all(
        steps.map(async (_, index) => {
          const stepDiv = stepsContainer.querySelector(
            `[data-step-index="${index}"]`
          );
          const title = stepDiv.querySelector(".step-title").value.trim();
          const promptId = stepDiv.querySelector(".step-prompt").value;
          const customPrompt = stepDiv
            .querySelector(".step-custom-prompt-text")
            .value.trim();
          const promptType = stepDiv.querySelector(
            `input[name="prompt-type-${index}"]:checked`
          )?.value;
          const isDynamic =
            promptType === "dynamic" ||
            (promptType === "custom" && /\{[^}]+\}/.test(customPrompt));
          const useCustomPrompt = promptType === "custom";
          let parameters = {};

          if (isDynamic && !useCustomPrompt) {
            try {
              parameters = JSON.parse(
                stepDiv.querySelector(".step-params").value.trim() || "{}"
              );
            } catch (err) {
              throw new Error(`Step ${index + 1}: Invalid JSON parameters`);
            }
          } else if (useCustomPrompt && isDynamic) {
            const placeholders = [
              ...customPrompt.matchAll(/\{\{([^}]+)\}\}/g),
            ].map((m) => m[1]);
            placeholders.forEach((key) => (parameters[key] = ""));
          }

          const stepAIModel = stepDiv.querySelector(".step-ai-model").value;
          const openInNewTab = stepDiv.querySelector(".step-new-tab").checked;

          if (!stepAIModel) {
            throw new Error(`Step ${index + 1}: No AI model selected`);
          }

          if (!promptId && !useCustomPrompt) {
            throw new Error(
              `Step ${index + 1}: No prompt selected or custom prompt provided`
            );
          }

          const step = {
            title: title || `Step ${index + 1}`,
            aiModel: stepAIModel,
            openInNewTab,
            isDynamic,
            useCustomPrompt,
            parameters,
          };

          if (useCustomPrompt) {
            const newPromptId = `${Date.now()}_${generateUUID()}`
            const snippet =
              customPrompt.length > 10
                ? customPrompt.substring(0, 10)
                : customPrompt;
            const promptTitle = `Custom: ${snippet}`;

            const newPrompt = {
              promptId: newPromptId,
              title: promptTitle,
              description: "",
              content: customPrompt,
              type: "",
              compatibleModels: [],
              incompatibleModels: [],
              tags: [],
              isFavorite: false,
              folderId: null,
              folderName: "Single Prompt",
              createdAt: Date.now(),
              updatedAt: Date.now(),
              usageCount: 0,
              lastUsed: null,
              notes: "",
              versions: [
                {
                  versionId: `${Date.now()}_${generateUUID()}`,
                  title: promptTitle,
                  description: "",
                  content: customPrompt,
                  timestamp: Date.now(),
                },
              ],
              metaChangeLog: [
                {
                  timestamp: Date.now(),
                  changes: {
                    title: { from: null, to: promptTitle },
                    description: { from: null, to: "" },
                    content: { from: null, to: customPrompt },
                    type: { from: null, to: "" },
                    compatibleModels: { from: [], to: [] },
                    incompatibleModels: { from: [], to: [] },
                    tags: { from: [], to: [] },
                    isFavorite: { from: false, to: false },
                    folderId: { from: null, to: null },
                    folderName: { from: null, to: "Single Prompt" },
                    notes: { from: null, to: "" },
                  },
                },
              ],
              performanceHistory: [],
            };

            // ✅ Nur dem lokalen Objekt hinzufügen
            promptsData[newPromptId] = newPrompt;

            step.promptId = newPromptId;
            step.customPrompt = customPrompt;
            step.isHidden = true;
          } else {
            step.promptId = promptId;
            step.isHidden = false;
          }

          return step;
        })
      );

      // 2️⃣ Speichere alle neuen Prompts gesammelt
      await new Promise((resolve, reject) => {
        chrome.storage.local.set({ prompts: promptsData }, () => {
          if (chrome.runtime.lastError) {
            console.error(
              "Fehler beim finalen Speichern der Prompts:",
              chrome.runtime.lastError
            );
            reject(new Error("Fehler beim Speichern der Prompts."));
          } else {
            resolve();
          }
        });
      });

      // 3️⃣ Speichere Workflow
      const workflowId = `${Date.now()}_${generateUUID()}`;
      const newWorkflow = {
        name,
        steps: workflowSteps,
        createdAt: Date.now(),
        lastUsed: null,
      };

      await new Promise((resolve, reject) => {
        chrome.storage.local.get(["workflows"], (data) => {
          if (chrome.runtime.lastError) {
            console.error("Error reading workflows:", chrome.runtime.lastError);
            reject(new Error("Fehler beim Lesen der Workflows."));
            return;
          }

          const workflows = data.workflows || {};
          workflows[workflowId] = newWorkflow;

          chrome.storage.local.set({ workflows }, () => {
            if (chrome.runtime.lastError) {
              console.error("Error saving workflow:", chrome.runtime.lastError);
              reject(new Error("Fehler beim Speichern."));
            } else {
              resolve();
            }
          });
        });
      });

      modal.remove();
      handleCategoryClick("Workflows");
    } catch (err) {
      alert(`Fehler: ${err.message}`);
    }
  });

  const resetConfig = () => {
    lastStepConfig = {
      aiModel: "",
      openInNewTab: false,
      isDynamic: true,
      useCustomPrompt: false,
      customPrompt: "",
      parameters: {},
    };
  };

  closeSpan.onclick = () => {
    resetConfig();
    modal.remove();
  };
}
function executeWorkflow(workflowId) {
  chrome.storage.local.get(workflowId, (data) => {
    const workflow = data[workflowId];
    if (!workflow || !workflow.steps) {
      console.error(`Workflow mit ID ${workflowId} nicht gefunden.`);
      alert("Fehler: Workflow nicht gefunden.");
      return;
    }

    console.log("Geladener Workflow:", JSON.stringify(workflow, null, 2));

    const modal = document.createElement("div");
    modal.className = "modal";
    const modalContent = document.createElement("div");
    modalContent.className = "modal-content";
    const modalHeader = document.createElement("div");
    modalHeader.className = "modal-header";
    const closeSpan = document.createElement("span");
    closeSpan.className = "close";
    closeSpan.innerHTML = "×";
    const headerTitle = document.createElement("h2");
    headerTitle.textContent = `Execute Workflow: ${workflow.name}`;
    const modalBody = document.createElement("div");
    modalBody.className = "modal-body";

    let currentStep = 0;
    let previousOutput = "";
    const stepOutputs = Array(workflow.steps.length).fill("");

    const renderStep = () => {
      modalBody.innerHTML = `
        <div class="execute-workflow-step">
          <label>Step ${currentStep + 1}: ${
        workflow.steps[currentStep].title || "Untitled Step"
      }</label>
          <label>Prompt Content</label>
          <textarea readonly></textarea>
          ${
            workflow.steps[currentStep].isDynamic
              ? `<label>Parameters (JSON)</label>
                 <textarea class="step-params" placeholder='{"key": "value"}'>${JSON.stringify(
                   workflow.steps[currentStep].parameters || {},
                   null,
                   2
                 )}</textarea>`
              : ""
          }
          <label>Previous Step Output (if any)</label>
          <textarea class="previous-output" placeholder="Paste the output from the previous step">${
            previousOutput || ""
          }</textarea>
          <button class="action-btn execute-step">Execute Step</button>
          ${
            currentStep < workflow.steps.length - 1
              ? `<button class="action-btn next-step">Next Step</button>`
              : `<button class="action-btn finish-workflow">Finish Workflow</button>`
          }
        </div>
      `;

      // Lade den Prompt-Inhalt
      const promptId = workflow.steps[currentStep].promptId;
      console.log(
        `Verarbeite promptId: ${promptId} für Schritt ${currentStep + 1}`
      );
      if (promptId) {
        // Split nur beim letzten Unterstrich

        // In executeWorkflow, mit parsePromptId
        const parsedId = parsePromptId(promptId);
        if (!parsedId) {
          console.error(`Ungültige promptId: ${promptId}`);
          modalBody.querySelector("textarea[readonly]").value =
            "Ungültige Prompt-ID.";
          return;
        }
        const { folderId, promptIndex } = parsedId;

        console.log(`folderId: ${folderId}, promptIndex: ${promptIndex}`);

        chrome.storage.local.get(folderId, (data) => {
          const topic = data[folderId];
          console.log(`Geladenes Topic für folderId ${folderId}:`, topic);
          if (
            topic &&
            topic.prompts &&
            topic.prompts[parseInt(promptIndex)] // Sicherstellen, dass promptIndex eine Zahl ist
          ) {
            const promptContent = topic.prompts[parseInt(promptIndex)].content;
            console.log(`Prompt-Inhalt gefunden: ${promptContent}`);
            modalBody.querySelector("textarea[readonly]").value = promptContent;
          } else {
            console.error(
              `Prompt nicht gefunden. Topic existiert: ${!!topic}, Prompts existieren: ${!!topic?.prompts}, Prompt an Index ${promptIndex}: ${
                topic?.prompts?.[parseInt(promptIndex)]
              }`
            );
            modalBody.querySelector("textarea[readonly]").value =
              "Prompt nicht gefunden.";
          }
        });
      } else {
        console.warn(
          `Keine promptId für Schritt ${currentStep + 1} definiert.`
        );
        modalBody.querySelector("textarea[readonly]").value =
          "Kein Prompt ausgewählt.";
      }

      // Execute Step
      modalBody.querySelector(".execute-step").addEventListener("click", () => {
        const promptId = workflow.steps[currentStep].promptId;
        if (!promptId) {
          alert("Kein Prompt für diesen Schritt ausgewählt.");
          return;
        }

        const parsedId = parsePromptId(promptId);
        if (!parsedId) {
          alert("Ungültige Prompt-ID.");
          return;
        }
        const { folderId, promptIndex } = parsedId;

        chrome.storage.local.get(folderId, (data) => {
          const topic = data[folderId];
          if (
            !topic ||
            !topic.prompts ||
            !topic.prompts[parseInt(promptIndex)]
          ) {
            alert("Fehler: Prompt nicht gefunden.");
            return;
          }
          const prompt = topic.prompts[parseInt(promptIndex)];
          let finalPrompt = prompt.content;

          if (workflow.steps[currentStep].isDynamic) {
            try {
              const params = JSON.parse(
                modalBody.querySelector(".step-params").value || "{}"
              );
              finalPrompt = finalPrompt.replace(
                /\{([^}]+)\}/g,
                (match, key) => {
                  return params[key] || match;
                }
              );
            } catch (e) {
              alert("Ungültiges JSON in den Parametern: " + e.message);
              return;
            }
          }

          // Ersetze Platzhalter für previousOutput
          if (previousOutput) {
            finalPrompt = finalPrompt.replace(
              "{previousOutput}",
              previousOutput
            );
          }

          // Kopiere den Prompt in die Zwischenablage
          navigator.clipboard
            .writeText(finalPrompt)
            .then(() => {
              // Öffne die KI-Seite in einem neuen Tab
              const aiModel = workflow.aiModel;
              const aiUrls = {
                grok: "https://grok.x.ai",
                gemini: "https://gemini.google.com",
                chatgpt: "https://chat.openai.com",
                claude: "https://www.anthropic.com",
                blackbox: "https://www.blackbox.ai",
                githubCopilot: "https://github.com/features/copilot",
                microsoftCopilot: "https://copilot.microsoft.com",
                mistral: "https://mistral.ai",
                duckduckgo: "https://duckduckgo.com",
                perplexity: "https://www.perplexity.ai",
                deepseek: "https://www.deepseek.com",
                deepai: "https://deepai.org",
                qwenAi: "https://www.qwen.ai",
              };
              const url = aiUrls[aiModel] || "https://www.google.com";
              window.open(url, "_blank");
              alert(
                "Prompt wurde in die Zwischenablage kopiert. Bitte füge ihn in die KI ein und kopiere die Ausgabe zurück."
              );
            })
            .catch((err) => {
              console.error("Fehler beim Kopieren des Prompts:", err);
              alert("Fehler beim Kopieren des Prompts.");
            });
        });
      });

      // Next Step
      if (currentStep < workflow.steps.length - 1) {
        modalBody.querySelector(".next-step").addEventListener("click", () => {
          stepOutputs[currentStep] = modalBody
            .querySelector(".previous-output")
            .value.trim();
          previousOutput = stepOutputs[currentStep];
          currentStep++;
          renderStep();
        });
      }

      // Finish Workflow
      if (currentStep === workflow.steps.length - 1) {
        modalBody
          .querySelector(".finish-workflow")
          .addEventListener("click", () => {
            stepOutputs[currentStep] = modalBody
              .querySelector(".previous-output")
              .value.trim();
            // Aktualisiere lastUsed
            chrome.storage.local.get(workflowId, (data) => {
              const updatedWorkflow = {
                ...data[workflowId],
                lastUsed: Date.now(),
              };
              chrome.storage.local.set(
                { [workflowId]: updatedWorkflow },
                () => {
                  modal.remove();
                  handleCategoryClick("Workflows");
                }
              );
            });
          });
      }
    };

    renderStep();

    modalHeader.appendChild(closeSpan);
    modalHeader.appendChild(headerTitle);
    modalContent.appendChild(modalHeader);
    modalContent.appendChild(modalBody);
    modal.appendChild(modalContent);
    document.body.appendChild(modal);

    closeSpan.onclick = () => modal.remove();
    window.onclick = (event) => {
      if (event.target === modal) modal.remove();
    };
  });
}

// Funktionen für Workflow-Aktionen
async function copyWorkflow(workflowId) {
  try {
    // Alle Workflows laden
    const data = await new Promise((resolve, reject) => {
      chrome.storage.local.get(["workflows"], (result) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(result.workflows || {});
        }
      });
    });

    const originalWorkflow = data[workflowId];
    if (!originalWorkflow) throw new Error("Workflow not found");

    // Neuen Workflow mit neuer ID erstellen
    const newWorkflowId = `${Date.now()}_${generateUUID()}`;
    const newWorkflow = {
      ...originalWorkflow,
      workflowId: newWorkflowId,
      name: `${originalWorkflow.name} (Copy)`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      lastUsed: null,
      // folderId kann übernommen oder neu gesetzt werden
      folderId: originalWorkflow.folderId || null,
    };

    // Workflows aktualisieren
    data[newWorkflowId] = newWorkflow;

    // Speicher alle Workflows zurück
    await new Promise((resolve, reject) => {
      chrome.storage.local.set({ workflows: data }, () => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve();
        }
      });
    });

    // Workflows für UI vorbereiten
    const updatedWorkflowsList = Object.values(data).map((wf) => ({
      id: wf.workflowId,
      title: wf.name,
      type: "Workflow",
      folderId: wf.folderId,
      createdAt: wf.createdAt,
      lastUsed: wf.lastUsed,
      compatibleModels: [],
      incompatibleModels: [],
      tags: [],
      folderName: "Workflows",
    }));

    renderPrompts(updatedWorkflowsList);
  } catch (error) {
    console.error("Error copying workflow:", error);
    alert("Fehler beim Kopieren des Workflows.");
  }
}

async function exportWorkflow(workflow, folderId) {
  try {
    const data = await new Promise((resolve) => {
      chrome.storage.local.get(folderId, (data) => resolve(data));
    });
    const workflowData = data[folderId];
    if (!workflowData) throw new Error("Workflow not found");

    const exportData = {
      ...workflowData,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${workflowData.name || "workflow"}.json`;
    a.click();
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Error exporting workflow:", error);
    alert("Fehler beim Exportieren des Workflows.");
  }
}

async function deleteWorkflow(workflowId, row, prompts) {
  try {
    const confirmDelete = confirm(
      `Are you sure you want to delete "${
        prompts.find((p) => p.id === workflowId)?.title || "this workflow"
      }"?`
    );
    if (!confirmDelete) return;

    // Workflows laden
    const data = await new Promise((resolve, reject) => {
      chrome.storage.local.get(["workflows"], (result) => {
        if (chrome.runtime.lastError) reject(chrome.runtime.lastError);
        else resolve(result.workflows || {});
      });
    });

    // Workflow löschen
    if (!(workflowId in data)) throw new Error("Workflow not found");
    delete data[workflowId];

    // Workflows speichern
    await new Promise((resolve, reject) => {
      chrome.storage.local.set({ workflows: data }, () => {
        if (chrome.runtime.lastError) reject(chrome.runtime.lastError);
        else resolve();
      });
    });

    // DOM aktualisieren
    row.remove();

    // Prompts-Array aktualisieren und rendern (Workflows filtern)
    const updatedPrompts = prompts.filter((p) => p.id !== workflowId);
    renderPrompts(updatedPrompts);
  } catch (error) {
    console.error("Error deleting workflow:", error);
    alert("Fehler beim Löschen des Workflows.");
  }
}

async function renameWorkflow(workflowId, row) {
  try {
    // Workflows laden
    const data = await new Promise((resolve, reject) => {
      chrome.storage.local.get(["workflows"], (result) => {
        if (chrome.runtime.lastError) reject(chrome.runtime.lastError);
        else resolve(result.workflows || {});
      });
    });

    const workflowData = data[workflowId];
    if (!workflowData) throw new Error("Workflow not found");

    const newName = prompt(
      `Enter new name for "${workflowData.name}"`,
      workflowData.name
    );
    if (!newName || newName.trim() === workflowData.name) return;

    workflowData.name = newName.trim();
    workflowData.updatedAt = Date.now();

    // Workflows speichern
    await new Promise((resolve, reject) => {
      chrome.storage.local.set({ workflows: data }, () => {
        if (chrome.runtime.lastError) reject(chrome.runtime.lastError);
        else resolve();
      });
    });

    // DOM aktualisieren
    row.cells[1].textContent = newName.trim();
  } catch (error) {
    console.error("Error renaming workflow:", error);
    alert("Fehler beim Umbenennen des Workflows.");
  }
}

// Hilfsfunktion zum Generieren von UUIDs
function generateUUID() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0,
      v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
function editWorkflowDetails(workflowId, workflow, sidebarContent) {
  const aiOptions = {
    grok: "Grok",
    gemini: "Gemini",
    chatgpt: "ChatGPT",
    claude: "Claude",
    blackbox: "BlackBox",
    githubCopilot: "GitHub Copilot",
    microsoftCopilot: "Microsoft Copilot",
    mistral: "Mistral",
    duckduckgo: "DuckDuckGo",
    perplexity: "Perplexity",
    deepseek: "DeepSeek",
    deepai: "Deepai",
    qwenAi: "Qwen AI",
  };

  const aiModelOptions = Object.entries(aiOptions)
    .map(([key, name]) => `<option value="${key}">${name}</option>`)
    .join("");

  const lastStepDefaults = {
    aiModel: workflow.aiModel || "",
    promptType: "static",
    isDynamic: false,
    useCustomPrompt: false,
    openInNewTab: false,
    customPrompt: "",
    promptId: null,
    parameters: {},
    staticState: { promptId: null, content: "" },
    dynamicState: { promptId: null, content: "", parameters: {} },
    customState: { customPrompt: "", parameters: {} },
  };

  sidebarContent.innerHTML = `
    <style>
      .prompt-type-container {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 15px;
      }
      .prompt-type {
        display: flex;
        gap: 15px;
        align-items: center;
      }
      .radio-group {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 5px 10px;
      }
      .radio-group label {
        margin-left: 5px;
        font-size: 14px;
        white-space: nowrap;
      }
      .checkbox-group {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 5px 10px;
      }
      .step-item {
        margin-bottom: 20px;
        padding: 10px;
        border: 1px solid #ddd;
        border-radius: 5px;
      }
      .action-btn,
      .save-btn,
      .cancel-btn {
        margin: 5px;
        padding: 8px 12px;
        cursor: pointer;
      }
      .dynamic-notice {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-top: 5px;
        margin-bottom: 15px;
        font-size: 14px;
        color: #555;
      }
      .dynamic-notice span {
        flex-grow: 1;
      }
      .dynamic-notice button {
        padding: 5px 10px;
        font-size: 14px;
      }
      .prompt-content-display {
        width: 100%;
        margin-top: 10px;
        margin-bottom: 15px;
        padding: 10px;
        border: 1px solid #ccc;
        border-radius: 4px;
        background-color: #f9f9f9;
        font-size: 14px;
        color: #333;
        resize: none;
      }
    </style>
    <label>Name</label>
    <input type="text" value="${workflow.name || ""}" id="edit-name" />
    <div id="edit-steps"></div>
    <button class="action-btn" id="add-step">Add Step</button>
    <button class="save-btn">Save</button>
    <button class="cancel-btn">Cancel</button>
  `;

  const sidebar = sidebarContent.closest(".sidebar");
  const maintainScrollPosition = (cb) => {
    if (sidebar) {
      const pos = sidebar.scrollTop;
      cb();
      sidebar.scrollTop = pos;
    } else {
      console.warn(
        "Sidebar element not found, skipping scroll position maintenance"
      );
      cb();
    }
  };

  const stepsContainer = sidebarContent.querySelector("#edit-steps");
  let steps = workflow.steps.map((s) => ({
    ...s,
    staticState: { promptId: s.promptId || null, content: s.content || "" },
    dynamicState: {
      promptId: s.promptId || null,
      content: s.content || "",
      parameters: s.parameters || {},
    },
    customState: {
      customPrompt: s.customPrompt || "",
      parameters: s.parameters || {},
    },
  }));

  const updateRemoveButtons = () => {
    const removeBtns = stepsContainer.querySelectorAll(".remove-step");
    removeBtns.forEach((btn) => {
      btn.disabled = steps.length === 1;
      btn.style.opacity = steps.length === 1 ? "0.5" : "1";
      btn.style.cursor = steps.length === 1 ? "not-allowed" : "pointer";
    });
  };

  const addStepToEdit = (rawStepData, index, container, stepsArray) => {
    const stepData = {
      title: "",
      promptId: null,
      customPrompt: "",
      parameters: {},
      ...lastStepDefaults,
      ...rawStepData,
    };

    const isDynamic =
      stepData.promptType === "dynamic" ||
      stepData.isDynamic === true ||
      (stepData.useCustomPrompt && /\{[^}]+\}/.test(stepData.customPrompt));
    const useCustomPrompt =
      stepData.promptType === "custom" || stepData.useCustomPrompt === true;

    container.appendChild(document.createElement("h2")).textContent = `Step ${
      index + 1
    }:`;

    const stepDiv = document.createElement("div");
    stepDiv.className = "step-item";
    stepDiv.dataset.stepIndex = index;

    stepDiv.innerHTML = `
      <label>Step Title</label>
      <input type="text" class="step-title" value="${
        stepData.title || ""
      }" placeholder="Enter step title" />
      <label>AI Model</label>
      <select class="step-ai-model" required>
        <option value="" disabled ${
          !stepData.aiModel ? "selected" : ""
        }>Choose a model</option>
        ${aiModelOptions}
      </select>
      <label for="new-tab-${index}">Open in New Tab</label>
      <div class="checkbox-group">
        <input type="checkbox" id="new-tab-${index}" class="step-new-tab" ${
      stepData.openInNewTab ? "checked" : ""
    } />
        <label for="new-tab-${index}">Open AI in new tab</label>
      </div>
      <div class="prompt-type-container">
        <div>
          <label>Prompt Type</label>
          <div class="prompt-type">
            <div class="radio-group">
              <input type="radio" id="static-${index}" name="prompt-type-${index}" value="static" ${
      !isDynamic && !useCustomPrompt ? "checked" : ""
    } />
              <label for="static-${index}">Static</label>
            </div>
            <div class="radio-group">
              <input type="radio" id="dynamic-${index}" name="prompt-type-${index}" value="dynamic" ${
      isDynamic && !useCustomPrompt ? "checked" : ""
    } />
              <label for="dynamic-${index}">Dynamic</label>
            </div>
            <div class="radio-group">
              <input type="radio" id="custom-${index}" name="prompt-type-${index}" value="custom" ${
      useCustomPrompt ? "checked" : ""
    } />
              <label for="custom-${index}">Use custom prompt</label>
            </div>
          </div>
        </div>
      </div>
      <label class="prompt-label" style="display: ${
        useCustomPrompt ? "none" : "block"
      }">Select Prompt</label>
      <select class="step-prompt" style="display: ${
        useCustomPrompt ? "none" : "block"
      }"></select>
      <label class="prompt-content-label" style="display: ${
        useCustomPrompt ? "none" : "block"
      }">Prompt Content</label>
      <textarea class="prompt-content-display" readonly style="display: ${
        useCustomPrompt ? "none" : "block"
      }" placeholder="Prompt content will appear here">${
      stepData.content || ""
    }</textarea>
      <label class="custom-prompt-label" style="display: ${
        useCustomPrompt ? "block" : "none"
      }">Custom Prompt</label>
      <textarea class="step-custom-prompt-text" style="display: ${
        useCustomPrompt ? "block" : "none"
      }" placeholder="Enter custom prompt">${
      stepData.customPrompt || ""
    }</textarea>
      <div class="dynamic-notice" style="display: ${
        useCustomPrompt ? "block" : "none"
      }">
        <span>Any value written in the format {{variable}} will be treated as a dynamic parameter and used during workflow execution.</span>
        <button type="button" class="action-btn" id="insert-variable-btn-${index}">{{Set Variable}}</button>
      </div>
      <label class="params-label" style="display: ${
        isDynamic && !useCustomPrompt ? "block" : "none"
      }">Parameters (JSON)</label>
      <textarea class="step-params" readonly style="display: ${
        isDynamic && !useCustomPrompt ? "block" : "none"
      }" placeholder='{"key": "value"}'>${JSON.stringify(
      stepData.parameters || {},
      null,
      2
    )}</textarea>
      <button class="action-btn remove-step">Remove Step</button>
    `;

    container.appendChild(stepDiv);

    const aiModelSelect = stepDiv.querySelector(".step-ai-model");
    const newTabCheckbox = stepDiv.querySelector(".step-new-tab");
    const radioButtons = stepDiv.querySelectorAll(
      `input[name="prompt-type-${index}"]`
    );
    const promptSelect = stepDiv.querySelector(".step-prompt");
    const promptContentDisplay = stepDiv.querySelector(
      ".prompt-content-display"
    );
    const paramsTextarea = stepDiv.querySelector(".step-params");
    const paramsLabel = stepDiv.querySelector(".params-label");
    const customPromptTextarea = stepDiv.querySelector(
      ".step-custom-prompt-text"
    );
    const customPromptLabel = stepDiv.querySelector(".custom-prompt-label");
    const promptLabel = stepDiv.querySelector(".prompt-label");
    const promptContentLabel = stepDiv.querySelector(".prompt-content-label");
    const insertVariableBtn = stepDiv.querySelector(
      `#insert-variable-btn-${index}`
    );
    const dynamicNotice = stepDiv.querySelector(".dynamic-notice");

    if (stepData.aiModel) {
      aiModelSelect.value = stepData.aiModel;
    }

    const loadPrompts = (type) => {
      chrome.storage.local.get(["prompts"], (data) => {
        const allPrompts = data.prompts || {};
        promptSelect.innerHTML = "";

        // Default-Option einfügen
        const defaultOption = document.createElement("option");
        defaultOption.value = "";
        defaultOption.textContent = "Select a prompt";
        defaultOption.disabled = true;
        defaultOption.selected =
          !stepData[type === "static" ? "staticState" : "dynamicState"]
            .promptId;
        promptSelect.appendChild(defaultOption);

        // Prompts nach Typ filtern (static oder dynamic)
        Object.entries(allPrompts).forEach(([promptId, prompt]) => {
          const isDynamicPrompt =
            typeof prompt.content === "string" &&
            /\{\{[^}]+\}\}/.test(prompt.content);

          const matchesType =
            (type === "dynamic" && isDynamicPrompt) ||
            (type === "static" && !isDynamicPrompt);

          if (matchesType) {
            const option = document.createElement("option");
            option.value = promptId;
            option.textContent = prompt.title || "Untitled Prompt";

            if (
              stepData[type === "static" ? "staticState" : "dynamicState"]
                .promptId === option.value
            ) {
              option.selected = true;
            }

            promptSelect.appendChild(option);
          }
        });

        // Event auslösen bei bereits gewähltem Prompt
        const selectedId =
          stepData[type === "static" ? "staticState" : "dynamicState"].promptId;
        if (selectedId) {
          promptSelect.value = selectedId;
          promptSelect.dispatchEvent(new Event("change"));
        }
      });
    };

    // Initialize view based on current prompt type
    if (useCustomPrompt) {
      customPromptTextarea.value = stepData.customState.customPrompt;
      promptSelect.style.display = "none";
      promptLabel.style.display = "none";
      promptContentDisplay.style.display = "none";
      promptContentLabel.style.display = "none";
    } else {
      promptContentDisplay.value =
        stepData[isDynamic ? "dynamicState" : "staticState"].content;
      paramsTextarea.value = JSON.stringify(
        stepData.dynamicState.parameters,
        null,
        2
      );
      loadPrompts(isDynamic ? "dynamic" : "static");
    }

    radioButtons.forEach((radio) => {
      radio.addEventListener("change", () => {
        maintainScrollPosition(() => {
          const pt = radio.value;
          const custom = pt === "custom";
          const dynamic = pt === "dynamic";

          // Update view without resetting values
          promptSelect.style.display = custom ? "none" : "block";
          promptLabel.style.display = custom ? "none" : "block";
          promptContentDisplay.style.display = custom ? "none" : "block";
          promptContentLabel.style.display = custom ? "none" : "block";
          customPromptTextarea.style.display = custom ? "block" : "none";
          customPromptLabel.style.display = custom ? "block" : "none";
          dynamicNotice.style.display = custom ? "block" : "none";
          paramsLabel.style.display = dynamic && !custom ? "block" : "none";
          paramsTextarea.style.display = dynamic && !custom ? "block" : "none";

          if (custom) {
            customPromptTextarea.value = stepData.customState.customPrompt;
            paramsTextarea.value = JSON.stringify(
              stepData.customState.parameters,
              null,
              2
            );
          } else if (dynamic) {
            promptContentDisplay.value = stepData.dynamicState.content;
            paramsTextarea.value = JSON.stringify(
              stepData.dynamicState.parameters,
              null,
              2
            );
            loadPrompts("dynamic");
          } else {
            promptContentDisplay.value = stepData.staticState.content;
            loadPrompts("static");
          }

          lastStepDefaults.promptType = pt;
          lastStepDefaults.isDynamic = dynamic;
          lastStepDefaults.useCustomPrompt = custom;
          stepData.promptType = pt;
          stepData.isDynamic = dynamic;
          stepData.useCustomPrompt = custom;
        });
      });
    });

    aiModelSelect.addEventListener("change", (e) => {
      lastStepDefaults.aiModel = e.target.value;
      stepData.aiModel = e.target.value;
    });

    newTabCheckbox.addEventListener("change", (e) => {
      lastStepDefaults.openInNewTab = e.target.checked;
      stepData.openInNewTab = e.target.checked;
    });

    customPromptTextarea.addEventListener("input", () => {
      stepData.customState.customPrompt = customPromptTextarea.value;
      lastStepDefaults.customPrompt = customPromptTextarea.value;
      if (/\{[^}]+\}/.test(customPromptTextarea.value)) {
        const placeholders = [
          ...customPromptTextarea.value.matchAll(/\{\{([^}]+)\}\}/g),
        ].map((m) => m[1]);
        const params = {};
        placeholders.forEach(
          (key) => (params[key] = stepData.customState.parameters[key] || "")
        );
        stepData.customState.parameters = params;
        paramsTextarea.value = JSON.stringify(params, null, 2);
      } else {
        stepData.customState.parameters = {};
        paramsTextarea.value = JSON.stringify({}, null, 2);
      }
    });

    promptSelect.addEventListener("change", () => {
      const selId = promptSelect.value;
      const dynamicChecked = radioButtons[1].checked;
      const stateKey = dynamicChecked ? "dynamicState" : "staticState";

      stepData[stateKey].promptId = selId;

      if (!selId) {
        stepData[stateKey].content = "";
        stepData[stateKey].parameters = {};
        promptContentDisplay.value = "";
        paramsTextarea.value = JSON.stringify({}, null, 2);
        return;
      }

      chrome.storage.local.get(null, (data) => {
        let content = null;
        Object.entries(data).forEach(([id, topic]) => {
          if (Array.isArray(topic.prompts)) {
            topic.prompts.forEach((prompt, idx) => {
              if (generatePromptId(id, idx) === selId) content = prompt.content;
            });
          }
        });
        if (content) {
          stepData[stateKey].content = content;
          promptContentDisplay.value = content;
          if (dynamicChecked) {
            const placeholders = [...content.matchAll(/\{\{([^}]+)\}\}/g)].map(
              (m) => m[1]
            );
            const params = {};
            placeholders.forEach(
              (key) =>
                (params[key] = stepData.dynamicState.parameters[key] || "")
            );
            stepData.dynamicState.parameters = params;
            paramsTextarea.value = JSON.stringify(params, null, 2);
          }
        } else {
          stepData[stateKey].content = "";
          stepData[stateKey].parameters = {};
          promptContentDisplay.value = "";
          paramsTextarea.value = JSON.stringify({}, null, 2);
        }
      });
    });

    insertVariableBtn.addEventListener("click", () => {
      const startPos = customPromptTextarea.selectionStart;
      const endPos = customPromptTextarea.selectionEnd;
      const text = customPromptTextarea.value;
      const variableText = "{{variable}}";
      customPromptTextarea.value =
        text.substring(0, startPos) + variableText + text.substring(endPos);
      customPromptTextarea.focus();
      customPromptTextarea.setSelectionRange(
        startPos + variableText.length,
        startPos + variableText.length
      );
      customPromptTextarea.dispatchEvent(new Event("input"));
    });

    stepDiv.querySelector(".remove-step").addEventListener("click", () => {
      if (stepsArray.length <= 1) return;
      const labelNode = container.querySelector(`h2:nth-of-type(${index + 1})`);
      if (labelNode) container.removeChild(labelNode);
      container.removeChild(stepDiv);
      stepsArray.splice(index, 1);
      [...container.children].forEach((child, idx) => {
        if (child.tagName === "H2") {
          child.textContent = `Step ${Math.floor(idx / 2) + 1}:`;
        } else if (child.classList.contains("step-item")) {
          child.dataset.stepIndex = Math.floor(idx / 2);
        }
      });
      updateRemoveButtons();
    });

    stepsArray[index] = { ...stepData, stepDiv };
    updateRemoveButtons();
  };

  steps.forEach((step, idx) => addStepToEdit(step, idx, stepsContainer, steps));

  const addStepBtn = sidebarContent.querySelector("#add-step");
  addStepBtn.addEventListener("click", () => {
    addStepToEdit({}, steps.length, stepsContainer, steps);
    const newStepLabel = stepsContainer.querySelector(
      `h2:nth-of-type(${steps.length})`
    );
    if (newStepLabel) newStepLabel.scrollIntoView({ behavior: "smooth" });
  });

  const saveBtn = sidebarContent.querySelector(".save-btn");
  const cancelBtn = sidebarContent.querySelector(".cancel-btn");

  saveBtn.addEventListener("click", async () => {
    try {
      const data = await new Promise((resolve) => {
        chrome.storage.local.get(["prompts", "folders"], (result) =>
          resolve(result)
        );
      });

      const prompts = data.prompts || {};
      const folders = data.folders || {};

      const updatedWorkflow = {
        ...workflow,
        name: sidebarContent.querySelector("#edit-name").value.trim(),
        steps: await Promise.all(
          steps.map(async (_, index) => {
            const idx = _.stepDiv.dataset.stepIndex;
            const sd = _.stepDiv;
            const title = sd.querySelector(".step-title").value.trim();
            const pType = sd.querySelector(
              `input[name="prompt-type-${idx}"]:checked`
            )?.value;
            const isDyn =
              pType === "dynamic" ||
              (pType === "custom" &&
                /\{[^}]+\}/.test(_.customState.customPrompt));
            const useCust = pType === "custom";
            const aiModel = sd.querySelector(".step-ai-model").value;
            const openInNewTab = sd.querySelector(".step-new-tab").checked;

            let promptId, customPrompt, parameters;

            if (useCust) {
              promptId = `${Date.now()}_${generateUUID()}`;
              customPrompt = _.customState.customPrompt;
              parameters = _.customState.parameters;

              const now = Date.now();
              const newPrompt = {
                promptId,
                title:
                  customPrompt.length > 5
                    ? customPrompt.substring(0, 5)
                    : customPrompt,
                description: "",
                content: customPrompt,
                type: "text",
                compatibleModels: [],
                incompatibleModels: [],
                tags: [],
                isFavorite: false,
                folderId: null,
                createdAt: now,
                updatedAt: now,
                usageCount: 0,
                lastUsed: null,
                notes: "",
                versions: [
                  {
                    versionId: `${Date.now()}_${generateUUID()}`,
                    title: customPrompt.substring(0, 20),
                    description: "",
                    content: customPrompt,
                    timestamp: now,
                  },
                ],
                metaChangeLog: [
                  {
                    timestamp: now,
                    changes: {
                      title: { from: null, to: customPrompt },
                      description: { from: null, to: "" },
                      content: { from: null, to: customPrompt },
                      type: { from: null, to: "text" },
                      compatibleModels: { from: [], to: [] },
                      incompatibleModels: { from: [], to: [] },
                      tags: { from: [], to: [] },
                      isFavorite: { from: false, to: false },
                      folderId: { from: null, to: null },
                      folderName: { from: null, to: null },
                      notes: { from: null, to: "" },
                    },
                  },
                ],
                performanceHistory: [],
              };

              // speichern unter prompts[promptId]
              prompts[promptId] = newPrompt;
            } else if (pType === "dynamic") {
              promptId = _.dynamicState.promptId;
              customPrompt = null;
              parameters = _.dynamicState.parameters;
            } else {
              promptId = _.staticState.promptId;
              customPrompt = null;
              parameters = {};
            }

            if (!aiModel)
              throw new Error(`Step ${+idx + 1}: No AI model chosen`);
            if (!promptId && !useCust)
              throw new Error(`Step ${+idx + 1}: No prompt selected/provided`);

            // prüfen ob promptId existiert (bei static/dynamic)
            if (!useCust && !prompts[promptId]) {
              throw new Error(
                `Step ${+idx + 1}: Invalid prompt ID (${promptId})`
              );
            }

            return {
              title: title || `Step ${+idx + 1}`,
              aiModel,
              openInNewTab,
              isDynamic: isDyn,
              useCustomPrompt: useCust,
              promptType: pType,
              parameters,
              promptId,
              customPrompt,
              isHidden: false,
            };
          })
        ),
      };

      // Save updated prompts + workflow
      await new Promise((resolve, reject) => {
        chrome.storage.local.set(
          { prompts, [workflowId]: updatedWorkflow },
          () => {
            if (chrome.runtime.lastError) {
              console.error("Error saving workflow:", chrome.runtime.lastError);
              reject(new Error("Error saving workflow."));
            } else {
              resolve();
            }
          }
        );
      });

      showDetailsSidebar(
        { type: "Workflow", folderId: workflowId },
        workflowId
      );
      handleCategoryClick("Workflows");
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  });

  cancelBtn.addEventListener("click", () => {
    showDetailsSidebar({ type: "Workflow", folderId: workflowId }, workflowId);
  });
}

function addStepToEdit(stepData, index, stepsContainer, steps) {
  const stepDiv = document.createElement("div");
  stepDiv.className = "step-item";
  stepDiv.dataset.stepIndex = index;

  // Standardmäßig dynamisch, falls nicht anders angegeben
  const isDynamic = stepData.isDynamic !== false;

  stepDiv.innerHTML = `
    <label>Step Title</label>
    <input type="text" class="step-title" value="${
      stepData.title || ""
    }" placeholder="Enter step title">
    <label>Prompt Type</label>
    <div class="prompt-type">
      <label for="static">Static</label><input type="radio" id="static" name="prompt-type-${index}" value="static" ${
    !isDynamic ? "checked" : ""
  }> 
      <label for="dynamic">Dynamic</label><input type="radio" id="dynamic" name="prompt-type-${index}" value="dynamic" ${
    isDynamic ? "checked" : ""
  }> 
    </div>
    <label>Select Prompt</label>
    <select class="step-prompt"></select>
    <label class="params-label" style="display: ${
      isDynamic ? "block" : "none"
    }">Parameters (JSON)</label>
    <textarea class="step-params" readonly style="display: ${
      isDynamic ? "block" : "none"
    }" placeholder='{"key": "value"}'>${JSON.stringify(
    stepData.parameters || {},
    null,
    2
  )}</textarea>
    <button class="action-btn remove-step">Remove Step</button>
  `;

  const promptSelect = stepDiv.querySelector(".step-prompt");
  const paramsTextarea = stepDiv.querySelector(".step-params");
  const paramsLabel = stepDiv.querySelector(".params-label");
  const radioButtons = stepDiv.querySelectorAll(
    'input[name="prompt-type-' + index + '"]'
  );

  // Funktion zum Laden der Prompts basierend auf dem Typ
  const loadPrompts = (type) => {
    chrome.storage.local.get(["prompts"], (data) => {
      promptSelect.innerHTML = ""; // Leere das Select-Feld
      const promptsById = data.prompts || {};
      const prompts = [];

      // Alle Prompts nach Typ filtern
      Object.entries(promptsById).forEach(([promptId, prompt]) => {
        const isDynamicPrompt =
          typeof prompt.content === "string" &&
          /\{\{[^}]+\}\}/.test(prompt.content);

        if (
          (type === "dynamic" && isDynamicPrompt) ||
          (type === "static" && !isDynamicPrompt)
        ) {
          prompts.push({
            id: promptId,
            title: prompt.title || "Untitled Prompt",
            content: prompt.content,
          });
        }
      });

      // Default-Option einfügen
      const defaultOption = document.createElement("option");
      defaultOption.value = "";
      defaultOption.textContent = "Select a prompt";
      promptSelect.appendChild(defaultOption);

      // Optionen hinzufügen
      prompts.forEach((prompt) => {
        const option = document.createElement("option");
        option.value = prompt.id;
        option.textContent = prompt.title;
        if (stepData.promptId === prompt.id) {
          option.selected = true;
        }
        promptSelect.appendChild(option);
      });
    });
  };

  // Initiale Prompt-Liste laden
  loadPrompts(isDynamic ? "dynamic" : "static");

  // Event-Listener für Radio-Buttons
  radioButtons.forEach((radio) => {
    radio.addEventListener("change", () => {
      const selectedType = radio.value;
      paramsLabel.style.display = selectedType === "dynamic" ? "block" : "none";
      paramsTextarea.style.display =
        selectedType === "dynamic" ? "block" : "none";
      if (selectedType === "static") {
        paramsTextarea.value = JSON.stringify({}, null, 2); // JSON zurücksetzen
      }
      loadPrompts(selectedType);
    });
  });

  // Event-Listener für Prompt-Auswahl
  promptSelect.addEventListener("change", () => {
    const selectedPromptId = promptSelect.value;

    if (selectedPromptId && isDynamic) {
      chrome.storage.local.get(["prompts"], (data) => {
        const promptsById = data.prompts || {};
        const selectedPrompt = promptsById[selectedPromptId];

        if (
          selectedPrompt &&
          typeof selectedPrompt.content === "string" &&
          /\{\{[^}]+\}\}/.test(selectedPrompt.content)
        ) {
          // Extrahiere Platzhalter
          const placeholders = [
            ...selectedPrompt.content.matchAll(/\{\{([^}]+)\}\}/g),
          ].map((match) => match[1]);

          // Erstelle JSON-Objekt aus Platzhaltern
          const params = placeholders.reduce((obj, key) => {
            obj[key] = "";
            return obj;
          }, {});

          paramsTextarea.value = JSON.stringify(params, null, 2);
        } else {
          paramsTextarea.value = JSON.stringify({}, null, 2);
        }
      });
    } else {
      paramsTextarea.value = JSON.stringify({}, null, 2);
    }
  });

  // Trigger change event if a prompt is already selected
  if (stepData.promptId && !stepData.parameters && isDynamic) {
    promptSelect.dispatchEvent(new Event("change"));
  }

  const removeBtn = stepDiv.querySelector(".remove-step");
  removeBtn.addEventListener("click", () => {
    stepsContainer.removeChild(stepDiv);
    steps.splice(index, 1);
    // Update indices of remaining steps
    stepsContainer.querySelectorAll(".step-item").forEach((div, idx) => {
      div.dataset.stepIndex = idx;
    });
  });

  stepsContainer.appendChild(stepDiv);
  steps[index] = { ...stepData, stepDiv, isDynamic };
}
