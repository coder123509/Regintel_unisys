import styles from './Features.module.css'
import { useLanguage } from '../context/LanguageContext'

const features = [
  {
    id: '01',
    title: 'Continuous Regulatory Monitoring',
    body: 'Web crawlers and RSS/API feed parsers continuously scan government portals, financial regulators, and official legal bulletins. Change-detection algorithms flag new or amended publications and route them to the extraction pipeline within hours.',
    tag: 'features.monitoring',
  },
  {
    id: '02',
    title: 'LLM-Based Clause Extraction',
    body: 'Documents are pre-processed through tokenisation and section segmentation, then passed to a fine-tuned GPT-4 class or Legal-BERT model that identifies and classifies obligations, prohibitions, permissions, deadlines, and conditional requirements at 90%+ precision.',
    tag: 'features.extraction',
  },
  {
    id: '03',
    title: 'Knowledge Graph Construction',
    body: 'Extracted clauses are represented as structured nodes within a Neo4j graph database. Edges encode relationships between regulatory clauses, internal policy documents, process controls, responsible departments, and affected IT systems.',
    tag: 'features.graphDb',
  },
  {
    id: '04',
    title: 'RAG-Augmented Policy Mapping',
    body: 'A Retrieval-Augmented Generation layer allows the LLM to query the knowledge graph during gap analysis, combining graph traversal and semantic vector search to identify policy coverage gaps and map obligations to responsible owners.',
    tag: 'features.rag',
  },
  {
    id: '05',
    title: 'Multi-Criteria Risk Scoring',
    body: 'Each regulatory clause is scored across severity of non-compliance, breadth of organisational impact, deadline proximity, and enforcement likelihood. SHAP-based explanations surface the scoring rationale to compliance officers for transparency.',
    tag: 'features.riskEngine',
  },
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
          <p className={styles.eyebrow}>{t('features.coreCapabilities')}</p>
          <h2 className={styles.heading}>{t('features.heading')}</h2>
          <p className={styles.sub}>
            {t('features.sub')}
          </p>
        </div>

        <div className={styles.grid}>
          {features.map(f => (
            <div key={f.id} className={styles.card}>
              <div className={styles.cardTop}>
                <span className={styles.id}>{f.id}</span>
                <span className={styles.tag}>{t(f.tag)}</span>
              </div>
              <h3 className={styles.title}>{t(f.title)}</h3>
              <p className={styles.body}>{t(f.body)}</p>
                <span className={styles.tag}>{t(f.tagKey)}</span>
              </div>
              <h3 className={styles.title}>{t(f.titleKey)}</h3>
              <p className={styles.body}>{t(f.bodyKey)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
