import styles from './Architecture.module.css'
import { useLanguage } from '../context/LanguageContext'

const architectureModules = [
  { label: 'architecture.modules.monitoring.label',   sub: 'architecture.modules.monitoring.sub' },
  { label: 'architecture.modules.extraction.label',   sub: 'architecture.modules.extraction.sub' },
  { label: 'architecture.modules.knowledgeGraph.label', sub: 'architecture.modules.knowledgeGraph.sub' },
  { label: 'architecture.modules.riskEngine.label',     sub: 'architecture.modules.riskEngine.sub' },
  { label: 'architecture.modules.actions.label',        sub: 'architecture.modules.actions.sub' },
]

export default function Architecture() {
  const { t } = useLanguage()

  return (
    <section id="architecture" className={styles.section}>
      <div className={styles.inner}>
        <div className={styles.header}>
          <p className={styles.eyebrow}>{t('architecture.systemDesign')}</p>
          <h2 className={styles.heading}>{t('architecture.systemArchitecture')}</h2>
          <p className={styles.sub}>
            {t('architecture.sub')}
          </p>
        </div>

        <div className={styles.diagram}>
          {architectureModules.map((m, i) => (
            <div key={i} className={styles.moduleWrapper}>
              <div className={styles.moduleBox}>
                <div className={styles.moduleIndex}>{String(i + 1).padStart(2, '0')}</div>
                <div className={styles.moduleLabel}>{t(m.label)}</div>
                <div className={styles.moduleSub}>{t(m.sub)}</div>
              </div>
              {i < architectureModules.length - 1 && (
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
            <p className={styles.specTitle}>{t('architecture.detectionTarget')}</p>
            <p className={styles.specVal}>{t('architecture.specs.detectionTime')}</p>
          </div>
          <div className={styles.specDivider} />
          <div className={styles.specGroup}>
            <p className={styles.specTitle}>{t('architecture.graphDatabase')}</p>
            <p className={styles.specVal}>{t('architecture.specs.neo4j')}</p>
          </div>
          <div className={styles.specDivider} />
          <div className={styles.specGroup}>
            <p className={styles.specTitle}>{t('architecture.messageQueue')}</p>
            <p className={styles.specVal}>{t('architecture.specs.kafka')}</p>
          </div>
          <div className={styles.specDivider} />
          <div className={styles.specGroup}>
            <p className={styles.specTitle}>{t('architecture.deployment')}</p>
            <p className={styles.specVal}>{t('architecture.specs.cloudNative')}</p>
          </div>
          <div className={styles.specDivider} />
          <div className={styles.specGroup}>
            <p className={styles.specTitle}>{t('architecture.security')}</p>
            <p className={styles.specVal}>{t('architecture.auditLogs')}</p>
          </div>
        </div>
      </div>
    </section>
  )
}
