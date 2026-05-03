import styles from './Architecture.module.css'

const modules = [
  { label: 'Regulatory Monitoring', sub: 'Web Crawlers, RSS Parsers, Change Detection, Kafka Queue' },
  { label: 'Clause Extraction', sub: 'Tokenisation, Fine-Tuned LLM (GPT-4 / Legal-BERT), Confidence Threshold' },
  { label: 'Knowledge Graph', sub: 'Neo4j, Policy Inventory, Enterprise IT Controls, RAG Layer' },
  { label: 'Risk Scoring Engine', sub: 'Multi-Criteria Model, SHAP Explainability, Prioritised Risk Vector' },
  { label: 'Action Generation', sub: 'LLM + RAG, RBAC Approval Gate, Policy Drafts, Audit Trail' },
]

export default function Architecture() {
  return (
    <section id="architecture" className={styles.section}>
      <div className={styles.inner}>
        <div className={styles.header}>
          <p className={styles.eyebrow}>System Design</p>
          <h2 className={styles.heading}>System Architecture</h2>
          <p className={styles.sub}>
            Five orchestrated modules form a closed-loop compliance intelligence pipeline,
            from regulatory publication to executable policy update.
          </p>
        </div>

        <div className={styles.diagram}>
          {modules.map((m, i) => (
            <div key={i} className={styles.moduleWrapper}>
              <div className={styles.moduleBox}>
                <div className={styles.moduleIndex}>{String(i + 1).padStart(2, '0')}</div>
                <div className={styles.moduleLabel}>{m.label}</div>
                <div className={styles.moduleSub}>{m.sub}</div>
              </div>
              {i < modules.length - 1 && (
                <div className={styles.arrow} aria-hidden="true">
                  <svg width="28" height="16" viewBox="0 0 28 16" fill="none">
                    <path d="M0 8H24M24 8L17 2M24 8L17 14" stroke="var(--c-accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className={styles.specs}>
          <div className={styles.specGroup}>
            <p className={styles.specTitle}>Detection Target</p>
            {/* <p className={styles.specVal}>2 – 4 hours post-publication</p> */}
          </div>
          <div className={styles.specDivider} />
          <div className={styles.specGroup}>
            <p className={styles.specTitle}>Graph Database</p>
            <p className={styles.specVal}>Neo4j with horizontal clustering</p>
          </div>
          <div className={styles.specDivider} />
          <div className={styles.specGroup}>
            <p className={styles.specTitle}>Message Queue</p>
            {/* <p className={styles.specVal}>Apache Kafka (async ingestion)</p> */}
          </div>
          <div className={styles.specDivider} />
          <div className={styles.specGroup}>
            <p className={styles.specTitle}>Deployment</p>
            <p className={styles.specVal}>Cloud-native, AWS / Azure</p>
          </div>
          <div className={styles.specDivider} />
          <div className={styles.specGroup}>
            <p className={styles.specTitle}>Security</p>
            <p className={styles.specVal}> Audit Logs</p>
          </div>
        </div>
      </div>
    </section>
  )
}