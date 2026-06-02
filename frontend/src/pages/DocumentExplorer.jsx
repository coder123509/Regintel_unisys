import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import styles from './DocumentExplorer.module.css'
import Translate from '../components/Translate'
import useTranslate from '../hooks/useTranslate'

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
  const { t } = useTranslation()
  const s = status?.toLowerCase() || 'unknown'
  const c = STATUS_COLOR[s] || STATUS_COLOR.unknown
  
  // Convert snake_case status to camelCase for i18n lookup
  const i18nKey = s.replace(/_([a-z])/g, (g) => g[1].toUpperCase())
  const translatedS = t(`status.${i18nKey}`, status)
  
  return <Badge label={translatedS} style={{ background: c.bg, color: c.text }} />
}

function PriorityBadge({ priority }) {
  const { t } = useTranslation()
  const p = priority?.toLowerCase() || 'low'
  const c = PRIORITY_COLOR[p] || PRIORITY_COLOR.low
  const translatedP = t(`priority.${p}`, priority)
  return (
    <span className={styles.badge} style={{ background: c.bg, color: c.text }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: c.dot, display: 'inline-block', marginRight: 4 }} />
      {translatedP}
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

function EmptyState({ message, i18nKey }) {
  const { t } = useTranslation()
  const translatedMessage = i18nKey ? t(i18nKey) : useTranslate(message, { dynamic: true })
  return <div className={styles.empty}>{translatedMessage}</div>
}

function SectionBlock({ title, children, count, i18nTitle }) {
  const { t } = useTranslation()
  return (
    <div className={styles.block}>
      <div className={styles.blockHeader}>
        <h3 className={styles.blockTitle}>{i18nTitle ? t(i18nTitle) : title}</h3>
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
  const { t } = useTranslation()
  const fields = [
    { label: 'explorer.documentId',   value: doc.doc_id },
    { label: 'explorer.sourceId',     value: doc.source_id },
    { label: 'explorer.sourceUrl',    value: doc.source_url },
    { label: 'explorer.status',        value: <StatusBadge status={doc.status} /> },
    { label: 'explorer.published',     value: doc.published_at ? new Date(doc.published_at).toLocaleString() : '—' },
    { label: 'explorer.ingested',      value: doc.ingested_at  ? new Date(doc.ingested_at).toLocaleString()  : '—' },
    { label: 'explorer.hash',          value: doc.hash },
  ]

  return (
    <div className={styles.metaGrid}>
      <div className={styles.metaFields}>
        {fields.map((f, i) => (
          <MetaRow key={i} f={f} />
        ))}
      </div>

      {context && (
        <ContextCard context={context} />
      )}
    </div>
  )
}

function MetaRow({ f }) {
  const { t } = useTranslation()
  const translatedLabel = t(f.label)
  return (
    <div className={styles.metaRow}>
      <span className={styles.metaLabel}>{translatedLabel}</span>
      <span className={styles.metaValue}>
        {typeof f.value === 'string'
          ? <code className={styles.code}>{f.value || '—'}</code>
          : f.value}
      </span>
    </div>
  )
}

function ContextCard({ context }) {
  const { t } = useTranslation()
  const translatedSummary = useTranslate(context.summary, { dynamic: true })
  return (
    <div className={styles.contextCard}>
      <p className={styles.contextTitle}>{t('explorer.documentSummary')}</p>
      <p className={styles.contextSummary}>{translatedSummary || '—'}</p>
      {context.keywords?.length > 0 && (
        <div className={styles.keywords}>
          {context.keywords.map((k, i) => (
            <KeywordItem key={i} k={k} />
          ))}
        </div>
      )}
    </div>
  )
}

function KeywordItem({ k }) {
  const translatedKeyword = useTranslate(k, { dynamic: true })
  return <span className={styles.keyword}>{translatedKeyword}</span>
}

function ClausesTable({ clauses }) {
  const { t } = useTranslation()
  if (!clauses.length) return <EmptyState i18nKey="explorer.noClausesFound" message="No clauses found for this document." />

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
            <th>{t('explorer.clauseId')}</th>
            <th>{t('explorer.type')}</th>
            <th>{t('explorer.text')}</th>
            <th>{t('explorer.deadline')}</th>
            <th>{t('explorer.confidence')}</th>
          </tr>
        </thead>
        <tbody>
          {clauses.map((c, i) => (
            <ClauseTableRow key={c.clause_id || i} c={c} typeColor={TYPE_COLOR} />
          ))}
        </tbody>
      </table>
    </div>
  )
}

function ClauseTableRow({ c, typeColor }) {
  const { t } = useTranslation()
  const tc = typeColor[c.type] || { bg: '#f0ede8', text: '#4a4a4a' }
  const translatedType = t(`explorer.types.${c.type}`, c.type)
  const translatedText = useTranslate(c.text, { dynamic: true })
  const translatedDeadline = useTranslate(c.deadline, { dynamic: true })
  
  return (
    <tr className={styles.tr}>
      <td><code className={styles.code}>{c.clause_id}</code></td>
      <td>
        <Badge label={translatedType || '—'}
          style={{ background: tc.bg, color: tc.text }} />
      </td>
      <td className={styles.clauseText}>{translatedText}</td>
      <td className={styles.muted}>{translatedDeadline || '—'}</td>
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
}

function MappingsTable({ mappings }) {
  const { t } = useTranslation()
  if (!mappings.length) return <EmptyState i18nKey="explorer.noMappingsFound" message="No policy mappings found. Run Pipeline 2 for this document." />

  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>{t('dashboard.table.clause')}</th>
            <th>{t('dashboard.table.mappedPolicy')}</th>
            <th>{t('dashboard.table.department')}</th>
            <th>{t('dashboard.table.gap')}</th>
            <th>{t('dashboard.table.confidence')}</th>
            <th>{t('dashboard.table.status')}</th>
            <th>{t('dashboard.table.reasoning')}</th>
          </tr>
        </thead>
        <tbody>
          {mappings.map((m, i) => (
            <MappingTableRow key={m.clause_id || i} m={m} />
          ))}
        </tbody>
      </table>
    </div>
  )
}

function MappingTableRow({ m }) {
  const { t } = useTranslation()
  const translatedPolicy = useTranslate(m.mapped_policy, { dynamic: true })
  const translatedDept = useTranslate(m.department, { dynamic: true })
  const translatedReasoning = useTranslate(m.reasoning, { dynamic: true })
  const gapKey = m.gap_detected ? 'gapDetected' : 'noGap'
  const translatedGapLabel = t(`common.${gapKey}`)

  return (
    <tr className={styles.tr}>
      <td><code className={styles.code}>{m.clause_id || '—'}</code></td>
      <td className={styles.policyName}>{translatedPolicy || '—'}</td>
      <td className={styles.muted}>{translatedDept || '—'}</td>
      <td>
        <Badge
          label={translatedGapLabel}
          style={m.gap_detected
            ? { background: '#fdecea', color: '#c0392b' }
            : { background: '#e8f5e9', color: '#256029' }}
        />
      </td>
      <td><ScoreBar value={m.mapping_confidence} color="#1a3a5c" /></td>
      <td><StatusBadge status={m.mapping_status || m.status} /></td>
      <td className={`${styles.muted} ${styles.reasoning}`}>{translatedReasoning || '—'}</td>
    </tr>
  )
}

function RiskPanel({ docRisk, clauseRisks }) {
  const { t } = useTranslation()
  if (!docRisk && !clauseRisks.length)
    return <EmptyState i18nKey="explorer.noRiskDataFound" message="No risk data found. Run Pipeline 3 for this document." />

  const riskColor = v =>
    parseFloat(v) > 0.7 ? '#e74c3c'
    : parseFloat(v) > 0.3 ? '#f39c12'
    : '#27ae60'

  return (
    <div className={styles.riskPanelWrap}>
      {docRisk && (
        <DocRiskCard docRisk={docRisk} riskColor={riskColor} />
      )}

      {clauseRisks.length > 0 && (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>{t('dashboard.table.clause')}</th>
                <th>{t('dashboard.table.riskScore')}</th>
                <th>{t('dashboard.table.severity')}</th>
                <th>{t('dashboard.table.impact')}</th>
                <th>{t('dashboard.table.urgency')}</th>
                <th>{t('dashboard.table.priority')}</th>
                <th>{t('dashboard.table.scoredAt')}</th>
              </tr>
            </thead>
            <tbody>
              {clauseRisks.map((r, i) => (
                <RiskTableRow key={r.risk_id || i} r={r} riskColor={riskColor} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function DocRiskCard({ docRisk, riskColor }) {
  const { t } = useTranslation()
  return (
    <div className={styles.docRiskCard}>
      <p className={styles.docRiskLabel}>{t('explorer.documentLevelRisk')}</p>
      <div className={styles.docRiskScores}>
        <div className={styles.docRiskMain}>
          <p className={styles.bigScore}
            style={{ color: riskColor(docRisk.risk_score) }}>
            {parseFloat(docRisk.risk_score).toFixed(2)}
          </p>
          <p className={styles.bigScoreLabel}>{t('explorer.overallRiskScore')}</p>
          <PriorityBadge priority={docRisk.priority} />
        </div>
        <div className={styles.docRiskBreakdown}>
          {[
            { label: 'severity', value: docRisk.severity },
            { label: 'impact',   value: docRisk.impact },
            { label: 'urgency',  value: docRisk.urgency },
          ].map(item => (
            <BreakdownItem key={item.label} item={item} riskColor={riskColor} />
          ))}
          <p className={styles.breakdownNote}>
            {t('explorer.scored')}: {docRisk.scored_at ? new Date(docRisk.scored_at).toLocaleString() : '—'}
          </p>
        </div>
      </div>
    </div>
  )
}

function BreakdownItem({ item, riskColor }) {
  const { t } = useTranslation()
  const translatedLabel = t(`dashboard.table.${item.label}`)
  return (
    <div className={styles.breakdownItem}>
      <p className={styles.breakdownLabel}>{translatedLabel}</p>
      <ScoreBar value={item.value} color={riskColor(item.value)} />
    </div>
  )
}

function RiskTableRow({ r, riskColor }) {
  return (
    <tr className={styles.tr}>
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
  )
}

function ActionsTable({ actions }) {
  const { t } = useTranslation()
  if (!actions.length)
    return <EmptyState i18nKey="explorer.noActionsGenerated" message="No actions generated yet. Run Pipeline 3 for this document." />

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
            <th>{t('dashboard.table.action')}</th>
            <th>{t('dashboard.table.type')}</th>
            <th>{t('dashboard.table.department')}</th>
            <th>{t('dashboard.table.clause')}</th>
            <th>{t('dashboard.table.status')}</th>
            <th>{t('dashboard.table.generated')}</th>
          </tr>
        </thead>
        <tbody>
          {actions.map((a, i) => (
            <ActionTableRow key={a.action_id || i} a={a} actionColor={ACTION_COLOR} />
          ))}
        </tbody>
      </table>
    </div>
  )
}

function ActionTableRow({ a, actionColor }) {
  const { t } = useTranslation()
  const tc = actionColor[a.action_type] || { bg: '#f0ede8', text: '#4a4a4a' }
  const translatedText = useTranslate(a.action_text, { dynamic: true })
  const translatedType = useTranslate(a.action_type?.replace('_', ' '), { dynamic: true })
  const translatedDept = useTranslate(a.department, { dynamic: true })
  
  return (
    <tr className={styles.tr}>
      <td className={styles.actionText}>{translatedText}</td>
      <td>
        <Badge
          label={translatedType || '—'}
          style={{ background: tc.bg, color: tc.text }}
        />
      </td>
      <td className={styles.muted}>{translatedDept || '—'}</td>
      <td><code className={styles.code}>{a.clause_id}</code></td>
      <td><StatusBadge status={a.status} /></td>
      <td className={styles.muted}>
        {a.generated_at ? new Date(a.generated_at).toLocaleString() : '—'}
      </td>
    </tr>
  )
}

function FullTextPanel({ text, visible }) {
  const { t } = useTranslation()
  const [expanded, setExpanded] = useState(false)
  const translatedText = useTranslate(text, { dynamic: true, visible: visible && expanded })
  
  if (!text) return <EmptyState i18nKey="explorer.noDocumentText" message="No document text available." />

  // If not expanded, we don't need to translate the full text, 
  // but we might want a translated preview. 
  // However, the requirement is to minimize tokens.
  const content = translatedText || text
  const preview = content.slice(0, 800)
  const hasMore = content.length > 800

  return (
    <div className={styles.fullTextWrap}>
      <p className={styles.fullText}>
        {expanded ? content : preview}
        {hasMore && !expanded && '...'}
      </p>
      {hasMore && (
        <button className={styles.expandBtn} onClick={() => setExpanded(e => !e)}>
          {expanded ? t('explorer.showLess') : t('explorer.showFullText', { count: content.length })}
        </button>
      )}
    </div>
  )
}

// ── Document detail view ─────────────────────────────────

function DocumentDetail({ doc, onBack }) {
  const { t } = useTranslation()
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
    { id: 'overview',  label: t('explorer.tabs.overview') },
    { id: 'clauses',   label: t('explorer.tabs.clauses'), count: data?.clauses.length },
    { id: 'mappings',  label: t('explorer.tabs.mappings'), count: data?.mappings.length },
    { id: 'risk',      label: t('explorer.tabs.risk') },
    { id: 'actions',   label: t('explorer.tabs.actions'), count: data?.actions.length },
    { id: 'fulltext',  label: t('explorer.tabs.fulltext') },
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
          {t('explorer.allDocuments')}
        </button>
        <div className={styles.detailMeta}>
          <div>
            <p className={styles.detailDocId}>{doc.doc_id}</p>
            <p className={styles.detailSource}>{doc.source_id || t('explorer.noSourceId')}</p>
          </div>
          <StatusBadge status={doc.status} />
        </div>
      </div>

      {loading ? <Loader /> : (
        <>
          {/* Quick stat strip */}
          <div className={styles.quickStats}>
            {[
              { label: t('explorer.quickStats.clauses'),        value: data.clauses.length },
              { label: t('explorer.quickStats.mappings'),       value: data.mappings.length },
              { label: t('explorer.quickStats.actions'),        value: data.actions.length },
              { label: t('explorer.quickStats.clauseRisks'),   value: data.clauseRisks.length },
              { label: t('explorer.quickStats.overallRisk'),   value: data.docRisk ? parseFloat(data.docRisk.risk_score).toFixed(2) : '—' },
              { label: t('explorer.quickStats.priority'),       value: data.docRisk
                  ? <PriorityBadge priority={data.docRisk.priority} />
                  : '—'
              },
            ].map((s, i) => (
              <QuickStat key={i} s={s} />
            ))}
          </div>

          {/* Tabs */}
          <div className={styles.tabs}>
            {tabs.map(t => (
              <TabButton key={t.id} t={t} activeTab={activeTab} setActiveTab={setActiveTab} />
            ))}
          </div>

          {/* Tab content */}
          <div className={styles.tabContent}>
            {activeTab === 'overview' && (
              <SectionBlock i18nTitle="explorer.documentMetadata">
                <DocMeta doc={data.fullDoc || doc} context={data.context} />
              </SectionBlock>
            )}
            {activeTab === 'clauses' && (
              <SectionBlock i18nTitle="explorer.extractedClauses" count={data.clauses.length}>
                <ClausesTable clauses={data.clauses} />
              </SectionBlock>
            )}
            {activeTab === 'mappings' && (
              <SectionBlock i18nTitle="explorer.policyMappings" count={data.mappings.length}>
                <MappingsTable mappings={data.mappings} />
              </SectionBlock>
            )}
            {activeTab === 'risk' && (
              <SectionBlock i18nTitle="explorer.riskAnalysis">
                <RiskPanel docRisk={data.docRisk} clauseRisks={data.clauseRisks} />
              </SectionBlock>
            )}
            {activeTab === 'actions' && (
              <SectionBlock i18nTitle="explorer.generatedActions" count={data.actions.length}>
                <ActionsTable actions={data.actions} />
              </SectionBlock>
            )}
            {activeTab === 'fulltext' && (
              <SectionBlock i18nTitle="explorer.fullDocumentText">
                <FullTextPanel text={data.fullDoc?.full_text} visible={activeTab === 'fulltext'} />
              </SectionBlock>
            )}
          </div>
        </>
      )}
    </div>
  )
}

function QuickStat({ s }) {
  return (
    <div className={styles.quickStat}>
      <span className={styles.quickStatVal}>{s.value}</span>
      <span className={styles.quickStatLabel}>{s.label}</span>
    </div>
  )
}

function TabButton({ t, activeTab, setActiveTab }) {
  return (
    <button
      className={`${styles.tab} ${activeTab === t.id ? styles.tabActive : ''}`}
      onClick={() => setActiveTab(t.id)}
    >
      {t.label}
      {t.count !== undefined && ` (${t.count})`}
    </button>
  )
}

// ── Document list sidebar ────────────────────────────────

function DocumentList({ documents, selected, onSelect, loading }) {
  const { t } = useTranslation()
  const [search, setSearch] = useState('')

  const filtered = documents.filter(d =>
    d.doc_id?.toLowerCase().includes(search.toLowerCase()) ||
    d.source_id?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className={styles.sidebar}>
      <div className={styles.sidebarHeader}>
        <p className={styles.sidebarTitle}>{t('nav.documents')}</p>
        <p className={styles.sidebarCount}>{documents.length} {t('explorer.total')}</p>
      </div>

      <div className={styles.searchWrap}>
        <svg className={styles.searchIcon} width="14" height="14" viewBox="0 0 16 16" fill="none">
          <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M11 11L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        <input
          className={styles.searchInput}
          placeholder={t('explorer.searchDocuments')}
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className={styles.list}>
        {loading && <Loader />}
        {!loading && filtered.length === 0 && (
          <EmptyState message="No documents match your search." />
        )}
        {!loading && filtered.map(doc => (
          <DocListItem key={doc.doc_id} doc={doc} selected={selected} onSelect={onSelect} />
        ))}
      </div>
    </div>
  )
}

function DocListItem({ doc, selected, onSelect }) {
  const { t } = useTranslation()
  const isActive = selected?.doc_id === doc.doc_id
  const sc = STATUS_COLOR[doc.status] || STATUS_COLOR.unknown
  
  const i18nStatusKey = doc.status?.replace(/_([a-z])/g, (g) => g[1].toUpperCase())
  const translatedStatus = t(`status.${i18nStatusKey}`, doc.status)
  const translatedSource = doc.source_id || t('explorer.noSource')
  
  return (
    <button
      className={`${styles.listItem} ${isActive ? styles.listItemActive : ''}`}
      onClick={() => onSelect(doc)}
    >
      <div className={styles.listItemTop}>
        <span className={styles.listDocId}>{doc.doc_id}</span>
        <span className={styles.listBadge}
          style={{ background: sc.bg, color: sc.text }}>
          {translatedStatus}
        </span>
      </div>
      <p className={styles.listSource}>{translatedSource}</p>
      {doc.published_at && (
        <p className={styles.listDate}>
          {new Date(doc.published_at).toLocaleDateString()}
        </p>
      )}
    </button>
  )
}

// ── Main page ────────────────────────────────────────────

export default function DocumentExplorer() {
  const { t } = useTranslation()
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
  }, [selected])

  useEffect(() => { fetchDocuments() }, [fetchDocuments])

  return (
    <div className={styles.page}>
      {/* Page header */}
      <div className={styles.pageHeader}>
        <div className={styles.pageHeaderInner}>
          <div>
            <p className={styles.eyebrow}>{t('explorer.documentExplorer')}</p>
            <h1 className={styles.pageTitle}>{t('explorer.allDocuments')}</h1>
            <p className={styles.pageSubtitle}>
              {t('explorer.sub')}
            </p>
          </div>
          <button className={styles.refreshBtn} onClick={fetchDocuments} disabled={loading}>
            {loading ? t('explorer.loading') : t('common.refresh')}
          </button>
        </div>
      </div>

      {error ? (
        <div className={styles.errorBanner}>
          <p>{error}</p>
          <button onClick={fetchDocuments}>{t('common.retry')}</button>
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
                    {t('explorer.selectDocumentPrompt')}
                  </p>
                </div>
            }
          </div>
        </div>
      )}
    </div>
  )
}
