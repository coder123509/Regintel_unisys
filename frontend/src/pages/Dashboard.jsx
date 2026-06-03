import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import styles from './Dashboard.module.css'
import Translate from '../components/Translate'
import useTranslate from '../hooks/useTranslate'
import TranslationService from '../services/TranslationService'

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

const STAT_ICONS = {
  'totalDocuments':    { icon: 'ti-files',         bg: '#E6F1FB', color: '#0C447C', bar: '#185FA5', pct: 100 },
  'clausesExtracted':  { icon: 'ti-list-details',  bg: '#FAEEDA', color: '#633806', bar: '#BA7517', pct: 88  },
  'processingSuccess': { icon: 'ti-circle-check',  bg: '#EAF3DE', color: '#3B6D11', bar: '#639922', pct: 100 },
  'highRiskItems':    { icon: 'ti-alert-triangle', bg: '#FCEBEB', color: '#791F1F', bar: '#A32D2D', pct: 40  },
  'lastPipelineRun':  { icon: 'ti-clock',         bg: '#EEEDFE', color: '#3C3489', bar: '#534AB7', pct: 75  },
}

function StatCard({ label, value, sub, i18nLabel, i18nSub }) {
  const { t } = useTranslation()
  const meta = STAT_ICONS[i18nLabel] || { icon: 'ti-chart-bar', bg: '#F1EFE8', color: '#444441', bar: '#888780', pct: 50 }
  const isDate = typeof value === 'string' && value.includes('/')
  
  const translatedLabel = t(`dashboard.${i18nLabel}`)
  const translatedSub = i18nSub ? t(`dashboard.${i18nSub}`) : sub
  const translatedValue = isDate ? value : value

  return (
    <div className={styles.statCard}>
      <div className={styles.statCardTop}>
        <span className={styles.statLabel}>{translatedLabel}</span>
      </div>
      <p className={styles.statValue} style={{ fontSize: isDate ? '1.1rem' : undefined }}>
        {translatedValue ?? '—'}
      </p>
      <div className={styles.statBarRow}>
        <div className={styles.statBarTrack}>
          <div className={styles.statBarFill} style={{ width: `${meta.pct}%`, background: meta.bar }} />
        </div>
        {translatedSub && <span className={styles.statSub}>{translatedSub}</span>}
      </div>
    </div>
  )
}

function PriorityBadge({ priority }) {
  const { t } = useTranslation()
  const c = PRIORITY_COLOR[priority] || PRIORITY_COLOR.low
  const translatedPriority = t(`priority.${priority}`)
  return (
    <span className={styles.badge} style={{ background: c.bg, color: c.text }}>
      <span className={styles.badgeDot} style={{ background: c.dot }} />
      {translatedPriority}
    </span>
  )
}

function StatusBadge({ status }) {
  const { t } = useTranslation()
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
  
  // Convert snake_case status to camelCase for i18n lookup
  const i18nKey = status.replace(/_([a-z])/g, (g) => g[1].toUpperCase())
  const translatedStatus = t(`status.${i18nKey}`, status)

  return (
    <span className={styles.badge} style={{ background: c.bg, color: c.text }}>
      {translatedStatus}
    </span>
  )
}

