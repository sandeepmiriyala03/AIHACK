import React from 'react';
import styles from './PagesComponent.module.css';

interface Page {
  id: string;
  file: File | null;
  fileUrl: string | null;
  text: string;
  notes: string;
}

interface PagesComponentProps {
  pages: Page[];
  activePageId: string | null;
  onPageSelect: (id: string) => void;
  onDeletePage: (id: string) => void;
}

export const PagesComponent: React.FC<PagesComponentProps> = ({
  pages,
  activePageId,
  onPageSelect,
  onDeletePage,
}) => {
  return (
    <div className={styles.pagesContainer}>
      {pages.map((page, index) => (
        <div
          key={page.id}
          className={`${styles.pageCard} ${page.id === activePageId ? styles.active : ''}`}
          onClick={() => onPageSelect(page.id)}
        >
          <p>Page {index + 1}</p>
          <button
            className={styles.deleteButton}
            onClick={(e) => {
              e.stopPropagation();
              onDeletePage(page.id);
            }}
          >
            &times;
          </button>
        </div>
      ))}
    </div>
  );
};