import styles from './Hero.module.css'
import { useLanguage } from '../context/LanguageContext'

const floatingItems = [
  { key: 'hero.clauseExtracted', subKey: 'hero.obligationConfidence', color: '#dff0e8', dot: '#2d6a4f' },
  { key: 'hero.gapDetected', subKey: 'hero.dataProtectionPolicy', color: '#fff3d9', dot: '#b5873c' },
  { key: 'hero.riskScore', subKey: 'hero.priorityLevels', color: '#ebf0f7', dot: '#1a3a5c' },
  { key: 'hero.actionGenerated', subKey: 'hero.draftPolicyUpdate', color: '#f0ede8', dot: '#4a4a4a' },
]

export default function Hero() {
  const { t } = useLanguage()

  return (
    <section className={styles.hero}>
      <div className={styles.bgPattern} aria-hidden="true" />

      <div className={styles.inner}>
        {/* LEFT — Text */}
        <div className={styles.left}>
          <h1 className={`${styles.heading} anim-fade-up delay-1`}>
            {t('hero.autonomous')}<br />
            <span className={styles.headingAccent}>{t('hero.regulatory')}</span><br />
            {t('hero.updateToPolicy')}<br />
            {t('hero.translationAgent')}
          </h1>

          <p className={`${styles.sub} anim-fade-up delay-2`}>
            {t('hero.sub')}
          </p>

          <div className={`${styles.actions} anim-fade-up delay-3`}>
            <a href="#architecture" className={styles.btnPrimary}>{t('hero.viewArchitecture')}</a>
            <a href="#pipelines" className={styles.btnSecondary}>{t('hero.explorePipelines')}</a>
          </div>

          <div className={`${styles.stats} anim-fade-up delay-4`}>
            <div className={styles.stat}>
              <span className={styles.statNum}>90%+</span>
              <span className={styles.statLabel}>{t('hero.extractionAccuracy')}</span>
            </div>
            <div className={styles.statDivider} />
            <div className={styles.stat}>
            </div>
            <div className={styles.statDivider} />
            <div className={styles.stat}>
              <span className={styles.statNum}>300–600%</span>
              <span className={styles.statLabel}>{t('hero.projectedRoi')}</span>
            </div>
          </div>
        </div>

        {/* RIGHT — Visual panel */}
        <div className={`${styles.right} anim-slide-l delay-2`}>
          <div className={styles.visualCard}>
            {/* Top bar */}
            <div className={styles.vcBar}>
              <div className={styles.vcDots}>
                <span /><span /><span />
              </div>
              <span className={styles.vcTitle}>{t('hero.livePipeline')}</span>
            </div>

            {/* Pipeline visual */}
            <div className={styles.pipeline}>
              {[
                'hero.regulatorySource', 
                'hero.clauseExtraction', 
                'hero.knowledgeGraph', 
                'hero.riskScoring', 
                'hero.actionOutput'
              ].map((key, i) => (
                <div key={i} className={styles.pipelineRow}>
                  <div className={styles.pipelineStep} style={{ animationDelay: `${0.4 + i * 0.12}s` }}>
                    <span className={styles.pipelineNum}>{String(i + 1).padStart(2, '0')}</span>
                    <span className={styles.pipelineLabel}>{t(key)}</span>
                    <span className={styles.pipelineDot} />
                  </div>
                  {i < 4 && <div className={styles.pipelineConnector} />}
                </div>
              ))}
            </div>

            {/* Floating status cards */}
            <div className={styles.floaters}>
              {floatingItems.map((item, i) => (
                <div
                  key={i}
                  className={styles.floater}
                  style={{
                    background: item.color,
                    animationDelay: `${0.7 + i * 0.15}s`,
                  }}
                >
                  <span className={styles.floaterDot} style={{ background: item.dot }} />
                  <div>
                    <p className={styles.floaterLabel}>{t(item.key)}</p>
                    <p className={styles.floaterSub}>{t(item.subKey)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
