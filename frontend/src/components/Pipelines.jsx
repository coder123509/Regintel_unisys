import { useState } from 'react'
import styles from './Pipelines.module.css'
import { useLanguage } from '../context/LanguageContext'

const pipelinesData = [
  {
    id: 'P1',
    short: 'pipelines.ingestion',
    key: 'p1',
    endpoints: [
      { method: 'GET', path: '/documents' },
      { method: 'GET', path: '/documents/{doc_id}' },
      { method: 'GET', path: '/documents/{doc_id}/clauses' },
      { method: 'GET', path: '/documents/{doc_id}/context' },
    ],
  },
  {
    id: 'P2',
    short: 'pipelines.ragMapping',
    key: 'p2',
    endpoints: [
      { method: 'GET', path: '/rag/map/{doc_id}' },
      { method: 'GET', path: '/rag/map/{doc_id}/{clause_id}' },
    ],
  },
  {
    id: 'P3',
    short: 'pipelines.riskActions',
    key: 'p3',
    endpoints: [
      { method: 'POST', path: '/risk/analyze' },
      { method: 'POST', path: '/actions/generate' },
      { method: 'GET', path: '/dashboard/{doc_id}' },
      { method: 'GET', path: '/risk/explain/{doc_id}', desc: 'Read-only risk rationale, evidence, and clause-level explanations' },
    ],
  },
]

const methodColor = { GET: styles.methodGet, POST: styles.methodPost }

export default function Pipelines() {
  const [active, setActive] = useState(0)
  const { t } = useLanguage()
  const p = pipelinesData[active]
  
  // Get localized steps and endpoint descriptions from i18n
  const steps = t(`pipelines.details.${p.key}.steps`, { returnObjects: true }) || []
  const endpointDescriptions = t(`pipelines.details.${p.key}.endpoints`, { returnObjects: true }) || []

  return (
    <section id="pipelines" className={styles.section}>
      <div className={styles.inner}>
        <div className={styles.header}>
          <p className={styles.eyebrow}>{t('pipelines.dataFlow')}</p>
          <h2 className={styles.heading}>{t('pipelines.threePipelineArchitecture')}</h2>
          <p className={styles.sub}>
            {t('pipelines.sub')}
          </p>
        </div>

        <div className={styles.tabs}>
          {pipelinesData.map((pipe, i) => (
            <button
              key={pipe.id}
              className={`${styles.tab} ${active === i ? styles.tabActive : ''}`}
              onClick={() => setActive(i)}
            >
              <span className={styles.tabId}>{pipe.id}</span>
              <span className={styles.tabLabel}>{t(pipe.short)}</span>
            </button>
          ))}
        </div>

        <div className={styles.content}>
          <div className={styles.left}>
            <h3 className={styles.pTitle}>{t(`pipelines.details.${p.key}.title`)}</h3>
            <p className={styles.pDesc}>{t(`pipelines.details.${p.key}.desc`)}</p>

            <div className={styles.flowLabel}>{t('pipelines.processFlow')}</div>
            <ol className={styles.steps}>
              {Array.isArray(steps) && steps.map((s, i) => (
                <li key={i} className={styles.step}>
                  <span className={styles.stepNum}>{String(i + 1).padStart(2, '0')}</span>
                  <span>{s}</span>
                </li>
              ))}
            </ol>
          </div>

          <div className={styles.right}>
            <div className={styles.endpointsLabel}>{t('pipelines.apiEndpoints')}</div>
            <div className={styles.endpoints}>
              {p.endpoints.map((e, i) => (
                <div key={i} className={styles.endpoint}>
                  <div className={styles.endpointTop}>
                    <span className={`${styles.method} ${methodColor[e.method] || ''}`}>{e.method}</span>
                    <code className={styles.path}>{e.path}</code>
                  </div>
                  <p className={styles.endpointDesc}>
                    {endpointDescriptions[i]?.desc || e.desc || ''}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
