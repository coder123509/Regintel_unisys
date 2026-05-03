import styles from './Hero.module.css'

const floatingItems = [
  { label: 'Clause Extracted', sub: 'obligation · 0.93 confidence', color: '#dff0e8', dot: '#2d6a4f' },
  { label: 'Gap Detected', sub: 'Data Protection Policy', color: '#fff3d9', dot: '#b5873c' },
  { label: 'Risk Score', sub: '0.82 · Priority: High', color: '#ebf0f7', dot: '#1a3a5c' },
  { label: 'Action Generated', sub: 'Draft policy update sent', color: '#f0ede8', dot: '#4a4a4a' },
]

export default function Hero() {
  return (
    <section className={styles.hero}>
      <div className={styles.bgPattern} aria-hidden="true" />

      <div className={styles.inner}>
        {/* LEFT — Text */}
        <div className={styles.left}>
          {/* <div className={`${styles.badge} anim-fade-in`}>
            <span className={styles.badgeDot} />
            Unisys Innovation Program 2025
          </div> */}

          <h1 className={`${styles.heading} anim-fade-up delay-1`}>
            Autonomous<br />
            <span className={styles.headingAccent}>Regulatory</span><br />
            Update-to-Policy<br />
            Translation Agent
          </h1>

          <p className={`${styles.sub} anim-fade-up delay-2`}>
            A multi-agent AI system for real-time regulatory compliance orchestration.
            Transforming how enterprises detect, interpret, and respond to regulatory change.
          </p>

          <div className={`${styles.actions} anim-fade-up delay-3`}>
            <a href="#architecture" className={styles.btnPrimary}>View Architecture</a>
            <a href="#pipelines" className={styles.btnSecondary}>Explore Pipelines</a>
          </div>

          <div className={`${styles.stats} anim-fade-up delay-4`}>
            <div className={styles.stat}>
              <span className={styles.statNum}>90%+</span>
              <span className={styles.statLabel}>Extraction Accuracy</span>
            </div>
            <div className={styles.statDivider} />
            <div className={styles.stat}>
              {/* <span className={styles.statNum}>Quick</span>
              <span className={styles.statLabel}>Response </span> */}
            </div>
            <div className={styles.statDivider} />
            <div className={styles.stat}>
              <span className={styles.statNum}>300–600%</span>
              <span className={styles.statLabel}>Projected ROI</span>
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
              <span className={styles.vcTitle}>RegIntel Agent — Live Pipeline</span>
            </div>

            {/* Pipeline visual */}
            <div className={styles.pipeline}>
              {['Regulatory Source', 'Clause Extraction', 'Knowledge Graph', 'Risk Scoring', 'Action Output'].map((step, i) => (
                <div key={i} className={styles.pipelineRow}>
                  <div className={styles.pipelineStep} style={{ animationDelay: `${0.4 + i * 0.12}s` }}>
                    <span className={styles.pipelineNum}>{String(i + 1).padStart(2, '0')}</span>
                    <span className={styles.pipelineLabel}>{step}</span>
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
                    <p className={styles.floaterLabel}>{item.label}</p>
                    <p className={styles.floaterSub}>{item.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Small accent card */}
          {/* <div className={`${styles.accentCard} anim-fade-up delay-5`}> */}
            {/* <p className={styles.accentNum}>3</p>
            <p className={styles.accentLabel}>Integrated<br />Pipelines</p> */}
          {/* </div> */}
        </div>
      </div>
    </section>
  )
}