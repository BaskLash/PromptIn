function exportVersionHistoryAsHtml(prompt) {
  if (!prompt || !prompt.versions) return;

  const versions = prompt.versions
    .slice()
    .sort((a, b) => b.timestamp - a.timestamp);

  let htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Prompt Version History</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; color: #2c3e50; }
    h1 { color: #1e90ff; }
    h2 { color: #34495e; border-bottom: 2px solid #1e90ff; padding-bottom: 8px; }
    .version { margin-bottom: 30px; padding: 20px; background: #f8f9fa; border-radius: 8px; }
    .version p { margin: 8px 0; }
    .label { font-weight: bold; color: #34495e; }
  </style>
</head>
<body>
  <h1>Prompt Version History: ${prompt.title || "Untitled"}</h1>
`;

  versions.forEach((version, index) => {
    const versionNumber = versions.length - index;
    const timestamp = new Date(version.timestamp).toLocaleString();
    htmlContent += `
  <div class="version">
    <h2>Version ${versionNumber} - ${timestamp}</h2>
    <p><span class="label">Title:</span> ${version.title || "None"}</p>
    <p><span class="label">Description:</span> ${
      version.description || "None"
    }</p>
    <p><span class="label">Content:</span> ${version.content || "None"}</p>
  </div>
`;
  });

  htmlContent += `
</body>
</html>
`;

  const blob = new Blob([htmlContent], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `prompt_version_history_${Date.now()}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
function exportVersionHistoryAsJson(prompt) {
  if (!prompt || !prompt.versions) return;

  const exportData = {
    title: prompt.title || "Untitled",
    versions: prompt.versions
      .slice()
      .sort((a, b) => b.timestamp - a.timestamp)
      .map((version, index) => ({
        versionNumber: prompt.versions.length - index,
        title: version.title || "None",
        description: version.description || "None",
        content: version.content || "None",
        timestamp: new Date(version.timestamp).toLocaleString(),
      })),
  };

  const jsonContent = JSON.stringify(exportData, null, 2);
  const blob = new Blob([jsonContent], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `prompt_version_history_${Date.now()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
function escapeLatex(str) {
  if (!str) return "";
  return str
    .replace(/([\\{}&$%#_\^~])/g, "\\$1")
    .replace(/</g, "\\textless{}")
    .replace(/>/g, "\\textgreater{}")
    .replace(/"/g, "\\textquotedbl{}")
    .replace(/'/g, "\\textquotesingle{}")
    .replace(/\n/g, "\\\\");
}

function exportVersionHistory(prompt) {
  if (!prompt || !prompt.versions) return;

  const versions = prompt.versions
    .slice()
    .sort((a, b) => b.timestamp - a.timestamp);

  let latexContent = `
\\documentclass[a4paper,12pt]{article}
\\usepackage[utf8]{inputenc}
\\usepackage[T1]{fontenc}
\\usepackage{geometry}
\\geometry{margin=2cm}
\\usepackage{parskip}
\\usepackage{datetime2}
\\usepackage{xcolor}
\\definecolor{headercolor}{RGB}{30,144,255}
\\title{Prompt Version History}
\\author{}
\\date{}

\\begin{document}
\\maketitle
\\section*{Prompt: ${escapeLatex(prompt.title || "Untitled")}}
`;

  versions.forEach((version, index) => {
    const versionNumber = versions.length - index;
    const timestamp = new Date(version.timestamp).toLocaleString();
    latexContent += `
\\subsection*{Version ${versionNumber} -- ${escapeLatex(timestamp)}}
\\textbf{Title:} ${escapeLatex(version.title || "None")}\\\\
\\textbf{Description:} ${escapeLatex(version.description || "None")}\\\\
\\textbf{Content:} ${escapeLatex(version.content || "None")}\\\\
`;
  });

  latexContent += `
\\end{document}
`;

  // Trigger download
  const blob = new Blob([latexContent], { type: "text/x-tex" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `prompt_version_history_${Date.now()}.tex`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
