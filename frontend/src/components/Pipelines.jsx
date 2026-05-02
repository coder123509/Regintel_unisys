import { useState } from 'react'
import styles from './Pipelines.module.css'

const pipelines = [
  {
    id: 'P1',
    title: 'Pipeline 1 — Ingestion',
    short: 'Ingestion',
    desc: 'Automated ingestion system that continuously monitors regulatory sources, fetches newly published documents, deduplicates them, extracts structured clauses using LLM, generates base context, and stores the processed document in a structured format.',
    steps: [
      'Scheduler (cron / background worker)',
      'Fetch new documents via RSS, API, or scraping',
      'Deduplicate using SHA-256 hash',
      'Text cleaning — remove HTML, headers, whitespace',
      'Clause extraction via LLM',
      'Base context generation (summary + keywords)',
      'Store structured document in MongoDB / PostgreSQL',
      'Emit doc_id to downstream pipelines',
    ],
    endpoints: [
      { method: 'GET', path: '/documents', desc: 'List all processed documents' },
      { method: 'GET', path: '/documents/{doc_id}', desc: 'Full document with clauses and context' },
      { method: 'GET', path: '/documents/{doc_id}/clauses', desc: 'Extracted structured clauses only' },
      { method: 'GET', path: '/documents/{doc_id}/context', desc: 'Summary and keyword metadata' },
    ],
  },
  {
    id: 'P2',
    title: 'Pipeline 2 — RAG, Mapping & LLM Engine',
    short: 'RAG & Mapping',
    desc: 'Receives enriched documents from Pipeline 1 and applies a parallelised hybrid retrieval strategy combining graph traversal (Neo4j) and semantic vector search to map each clause to internal policies and detect compliance gaps.',
    steps: [
      'Receive doc_id from Pipeline 1',
      'For each clause: trigger hybrid retrieval',
      'Graph Retrieval: Clause → Control → Policy → Department',
      'Semantic Retrieval: vector embedding similarity search',
      'Context Builder merges and deduplicates candidates',
      'LLM selects best-matching policy and detects gaps',
      'Assign responsible department by policy ownership',
      'Store mapping results, return enriched clauses',
    ],
    endpoints: [
      { method: 'GET', path: '/rag/map/{doc_id}', desc: 'Full document with all clauses enriched with mapping data' },
      { method: 'GET', path: '/rag/map/{doc_id}/{clause_id}', desc: 'Deep-dive for a single clause including retrieval sources' },
    ],
  },
  {
    id: 'P3',
    title: 'Pipeline 3 — Risk Scoring & Action Generation',
    short: 'Risk & Actions',
    desc: 'Evaluates mapped clauses from Pipeline 2, calculates weighted risk scores, assigns priority levels (Low / Medium / High), and generates actionable compliance recommendations using LLM grounded in the knowledge graph.',
    steps: [
      'Receive mapped clauses from Pipeline 2',
      'Calculate severity score for each clause',
      'Calculate impact across systems and operations',
      'Calculate urgency based on deadline proximity',
      'Aggregate: risk = 0.4×severity + 0.3×impact + 0.3×urgency',
      'Classify priority: Low (0–0.3), Medium (0.3–0.7), High (0.7–1)',
      'LLM generates policy updates, alerts, checklists',
      'Store results, expose via dashboard API',
    ],
    endpoints: [
      { method: 'POST', path: '/risk/analyze', desc: 'Compute risk score and priority for a document' },
      { method: 'POST', path: '/actions/generate', desc: 'Generate actionable recommendations' },
      { method: 'GET', path: '/dashboard/{doc_id}', desc: 'Executive dashboard summary' },
    ],
  },
]

const methodColor = { GET: styles.methodGet, POST: styles.methodPost }

export default function Pipelines() {
  const [active, setActive] = useState(0)
  const p = pipelines[active]

  return (
    <section id="pipelines" className={styles.section}>
      <div className={styles.inner}>
        <div className={styles.header}>
          <p className={styles.eyebrow}>Data Flow</p>
          <h2 className={styles.heading}>Three-Pipeline Architecture</h2>
          <p className={styles.sub}>
            Each pipeline has a distinct responsibility and exposes a clean API boundary,
            enabling modular development and independent scaling.
          </p>
        </div>

        <div className={styles.tabs}>
          {pipelines.map((p, i) => (
            <button
              key={p.id}
              className={`${styles.tab} ${active === i ? styles.tabActive : ''}`}
              onClick={() => setActive(i)}
            >
              <span className={styles.tabId}>{p.id}</span>
              <span className={styles.tabLabel}>{p.short}</span>
            </button>
          ))}
        </div>

        <div className={styles.content}>
          <div className={styles.left}>
            <h3 className={styles.pTitle}>{p.title}</h3>
            <p className={styles.pDesc}>{p.desc}</p>

            <div className={styles.flowLabel}>Process Flow</div>
            <ol className={styles.steps}>
              {p.steps.map((s, i) => (
                <li key={i} className={styles.step}>
                  <span className={styles.stepNum}>{String(i + 1).padStart(2, '0')}</span>
                  <span>{s}</span>
                </li>
              ))}
            </ol>
          </div>

          <div className={styles.right}>
            <div className={styles.endpointsLabel}>API Endpoints</div>
            <div className={styles.endpoints}>
              {p.endpoints.map((e, i) => (
                <div key={i} className={styles.endpoint}>
                  <div className={styles.endpointTop}>
                    <span className={`${styles.method} ${methodColor[e.method] || ''}`}>{e.method}</span>
                    <code className={styles.path}>{e.path}</code>
                  </div>
                  <p className={styles.endpointDesc}>{e.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
