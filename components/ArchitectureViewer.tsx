"use client";

import { useState } from "react";

const diagrams = [
  {
    title: "Architecture Diagram",
    img: "/diagrams/architecture.png",
    desc: "Full system architecture from upload to AI response",
  },
  {
    title: "End-to-End Flow",
    img: "/diagrams/flow.png",
    desc: "Step-by-step execution after document upload",
  },
  {
    title: "RAG Pipeline",
    img: "/diagrams/rag.png",
    desc: "Local retrieval augmented generation pipeline",
  },
  {
    title: "UML Component",
    img: "/diagrams/component.png",
    desc: "System components and interactions",
  },
  {
    title: "Sequence Diagram",
    img: "/diagrams/sequence.png",
    desc: "Request-response lifecycle",
  },
  {
    title: "Processing Pipeline",
    img: "/diagrams/pipeline.png",
    desc: "Internal processing stages",
  },
  {
    title: "Functional Requirements",
    img: "/diagrams/fr.png",
    desc: "System capabilities and features",
  },
  {
    title: "Non-Functional Requirements",
    img: "/diagrams/nfr.png",
    desc: "Performance, security, scalability",
  },
];

export default function ArchitectureViewer() {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);

  return (
    <div className="text-center mt-10">
      {/* 🔘 OPEN BUTTON */}
      <button
        onClick={() => setOpen(true)}
        className="px-6 py-3 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
        aria-label="Open architecture diagrams"
      >
        📊 View AI Architecture
      </button>

      {/* 🪟 MODAL */}
      {open && (
        <div
          className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white dark:bg-gray-900 rounded-xl w-[95%] max-w-5xl p-5 shadow-lg overflow-auto max-h-[90vh]">
            
            {/* CLOSE */}
            <button
              onClick={() => setOpen(false)}
              className="float-right text-red-500 text-lg"
              aria-label="Close diagrams"
            >
              ✖
            </button>

            <h2 className="text-2xl font-bold mb-4 text-center">
              🧠 AI System Architecture
            </h2>

            {/* TABS */}
            <div className="flex flex-wrap gap-2 justify-center mb-4">
              {diagrams.map((d, i) => (
                <button
                  key={i}
                  onClick={() => setActive(i)}
                  className={`px-3 py-1 rounded ${
                    active === i
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 dark:bg-gray-700"
                  }`}
                  aria-selected={active === i}
                >
                  {d.title}
                </button>
              ))}
            </div>

            {/* IMAGE */}
            <div className="flex flex-col items-center">
              <img
                src={diagrams[active].img}
                alt={diagrams[active].desc}
                className="rounded-lg border max-h-[400px]"
              />

              <p className="mt-3 text-gray-700 dark:text-gray-300">
                {diagrams[active].desc}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}