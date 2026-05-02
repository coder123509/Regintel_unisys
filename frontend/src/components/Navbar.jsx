import { useState, useEffect } from 'react'
import styles from './Navbar.module.css'

const navLinks = [
  { label: 'About', href: '#about' },
  { label: 'Features', href: '#features' },
  { label: 'Architecture', href: '#architecture' },
  { label: 'Pipelines', href: '#pipelines' },
  { label: 'Team', href: '#team' },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 48)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header className={`${styles.nav} ${scrolled ? styles.navScrolled : ''}`}>
      <div className={styles.inner}>
        <a href="#" className={styles.logo}>
          <span className={styles.logoMark}>RI</span>
          <span className={styles.logoText}>RegIntel</span>
          <span className={styles.logoSub}>Agent</span>
        </a>

        <nav className={styles.links}>
          {navLinks.map(l => (
            <a key={l.label} href={l.href} className={styles.link}>{l.label}</a>
          ))}
        </nav>

        <a href="#team" className={styles.cta}>Contact Team</a>

        <button
          className={styles.hamburger}
          onClick={() => setMobileOpen(o => !o)}
          aria-label="Toggle menu"
        >
          <span className={mobileOpen ? styles.barOpen1 : styles.bar} />
          <span className={mobileOpen ? styles.barOpenMid : styles.bar} />
          <span className={mobileOpen ? styles.barOpen3 : styles.bar} />
        </button>
      </div>

      {mobileOpen && (
        <div className={styles.mobileMenu}>
          {navLinks.map(l => (
            <a key={l.label} href={l.href} className={styles.mobileLink} onClick={() => setMobileOpen(false)}>
              {l.label}
            </a>
          ))}
          <a href="#team" className={styles.mobileCta} onClick={() => setMobileOpen(false)}>
            Contact Team
          </a>
        </div>
      )}
    </header>
  )
}