function SectionHeader({ eyebrow, title, i18nEyebrow, i18nTitle }) {
  const { t } = useTranslation()
  return (
    <div className={styles.sectionHeader}>
      <span className={styles.eyebrow}>{t(`dashboard.${i18nEyebrow}`)}</span>
      <h2 className={styles.sectionTitle}>{t(`dashboard.${i18nTitle}`)}</h2>
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
  const translatedMessage = useTranslate(message, { dynamic: true })
  return <div className={styles.empty}>{translatedMessage}</div>
}

function ErrorState({ message, onRetry }) {
  const { t } = useTranslation()
  const translatedMessage = useTranslate(message, { dynamic: true })
  return (
    <div className={styles.errorState}>
      <p>{translatedMessage}</p>
      {onRetry && <button className={styles.retryBtn} onClick={onRetry}>{t('common.retry')}</button>}
    </div>
  )
}

function OverviewPanel({ documents, risks, lastRefresh }) {
  const { t } = useTranslation()
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
      <StatCard i18nLabel="totalDocuments" i18nSub="allTime" value={total} accent="#1a3a5c" />
      <StatCard
        i18nLabel="clausesExtracted"
        i18nSub="acrossAllDocuments"
        value={loadingClauses ? '...' : clauseCount}
        accent="#b5873c"
      />
      <StatCard 
        i18nLabel="processingSuccess" 
        i18nSub="failed" 
        sub={`${failed} ${t('status.failed')}`}
        value={`${successRate}%`} 
        accent="#27ae60" 
      />
      <StatCard i18nLabel="highRiskItems" i18nSub="requireAttention" value={highRisk} accent="#e74c3c" />
      <StatCard i18nLabel="lastPipelineRun" i18nSub="timeOfLastRefresh" value={lastRun} accent="#2c5282" />
    </div>
  )
}

