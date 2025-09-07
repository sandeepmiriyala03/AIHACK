'use client';

import React, { useState } from "react";

interface Page {
  id: string;
  text: string;
  notes: string; // The user's notes for this page
}

interface DownloadManagerProps {
  pages: Page[];
}

/**
 * A component to manage the book information prompt and HTML download logic.
 * It is meant to be used as a modal or pop-up.
 */
export const DownloadManager: React.FC<DownloadManagerProps> = ({ pages }) => {
  const [bookTitle, setBookTitle] = useState("");
  const [bookDescription, setBookDescription] = useState("");
  const [showBookInfoPrompt, setShowBookInfoPrompt] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  /**
   * Generates and downloads a single, self-contained HTML file for the book.
   * The file includes the pages, an editable text area, and a notes section.
   */
  const downloadBook = () => {
    if (!bookTitle.trim() || pages.length === 0) {
      alert("Please enter a book title and ensure there are pages to download.");
      return;
    }

    const todayStr = new Date().toLocaleDateString();
    const year = new Date().getFullYear();

    const initialNotesData = pages.reduce((acc, page, index) => {
      acc[`page-${index + 1}-notes`] = page.notes;
      return acc;
    }, {} as Record<string, string>);

    const tabButtons = pages.map(
      (_, i) => `<button class="tablinks" onclick="openPage(event, 'Page${i + 1}')">Page ${i + 1}</button>`
    ).join("\n");

    const tabContents = pages.map(
      (p, i) => `
      <div id="Page${i + 1}" class="tabcontent" style="display:none; padding:10px;">
        <h3>Page ${i + 1}</h3>
        <textarea id="page-${i + 1}-text" style="width:100%; height:400px; box-sizing:border-box; font-size:16px; font-family: monospace; border:1px solid #ccc; border-radius:8px; padding:10px;">${p.text}</textarea>
        <div style="margin-top:20px; padding:15px; border:1px dashed #4f46e5; border-radius:8px; background-color:#eef2ff;">
          <h4 style="margin-top:0;">Your Notes</h4>
          <textarea id="page-${i + 1}-notes" class="notes-field" style="width:100%; height:150px; box-sizing:border-box; font-size:14px; font-family:sans-serif; border:none; background:transparent; resize:vertical;"></textarea>
          <div style="display:flex; gap:10px; margin-top:10px;">
            <button class="save-btn" data-page-id="page-${i + 1}" style="padding: 8px 12px; background-color: #4f46e5; color: white; border: none; border-radius: 5px; cursor:pointer;">Save Notes</button>
            <button class="delete-btn" data-page-id="page-${i + 1}" style="padding: 8px 12px; background-color: #e54646; color: white; border: none; border-radius: 5px; cursor:pointer;">Delete Notes</button>
          </div>
        </div>
      </div>`
    ).join("\n");

    const descSection = bookDescription.trim() ?
      `<section style="padding:20px; margin-bottom:20px; border-bottom:1px solid #ccc;">
        <h2>Description</h2>
        <p>${bookDescription}</p>
      </section>` : "";

    const html = `<!DOCTYPE html>
<html lang="sa">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${bookTitle}</title>
<style>
  body { font-family: Arial, sans-serif; margin: 0; padding-top: 100px; background-color: #f4f4f9; }
  header {
    position: fixed; top: 0; left: 0; right: 0; background: #3b82f6; color: white;
    height: 80px; display: flex; align-items: center; justify-content: space-between;
    padding: 0 30px; font-weight: bold; z-index: 1000;
    box-shadow: 0 2px 5px rgba(0,0,0,0.1);
  }
  header .title { font-size: 24px; text-align: center; flex-grow: 1; }
  header .left, header .right { font-size: 16px; }
  .tabs {
    position: fixed; top: 80px; left: 0; right: 0; background: #dbeafe; display: flex;
    border-bottom: 1px solid #a5b4fc; z-index: 999; overflow-x: auto; white-space: nowrap;
    -webkit-overflow-scrolling: touch;
  }
  .tabs button {
    flex-shrink: 0; padding: 15px; background: none; border: none; cursor: pointer; font-size: 16px;
    transition: background-color 0.3s, color 0.3s;
  }
  .tabs button.active { background: #3b82f6; color: white; }
  .tabcontent { display: none; padding: 20px; }
  textarea {
    box-sizing: border-box; padding: 10px; border: 1px solid #ccc; border-radius: 8px;
    font-size: 16px; font-family: monospace; resize: vertical;
  }
  .notes-field { background-color: white; border: 1px solid #ccc !important; }
  footer { text-align: center; padding: 10px; font-size: 14px; color: #555; margin-top: 15px; border-top: 1px solid #ddd; }
  
  /* Bot CSS */
  #bot-container {
    position: fixed; bottom: 20px; left: 20px; z-index: 1000;
  }
  #bot-icon {
    width: 50px; height: 50px; border-radius: 50%; background-color: #4f46e5;
    color: white; display: flex; justify-content: center; align-items: center;
    font-size: 24px; cursor: pointer; box-shadow: 0 4px 8px rgba(0,0,0,0.2);
    transition: transform 0.2s ease-in-out;
  }
  #bot-icon:hover { transform: scale(1.1); }
  #bot-chatbox {
    width: 280px; background-color: white; border-radius: 10px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.2); padding: 15px;
    position: absolute; bottom: 70px; left: 0;
    transform-origin: bottom left; transition: transform 0.3s ease-in-out;
  }
  #bot-chatbox.hidden {
    display: none;
    transform: scale(0);
  }
  .bot-message h4 { margin: 0; color: #333; }
  .bot-message p { margin: 5px 0; font-size: 14px; color: #666; }
  .bot-actions { display: flex; gap: 8px; margin-top: 10px; }
  .bot-actions button {
    padding: 8px 12px; border: none; border-radius: 5px; cursor: pointer;
    font-size: 12px; background-color: #3b82f6; color: white;
  }
  @media print { header, footer, .tabs, #bot-container { display: none; } }
</style>
</head>
<body>
<header>
  <div class="left">Pages: ${pages.length}</div>
  <div class="title">${bookTitle}</div>
  <div class="right">${todayStr}</div>
</header>
${descSection}
<div class="tabs">
  ${tabButtons}
</div>
<div id="page-content" style="padding: 100px 20px 20px;">
${tabContents}
</div>
<footer>&copy; ${year} AksharaTantra OCR generated.</footer>

<div id="bot-container">
  <div id="bot-icon" onclick="toggleBot()">&#x1F916;</div>
  <div id="bot-chatbox" class="hidden">
    <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #eee; padding-bottom: 10px; margin-bottom: 10px;">
      <h4 style="margin:0;">Book Overview</h4>
      <button onclick="toggleBot()" style="background:none; border:none; cursor:pointer; font-size:16px;">✖</button>
    </div>
    <div class="bot-message">
      <p>Total Pages: **${pages.length}**</p>
      <p>Start reading and keep your notes. Your progress is saved in your browser.</p>
    </div>
  </div>
</div>

<script>
  // Initial notes from the OCR component, saved as a JSON string
  const initialNotes = JSON.parse(\`${JSON.stringify(initialNotesData)}\`);

  function openPage(evt, pageName) {
    let i, tabcontent, tablinks;
    tabcontent = document.getElementsByClassName("tabcontent");
    for (i = 0; i < tabcontent.length; i++) { tabcontent[i].style.display = "none"; }
    tablinks = document.getElementsByClassName("tablinks");
    for (i = 0; i < tablinks.length; i++) { tablinks[i].className = tablinks[i].className.replace(" active", ""); }
    document.getElementById(pageName).style.display = "block";
    evt.currentTarget.className += " active";

    // Load notes for the active page
    loadNotes(pageName);
  }

  function toggleBot() {
    const chatbox = document.getElementById('bot-chatbox');
    chatbox.classList.toggle('hidden');
  }

  function loadNotes(pageId) {
    const notesKey = \`\${bookTitle}\` + '-' + pageId + '-notes';
    const savedNotes = localStorage.getItem(notesKey);
    const notesTextarea = document.getElementById(pageId + '-notes');
    if (notesTextarea) {
      notesTextarea.value = savedNotes || initialNotes[notesKey] || '';
    }
  }

  function saveNotes(pageId) {
    const notesKey = \`\${bookTitle}\` + '-' + pageId + '-notes';
    const notesTextarea = document.getElementById(pageId + '-notes');
    if (notesTextarea) {
      localStorage.setItem(notesKey, notesTextarea.value);
      alert('Notes saved!');
    }
  }

  function deleteNotes(pageId) {
    const notesKey = \`\${bookTitle}\` + '-' + pageId + '-notes';
    localStorage.removeItem(notesKey);
    const notesTextarea = document.getElementById(pageId + '-notes');
    if (notesTextarea) {
      notesTextarea.value = initialNotes[notesKey] || '';
    }
    alert('Notes deleted!');
  }

  document.addEventListener("DOMContentLoaded", function() {
    const firstTab = document.querySelector(".tablinks");
    if (firstTab) {
      firstTab.click();
    }
    
    // Attach event listeners to save/delete buttons
    document.querySelectorAll('.save-btn').forEach(button => {
      button.addEventListener('click', (e) => {
        const pageId = e.currentTarget.dataset.pageId;
        if (pageId) saveNotes(pageId);
      });
    });

    document.querySelectorAll('.delete-btn').forEach(button => {
      button.addEventListener('click', (e) => {
        const pageId = e.currentTarget.dataset.pageId;
        if (pageId) {
          // Trigger the React state change to show the dialog
          window.dispatchEvent(new CustomEvent('showDeleteConfirm', { detail: pageId }));
        }
      });
    });
  });
</script>
</body>
</html>`;

    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = bookTitle.trim().replace(/\s+/g, "_") + ".html";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    setShowBookInfoPrompt(false);
  };

  const BookInfoPrompt = () => (
    <div style={{
      position: "fixed", inset: 0,
      backgroundColor: "rgba(0,0,0,0.5)",
      display: "flex", justifyContent: "center", alignItems: "center", zIndex: 9999,
    }}>
      <div style={{ background: "white", padding: 20, borderRadius: 8, maxWidth: 400, width: "90%" }}>
        <h3>Enter Book Information</h3>
        <input
          type="text"
          value={bookTitle}
          onChange={e => setBookTitle(e.target.value)}
          placeholder="Book Title"
          style={{ width: "100%", padding: 8, fontSize: 16, marginBottom: 12 }}
        />
        <textarea
          value={bookDescription}
          onChange={e => setBookDescription(e.target.value)}
          placeholder="Book Description (optional)"
          style={{ width: "100%", padding: 8, fontSize: 16, height: 80 }}
        />
        <button
          disabled={!bookTitle.trim()}
          onClick={downloadBook}
          style={{ marginTop: 12, padding: "10px 16px", cursor: "pointer" }}
        >
          Confirm
        </button>
      </div>
    </div>
  );

  const handleDeleteConfirm = (pageId: string) => {
    // This function will be called from the dialog
    const pageIndex = parseInt(pageId.split('-')[1]) - 1;
    if (pageIndex >= 0 && pageIndex < pages.length) {
      const updatedPages = [...pages];
      updatedPages[pageIndex] = { ...updatedPages[pageIndex], notes: "" };
      // You would then update the state in your parent component (e.g., SearchableLangOcr)
      // to reflect this change. Since this component doesn't manage the `pages` state,
      // you would need a callback prop for this.
      // For this example, we'll just demonstrate the logic.
      alert(`Notes for ${pageId} were deleted!`);
    }
  };

  const DeleteConfirmationDialog = ({ pageId, onConfirm, onCancel }) => {
    if (!pageId) return null;
    return (
      <div style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.5)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 10000,
      }}>
        <div style={{
          background: "white",
          padding: "20px",
          borderRadius: "8px",
          boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
          textAlign: "center",
          maxWidth: "350px",
          width: "90%",
        }}>
          <h4 style={{ color: "#d9534f" }}>Delete Notes</h4>
          <p>Are you sure you want to delete these notes? This action cannot be undone.</p>
          <div style={{ display: "flex", justifyContent: "center", gap: "10px", marginTop: "20px" }}>
            <button onClick={onCancel} style={{ padding: "10px 20px", border: "1px solid #ccc", borderRadius: "5px", cursor: "pointer", background: "white" }}>
              Cancel
            </button>
            <button onClick={() => onConfirm(pageId)} style={{ padding: "10px 20px", backgroundColor: "#d9534f", color: "white", border: "none", borderRadius: "5px", cursor: "pointer" }}>
              Confirm Delete
            </button>
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <>
      <button
        onClick={() => setShowBookInfoPrompt(true)}
        style={{
          padding: "10px 20px",
          backgroundColor: "#10b981",
          color: "white",
          border: "none",
          borderRadius: 6,
          cursor: "pointer",
        }}
      >
        Download Book as HTML
      </button>

      {showBookInfoPrompt && <BookInfoPrompt />}
      <DeleteConfirmationDialog 
        pageId={showDeleteConfirm} 
        onConfirm={handleDeleteConfirm} 
        onCancel={() => setShowDeleteConfirm(null)} 
      />
    </>
  );
};