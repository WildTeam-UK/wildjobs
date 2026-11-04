"use client";

import { useId, useState, type ReactNode } from "react";
import styles from "./course-accordion.module.css";

export function CourseAccordion({
  items,
  numbered = false,
  initialOpen = null,
}: {
  items: readonly { title: string; subtitle?: string; content: ReactNode }[];
  numbered?: boolean;
  initialOpen?: number | null;
}) {
  const id = useId();
  const [open, setOpen] = useState<number | null>(initialOpen);
  return (
    <div className={`${styles.accordion} ${numbered ? styles.numbered : ""}`}>
      {items.map((item, index) => {
        const expanded = open === index;
        return (
          <div className={styles.item} key={item.title}>
            <h3 className={styles.heading}>
              <button
                type="button"
                className={styles.trigger}
                id={`${id}-trigger-${index}`}
                aria-controls={`${id}-panel-${index}`}
                aria-expanded={expanded}
                onClick={() => setOpen(expanded ? null : index)}
              >
                {numbered ? <span className={styles.number}>0{index + 1}</span> : null}
                <span className={styles.label}>
                  <span>{item.title}</span>
                  {item.subtitle ? <small>{item.subtitle}</small> : null}
                </span>
                <span className={styles.plus} aria-hidden="true" />
              </button>
            </h3>
            <div
              className={styles.panel}
              id={`${id}-panel-${index}`}
              aria-labelledby={`${id}-trigger-${index}`}
              aria-hidden={!expanded}
              inert={!expanded}
              data-open={expanded}
            >
              <div className={styles.clip}>
                <div className={styles.body}>{item.content}</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
