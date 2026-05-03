import { useState, useEffect, useCallback } from 'react'
import styles from './Dashboard.module.css'


// ── CONFIG: point this at your backend ──────────────────
const BASE_URL = 'http://localhost:5000/db'
// ────────────────────────────────────────────────────────

const PRIORITY_COLOR = {
  high:   { bg: '#fdecea', text: '#c0392b', dot: '#e74c3c' },
  medium: { bg: '#fff8e1', text: '#b7770d', dot: '#f39c12' },
  low:    { bg: '#e8f5e9', text: '#256029', dot: '#27ae60' },
}

const ACTION_TYPE_COLOR = {
  policy_update: { bg: '#ebf0f7', text: '#1a3a5c' },
  alert:         { bg: '#fdecea', text: '#c0392b' },
  audit:         { bg: '#fff3d9', text: '#8a5a00' },
  checklist:     { bg: '#e8f5e9', text: '#256029' },
}

function StatCard({ label, value, sub, accent }) {
  return (
    <div className={styles.statCard} style={accent ? { borderTopColor: accent } : {}}>
      <p className={styles.statValue}>{value ?? '—'}</p>
      <p className={styles.statLabel}>{label}</p>
      {sub && <p className={styles.statSub}>{sub}</p>}
    </div>
  )
}

function PriorityBadge({ priority }) {
  const c = PRIORITY_COLOR[priority] || PRIORITY_COLOR.low
  return (
    <span className={styles.badge} style={{ background: c.bg, color: c.text }}>
      <span className={styles.badgeDot} style={{ background: c.dot }} />
      {priority}
    </span>
  )
}

function StatusBadge({ status }) {
  const map = {
    processed:   { bg: '#e8f5e9', text: '#256029' },
    ingesting:   { bg: '#ebf0f7', text: '#1a3a5c' },
    failed:      { bg: '#fdecea', text: '#c0392b' },
    duplicate:   { bg: '#f5f0e8', text: '#7a5c2e' },
    pending:     { bg: '#fff8e1', text: '#b7770d' },
    in_progress: { bg: '#ebf0f7', text: '#1a3a5c' },
    done:        { bg: '#e8f5e9', text: '#256029' },
    completed:   { bg: '#e8f5e9', text: '#256029' },
  }
  const c = map[status] || { bg: '#f0ede8', text: '#4a4a4a' }
  return (
    <span className={styles.badge} style={{ background: c.bg, color: c.text }}>
      {status}
    </span>
  )
}

function SectionHeader({ eyebrow, title }) {
  return (
    <div className={styles.sectionHeader}>
      <span className={styles.eyebrow}>{eyebrow}</span>
      <h2 className={styles.sectionTitle}>{title}</h2>
    </div>
  )
}

function Loader() {
  return (
    <div className={styles.loaderWrap}>
      <div className={styles.loader} />
    </div>
  )
}

function EmptyState({ message }) {
  return <div className={styles.empty}>{message}</div>
}

function ErrorState({ message, onRetry }) {
  return (
    <div className={styles.errorState}>
      <p>{message}</p>
      {onRetry && <button className={styles.retryBtn} onClick={onRetry}>Retry</button>}
    </div>
  )
}

function OverviewPanel({ documents, risks, lastRefresh }) {
  const [clauseCount, setClauseCount] = useState(0)
  const [loadingClauses, setLoadingClauses] = useState(true)

  useEffect(() => {
    if (!documents.length) { setLoadingClauses(false); return }

    setLoadingClauses(true)
    const fetchClauses = async () => {
      try {
        const results = await Promise.allSettled(
          documents.map(d =>
            fetch(`${BASE_URL}/documents/${d.doc_id}/clauses`)
              .then(r => r.ok ? r.json() : [])
              .then(data => Array.isArray(data) ? data.length : 0)
              .catch(() => 0)
          )
        )
        const total = results.reduce((sum, r) =>
          sum + (r.status === 'fulfilled' ? r.value : 0), 0
        )
        setClauseCount(total)
      } catch {
        setClauseCount(0)
      } finally {
        setLoadingClauses(false)
      }
    }
    fetchClauses()
  }, [lastRefresh, documents.length])

  const total = documents.length
  const processed = documents.filter(d => d.status === 'processed').length
  const failed = documents.filter(d => d.status === 'failed').length
  const successRate = total > 0 ? Math.round((processed / total) * 100) : 0
  const highRisk = risks.filter(r => r.priority === 'high').length
  const lastRun = lastRefresh ? lastRefresh.toLocaleString() : '—'

  return (
    <div className={styles.overviewGrid}>
      <StatCard label="Total Documents" value={total} sub="All time" accent="#1a3a5c" />
      <StatCard
        label="Clauses Extracted"
        value={loadingClauses ? '...' : clauseCount}
        sub="Across all documents"
        accent="#b5873c"
      />
      <StatCard label="Processing Success" value={`${successRate}%`} sub={`${failed} failed`} accent="#27ae60" />
      <StatCard label="High Risk Items" value={highRisk} sub="Require attention" accent="#e74c3c" />
      <StatCard label="Last Pipeline Run" value={lastRun} sub="Time of last refresh" accent="#2c5282" />
    </div>
  )
}

