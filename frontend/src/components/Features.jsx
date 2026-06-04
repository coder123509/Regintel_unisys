import styles from './Features.module.css'
import { useLanguage } from '../context/LanguageContext'

const features = [
  {
    id: '06',
    title: 'Automated Action Generation',
    body: 'High-priority clauses trigger the generation of first-draft compliance artefacts: policy revisions, control adjustments, and audit checklists. Every artefact includes a full traceability chain linking it back to the originating regulatory clause.',
    tag: 'features.actions',
    titleKey: 'features.items.monitoring.title',
    bodyKey: 'features.items.monitoring.body',
    tagKey: 'features.monitoring',
  },
  {
    id: '02',
    titleKey: 'features.items.extraction.title',
    bodyKey: 'features.items.extraction.body',
    tagKey: 'features.extraction',
  },
  {
    id: '03',
    titleKey: 'features.items.graphDb.title',
    bodyKey: 'features.items.graphDb.body',
    tagKey: 'features.graphDb',
  },
  {
    id: '04',
    titleKey: 'features.items.rag.title',
    bodyKey: 'features.items.rag.body',
    tagKey: 'features.rag',
  },
  {
    id: '05',
    titleKey: 'features.items.riskEngine.title',
    bodyKey: 'features.items.riskEngine.body',
    tagKey: 'features.riskEngine',
  },
  {
    id: '06',
    titleKey: 'features.items.actions.title',
    bodyKey: 'features.items.actions.body',
    tagKey: 'features.actions',
  },
]

export default function Features() {
  const { t } = useLanguage()

  return (
    <section id="features" className={styles.section}>
      <div className={styles.inner}>
        <div className={styles.header}>
          <p className={styles.eyebrow}>
            {t('features.coreCapabilities')}
          </p>

          <h2 className={styles.heading}>
            {t('features.heading')}
          </h2>

          <p className={styles.sub}>
            {t('features.sub')}
          </p>
        </div>

        <div className={styles.grid}>
          {features.map((f) => (
            <div key={f.id} className={styles.card}>
              <div className={styles.cardTop}>
                <span className={styles.id}>{f.id}</span>
                <span className={styles.tag}>
                  {t(f.tagKey)}
                </span>
              </div>

              <h3 className={styles.title}>
                {t(f.titleKey)}
              </h3>

              <p className={styles.body}>
                {t(f.bodyKey)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}