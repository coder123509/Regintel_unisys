import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import styles from './Navbar.module.css'
import LanguageSelector from './LanguageSelector'
import { useLanguage } from '../context/LanguageContext'

const homeLinks = [
  { key: 'nav.about',        href: '#about' },
  { key: 'nav.features',     href: '#features' },
  { key: 'nav.architecture', href: '#architecture' },
  { key: 'nav.pipelines',    href: '#pipelines' },
  { key: 'nav.team',         href: '#team' },
]

export default function Navbar() {
  const [scrolled, setScrolled]     = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const location  = useLocation()
  const navigate  = useNavigate()
  const { t } = useLanguage()

  const isDashboard = location.pathname === '/dashboard'
  const isDocs      = location.pathname === '/documents'
  const isInner     = isDashboard || isDocs

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 48)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header className={`${styles.nav} ${scrolled ? styles.navScrolled : ''}`}>
      <div className={styles.inner}>

        <a href="/" className={styles.logo}>
          <span className={styles.logoMark}>RI</span>
          <span className={styles.logoText}>RegIntel</span>
          <span className={styles.logoSub}>{t('nav.agent')}</span>
        </a>

        <nav className={styles.links}>
          {!isInner
            ? homeLinks.map(l => (
                <a key={l.key} href={l.href} className={styles.link}>{t(l.key)}</a>
              ))
            : <a href="/" className={styles.link}>{t('nav.home')}</a>
          }
        </nav>

        <div className={styles.navActions}>
          <LanguageSelector />
          <button
            className={`${styles.dashBtn} ${isDocs ? styles.dashBtnActive : ''}`}
            onClick={() => navigate(isDocs ? '/' : '/documents')}
          >
            {isDocs ? t('nav.backToHome') : t('nav.documents')}
          </button>
          <button
            className={`${styles.dashBtn} ${isDashboard ? styles.dashBtnActive : ''}`}
            onClick={() => navigate(isDashboard ? '/' : '/dashboard')}
          >
            {isDashboard ? t('nav.backToHome') : t('nav.dashboard')}
          </button>
        </div>

        <button
          className={styles.hamburger}
          onClick={() => setMobileOpen(o => !o)}
          aria-label="Toggle menu"
        >
          <span className={mobileOpen ? styles.barOpen1   : styles.bar} />
          <span className={mobileOpen ? styles.barOpenMid : styles.bar} />
          <span className={mobileOpen ? styles.barOpen3   : styles.bar} />
        </button>
      </div>

      {mobileOpen && (
        <div className={styles.mobileMenu}>
          <div style={{ padding: '0 1.5rem 1rem' }}>
            <LanguageSelector />
          </div>
          {!isInner && homeLinks.map(l => (
            <a key={l.key} href={l.href} className={styles.mobileLink} onClick={() => setMobileOpen(false)}>
              {t(l.key)}
            </a>
          ))}
          <button className={styles.mobileCta}
            onClick={() => { navigate('/documents'); setMobileOpen(false) }}>
            {t('nav.documents')}
          </button>
          <button className={styles.mobileCta}
            onClick={() => { navigate('/dashboard'); setMobileOpen(false) }}>
            {t('nav.dashboard')}
          </button>
        </div>
      )}
    </header>
  )
}