function PipelineStatusSection({ documents }) {
  if (!documents.length) return <EmptyState message="No documents found." />

  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Document ID</th>
            <th>Source</th>
            <th>Status</th>
            <th>Clauses</th>
            <th>Published</th>
            <th>Ingested</th>
          </tr>
        </thead>
        <tbody>
          {documents.map((doc, i) => (
            <tr key={doc.doc_id || i} className={styles.tr}>
              <td><code className={styles.code}>{doc.doc_id}</code></td>
              <td className={styles.muted}>{doc.source_id || '—'}</td>
              <td><StatusBadge status={doc.status} /></td>
              <td className={styles.centered}>{doc.clauses_count ?? '—'}</td>
              <td className={styles.muted}>
                {doc.published_at ? new Date(doc.published_at).toLocaleDateString() : '—'}
              </td>
              <td className={styles.muted}>
                {doc.ingested_at ? new Date(doc.ingested_at).toLocaleString() : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function RiskSection({ documents }) {
  const [risks, setRisks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!documents.length) { setLoading(false); return }

    const fetchAll = async () => {
      try {
        const docRiskResults = await Promise.allSettled(
          documents.map(d =>
            fetch(`${BASE_URL}/risk/${d.doc_id}`)
              .then(r => r.ok ? r.json() : null)
              .catch(() => null)
          )
        )
        const docRisks = docRiskResults
          .filter(r => r.status === 'fulfilled' && r.value)
          .map(r => ({ ...r.value, _level: 'document' }))

        const clauseRiskResults = await Promise.allSettled(
          documents.map(d =>
            fetch(`${BASE_URL}/risk/${d.doc_id}/clauses`)
              .then(r => r.ok ? r.json() : [])
              .then(data => Array.isArray(data) ? data : [])
              .catch(() => [])
          )
        )
        const clauseRisks = clauseRiskResults
          .flatMap(r => r.status === 'fulfilled' ? r.value : [])
          .map(r => ({ ...r, _level: 'clause' }))

        setRisks([...docRisks, ...clauseRisks])
      } catch {
        setError('Failed to load risk data.')
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [documents])

  const dist = { high: 0, medium: 0, low: 0 }
  risks.forEach(r => { if (r.priority in dist) dist[r.priority]++ })
  const total = risks.length || 1

  if (loading) return <Loader />
  if (error) return <ErrorState message={error} />
  if (!risks.length) return <EmptyState message="No risk data available yet." />

  return (
    <div className={styles.riskLayout}>
      <div className={styles.riskDistCard}>
        <p className={styles.cardLabel}>
          Risk Distribution — {risks.length} entries
          ({risks.filter(r => r._level === 'document').length} document-level,{' '}
          {risks.filter(r => r._level === 'clause').length} clause-level)
        </p>
        <div className={styles.distBar}>
          {dist.high > 0 && (
            <div className={styles.distSegHigh}
              style={{ width: `${(dist.high / total) * 100}%` }}
              title={`High: ${dist.high}`} />
          )}
          {dist.medium > 0 && (
            <div className={styles.distSegMed}
              style={{ width: `${(dist.medium / total) * 100}%` }}
              title={`Medium: ${dist.medium}`} />
          )}
          {dist.low > 0 && (
            <div className={styles.distSegLow}
              style={{ width: `${(dist.low / total) * 100}%` }}
              title={`Low: ${dist.low}`} />
          )}
        </div>
        <div className={styles.distLegend}>
          {['high', 'medium', 'low'].map(p => (
            <div key={p} className={styles.legendItem}>
              <span className={styles.legendDot} style={{ background: PRIORITY_COLOR[p].dot }} />
              <span className={styles.legendLabel}>{p}</span>
              <span className={styles.legendCount}>{dist[p]}</span>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Level</th>
              <th>Document</th>
              <th>Clause</th>
              <th>Risk Score</th>
              <th>Severity</th>
              <th>Impact</th>
              <th>Urgency</th>
              <th>Priority</th>
              <th>Scored At</th>
            </tr>
          </thead>
          <tbody>
            {risks.map((r, i) => (
              <tr key={r.risk_id || i} className={styles.tr}>
                <td>
                  <span className={styles.badge} style={
                    r._level === 'document'
                      ? { background: '#ebf0f7', color: '#1a3a5c' }
                      : { background: '#f0ede8', color: '#4a4a4a' }
                  }>
                    {r._level}
                  </span>
                </td>
                <td><code className={styles.code}>{r.doc_id}</code></td>
                <td>
                  {r.clause_id
                    ? <code className={styles.code}>{r.clause_id}</code>
                    : <span className={styles.muted}>—</span>
                  }
                </td>
                <td>
                  <div className={styles.scoreWrap}>
                    <div className={styles.scoreBar}>
                      <div className={styles.scoreFill} style={{
                        width: `${Math.round(parseFloat(r.risk_score) * 100)}%`,
                        background: parseFloat(r.risk_score) > 0.7
                          ? '#e74c3c'
                          : parseFloat(r.risk_score) > 0.3
                          ? '#f39c12'
                          : '#27ae60',
                      }} />
                    </div>
                    <span className={styles.scoreNum}>{parseFloat(r.risk_score).toFixed(2)}</span>
                  </div>
                </td>
                <td className={styles.centered}>{parseFloat(r.severity).toFixed(2)}</td>
                <td className={styles.centered}>{parseFloat(r.impact).toFixed(2)}</td>
                <td className={styles.centered}>{parseFloat(r.urgency).toFixed(2)}</td>
                <td><PriorityBadge priority={r.priority} /></td>
                <td className={styles.muted}>
                  {r.scored_at ? new Date(r.scored_at).toLocaleString() : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function ActionsSection({ documents }) {
  const [actions, setActions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!documents.length) { setLoading(false); return }

    const fetchAll = async () => {
      try {
        const results = await Promise.allSettled(
          documents.map(d =>
            fetch(`${BASE_URL}/actions/${d.doc_id}`)
              .then(r => r.ok ? r.json() : [])
              .catch(() => [])
          )
        )
        const all = results.flatMap(r => r.status === 'fulfilled' ? r.value : [])
        setActions(all)
      } catch {
        setError('Failed to load actions.')
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [documents])

  if (loading) return <Loader />
  if (error) return <ErrorState message={error} />
  if (!actions.length) return <EmptyState message="No actions generated yet." />

  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Action</th>
            <th>Type</th>
            <th>Department</th>
            <th>Clause</th>
            <th>Status</th>
            <th>Generated</th>
          </tr>
        </thead>
        <tbody>
          {actions.map((a, i) => {
            const tc = ACTION_TYPE_COLOR[a.action_type] || { bg: '#f0ede8', text: '#4a4a4a' }
            return (
              <tr key={a.action_id || i} className={styles.tr}>
                <td className={styles.actionText}>{a.action_text}</td>
                <td>
                  <span className={styles.badge} style={{ background: tc.bg, color: tc.text }}>
                    {a.action_type?.replace('_', ' ')}
                  </span>
                </td>
                <td className={styles.muted}>{a.department || '—'}</td>
                <td><code className={styles.code}>{a.clause_id}</code></td>
                <td><StatusBadge status={a.status} /></td>
                <td className={styles.muted}>
                  {a.generated_at ? new Date(a.generated_at).toLocaleString() : '—'}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function MappingsSection({ documents }) {
  const [mappings, setMappings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [rawDebug, setRawDebug] = useState(null)

  useEffect(() => {
    if (!documents.length) { setLoading(false); return }

    const fetchAll = async () => {
      try {
        const results = await Promise.allSettled(
          documents.map(async d => {
            const res = await fetch(`${BASE_URL}/mappings/document/${d.doc_id}`)
            if (!res.ok) return []
            const data = await res.json()

            console.log(`Mappings for ${d.doc_id}:`, data)
            setRawDebug(JSON.stringify(data, null, 2))

            if (Array.isArray(data)) return data
            if (data && Array.isArray(data.mappings)) return data.mappings
            if (data && Array.isArray(data.data)) return data.data
            if (data && Array.isArray(data.results)) return data.results
            if (data && typeof data === 'object' && !Array.isArray(data)) {
              if (data.clause_id || data.mapped_policy) return [data]
            }
            return []
          })
        )

        const all = results.flatMap(r =>
          r.status === 'fulfilled' ? r.value : []
        )

        console.log('All mappings combined:', all)
        setMappings(all)
      } catch (err) {
        console.error('Mappings fetch error:', err)
        setError(`Failed to load mapping data: ${err.message}`)
      } finally {
        setLoading(false)
      }
    }

    fetchAll()
  }, [documents])

  if (loading) return <Loader />
  if (error) return <ErrorState message={error} />

  if (!mappings.length) {
    return (
      <div style={{ padding: '2rem' }}>
        <div className={styles.empty}>
          No mapping data found. Check console (F12) for raw API response.
        </div>
        {rawDebug && (
          <div style={{
            marginTop: '1rem',
            padding: '1rem',
            background: '#f5f4f0',
            border: '1px solid #e0dbd3',
            borderRadius: '6px',
            fontFamily: 'Courier New, monospace',
            fontSize: '0.75rem',
            color: '#1a3a5c',
            whiteSpace: 'pre-wrap',
            maxHeight: '300px',
            overflowY: 'auto'
          }}>
            <p style={{ marginBottom: '0.5rem', fontWeight: 700, fontSize: '0.7rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#7a7a7a' }}>
              Raw API Response (first document):
            </p>
            {rawDebug}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Clause</th>
            <th>Mapped Policy</th>
            <th>Department</th>
            <th>Gap</th>
            <th>Confidence</th>
            <th>Status</th>
            <th>Reasoning</th>
          </tr>
        </thead>
        <tbody>
          {mappings.map((m, i) => (
            <tr key={m.clause_id || i} className={styles.tr}>
              <td><code className={styles.code}>{m.clause_id || '—'}</code></td>
              <td className={styles.policyName}>{m.mapped_policy || '—'}</td>
              <td className={styles.muted}>{m.department || '—'}</td>
              <td>
                <span className={styles.badge} style={
                  m.gap_detected
                    ? { background: '#fdecea', color: '#c0392b' }
                    : { background: '#e8f5e9', color: '#256029' }
                }>
                  {m.gap_detected ? 'Gap Detected' : 'No Gap'}
                </span>
              </td>
              <td>
                <div className={styles.scoreWrap}>
                  <div className={styles.scoreBar}>
                    <div className={styles.scoreFill} style={{
                      width: `${Math.round((m.mapping_confidence || 0) * 100)}%`,
                      background: '#1a3a5c',
                    }} />
                  </div>
                  <span className={styles.scoreNum}>
                    {m.mapping_confidence != null
                      ? parseFloat(m.mapping_confidence).toFixed(2)
                      : '—'}
                  </span>
                </div>
              </td>
              <td><StatusBadge status={m.mapping_status || m.status || 'unknown'} /></td>
              <td className={styles.muted} style={{ maxWidth: '200px', fontSize: '0.72rem' }}>
                {m.reasoning || '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ── Main Dashboard ───────────────────────────────────────

export default function Dashboard() {
  const [documents, setDocuments] = useState([])
  const [risks, setRisks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastRefresh, setLastRefresh] = useState(null)
  const [activeTab, setActiveTab] = useState('pipeline')

//   const fetchData = useCallback(async () => {
//     setLoading(true)
//     setError(null)
//     try {
//       const docsRes = await fetch(`${BASE_URL}/documents`)
//       if (!docsRes.ok) throw new Error(`Documents endpoint returned ${docsRes.status}`)
//       const docs = await docsRes.json()
//       const docList = Array.isArray(docs) ? docs : []
//       setDocuments(docList)

//       const riskResults = await Promise.allSettled(
//         docList.map(d =>
//           fetch(`${BASE_URL}/risk/${d.doc_id}`)
//             .then(r => r.ok ? r.json() : null)
//             .catch(() => null)
//         )
//       )
//       const validRisks = riskResults
//         .filter(r => r.status === 'fulfilled' && r.value)
//         .map(r => r.value)
//       setRisks(validRisks)

//       setLastRefresh(new Date())
//     } catch (err) {
//       setError(`Could not connect to backend at ${BASE_URL}. Make sure your server is running.`)
//     } finally {
//       setLoading(false)
//     }
//   }, [])
const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const docsRes = await fetch(`${BASE_URL}/documents`)
      if (!docsRes.ok) throw new Error(`Documents endpoint returned ${docsRes.status}`)
      const docs = await docsRes.json()
      const docList = Array.isArray(docs) ? docs : []
      setDocuments(docList)

      // Document-level risks
      const riskResults = await Promise.allSettled(
        docList.map(d =>
          fetch(`${BASE_URL}/risk/${d.doc_id}`)
            .then(r => r.ok ? r.json() : null)
            .catch(() => null)
        )
      )
      const docRisks = riskResults
        .filter(r => r.status === 'fulfilled' && r.value)
        .map(r => r.value)

      // Clause-level risks
      const clauseRiskResults = await Promise.allSettled(
        docList.map(d =>
          fetch(`${BASE_URL}/risk/${d.doc_id}/clauses`)
            .then(r => r.ok ? r.json() : [])
            .then(data => Array.isArray(data) ? data : [])
            .catch(() => [])
        )
      )
      const clauseRisks = clauseRiskResults
        .flatMap(r => r.status === 'fulfilled' ? r.value : [])

      setRisks([...docRisks, ...clauseRisks])  // ← both combined

      setLastRefresh(new Date())
    } catch (err) {
      setError(`Could not connect to backend at ${BASE_URL}. Make sure your server is running.`)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [fetchData])

  const tabs = [
    { id: 'pipeline', label: 'Pipeline Status' },
    { id: 'risk',     label: 'Risk Analysis' },
    { id: 'actions',  label: 'Actions' },
    { id: 'mappings', label: 'Policy Mappings' },
  ]

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div className={styles.pageHeaderInner}>
          <div>
            <p className={styles.eyebrow}>Live System</p>
            <h1 className={styles.pageTitle}>Compliance Dashboard</h1>
            <p className={styles.pageSubtitle}>
              Real-time view of document processing, risk scoring, and action generation
              across all three pipelines.
            </p>
          </div>
          <div className={styles.headerRight}>
            {lastRefresh && (
              <p className={styles.refreshNote}>
                Last updated: {lastRefresh.toLocaleTimeString()}
              </p>
            )}
            <button className={styles.refreshBtn} onClick={fetchData} disabled={loading}>
              {loading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>
      </div>

      <div className={styles.content}>
        <section className={styles.section}>
          <SectionHeader eyebrow="System Overview" title="Platform Health" />
          {loading
            ? <Loader />
            : error
            ? <ErrorState message={error} onRetry={fetchData} />
            : <OverviewPanel documents={documents} risks={risks} lastRefresh={lastRefresh} />
          }
        </section>

        <section className={styles.section}>
          <SectionHeader eyebrow="Data Explorer" title="Pipeline Data" />

          <div className={styles.tabs}>
            {tabs.map(t => (
              <button
                key={t.id}
                className={`${styles.tab} ${activeTab === t.id ? styles.tabActive : ''}`}
                onClick={() => setActiveTab(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className={styles.tabContent}>
            {loading
              ? <Loader />
              : error
              ? <ErrorState message={error} onRetry={fetchData} />
              : (
                <>
                  {activeTab === 'pipeline'  && <PipelineStatusSection documents={documents} />}
                  {activeTab === 'risk'      && <RiskSection documents={documents} />}
                  {activeTab === 'actions'   && <ActionsSection documents={documents} />}
                  {activeTab === 'mappings'  && <MappingsSection documents={documents} />}
                </>
              )
            }
          </div>
        </section>
      </div>
    </div>
  )
}