function PipelineTracker({ doc }) {
  const { t } = useTranslation()
  const [status, setStatus] = useState({
    p1: 'checking',
    p2: 'checking',
    p3: 'checking',
  })

  useEffect(() => {
    let interval;
    const checkStatus = async () => {
      try {
        const res = await fetch(`${BASE_URL}/pipeline-status/${doc.doc_id}`);
        if (!res.ok) {
          const p1 =
            doc.status === 'processed' ? 'completed' :
            doc.status === 'ingesting' ? 'in_progress' :
            doc.status === 'failed' ? 'failed' :
            doc.status === 'duplicate' ? 'duplicate' : 'not_started';
          
          setStatus({ p1, p2: 'not_started', p3: 'not_started' });
          return;
        }

        const data = await res.json();
        if (!data) return;

        const newStatus = {
          p1: data.p1_status === 'processing' ? 'in_progress' : data.p1_status || 'not_started',
          p2: data.p2_status === 'processing' ? 'in_progress' : data.p2_status || 'not_started',
          p3: data.p3_status === 'processing' ? 'in_progress' : data.p3_status || 'not_started',
        };

        setStatus(newStatus);

        const finalStates = ['completed', 'failed', 'duplicate'];
        const allFinal = finalStates.includes(newStatus.p1) &&
                         finalStates.includes(newStatus.p2) &&
                         finalStates.includes(newStatus.p3);

        if (allFinal && interval) {
          clearInterval(interval);
        }
      } catch (err) {
        console.error('Failed to check pipeline status:', err);
      }
    };

    checkStatus();
    interval = setInterval(checkStatus, 3000);

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [doc.doc_id, doc.status])

  const statusMeta = {
    completed:   { bg: '#e8f5e9', text: '#256029', dot: '#27ae60', bar: '#27ae60', pct: 100 },
    in_progress: { bg: '#ebf0f7', text: '#1a3a5c', dot: '#2c5282', bar: '#2c5282', pct: 55  },
    partial:     { bg: '#fff8e1', text: '#b7770d', dot: '#f39c12', bar: '#f39c12', pct: 70  },
    failed:      { bg: '#fdecea', text: '#c0392b', dot: '#e74c3c', bar: '#e74c3c', pct: 100 },
    duplicate:   { bg: '#f5f0e8', text: '#7a5c2e', dot: '#b5873c', bar: '#b5873c', pct: 100 },
    not_started: { bg: '#f0ede8', text: '#7a7a7a', dot: '#c5bfb5', bar: '#e0dbd3', pct: 0   },
    pending:     { bg: '#f0ede8', text: '#7a7a7a', dot: '#c5bfb5', bar: '#e0dbd3', pct: 0   },
    checking:    { bg: '#f0ede8', text: '#7a7a7a', dot: '#c5bfb5', bar: '#e0dbd3', pct: 0   },
  }

  const stages = [
    {
      id: 'p1',
      label: t('dashboard.pipelines.p1.label'),
      sub: t('dashboard.pipelines.p1.sub'),
      status: status.p1,
      detail: status.p1 === 'checking' ? t('dashboard.checking') : status.p1.replace(/_/g, ' '),
      steps: t('dashboard.pipelines.p1.steps', { returnObjects: true }) || [],
    },
    {
      id: 'p2',
      label: t('dashboard.pipelines.p2.label'),
      sub: t('dashboard.pipelines.p2.sub'),
      status: status.p2,
      detail: status.p2 === 'checking' ? t('dashboard.checking') : status.p2.replace(/_/g, ' '),
      steps: t('dashboard.pipelines.p2.steps', { returnObjects: true }) || [],
    },
    {
      id: 'p3',
      label: t('dashboard.pipelines.p3.label'),
      sub: t('dashboard.pipelines.p3.sub'),
      status: status.p3,
      detail: status.p3 === 'checking' ? t('dashboard.checking') : status.p3.replace(/_/g, ' '),
      steps: t('dashboard.pipelines.p3.steps', { returnObjects: true }) || [],
    },
  ]

  const completedCount = [status.p1, status.p2, status.p3].filter(s => s === 'completed').length
  const overallPct = Math.round((completedCount / 3) * 100)

  return (
    <div className={styles.trackerWrap}>
      <div className={styles.overallBar}>
        <div className={styles.overallBarTop}>
          <span className={styles.overallLabel}>
            {t('dashboard.overallProgress')} — {doc.doc_id}
          </span>
          <span className={styles.overallPct}>{overallPct}% {t('dashboard.complete')}</span>
        </div>
        <div className={styles.overallTrack}>
          <div className={styles.overallFill} style={{ width: `${overallPct}%` }} />
        </div>
        <div className={styles.overallStageRow}>
          {stages.map((st, i) => {
            const sm = statusMeta[st.status] || statusMeta.not_started
            return (
              <div key={i} className={styles.overallStagePill}
                style={{ background: sm.bg, color: sm.text }}>
                <span className={styles.overallStageDot} style={{ background: sm.dot }} />
                {st.label}
              </div>
            )
          })}
        </div>
      </div>

      <div className={styles.pipelineCards}>
        {stages.map((stage, idx) => {
          const sm = statusMeta[stage.status] || statusMeta.not_started
          const isLast = idx === stages.length - 1
          const isPulsing = stage.status === 'in_progress' || stage.status === 'checking'
          
          const i18nStatusKey = stage.status.replace(/_([a-z])/g, (g) => g[1].toUpperCase())
          const translatedDetail = stage.status === 'checking' ? t('dashboard.checking') : t(`status.${i18nStatusKey}`, stage.detail)

          return (
            <div key={stage.id} className={styles.pipelineCardRow}>
              <div className={styles.pipelineCard}
                style={{ borderTopColor: sm.bar, borderTopWidth: 3, borderTopStyle: 'solid' }}>

                <div className={styles.pcHeader}>
                  <div className={styles.pcLeft}>
                    <div className={styles.pcIndex}>{String(idx + 1).padStart(2, '0')}</div>
                    <div>
                      <p className={styles.pcLabel}>{stage.label}</p>
                      <p className={styles.pcSub}>{stage.sub}</p>
                    </div>
                  </div>
                  <span className={styles.pcBadge}
                    style={{ background: sm.bg, color: sm.text }}>
                    <span className={styles.pcBadgeDot}
                      style={{
                        background: sm.dot,
                        animation: isPulsing ? 'pulseDot 1.5s ease-in-out infinite' : 'none',
                      }} />
                    {translatedDetail}
                  </span>
                </div>

                <div className={styles.pcBarTrack}>
                  <div className={styles.pcBarFill}
                    style={{ width: `${sm.pct}%`, background: sm.bar }} />
                </div>

                <div className={styles.pcSteps}>
                  {stage.steps.map((step, si) => {
                    const done   = sm.pct === 100
                    const active = stage.status === 'in_progress' && si === 2
                    return <StepItem key={si} step={step} done={done} active={active} sm={sm} />
                  })}
                </div>
              </div>

              {!isLast && (
                <div className={styles.cardConnector}>
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path
                      d="M10 2V15M10 15L4 9M10 15L16 9"
                      stroke={completedCount > idx ? '#27ae60' : 'var(--c-border)'}
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function StepItem({ step, done, active, sm }) {
  return (
    <div className={styles.pcStep}>
      <span className={styles.pcStepDot}
        style={{
          background: done || active ? sm.bar : 'var(--c-border)',
          opacity: done || active ? 1 : 0.4,
        }} />
      <span className={styles.pcStepLabel}
        style={{
          color: done || active ? 'var(--c-text-primary)' : 'var(--c-text-muted)',
          fontWeight: active ? 600 : 400,
        }}>
        {step}
      </span>
    </div>
  )
}

function PipelineStatusSection({ documents }) {
  const { t } = useTranslation()
  const [selected, setSelected] = useState(
    documents.length > 0 ? documents[0] : null
  )

  useEffect(() => {
    if (documents.length > 0 && !selected) {
      setSelected(documents[0])
    }
  }, [documents])

  if (!documents.length) return <EmptyState message={t('dashboard.noDocumentsFound')} />

  return (
    <div className={styles.pipelineLayout}>
      <div className={styles.pipelineDocList}>
        <p className={styles.pipelineDocListTitle}>{t('dashboard.selectDocument')}</p>
        {documents.map(doc => (
          <button
            key={doc.doc_id}
            className={`${styles.pipelineDocBtn} ${selected?.doc_id === doc.doc_id ? styles.pipelineDocBtnActive : ''}`}
            onClick={() => setSelected(doc)}
          >
            <span className={styles.pipelineDocId}>{doc.doc_id}</span>
            <span className={styles.pipelineDocSource}>{doc.source_id || '—'}</span>
          </button>
        ))}
      </div>

      <div className={styles.pipelineTrackerArea}>
        {selected
          ? <PipelineTracker key={selected.doc_id} doc={selected} />
          : <EmptyState message={t('dashboard.selectADocumentToViewPipelineStatus')} />
        }
      </div>
    </div>
  )
}

function RiskSection({ documents }) {
  const { t } = useTranslation()
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
        setError(t('dashboard.failedToLoadRiskData'))
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [documents, t])

  const dist = { high: 0, medium: 0, low: 0 }
  risks.forEach(r => { if (r.priority in dist) dist[r.priority]++ })
  const total = risks.length || 1

  if (loading) return <Loader />
  if (error) return <ErrorState message={error} />
  if (!risks.length) return <EmptyState message={t('dashboard.noRiskDataAvailableYet')} />

  return (
    <div className={styles.riskLayout}>
      <div className={styles.riskDistCard}>
        <p className={styles.cardLabel}>
          {t('dashboard.riskDistribution')} — {risks.length} {t('dashboard.entries')}
          ({risks.filter(r => r._level === 'document').length} {t('dashboard.documentLevel')},{' '}
          {risks.filter(r => r._level === 'clause').length} {t('dashboard.clauseLevel')})
        </p>
        <div className={styles.distBar}>
          {dist.high > 0 && (
            <div className={styles.distSegHigh}
              style={{ width: `${(dist.high / total) * 100}%` }}
              title={`${t('priority.high')}: ${dist.high}`} />
          )}
          {dist.medium > 0 && (
            <div className={styles.distSegMed}
              style={{ width: `${(dist.medium / total) * 100}%` }}
              title={`${t('priority.medium')}: ${dist.medium}`} />
          )}
          {dist.low > 0 && (
            <div className={styles.distSegLow}
              style={{ width: `${(dist.low / total) * 100}%` }}
              title={`${t('priority.low')}: ${dist.low}`} />
          )}
        </div>
        <div className={styles.distLegend}>
          {['high', 'medium', 'low'].map(p => (
            <LegendItem key={p} p={p} count={dist[p]} />
          ))}
        </div>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>{t('dashboard.table.level')}</th>
              <th>{t('dashboard.table.document')}</th>
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
            {risks.map((r, i) => (
              <RiskTableRow key={r.risk_id || i} r={r} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function LegendItem({ p, count }) {
  const { t } = useTranslation()
  const translatedP = t(`priority.${p}`)
  return (
    <div className={styles.legendItem}>
      <span className={styles.legendDot} style={{ background: PRIORITY_COLOR[p].dot }} />
      <span className={styles.legendLabel}>{translatedP}</span>
      <span className={styles.legendCount}>{count}</span>
    </div>
  )
}

function RiskTableRow({ r }) {
  const { t } = useTranslation()
  const translatedLevel = t(`dashboard.${r._level}Level`)
  return (
    <tr className={styles.tr}>
      <td>
        <span className={styles.badge} style={
          r._level === 'document'
            ? { background: '#ebf0f7', color: '#1a3a5c' }
            : { background: '#f0ede8', color: '#4a4a4a' }
        }>
          {translatedLevel}
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
  )
}



function ActionsSection({ documents }) {
  const { t, i18n } = useTranslation()
  const [actions, setActions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [translatedData, setTranslatedData] = useState({})

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
        setLoading(false)

        // Start batch translation for dynamic fields
        if (i18n.language !== 'en') {
          translateAll(all, i18n.language)
        }
      } catch {
        setError(t('dashboard.failedToLoadActions'))
        setLoading(false)
      }
    }

    const translateAll = async (items, lang) => {
      const textsToTranslate = items.flatMap(a => [
        a.action_text,
        a.action_type?.replace('_', ' '),
        a.department
      ]).filter(Boolean);

      const uniqueTexts = [...new Set(textsToTranslate)];
      
      // Filter out what's already in the local cache to avoid redundant calls
      const cachedData = JSON.parse(localStorage.getItem("dynamic_translation_cache") || "{}");
      const neededTexts = uniqueTexts.filter(text => !cachedData[`${lang}_${text}`]);

      // Immediately set cached values to state
      const initialResults = {};
      uniqueTexts.forEach(text => {
        if (cachedData[`${lang}_${text}`]) {
          initialResults[text] = cachedData[`${lang}_${text}`];
        }
      });
      if (Object.keys(initialResults).length > 0) {
        setTranslatedData(prev => ({ ...prev, ...initialResults }));
      }

      if (neededTexts.length === 0) return;
      
      // Translate in smaller batches of 5 for progressive updates
      const batchSize = 5;
      for (let i = 0; i < neededTexts.length; i += batchSize) {
        const batch = neededTexts.slice(i, i + batchSize);
        const results = await TranslationService.translateBatch(batch, lang);
        
        setTranslatedData(prev => {
          const next = { ...prev };
          batch.forEach((original, idx) => {
            next[original] = results[idx];
          });
          return next;
        });
      }
    }

    fetchAll()
  }, [documents, t, i18n.language])

  if (loading) return <Loader />
  if (error) return <ErrorState message={error} />
  if (!actions.length) return <EmptyState message={t('dashboard.noActionsGeneratedYet')} />

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
            <ActionTableRow 
              key={a.action_id || i} 
              a={a} 
              translations={translatedData}
              lang={i18n.language}
            />
          ))}
        </tbody>
      </table>
    </div>
  )
}

function ActionTableRow({ a, translations, lang }) {
  const { t } = useTranslation()
  const tc = ACTION_TYPE_COLOR[a.action_type] || { bg: '#f0ede8', text: '#4a4a4a' }
  
  const getTranslated = (text) => {
    if (!text || lang === 'en') return text;
    if (translations[text]) return translations[text];
    
    // Check global cache as well (fallback if parent state hasn't updated yet)
    const cachedData = JSON.parse(localStorage.getItem("dynamic_translation_cache") || "{}");
    if (cachedData[`${lang}_${text}`]) return cachedData[`${lang}_${text}`];

    return t('common.translating', 'Translating...');
  }

  return (
    <tr className={styles.tr}>
      <td className={styles.actionText}>{getTranslated(a.action_text)}</td>
      <td>
        <span className={styles.badge} style={{ background: tc.bg, color: tc.text }}>
          {getTranslated(a.action_type?.replace('_', ' '))}
        </span>
      </td>
      <td className={styles.muted}>{getTranslated(a.department) || '—'}</td>
      <td><code className={styles.code}>{a.clause_id}</code></td>
      <td><StatusBadge status={a.status} /></td>
      <td className={styles.muted}>
        {a.generated_at ? new Date(a.generated_at).toLocaleString() : '—'}
      </td>
    </tr>
  )
}

function MappingsSection({ documents }) {
  const { t, i18n } = useTranslation()
  const [mappings, setMappings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [translatedData, setTranslatedData] = useState({})

  useEffect(() => {
    if (!documents.length) { setLoading(false); return }

    const fetchAll = async () => {
      try {
        const results = await Promise.allSettled(
          documents.map(async d => {
            const res = await fetch(`${BASE_URL}/mappings/document/${d.doc_id}`)
            if (!res.ok) return []
            const data = await res.json()
            if (Array.isArray(data)) return data
            if (data && Array.isArray(data.mappings)) return data.mappings
            if (data && Array.isArray(data.data)) return data.data
            return []
          })
        )
        const all = results.flatMap(r => r.status === 'fulfilled' ? r.value : [])
        setMappings(all)
        setLoading(false)

        if (i18n.language !== 'en') {
          translateAll(all, i18n.language)
        }
      } catch (err) {
        setError(`${t('dashboard.failedToLoadMappingData')}: ${err.message}`)
        setLoading(false)
      }
    }

    const translateAll = async (items, lang) => {
      const textsToTranslate = items.flatMap(m => [
        m.mapped_policy,
        m.department,
        m.reasoning
      ]).filter(Boolean);

      const uniqueTexts = [...new Set(textsToTranslate)];
      
      // Filter out what's already in the local cache to avoid redundant calls
      const cachedData = JSON.parse(localStorage.getItem("dynamic_translation_cache") || "{}");
      const neededTexts = uniqueTexts.filter(text => !cachedData[`${lang}_${text}`]);

      // Immediately set cached values to state
      const initialResults = {};
      uniqueTexts.forEach(text => {
        if (cachedData[`${lang}_${text}`]) {
          initialResults[text] = cachedData[`${lang}_${text}`];
        }
      });
      if (Object.keys(initialResults).length > 0) {
        setTranslatedData(prev => ({ ...prev, ...initialResults }));
      }

      if (neededTexts.length === 0) return;

      const batchSize = 5;
      for (let i = 0; i < neededTexts.length; i += batchSize) {
        const batch = neededTexts.slice(i, i + batchSize);
        const results = await TranslationService.translateBatch(batch, lang);
        
        setTranslatedData(prev => {
          const next = { ...prev };
          batch.forEach((original, idx) => {
            next[original] = results[idx];
          });
          return next;
        });
      }
    }

    fetchAll()
  }, [documents, t, i18n.language])

  if (loading) return <Loader />
  if (error) return <ErrorState message={error} />
  if (!mappings.length) return <EmptyState message={t('dashboard.noMappingDataFound')} />

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
            <MappingTableRow 
              key={m.clause_id || i} 
              m={m} 
              translations={translatedData}
              lang={i18n.language}
            />
          ))}
        </tbody>
      </table>
    </div>
  )
}

function MappingTableRow({ m, translations, lang }) {
  const { t } = useTranslation()
  
  const getTranslated = (text) => {
    if (!text || lang === 'en') return text;
    if (translations[text]) return translations[text];

    // Check global cache as well (fallback if parent state hasn't updated yet)
    const cachedData = JSON.parse(localStorage.getItem("dynamic_translation_cache") || "{}");
    if (cachedData[`${lang}_${text}`]) return cachedData[`${lang}_${text}`];

    return t('common.translating', 'Translating...');
  }

  const gapKey = m.gap_detected ? 'gapDetected' : 'noGap'
  const translatedGap = t(`common.${gapKey}`)

  return (
    <tr className={styles.tr}>
      <td><code className={styles.code}>{m.clause_id || '—'}</code></td>
      <td className={styles.policyName}>{getTranslated(m.mapped_policy) || '—'}</td>
      <td className={styles.muted}>{getTranslated(m.department) || '—'}</td>
      <td>
        <span className={styles.badge} style={
          m.gap_detected
            ? { background: '#fdecea', color: '#c0392b' }
            : { background: '#e8f5e9', color: '#256029' }
        }>
          {translatedGap}
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
            {m.mapping_confidence != null ? parseFloat(m.mapping_confidence).toFixed(2) : '—'}
          </span>
        </div>
      </td>
      <td><StatusBadge status={m.mapping_status || m.status || 'unknown'} /></td>
      <td className={styles.muted} style={{ maxWidth: '200px', fontSize: '0.72rem' }}>
        {getTranslated(m.reasoning) || '—'}
      </td>
    </tr>
  )
}

export default function Dashboard() {
  const { t } = useTranslation()
  const [documents, setDocuments] = useState([])
  const [risks, setRisks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastRefresh, setLastRefresh] = useState(null)
  const [activeTab, setActiveTab] = useState('pipeline')

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const docsRes = await fetch(`${BASE_URL}/documents`)
      if (!docsRes.ok) throw new Error(`Documents endpoint returned ${docsRes.status}`)
      const docs = await docsRes.json()
      const docList = Array.isArray(docs) ? docs : []
      setDocuments(docList)

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

      setRisks([...docRisks, ...clauseRisks])
      setLastRefresh(new Date())
    } catch (err) {
      setError(`${t('dashboard.couldNotConnectToBackend')} ${BASE_URL}. ${t('dashboard.makeSureYourServerIsRunning')}`)
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 600000)
    return () => clearInterval(interval)
  }, [fetchData])

  const tabs = [
    { id: 'pipeline', label: 'pipelineStatus' },
    { id: 'risk',     label: 'riskAnalysis' },
    { id: 'actions',  label: 'actions' },
    { id: 'mappings', label: 'policyMappings' },
  ]

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div className={styles.pageHeaderInner}>
          <div>
            <p className={styles.eyebrow}>{t('dashboard.liveSystem')}</p>
            <h1 className={styles.pageTitle}>{t('dashboard.complianceDashboard')}</h1>
            <p className={styles.pageSubtitle}>
              {t('dashboard.sub')}
            </p>
          </div>
          <div className={styles.headerRight}>
            {lastRefresh && (
              <p className={styles.refreshNote}>
                {t('dashboard.lastUpdated')}: {lastRefresh.toLocaleTimeString()}
              </p>
            )}
            <button className={styles.refreshBtn} onClick={fetchData} disabled={loading}>
              {loading ? t('dashboard.refreshing') : t('dashboard.refresh')}
            </button>
          </div>
        </div>
      </div>

      <div className={styles.content}>
        <section className={styles.section}>
          <SectionHeader i18nEyebrow="systemOverview" i18nTitle="platformHealth" />
          {loading
            ? <Loader />
            : error
            ? <ErrorState message={error} onRetry={fetchData} />
            : <OverviewPanel documents={documents} risks={risks} lastRefresh={lastRefresh} />
          }
        </section>

        <section className={styles.section}>
          <SectionHeader i18nEyebrow="dataExplorer" i18nTitle="pipelineData" />

          <div className={styles.tabs}>
            {tabs.map(t => (
              <TabButton key={t.id} t={t} activeTab={activeTab} setActiveTab={setActiveTab} />
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

function TabButton({ t: tab, activeTab, setActiveTab }) {
  const { t } = useTranslation()
  const translatedLabel = t(`dashboard.${tab.label}`)
  return (
    <button
      className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ''}`}
      onClick={() => setActiveTab(tab.id)}
    >
      {translatedLabel}
    </button>
  )
}
