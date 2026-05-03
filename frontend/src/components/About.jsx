import styles from './About.module.css'

export default function About() {
  return (
    <section id="about" className={styles.section}>
      <div className={styles.inner}>
        <div className={styles.left}>
          <p className={styles.eyebrow}>Project Overview</p>
          <h2 className={styles.heading}>
            Bridging the Gap Between<br />Regulatory Change and<br />Organisational Response
          </h2>
          <div className={styles.line} />
          <p className={styles.body}>
            The accelerating pace and growing complexity of global regulatory frameworks across banking,
            aviation, data privacy, and digital governance have outpaced traditional manual compliance
            processes. Enterprises continue to rely on labour-intensive interpretation of regulatory
            circulars and legal amendments, resulting in delayed policy updates, fragmented
            implementation, and increased audit exposure.
          </p>
          <p className={styles.body}>
            RegIntel Agent is a software-based, multi-agent AI system designed to transform compliance
            from a reactive workflow into a proactive, autonomous decision-making process. The system
            continuously ingests regulatory updates from official sources, applies large language models
            to extract structured obligations, and leverages a compliance knowledge graph to map clauses
            to enterprise policies, procedures, and IT controls.
          </p>
          <div className={styles.keywords}>
            {['Agentic AI', 'Multi-Agent Systems', 'Knowledge Graphs', 'Policy Translation', 'Risk Scoring', 'NLP / LLM'].map(k => (
              <span key={k} className={styles.keyword}>{k}</span>
            ))}
          </div>
        </div>

        <div className={styles.right}>
          <div className={styles.cardGrid}>
            {[
              { label: 'Velocity & Volume', desc: 'Continuous real-time scanning of regulatory sources, detecting changes within hours of publication.' },
              { label: 'Interpretation', desc: 'LLM-based extraction of obligations, prohibitions, permissions, and deadlines with 90%+ precision.' },
              { label: 'Policy Mapping', desc: 'Dynamic knowledge graph linking clauses to internal policies, controls, and responsible departments.' },
              { label: 'Action Generation', desc: 'Automated draft policy revisions, compliance checklists, and risk-ranked remediation tasks.' },
            ].map((c, i) => (
              <div key={i} className={styles.card}>
                <span className={styles.cardNum}>0{i + 1}</span>
                <h3 className={styles.cardLabel}>{c.label}</h3>
                <p className={styles.cardDesc}>{c.desc}</p>
              </div>
            ))}
          </div>

          {/* <div className={styles.institutionBadge}>
            <div className={styles.instLeft}>
              <p className={styles.instName}>RV College of Engineering</p>
              <p className={styles.instSub}>Bengaluru, Karnataka</p>
            </div>
            <div className={styles.instRight}>
              <p className={styles.instYear}>2025</p>
            </div>
          </div> */}
        </div>
      </div>
    </section>
  )
}
