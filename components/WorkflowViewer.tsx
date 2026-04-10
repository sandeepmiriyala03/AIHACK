"use client";

import { useState } from "react";

export default function WorkflowViewer() {
  const [open, setOpen] = useState(false);

  return (
    <div className="mb-8">

      {/* CLICK BUTTON */}
      <button
        onClick={() => setOpen(true)}
        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-400"
        aria-label="View workflow diagram"
      >
        📊 Workflow of this Page
      </button>

      {/* MODAL */}
      {open && (
        <div
          className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white dark:bg-gray-900 p-4 rounded-xl max-w-5xl w-[95%] shadow-lg">

            {/* CLOSE */}
            <div className="flex justify-end">
              <button
                onClick={() => setOpen(false)}
                className="text-red-500 text-xl"
                aria-label="Close workflow"
              >
                ✖
              </button>
            </div>

            {/* IMAGE */}
            <div className="flex justify-center">
              <img
                src="/arch/upload.png"
                alt="Upload page workflow diagram"
                className="rounded-lg max-h-[80vh] object-contain"
              />
            </div>

            {/* DESCRIPTION */}
            <p className="text-center mt-3 text-gray-600 dark:text-gray-300">
              End-to-end workflow of document upload → processing → AI response
            </p>
          </div>
        </div>
      )}
    </div>
  );
}