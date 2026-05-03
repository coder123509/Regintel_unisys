import { useState, useEffect, useCallback } from 'react'
import styles from './DocumentExplorer.module.css'

const BASE_URL = 'http://localhost:5000/db'

// ── Helpers ──────────────────────────────────────────────

const PRIORITY_COLOR = {
  high:   { bg: '#fdecea', text: '#c0392b', dot: '#e74c3c' },
  medium: { bg: '#fff8e1', text: '#b7770d', dot: '#f39c12' },
  low:    { bg: '#e8f5e9', text: '#256029', dot: '#27ae60' },
}

const STATUS_COLOR = {
  processed:   { bg: '#e8f5e9', text: '#256029' },
  ingesting:   { bg: '#ebf0f7', text: '#1a3a5c' },
  failed:      { bg: '#fdecea', text: '#c0392b' },
  duplicate:   { bg: '#f5f0e8', text: '#7a5c2e' },
  pending:     { bg: '#fff8e1', text: '#b7770d' },
  in_progress: { bg: '#ebf0f7', text: '#1a3a5c' },
  done:        { bg: '#e8f5e9', text: '#256029' },
  completed:   { bg: '#e8f5e9', text: '#256029' },
  partial:     { bg: '#fff8e1', text: '#b7770d' },
  unknown:     { bg: '#f0ede8', text: '#4a4a4a' },
}

function Badge({ label, style }) {
  return <span className={styles.badge} style={style}>{label}</span>
}

function StatusBadge({ status }) {
  const s = status?.toLowerCase() || 'unknown'
  const c = STATUS_COLOR[s] || STATUS_COLOR.unknown
  return <Badge label={s} style={{ background: c.bg, color: c.text }} />
}

function PriorityBadge({ priority }) {
  const p = priority?.toLowerCase() || 'low'
  const c = PRIORITY_COLOR[p] || PRIORITY_COLOR.low
  return (
    <span className={styles.badge} style={{ background: c.bg, color: c.text }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: c.dot, display: 'inline-block', marginRight: 4 }} />
      {p}
    </span>
  )
}

