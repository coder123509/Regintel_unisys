import styles from './Features.module.css'

const features = [
  {
    id: '01',
    title: 'Continuous Regulatory Monitoring',
    body: 'Web crawlers and RSS/API feed parsers continuously scan government portals, financial regulators, and official legal bulletins. Change-detection algorithms flag new or amended publications and route them to the extraction pipeline within hours.',
    tag: 'Monitoring',
  },
  {
    id: '02',
    title: 'LLM-Based Clause Extraction',
    body: 'Documents are pre-processed through tokenisation and section segmentation, then passed to a fine-tuned GPT-4 class or Legal-BERT model that identifies and classifies obligations, prohibitions, permissions, deadlines, and conditional requirements at 90%+ precision.',
    tag: 'Extraction',
  },
  {
    id: '03',
    title: 'Knowledge Graph Construction',
    body: 'Extracted clauses are represented as structured nodes within a Neo4j graph database. Edges encode relationships between regulatory clauses, internal policy documents, process controls, responsible departments, and affected IT systems.',
    tag: 'Graph DB',
  },
  {
    id: '04',
    title: 'RAG-Augmented Policy Mapping',
    body: 'A Retrieval-Augmented Generation layer allows the LLM to query the knowledge graph during gap analysis, combining graph traversal and semantic vector search to identify policy coverage gaps and map obligations to responsible owners.',
    tag: 'RAG',
  },
  {
    id: '05',
    title: 'Multi-Criteria Risk Scoring',
    body: 'Each regulatory clause is scored across severity of non-compliance, breadth of organisational impact, deadline proximity, and enforcement likelihood. SHAP-based explanations surface the scoring rationale to compliance officers for transparency.',
    tag: 'Risk Engine',
  },
  {
    id: '06',
    title: 'Automated Action Generation',
    body: 'High-priority clauses trigger the generation of first-draft compliance artefacts: policy revisions, control adjustments, and audit checklists. Every artefact includes a full traceability chain linking it back to the originating regulatory clause.',
    tag: 'Actions',
  },
]

export default function Features() {
  return (
    <section id="features" className={styles.section}>
      <div className={styles.inner}>
        <div className={styles.header}>
          <p className={styles.eyebrow}>Core Capabilities</p>
          <h2 className={styles.heading}>Six Integrated Modules,<br />One Autonomous Platform</h2>
          <p className={styles.sub}>
            Each module addresses a distinct dimension of the compliance challenge,
            working together as a closed-loop intelligence system.
          </p>
        </div>

        <div className={styles.grid}>
          {features.map(f => (
            <div key={f.id} className={styles.card}>
              <div className={styles.cardTop}>
                <span className={styles.id}>{f.id}</span>
                <span className={styles.tag}>{f.tag}</span>
              </div>
              <h3 className={styles.title}>{f.title}</h3>
              <p className={styles.body}>{f.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
