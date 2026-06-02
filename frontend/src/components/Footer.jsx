import styles from './Footer.module.css'
import { useLanguage } from '../context/LanguageContext'

const links = {
  'footer.project': ['nav.about', 'nav.features', 'nav.architecture', 'nav.pipelines'],
  'footer.references': ['footer.links.rbi', 'footer.links.gdpr', 'footer.links.euAiAct', 'footer.links.fda'],
  'footer.technology': ['footer.links.neo4j', 'footer.links.kafka', 'footer.links.gpt4', 'footer.links.rag'],
}

export default function Footer() {
  const { t } = useLanguage()

  return (
    <footer className={styles.footer}>
      <div className={styles.top}>
        <div className={styles.brand}>
          <div className={styles.logo}>
            <span className={styles.logoMark}>RI</span>
            <div>
              <span className={styles.logoText}>RegIntel Agent</span>
              <p className={styles.logoTagline}>{t('footer.tagline')}</p>
            </div>
          </div>
          <p className={styles.brandDesc}>
            {t('footer.desc')}
          </p>
          <div className={styles.tags}>
            <span className={styles.tag}>{t('about.keywords.agenticAi')}</span>
            <span className={styles.tag}>{t('about.keywords.multiAgentSystems')}</span>
            <span className={styles.tag}>RegTech</span>
          </div>
        </div>

        <div className={styles.linkCols}>
          {Object.entries(links).map(([groupKey, items]) => (
            <div key={groupKey} className={styles.linkCol}>
              <p className={styles.linkColTitle}>{t(groupKey)}</p>
              {items.map(item => (
                <a key={item} href="#" className={styles.link}>{t(item)}</a>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className={styles.bottom}>
        <p className={styles.copy}>
          &copy; 2026 {t('footer.copy')}
        </p>
      </div>
    </footer>
  )
}
