import styles from './About.module.css'
import { useLanguage } from '../context/LanguageContext'

export default function About() {
  const { t } = useLanguage()

  return (
    <section id="about" className={styles.section}>
      <div className={styles.inner}>
        <div className={styles.left}>
          <p className={styles.eyebrow}>{t('about.projectOverview')}</p>
          <h2 className={styles.heading}>
            {t('about.heading')}
          </h2>
          <div className={styles.line} />
          <p className={styles.body}>
            {t('about.body1')}
          </p>
          <p className={styles.body}>
            {t('about.body2')}
          </p>
          <div className={styles.keywords}>
            {[
              'about.keywords.agenticAi', 
              'about.keywords.multiAgentSystems', 
              'about.keywords.knowledgeGraphs', 
              'about.keywords.policyTranslation', 
              'about.keywords.riskScoring', 
              'about.keywords.nlpLlm'
            ].map(key => (
              <span key={key} className={styles.keyword}>{t(key)}</span>
            ))}
          </div>
        </div>

        <div className={styles.right}>
          <div className={styles.cardGrid}>
            {[
              { labelKey: 'about.velocity', descKey: 'about.velocityDesc' },
              { labelKey: 'about.interpretation', descKey: 'about.interpretationDesc' },
              { labelKey: 'about.mapping', descKey: 'about.mappingDesc' },
              { labelKey: 'about.generation', descKey: 'about.generationDesc' },
            ].map((c, i) => (
              <div key={i} className={styles.card}>
                <span className={styles.cardNum}>0{i + 1}</span>
                <h3 className={styles.cardLabel}>{t(c.labelKey)}</h3>
                <p className={styles.cardDesc}>{t(c.descKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
