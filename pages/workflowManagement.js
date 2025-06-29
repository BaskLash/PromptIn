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
    const parameters = stepData.parameters ?? lastStepConfig.parameters;

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
          customPromptTextarea.style.display = isCustom ? "block" : "none";
          customPromptLabel.style.display = isCustom ? "block" : "none";
          paramsLabel.style.display = dynamic && !isCustom ? "block" : "none";
          paramsTextarea.style.display =
            dynamic && !isCustom ? "block" : "none";
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
    });

    promptSelect.addEventListener("change", () => {
      const selectedPromptId = promptSelect.value;
      const dynamicChecked = radioButtons[1].checked;

      if (!selectedPromptId || radioButtons[2].checked) {
        paramsTextarea.value = JSON.stringify({}, null, 2);
        lastStepConfig.parameters = {};
        steps[index].parameters = {};
        return;
      }

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
      lastStepConfig.parameters = JSON.parse(
        lastStepDiv.querySelector(".step-params").value.trim() || "{}"
      );
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
            const promptTitle =
              customPrompt.length > 5
                ? customPrompt.substring(0, 5)
                : customPrompt;
            const newPrompt = {
              id: generateUUID(),
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
                  versionId: generateUUID(),
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

            const targetFolderId = `single_prompt_${Date.now()}_${index}`;
            const newTopic = {
              name: "Single Prompt",
              prompts: [newPrompt],
              isHidden: true,
              isTrash: false,
            };

            await new Promise((resolve, reject) => {
              chrome.storage.local.set({ [targetFolderId]: newTopic }, () => {
                if (chrome.runtime.lastError) {
                  console.error(
                    `Error saving custom prompt for Step ${index + 1}:`,
                    chrome.runtime.lastError
                  );
                  reject(
                    new Error(`Step ${index + 1}: Error saving custom prompt`)
                  );
                } else {
                  resolve();
                }
              });
            });

            // Verwende folderId-basiertes promptId-Format
            step.promptId = `${targetFolderId}_0`;
            step.customPrompt = customPrompt;
            step.isHidden = true;
          } else {
            step.promptId = promptId;
            step.isHidden = false;
          }

          return step;
        })
      );

      const workflowId = `workflow_${Date.now()}`;
      const newWorkflow = {
        name,
        steps: workflowSteps,
        createdAt: Date.now(),
        lastUsed: null,
      };

      await new Promise((resolve, reject) => {
        chrome.storage.local.set({ [workflowId]: newWorkflow }, () => {
          if (chrome.runtime.lastError) {
            console.error("Error saving workflow:", chrome.runtime.lastError);
            reject(new Error("Fehler beim Speichern."));
          } else {
            chrome.storage.local.get(workflowId, (result) => {
              console.log("Saved Workflow in chrome.storage.local:", result);
            });
            resolve();
          }
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
    const pos = sidebar.scrollTop;
    cb();
    sidebar.scrollTop = pos;
  };

  const stepsContainer = sidebarContent.querySelector("#edit-steps");
  let steps = workflow.steps.map((s) => ({ ...s }));

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

    const stepDiv = document.createElement("div");
    stepDiv.className = "step-item";
    stepDiv.dataset.stepIndex = index;

    const isDynamic =
      stepData.promptType === "dynamic" || stepData.isDynamic === true;
    const useCustomPrompt =
      stepData.promptType === "custom" || stepData.useCustomPrompt === true;

    container.appendChild(document.createElement("h2")).textContent = `Step ${
      index + 1
    }:`;

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
      <textarea class="step-prompt-content" readonly style="display: ${
        useCustomPrompt ? "none" : "block"
      }" placeholder="Prompt content will appear here"></textarea>
      <label class="custom-prompt-text-label" style="display: ${
        useCustomPrompt ? "block" : "none"
      }">Custom Prompt</label>
      <textarea class="step-custom-prompt-text" style="display: ${
        useCustomPrompt ? "block" : "none"
      }" placeholder="Enter custom prompt">${
      stepData.customPrompt || ""
    }</textarea>
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
    const promptContentTextarea = stepDiv.querySelector(".step-prompt-content");
    const paramsTextarea = stepDiv.querySelector(".step-params");
    const paramsLabel = stepDiv.querySelector(".params-label");
    const customPromptTextarea = stepDiv.querySelector(
      ".step-custom-prompt-text"
    );
    const customPromptLabel = stepDiv.querySelector(
      ".custom-prompt-text-label"
    );
    const promptLabel = stepDiv.querySelector(".prompt-label");
    const promptContentLabel = stepDiv.querySelector(".prompt-content-label");

    if (stepData.aiModel) {
      aiModelSelect.value = stepData.aiModel;
    }

    const loadPrompts = (type) => {
      chrome.storage.local.get(null, (data) => {
        promptSelect.innerHTML = "";
        const defaultOption = document.createElement("option");
        defaultOption.value = "";
        defaultOption.textContent = "Select a prompt";
        defaultOption.disabled = true;
        defaultOption.selected = !stepData.promptId;
        promptSelect.appendChild(defaultOption);

        Object.entries(data).forEach(([id, topic]) => {
          if (Array.isArray(topic.prompts)) {
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

        if (stepData.promptId) {
          promptSelect.value = stepData.promptId;
          promptSelect.dispatchEvent(new Event("change"));
        }
      });
    };

    loadPrompts(isDynamic && !useCustomPrompt ? "dynamic" : "static");

    radioButtons.forEach((radio) => {
      radio.addEventListener("change", () => {
        maintainScrollPosition(() => {
          const pt = radio.value;
          const custom = pt === "custom";
          const dynamic = pt === "dynamic";

          promptSelect.style.display = custom ? "none" : "block";
          promptLabel.style.display = custom ? "none" : "block";
          promptContentTextarea.style.display = custom ? "none" : "block";
          promptContentLabel.style.display = custom ? "none" : "block";
          customPromptTextarea.style.display = custom ? "block" : "none";
          customPromptLabel.style.display = custom ? "block" : "none";
          paramsLabel.style.display = dynamic && !custom ? "block" : "none";
          paramsTextarea.style.display = dynamic && !custom ? "block" : "none";
          if (!dynamic || custom) {
            paramsTextarea.value = JSON.stringify({}, null, 2);
          }

          if (!custom) loadPrompts(pt);
          if (custom) {
            promptContentTextarea.value = "";
            paramsTextarea.value = JSON.stringify({}, null, 2);
          }

          lastStepDefaults.promptType = pt;
          lastStepDefaults.isDynamic = dynamic;
          lastStepDefaults.useCustomPrompt = custom;
        });
      });
    });

    aiModelSelect.addEventListener("change", (e) => {
      lastStepDefaults.aiModel = e.target.value;
    });

    newTabCheckbox.addEventListener("change", (e) => {
      lastStepDefaults.openInNewTab = e.target.checked;
    });

    customPromptTextarea.addEventListener("input", () => {
      lastStepDefaults.customPrompt = customPromptTextarea.value;
    });

    promptSelect.addEventListener("change", () => {
      const selId = promptSelect.value;
      if (!selId || radioButtons[2].checked) {
        promptContentTextarea.value = "";
        paramsTextarea.value = JSON.stringify({}, null, 2);
        return;
      }

      const dynamicChecked = radioButtons[1].checked;
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
          promptContentTextarea.value = content;
          if (dynamicChecked) {
            const placeholders = [...content.matchAll(/\{\{([^}]+)\}\}/g)].map(
              (m) => m[1]
            );
            const params = stepData.parameters || {};
            placeholders.forEach((k) => {
              if (!(k in params)) params[k] = "";
            });
            paramsTextarea.value = JSON.stringify(params, null, 2);
          } else {
            paramsTextarea.value = JSON.stringify({}, null, 2);
          }
        } else {
          promptContentTextarea.value = "";
          paramsTextarea.value = JSON.stringify({}, null, 2);
        }
      });
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
        chrome.storage.local.get(null, (result) => resolve(result));
      });

      const updatedWorkflow = {
        ...workflow,
        name: sidebarContent.querySelector("#edit-name").value.trim(),
        steps: await Promise.all(
          steps.map(async (_, index) => {
            const idx = _.stepDiv.dataset.stepIndex;
            const sd = _.stepDiv;
            const title = sd.querySelector(".step-title").value.trim();
            const promptId = sd.querySelector(".step-prompt").value;
            const customPrompt = sd
              .querySelector(".step-custom-prompt-text")
              .value.trim();
            const pType = sd.querySelector(
              `input[name="prompt-type-${idx}"]:checked`
            )?.value;
            const isDyn =
              pType === "dynamic" ||
              (pType === "custom" && /\{[^}]+\}/.test(customPrompt));
            const useCust = pType === "custom";
            let parameters = {};
            if (isDyn && !useCust) {
              try {
                parameters = JSON.parse(
                  sd.querySelector(".step-params").value.trim() || "{}"
                );
              } catch (err) {
                throw new Error(`Step ${+idx + 1}: Invalid JSON parameters`);
              }
            } else if (useCust && isDyn) {
              const placeholders = [
                ...customPrompt.matchAll(/\{\{([^}]+)\}\}/g),
              ].map((m) => m[1]);
              placeholders.forEach((key) => (parameters[key] = ""));
            }
            const aiModel = sd.querySelector(".step-ai-model").value;
            const openInNewTab = sd.querySelector(".step-new-tab").checked;

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
              parameters,
              promptType: pType,
            };

            if (useCust) {
              const promptTitle =
                customPrompt.length > 5
                  ? customPrompt.substring(0, 5)
                  : customPrompt;
              const newPrompt = {
                id: generateUUID(),
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
                    versionId: generateUUID(),
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

              const targetFolderId = `single_prompt_${Date.now()}_${index}`;
              const newTopic = {
                name: "Single Prompt",
                prompts: [newPrompt],
                isHidden: true,
                isTrash: false,
              };

              await new Promise((resolve, reject) => {
                chrome.storage.local.set({ [targetFolderId]: newTopic }, () => {
                  if (chrome.runtime.lastError) {
                    console.error(
                      `Error saving custom prompt for Step ${+idx + 1}:`,
                      chrome.runtime.lastError
                    );
                    reject(
                      new Error(`Step ${+idx + 1}: Error saving custom prompt`)
                    );
                  } else {
                    resolve();
                  }
                });
              });

              step.promptId = `${targetFolderId}_0`;
              step.customPrompt = customPrompt;
              step.isHidden = true;
            } else {
              let promptExists = false;
              Object.entries(data).forEach(([id, topic]) => {
                if (Array.isArray(topic.prompts)) {
                  topic.prompts.forEach((prompt, idx) => {
                    if (generatePromptId(id, idx) === promptId) {
                      promptExists = true;
                    }
                  });
                }
              });

              if (!promptExists) {
                throw new Error(
                  `Step ${+idx + 1}: Invalid prompt ID (${promptId})`
                );
              }

              step.promptId = promptId;
              step.customPrompt = null;
              step.isHidden = false;
            }

            return step;
          })
        ),
      };

      await new Promise((resolve, reject) => {
        chrome.storage.local.set({ [workflowId]: updatedWorkflow }, () => {
          if (chrome.runtime.lastError) {
            console.error("Error saving workflow:", chrome.runtime.lastError);
            reject(new Error("Error saving workflow."));
          } else {
            resolve();
          }
        });
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
            ...selectedPrompt.content.matchAll(/\{\{([^}]+)\}\}/g),
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
