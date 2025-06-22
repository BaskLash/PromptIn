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
    const customPrompt = stepData.customPrompt ?? lastStepConfig.customPrompt;

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
      <label class="custom-prompt-text-label" style="display: ${
        useCustomPrompt ? "block" : "none"
      }">Custom Prompt</label>
      <textarea class="step-custom-prompt-text" style="display: ${
        useCustomPrompt ? "block" : "none"
      }" placeholder="Enter custom prompt">${customPrompt}</textarea>
      <label class="params-label" style="display: ${
        isDynamic && !useCustomPrompt ? "block" : "none"
      }">Parameters (JSON)</label>
      <textarea class="step-params" style="display: ${
        isDynamic && !useCustomPrompt ? "block" : "none"
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

    // Set AI model for the step
    if (stepData.aiModel) {
      aiModelSelect.value = stepData.aiModel;
    } else if (lastStepConfig.aiModel && aiOptions[lastStepConfig.aiModel]) {
      aiModelSelect.value = lastStepConfig.aiModel;
    }

    const loadPrompts = (type) => {
      chrome.storage.local.get(null, (data) => {
        promptSelect.innerHTML = "";
        const defaultOption = document.createElement("option");
        defaultOption.value = "";
        defaultOption.textContent = "Select a prompt";
        promptSelect.appendChild(defaultOption);

        Object.entries(data).forEach(([id, topic]) => {
          if (topic.prompts && Array.isArray(topic.prompts)) {
            topic.prompts.forEach((prompt, idx) => {
              const isDynamicPrompt =
                typeof prompt.content === "string" &&
                /\{[^}]+\}/.test(prompt.content);
              if (
                (type === "dynamic" && isDynamicPrompt) ||
                (type === "static" && !isDynamicPrompt)
              ) {
                const option = document.createElement("option");
                option.value = generatePromptId(id, idx);
                option.textContent = prompt.title || `Prompt ${idx + 1}`;
                if (stepData.promptId === option.value) option.selected = true;
                promptSelect.appendChild(option);
              }
            });
          }
        });
      });
    };

    loadPrompts(isDynamic && !useCustomPrompt ? "dynamic" : "static");

    radioButtons.forEach((radio) => {
      radio.addEventListener("change", () => {
        const selectedType = radio.value;
        const isCustom = selectedType === "custom";
        const dynamic = selectedType === "dynamic";
        promptSelect.style.display = isCustom ? "none" : "block";
        promptLabel.style.display = isCustom ? "none" : "block";
        customPromptTextarea.style.display = isCustom ? "block" : "none";
        customPromptLabel.style.display = isCustom ? "block" : "none";
        paramsLabel.style.display = dynamic && !isCustom ? "block" : "none";
        paramsTextarea.style.display = dynamic && !isCustom ? "block" : "none";
        if (!dynamic && !isCustom) {
          paramsTextarea.value = JSON.stringify({}, null, 2);
        }
        if (!isCustom) {
          loadPrompts(selectedType);
        }
        lastStepConfig.isDynamic = dynamic;
        lastStepConfig.useCustomPrompt = isCustom;
        if (isCustom) {
          paramsTextarea.value = JSON.stringify({}, null, 2);
        }
      });
    });

    promptSelect.addEventListener("change", () => {
      const selectedPromptId = promptSelect.value;
      if (!selectedPromptId || radioButtons[2].checked) return;
      const dynamicChecked = radioButtons[1].checked;

      if (!dynamicChecked) return;

      chrome.storage.local.get(null, (data) => {
        let selectedPromptContent = null;

        Object.entries(data).forEach(([id, topic]) => {
          if (topic.prompts && Array.isArray(topic.prompts)) {
            topic.prompts.forEach((prompt, idx) => {
              if (generatePromptId(id, idx) === selectedPromptId) {
                selectedPromptContent = prompt.content;
              }
            });
          }
        });

        if (selectedPromptContent) {
          const placeholders = [
            ...selectedPromptContent.matchAll(/\{[^}]+\}/g),
          ].map((m) => m[1]);
          const params = {};
          placeholders.forEach((key) => (params[key] = ""));
          paramsTextarea.value = JSON.stringify(params, null, 2);
        }
      });
    });

    aiModelSelect.addEventListener("change", () => {
      if (steps.length > 0) {
        lastStepConfig.aiModel = aiModelSelect.value;
      }
    });

    newTabCheckbox.addEventListener("change", () => {
      if (steps.length > 0) {
        lastStepConfig.openInNewTab = newTabCheckbox.checked;
      }
    });

    customPromptTextarea.addEventListener("input", () => {
      lastStepConfig.customPrompt = customPromptTextarea.value;
    });

    stepDiv.querySelector(".remove-step").addEventListener("click", () => {
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
    });

    stepsContainer.appendChild(stepDiv);
    steps[index] = {
      ...stepData,
      stepDiv,
      isDynamic,
      useCustomPrompt,
      customPrompt,
      aiModel: aiModelSelect.value,
      openInNewTab: newTabCheckbox.checked,
    };
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
      lastStepConfig.customPrompt = lastStepDiv.querySelector(
        ".step-custom-prompt-text"
      ).value;
    }
    addStep({}, steps.length);
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const name = form.querySelector("#workflow-name").value.trim();

    try {
      const workflowSteps = steps.map((_, index) => {
        const stepDiv = stepsContainer.querySelector(
          `[data-step-index="${index}"]`
        );
        const title = stepDiv.querySelector(".step-title").value.trim();
        const promptId = stepDiv.querySelector(".step-prompt").value;
        const customPrompt = stepDiv
          .querySelector(".step-custom-prompt-text")
          .value.trim();
        const isDynamic =
          stepDiv.querySelector(`input[name="prompt-type-${index}"]:checked`)
            ?.value === "dynamic" || customPrompt;
        const useCustomPrompt =
          stepDiv.querySelector(`input[name="prompt-type-${index}"]:checked`)
            ?.value === "custom";
        const params = isDynamic
          ? JSON.parse(
              stepDiv.querySelector(".step-params").value.trim() || "{}"
            )
          : {};
        const stepAIModel = stepDiv.querySelector(".step-ai-model").value;
        const openInNewTab = stepDiv.querySelector(".step-new-tab").checked;

        if (!promptId && !useCustomPrompt) {
          throw new Error(
            `Step ${index + 1}: No prompt selected or custom prompt provided`
          );
        }
        if (!stepAIModel) {
          throw new Error(`Step ${index + 1}: No AI model selected`);
        }

        return {
          title: title || `Step ${index + 1}`,
          promptId: useCustomPrompt ? null : promptId,
          customPrompt: useCustomPrompt ? customPrompt : null,
          parameters: params,
          isDynamic,
          aiModel: stepAIModel,
          openInNewTab,
        };
      });

      const workflowId = `workflow_${Date.now()}`;
      const newWorkflow = {
        name,
        steps: workflowSteps,
        createdAt: Date.now(),
        lastUsed: null,
      };

      chrome.storage.local.set({ [workflowId]: newWorkflow }, () => {
        if (chrome.runtime.lastError) {
          console.error("Error saving workflow:", chrome.runtime.lastError);
          alert("Fehler beim Speichern.");
        } else {
          modal.remove();
          handleCategoryClick("Workflows");
        }
      });
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
    };
  };

  closeSpan.onclick = () => {
    resetConfig();
    modal.remove();
  };

  window.onclick = (e) => {
    if (e.target === modal) {
      resetConfig();
      modal.remove();
    }
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
function editWorkflowDetails(workflowId, workflow, sidebarContent) {
  const aiOptions = {
    grok: { name: "Grok" },
    gemini: { name: "Gemini" },
    chatgpt: { name: "ChatGPT" },
    claude: { name: "Claude" },
    blackbox: { name: "BlackBox" },
    githubCopilot: { name: "GitHub Copilot" },
    microsoftCopilot: { name: "Microsoft Copilot" },
    mistral: { name: "Mistral" },
    duckduckgo: { name: "DuckDuckGo" },
    perplexity: { name: "Perplexity" },
    deepseek: { name: "DeepSeek" },
    deepai: { name: "Deepai" },
    qwenAi: { name: "Qwen AI" },
  };

  sidebarContent.innerHTML = `
    <label>Name</label>
    <input type="text" value="${workflow.name || ""}" id="edit-name">
    <label>AI Model</label>
    <select id="edit-ai-model">
      ${Object.keys(aiOptions)
        .map(
          (key) => `
          <option value="${key}" ${
            workflow.aiModel === key ? "selected" : ""
          }>${aiOptions[key].name}</option>
        `
        )
        .join("")}
    </select>
    <label>Steps</label>
    <div id="edit-steps"></div>
    <button class="action-btn" id="add-step">Add Step</button>
    <button class="save-btn">Save</button>
    <button class="cancel-btn">Cancel</button>
  `;

  const stepsContainer = sidebarContent.querySelector("#edit-steps");
  let steps = workflow.steps.map((step) => ({ ...step }));

  steps.forEach((step, index) => {
    addStepToEdit(step, index, stepsContainer, steps);
  });

  const addStepBtn = sidebarContent.querySelector("#add-step");
  addStepBtn.addEventListener("click", () => {
    addStepToEdit({}, steps.length, stepsContainer, steps);
  });

  const saveBtn = sidebarContent.querySelector(".save-btn");
  const cancelBtn = sidebarContent.querySelector(".cancel-btn");

  saveBtn.addEventListener("click", () => {
    const updatedWorkflow = {
      ...workflow,
      name: sidebarContent.querySelector("#edit-name").value.trim(),
      aiModel: sidebarContent.querySelector("#edit-ai-model").value,
      steps: steps.map((step, index) => {
        const stepDiv = stepsContainer.querySelector(
          `[data-step-index="${index}"]`
        );
        try {
          const isDynamic =
            stepDiv.querySelector(`input[name="prompt-type-${index}"]:checked`)
              ?.value === "dynamic";
          const promptId = stepDiv.querySelector(".step-prompt").value;

          // Validierung der promptId
          if (
            !promptId &&
            !stepDiv
              .querySelector(".step-prompt option:checked")
              .textContent.includes("Select a prompt")
          ) {
            alert(`Please select a valid prompt for step ${index + 1}.`);
            throw new Error(`Invalid prompt for step ${index + 1}`);
          }

          return {
            ...step,
            title:
              stepDiv.querySelector(".step-title").value.trim() ||
              `Step ${index + 1}`,
            promptId: promptId || null,
            parameters: isDynamic
              ? JSON.parse(
                  stepDiv.querySelector(".step-params").value.trim() || "{}"
                )
              : {},
            isDynamic,
          };
        } catch (e) {
          if (e.message.includes("Invalid prompt")) {
            throw e; // Abbruch, wenn kein Prompt ausgewählt
          }
          alert(
            `Invalid JSON in parameters for step ${index + 1}: ${e.message}`
          );
          throw e;
        }
      }),
    };

    chrome.storage.local.set({ [workflowId]: updatedWorkflow }, () => {
      if (chrome.runtime.lastError) {
        console.error("Error saving workflow:", chrome.runtime.lastError);
        alert("Error saving workflow.");
      } else {
        // Korrektes Objekt für showDetailsSidebar
        showDetailsSidebar(
          { type: "Workflow", folderId: workflowId },
          workflowId
        );
        // Refresh the table
        handleCategoryClick("Workflows");
      }
    });
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
    <textarea class="step-params" style="display: ${
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
    chrome.storage.local.get(null, (data) => {
      promptSelect.innerHTML = ""; // Leere das Select-Feld
      const prompts = [];

      Object.entries(data).forEach(([id, topic]) => {
        if (topic.prompts && Array.isArray(topic.prompts)) {
          topic.prompts.forEach((prompt, idx) => {
            const isDynamicPrompt =
              typeof prompt.content === "string" &&
              /\{[^}]+\}/.test(prompt.content);
            if (
              (type === "dynamic" && isDynamicPrompt) ||
              (type === "static" && !isDynamicPrompt)
            ) {
              prompts.push({
                id: `${id}_${idx}`,
                title: prompt.title || `Prompt ${idx + 1}`,
                content: prompt.content,
              });
            }
          });
        }
      });

      const defaultOption = document.createElement("option");
      defaultOption.value = "";
      defaultOption.textContent = "Select a prompt";
      promptSelect.appendChild(defaultOption);

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
      chrome.storage.local.get(null, (data) => {
        const prompts = [];
        Object.entries(data).forEach(([id, topic]) => {
          if (topic.prompts && Array.isArray(topic.prompts)) {
            topic.prompts.forEach((prompt, idx) => {
              if (
                typeof prompt.content === "string" &&
                /\{[^}]+\}/.test(prompt.content)
              ) {
                prompts.push({
                  id: `${id}_${idx}`,
                  content: prompt.content,
                });
              }
            });
          }
        });

        const selectedPrompt = prompts.find((p) => p.id === selectedPromptId);
        if (selectedPrompt && selectedPrompt.content) {
          // Extrahiere Platzhalter
          const placeholders = [
            ...selectedPrompt.content.matchAll(/\{([^}]+)\}/g),
          ].map((match) => match[1]);
          // Erstelle JSON-Objekt
          const params = placeholders.reduce((obj, key) => {
            obj[key] = "";
            return obj;
          }, {});
          paramsTextarea.value = JSON.stringify(params, null, 2);
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
