import styles from './Footer.module.css'

const links = {
  Project: ['About', 'Features', 'Architecture', 'Pipelines'],
  References: ['RBI Regulations', 'GDPR', 'EU AI Act', 'FDA AI Plan'],
  Technology: ['Neo4j Graph DB', 'Apache Kafka', 'GPT-4 / Legal-BERT', 'RAG Pipeline'],
}

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.top}>
        <div className={styles.brand}>
          <div className={styles.logo}>
            <span className={styles.logoMark}>RI</span>
            <div>
              <span className={styles.logoText}>RegIntel Agent</span>
              <p className={styles.logoTagline}>Autonomous Regulatory Compliance Intelligence</p>
            </div>
          </div>
          <p className={styles.brandDesc}>
            A multi-agent AI system developed at RV College of Engineering, Bengaluru,
            for the Unisys Innovation Program 2026.
          </p>
          <div className={styles.tags}>
            <span className={styles.tag}>Agentic AI</span>
            <span className={styles.tag}>Multi-Agent Systems</span>
            <span className={styles.tag}>RegTech</span>
          </div>
        </div>

        <div className={styles.linkCols}>
          {Object.entries(links).map(([group, items]) => (
            <div key={group} className={styles.linkCol}>
              <p className={styles.linkColTitle}>{group}</p>
              {items.map(item => (
                <a key={item} href="#" className={styles.link}>{item}</a>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className={styles.bottom}>
        <p className={styles.copy}>
          &copy; 2026 RegIntel Agent — RV College of Engineering, Bengaluru.
          Developed for the Unisys Innovation Program.
        </p>
        {/* <p className={styles.disclaimer}>
          Research project. Not a commercial product.
        </p> */}
      </div>
    </footer>
  )
}