function ScoreBar({ value, color }) {
  const pct = Math.round(parseFloat(value || 0) * 100)
  return (
    <div className={styles.scoreWrap}>
      <div className={styles.scoreBar}>
        <div className={styles.scoreFill}
          style={{ width: `${pct}%`, background: color || '#1a3a5c' }} />
      </div>
      <span className={styles.scoreNum}>{parseFloat(value || 0).toFixed(2)}</span>
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

function SectionBlock({ title, children, count }) {
  return (
    <div className={styles.block}>
      <div className={styles.blockHeader}>
        <h3 className={styles.blockTitle}>{title}</h3>
        {count !== undefined && (
          <span className={styles.blockCount}>{count}</span>
        )}
      </div>
      <div className={styles.blockBody}>{children}</div>
    </div>
  )
}

// ── Document detail sections ─────────────────────────────

function DocMeta({ doc, context }) {
  const fields = [
    { label: 'Document ID',   value: doc.doc_id },
    { label: 'Source ID',     value: doc.source_id },
    { label: 'Source URL',    value: doc.source_url },
    { label: 'Status',        value: <StatusBadge status={doc.status} /> },
    { label: 'Published',     value: doc.published_at ? new Date(doc.published_at).toLocaleString() : '—' },
    { label: 'Ingested',      value: doc.ingested_at  ? new Date(doc.ingested_at).toLocaleString()  : '—' },
    { label: 'Hash',          value: doc.hash },
  ]

  return (
    <div className={styles.metaGrid}>
      <div className={styles.metaFields}>
        {fields.map((f, i) => (
          <div key={i} className={styles.metaRow}>
            <span className={styles.metaLabel}>{f.label}</span>
            <span className={styles.metaValue}>
              {typeof f.value === 'string'
                ? <code className={styles.code}>{f.value || '—'}</code>
                : f.value}
            </span>
          </div>
        ))}
      </div>

      {context && (
        <div className={styles.contextCard}>
          <p className={styles.contextTitle}>Document Summary</p>
          <p className={styles.contextSummary}>{context.summary || '—'}</p>
          {context.keywords?.length > 0 && (
            <div className={styles.keywords}>
              {context.keywords.map((k, i) => (
                <span key={i} className={styles.keyword}>{k}</span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function ClausesTable({ clauses }) {
  if (!clauses.length) return <EmptyState message="No clauses found for this document." />

  const TYPE_COLOR = {
    obligation:  { bg: '#ebf0f7', text: '#1a3a5c' },
    prohibition: { bg: '#fdecea', text: '#c0392b' },
    permission:  { bg: '#e8f5e9', text: '#256029' },
  }

  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Clause ID</th>
            <th>Type</th>
            <th>Text</th>
            <th>Deadline</th>
            <th>Confidence</th>
          </tr>
        </thead>
        <tbody>
          {clauses.map((c, i) => {
            const tc = TYPE_COLOR[c.type] || { bg: '#f0ede8', text: '#4a4a4a' }
            return (
              <tr key={c.clause_id || i} className={styles.tr}>
                <td><code className={styles.code}>{c.clause_id}</code></td>
                <td>
                  <Badge label={c.type || '—'}
                    style={{ background: tc.bg, color: tc.text }} />
                </td>
                <td className={styles.clauseText}>{c.text}</td>
                <td className={styles.muted}>{c.deadline || '—'}</td>
                <td>
                  <ScoreBar value={c.extraction_confidence}
                    color={
                      (c.extraction_confidence || 0) > 0.8 ? '#27ae60'
                      : (c.extraction_confidence || 0) > 0.5 ? '#f39c12'
                      : '#e74c3c'
                    }
                  />
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function MappingsTable({ mappings }) {
  if (!mappings.length) return <EmptyState message="No policy mappings found. Run Pipeline 2 for this document." />

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
                <Badge
                  label={m.gap_detected ? 'Gap Detected' : 'No Gap'}
                  style={m.gap_detected
                    ? { background: '#fdecea', color: '#c0392b' }
                    : { background: '#e8f5e9', color: '#256029' }}
                />
              </td>
              <td><ScoreBar value={m.mapping_confidence} color="#1a3a5c" /></td>
              <td><StatusBadge status={m.mapping_status || m.status} /></td>
              <td className={`${styles.muted} ${styles.reasoning}`}>{m.reasoning || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function RiskPanel({ docRisk, clauseRisks }) {
  if (!docRisk && !clauseRisks.length)
    return <EmptyState message="No risk data found. Run Pipeline 3 for this document." />

  const riskColor = v =>
    parseFloat(v) > 0.7 ? '#e74c3c'
    : parseFloat(v) > 0.3 ? '#f39c12'
    : '#27ae60'

  return (
    <div className={styles.riskPanelWrap}>
      {docRisk && (
        <div className={styles.docRiskCard}>
          <p className={styles.docRiskLabel}>Document-Level Risk</p>
          <div className={styles.docRiskScores}>
            <div className={styles.docRiskMain}>
              <p className={styles.bigScore}
                style={{ color: riskColor(docRisk.risk_score) }}>
                {parseFloat(docRisk.risk_score).toFixed(2)}
              </p>
              <p className={styles.bigScoreLabel}>Overall Risk Score</p>
              <PriorityBadge priority={docRisk.priority} />
            </div>
            <div className={styles.docRiskBreakdown}>
              {[
                { label: 'Severity', value: docRisk.severity },
                { label: 'Impact',   value: docRisk.impact },
                { label: 'Urgency',  value: docRisk.urgency },
              ].map(item => (
                <div key={item.label} className={styles.breakdownItem}>
                  <p className={styles.breakdownLabel}>{item.label}</p>
                  <ScoreBar value={item.value} color={riskColor(item.value)} />
                </div>
              ))}
              <p className={styles.breakdownNote}>
                Scored: {docRisk.scored_at ? new Date(docRisk.scored_at).toLocaleString() : '—'}
              </p>
            </div>
          </div>
        </div>
      )}

      {clauseRisks.length > 0 && (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
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
              {clauseRisks.map((r, i) => (
                <tr key={r.risk_id || i} className={styles.tr}>
                  <td><code className={styles.code}>{r.clause_id}</code></td>
                  <td><ScoreBar value={r.risk_score} color={riskColor(r.risk_score)} /></td>
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
      )}
    </div>
  )
}

function ActionsTable({ actions }) {
  if (!actions.length)
    return <EmptyState message="No actions generated yet. Run Pipeline 3 for this document." />

  const ACTION_COLOR = {
    policy_update: { bg: '#ebf0f7', text: '#1a3a5c' },
    alert:         { bg: '#fdecea', text: '#c0392b' },
    audit:         { bg: '#fff3d9', text: '#8a5a00' },
    checklist:     { bg: '#e8f5e9', text: '#256029' },
  }

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
            const tc = ACTION_COLOR[a.action_type] || { bg: '#f0ede8', text: '#4a4a4a' }
            return (
              <tr key={a.action_id || i} className={styles.tr}>
                <td className={styles.actionText}>{a.action_text}</td>
                <td>
                  <Badge
                    label={a.action_type?.replace('_', ' ') || '—'}
                    style={{ background: tc.bg, color: tc.text }}
                  />
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

function FullTextPanel({ text }) {
  const [expanded, setExpanded] = useState(false)
  if (!text) return <EmptyState message="No document text available." />

  const preview = text.slice(0, 800)
  const hasMore = text.length > 800

  return (
    <div className={styles.fullTextWrap}>
      <p className={styles.fullText}>
        {expanded ? text : preview}
        {hasMore && !expanded && '...'}
      </p>
      {hasMore && (
        <button className={styles.expandBtn} onClick={() => setExpanded(e => !e)}>
          {expanded ? 'Show less' : `Show full text (${text.length} characters)`}
        </button>
      )}
    </div>
  )
}

// ── Document detail view ─────────────────────────────────

function DocumentDetail({ doc, onBack }) {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true)
      try {
        const [fullDoc, context, clauses, mappings, docRisk, clauseRisks, actions] =
          await Promise.allSettled([
            fetch(`${BASE_URL}/documents/${doc.doc_id}`).then(r => r.ok ? r.json() : null),
            fetch(`${BASE_URL}/documents/${doc.doc_id}/context`).then(r => r.ok ? r.json() : null),
            fetch(`${BASE_URL}/documents/${doc.doc_id}/clauses`).then(r => r.ok ? r.json() : []),
            fetch(`${BASE_URL}/mappings/document/${doc.doc_id}`).then(r => r.ok ? r.json() : []),
            fetch(`${BASE_URL}/risk/${doc.doc_id}`).then(r => r.ok ? r.json() : null),
            fetch(`${BASE_URL}/risk/${doc.doc_id}/clauses`).then(r => r.ok ? r.json() : []),
            fetch(`${BASE_URL}/actions/${doc.doc_id}`).then(r => r.ok ? r.json() : []),
          ])

        const safeArr = r => {
          const v = r.status === 'fulfilled' ? r.value : []
          if (Array.isArray(v)) return v
          if (v && Array.isArray(v.mappings)) return v.mappings
          if (v && Array.isArray(v.data)) return v.data
          return []
        }

        setData({
          fullDoc:      fullDoc.status === 'fulfilled' ? fullDoc.value : null,
          context:      context.status === 'fulfilled' ? context.value : null,
          clauses:      safeArr(clauses),
          mappings:     safeArr(mappings),
          docRisk:      docRisk.status === 'fulfilled' ? docRisk.value : null,
          clauseRisks:  safeArr(clauseRisks),
          actions:      safeArr(actions),
        })
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [doc.doc_id])

  const tabs = [
    { id: 'overview',  label: 'Overview' },
    { id: 'clauses',   label: `Clauses${data ? ` (${data.clauses.length})` : ''}` },
    { id: 'mappings',  label: `Policy Mappings${data ? ` (${data.mappings.length})` : ''}` },
    { id: 'risk',      label: 'Risk Analysis' },
    { id: 'actions',   label: `Actions${data ? ` (${data.actions.length})` : ''}` },
    { id: 'fulltext',  label: 'Full Text' },
  ]

  return (
    <div className={styles.detail}>
      {/* Detail header */}
      <div className={styles.detailHeader}>
        <button className={styles.backBtn} onClick={onBack}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5"
              strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          All Documents
        </button>
        <div className={styles.detailMeta}>
          <div>
            <p className={styles.detailDocId}>{doc.doc_id}</p>
            <p className={styles.detailSource}>{doc.source_id || 'No source ID'}</p>
          </div>
          <StatusBadge status={doc.status} />
        </div>
      </div>

      {loading ? <Loader /> : (
        <>
          {/* Quick stat strip */}
          <div className={styles.quickStats}>
            {[
              { label: 'Clauses',        value: data.clauses.length },
              { label: 'Mappings',       value: data.mappings.length },
              { label: 'Actions',        value: data.actions.length },
              { label: 'Clause Risks',   value: data.clauseRisks.length },
              { label: 'Overall Risk',   value: data.docRisk ? parseFloat(data.docRisk.risk_score).toFixed(2) : '—' },
              { label: 'Priority',       value: data.docRisk
                  ? <PriorityBadge priority={data.docRisk.priority} />
                  : '—'
              },
            ].map((s, i) => (
              <div key={i} className={styles.quickStat}>
                <span className={styles.quickStatVal}>{s.value}</span>
                <span className={styles.quickStatLabel}>{s.label}</span>
              </div>
            ))}
          </div>

          {/* Tabs */}
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

          {/* Tab content */}
          <div className={styles.tabContent}>
            {activeTab === 'overview' && (
              <SectionBlock title="Document Metadata">
                <DocMeta doc={data.fullDoc || doc} context={data.context} />
              </SectionBlock>
            )}
            {activeTab === 'clauses' && (
              <SectionBlock title="Extracted Clauses" count={data.clauses.length}>
                <ClausesTable clauses={data.clauses} />
              </SectionBlock>
            )}
            {activeTab === 'mappings' && (
              <SectionBlock title="Policy Mappings" count={data.mappings.length}>
                <MappingsTable mappings={data.mappings} />
              </SectionBlock>
            )}
            {activeTab === 'risk' && (
              <SectionBlock title="Risk Analysis">
                <RiskPanel docRisk={data.docRisk} clauseRisks={data.clauseRisks} />
              </SectionBlock>
            )}
            {activeTab === 'actions' && (
              <SectionBlock title="Generated Actions" count={data.actions.length}>
                <ActionsTable actions={data.actions} />
              </SectionBlock>
            )}
            {activeTab === 'fulltext' && (
              <SectionBlock title="Full Document Text">
                <FullTextPanel text={data.fullDoc?.full_text} />
              </SectionBlock>
            )}
          </div>
        </>
      )}
    </div>
  )
}

// ── Document list sidebar ────────────────────────────────

function DocumentList({ documents, selected, onSelect, loading }) {
  const [search, setSearch] = useState('')

  const filtered = documents.filter(d =>
    d.doc_id?.toLowerCase().includes(search.toLowerCase()) ||
    d.source_id?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className={styles.sidebar}>
      <div className={styles.sidebarHeader}>
        <p className={styles.sidebarTitle}>Documents</p>
        <p className={styles.sidebarCount}>{documents.length} total</p>
      </div>

      <div className={styles.searchWrap}>
        <svg className={styles.searchIcon} width="14" height="14" viewBox="0 0 16 16" fill="none">
          <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M11 11L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        <input
          className={styles.searchInput}
          placeholder="Search documents..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className={styles.list}>
        {loading && <Loader />}
        {!loading && filtered.length === 0 && (
          <EmptyState message="No documents match your search." />
        )}
        {!loading && filtered.map(doc => {
          const isActive = selected?.doc_id === doc.doc_id
          const sc = STATUS_COLOR[doc.status] || STATUS_COLOR.unknown
          return (
            <button
              key={doc.doc_id}
              className={`${styles.listItem} ${isActive ? styles.listItemActive : ''}`}
              onClick={() => onSelect(doc)}
            >
              <div className={styles.listItemTop}>
                <span className={styles.listDocId}>{doc.doc_id}</span>
                <span className={styles.listBadge}
                  style={{ background: sc.bg, color: sc.text }}>
                  {doc.status}
                </span>
              </div>
              <p className={styles.listSource}>{doc.source_id || 'No source'}</p>
              {doc.published_at && (
                <p className={styles.listDate}>
                  {new Date(doc.published_at).toLocaleDateString()}
                </p>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── Main page ────────────────────────────────────────────

export default function DocumentExplorer() {
  const [documents, setDocuments] = useState([])
  const [selected, setSelected]   = useState(null)
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState(null)

  const fetchDocuments = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${BASE_URL}/documents`)
      if (!res.ok) throw new Error(`Status ${res.status}`)
      const data = await res.json()
      const list = Array.isArray(data) ? data : []
      setDocuments(list)
      if (list.length && !selected) setSelected(list[0])
    } catch (err) {
      setError(`Could not reach backend at ${BASE_URL}. Make sure the server is running.`)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchDocuments() }, [fetchDocuments])

  return (
    <div className={styles.page}>
      {/* Page header */}
      <div className={styles.pageHeader}>
        <div className={styles.pageHeaderInner}>
          <div>
            <p className={styles.eyebrow}>Document Explorer</p>
            <h1 className={styles.pageTitle}>All Documents</h1>
            <p className={styles.pageSubtitle}>
              Select a document from the list to view all associated clauses,
              policy mappings, risk scores, and generated actions.
            </p>
          </div>
          <button className={styles.refreshBtn} onClick={fetchDocuments} disabled={loading}>
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </div>

      {error ? (
        <div className={styles.errorBanner}>
          <p>{error}</p>
          <button onClick={fetchDocuments}>Retry</button>
        </div>
      ) : (
        <div className={styles.layout}>
          <DocumentList
            documents={documents}
            selected={selected}
            onSelect={setSelected}
            loading={loading}
          />
          <div className={styles.main}>
            {selected
              ? <DocumentDetail doc={selected} onBack={() => setSelected(null)} />
              : <div className={styles.placeholder}>
                  <p className={styles.placeholderText}>
                    Select a document from the list to view its details.
                  </p>
                </div>
            }
          </div>
        </div>
      )}
    </div>
  )
}