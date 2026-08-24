import React, { useRef } from "react";
import { Download, FileText, Code, Printer, Upload, X } from "lucide-react";

export default function ExportModal({
  isOpen,
  title = "Document",
  htmlContent = "",
  onImportContent,
  onClose
}) {
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  // Convert HTML to simple markdown
  const htmlToMarkdown = (html) => {
    let md = html
      .replace(/<h1>(.*?)<\/h1>/gi, "# $1\n\n")
      .replace(/<h2>(.*?)<\/h2>/gi, "## $1\n\n")
      .replace(/<h3>(.*?)<\/h3>/gi, "### $1\n\n")
      .replace(/<blockquote>(.*?)<\/blockquote>/gi, "> $1\n\n")
      .replace(/<pre><code>(.*?)<\/code><\/pre>/gi, "```\n$1\n```\n\n")
      .replace(/<ul>(.*?)<\/ul>/gi, "$1\n")
      .replace(/<li>(.*?)<\/li>/gi, "* $1\n")
      .replace(/<b>(.*?)<\/b>/gi, "**$1**")
      .replace(/<strong>(.*?)<\/strong>/gi, "**$1**")
      .replace(/<i>(.*?)<\/i>/gi, "*$1*")
      .replace(/<em>(.*?)<\/em>/gi, "*$1*")
      .replace(/<p>(.*?)<\/p>/gi, "$1\n\n")
      .replace(/<br\s*[\/]?>/gi, "\n")
      .replace(/<[^>]+>/g, "");
    return md.trim();
  };

  const downloadFile = (content, filename, type) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportMarkdown = () => {
    const md = htmlToMarkdown(htmlContent);
    downloadFile(md, `${title.replace(/\s+/g, "_")}.md`, "text/markdown;charset=utf-8");
  };

  const handleExportHTML = () => {
    const fullHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; line-height: 1.6; color: #1e293b; }
    h1, h2, h3 { color: #0f172a; }
    blockquote { border-left: 3px solid #cbd5e1; margin: 1em 0; padding-left: 1em; color: #64748b; font-style: italic; }
    pre { background: #f1f5f9; padding: 1em; border-radius: 8px; overflow-x: auto; }
  </style>
</head>
<body>
  <h1>${title}</h1>
  ${htmlContent}
</body>
</html>`;
    downloadFile(fullHtml, `${title.replace(/\s+/g, "_")}.html`, "text/html;charset=utf-8");
  };

  const handlePrintPDF = () => {
    window.print();
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      if (text && onImportContent) {
        // Convert simple markdown/plain text to HTML paragraphs
        const paragraphs = text
          .split("\n\n")
          .map((p) => `<p>${p.replace(/\n/g, "<br>")}</p>`)
          .join("");
        onImportContent(paragraphs);
        onClose();
      }
    };
    reader.readAsText(file);
  };

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: "rgba(15, 23, 42, 0.6)",
      backdropFilter: "blur(6px)",
      display: "flex", justifyContent: "center", alignItems: "center",
      zIndex: 100, padding: "1rem"
    }}>
      <div style={{
        backgroundColor: "#ffffff", borderRadius: "16px", padding: "1.75rem",
        width: "100%", maxWidth: "460px",
        boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Download size={20} color="#2563eb" />
            <h3 style={{ fontSize: "1.125rem", fontWeight: "700", color: "#0f172a" }}>Export & Import Document</h3>
          </div>
          <button onClick={onClose} style={{ border: "none", background: "none", cursor: "pointer", color: "#94a3b8" }}>
            <X size={18} />
          </button>
        </div>

        {/* Export Options Grid */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1.5rem" }}>
          <button
            onClick={handleExportMarkdown}
            style={exportBtnStyle}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = "#93c5fd"}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = "#e2e8f0"}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <div style={{ padding: "0.4rem", borderRadius: "8px", backgroundColor: "#eff6ff", color: "#2563eb" }}>
                <FileText size={18} />
              </div>
              <div style={{ textAlign: "left" }}>
                <div style={{ fontSize: "0.875rem", fontWeight: "700", color: "#0f172a" }}>Markdown (.md)</div>
                <div style={{ fontSize: "0.75rem", color: "#64748b" }}>Clean plain-text markdown file</div>
              </div>
            </div>
            <Download size={16} color="#94a3b8" />
          </button>

          <button
            onClick={handleExportHTML}
            style={exportBtnStyle}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = "#93c5fd"}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = "#e2e8f0"}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <div style={{ padding: "0.4rem", borderRadius: "8px", backgroundColor: "#f0fdf4", color: "#16a34a" }}>
                <Code size={18} />
              </div>
              <div style={{ textAlign: "left" }}>
                <div style={{ fontSize: "0.875rem", fontWeight: "700", color: "#0f172a" }}>HTML Document (.html)</div>
                <div style={{ fontSize: "0.75rem", color: "#64748b" }}>Self-contained web page</div>
              </div>
            </div>
            <Download size={16} color="#94a3b8" />
          </button>

          <button
            onClick={handlePrintPDF}
            style={exportBtnStyle}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = "#93c5fd"}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = "#e2e8f0"}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <div style={{ padding: "0.4rem", borderRadius: "8px", backgroundColor: "#faf5ff", color: "#9333ea" }}>
                <Printer size={18} />
              </div>
              <div style={{ textAlign: "left" }}>
                <div style={{ fontSize: "0.875rem", fontWeight: "700", color: "#0f172a" }}>Print / PDF Export</div>
                <div style={{ fontSize: "0.75rem", color: "#64748b" }}>Formatted printable document</div>
              </div>
            </div>
            <Printer size={16} color="#94a3b8" />
          </button>
        </div>

        {/* Import Section */}
        <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: "1rem" }}>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".md,.txt,.html"
            style={{ display: "none" }}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            style={{
              width: "100%",
              padding: "0.65rem",
              borderRadius: "10px",
              border: "1px dashed #cbd5e1",
              backgroundColor: "#f8fafc",
              color: "#334155",
              fontSize: "0.875rem",
              fontWeight: "600",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem"
            }}
          >
            <Upload size={16} />
            <span>Import Markdown / Text File</span>
          </button>
        </div>
      </div>
    </div>
  );
}

const exportBtnStyle = {
  width: "100%",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "0.75rem",
  borderRadius: "12px",
  border: "1px solid #e2e8f0",
  backgroundColor: "#ffffff",
  cursor: "pointer",
  transition: "all 0.15s ease"
};
