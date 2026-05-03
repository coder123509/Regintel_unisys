// import { useState, useEffect } from 'react'
// import { useLocation, useNavigate } from 'react-router-dom'
// import styles from './Navbar.module.css'

// const homeLinks = [
//   { label: 'About', href: '#about' },
//   { label: 'Features', href: '#features' },
//   { label: 'Architecture', href: '#architecture' },
//   { label: 'Pipelines', href: '#pipelines' },
//   { label: 'Team', href: '#team' },
// ]

// export default function Navbar() {
//   const [scrolled, setScrolled] = useState(false)
//   const [mobileOpen, setMobileOpen] = useState(false)
//   const location = useLocation()
//   const navigate = useNavigate()
//   const isDashboard = location.pathname === '/dashboard'

//   useEffect(() => {
//     const onScroll = () => setScrolled(window.scrollY > 48)
//     window.addEventListener('scroll', onScroll)
//     return () => window.removeEventListener('scroll', onScroll)
//   }, [])

//   return (
//     <header className={`${styles.nav} ${scrolled ? styles.navScrolled : ''}`}>
//       <div className={styles.inner}>
//         <a href="/" className={styles.logo}>
//           <span className={styles.logoMark}>RI</span>
//           <span className={styles.logoText}>RegIntel</span>
//           <span className={styles.logoSub}>Agent</span>
//         </a>

//         <nav className={styles.links}>
//           {!isDashboard && homeLinks.map(l => (
//             <a key={l.label} href={l.href} className={styles.link}>{l.label}</a>
//           ))}
//           {isDashboard && (
//             <a href="/" className={styles.link}>Home</a>
//           )}
//         </nav>

//         <button
//           className={styles.dashBtn}
//           onClick={() => navigate(isDashboard ? '/' : '/dashboard')}
//         >
//           {isDashboard ? 'Back to Home' : 'Live Dashboard'}
//         </button>

//         <button
//           className={styles.hamburger}
//           onClick={() => setMobileOpen(o => !o)}
//           aria-label="Toggle menu"
//         >
//           <span className={mobileOpen ? styles.barOpen1 : styles.bar} />
//           <span className={mobileOpen ? styles.barOpenMid : styles.bar} />
//           <span className={mobileOpen ? styles.barOpen3 : styles.bar} />
//         </button>
//       </div>

//       {mobileOpen && (
//         <div className={styles.mobileMenu}>
//           {!isDashboard && homeLinks.map(l => (
//             <a key={l.label} href={l.href} className={styles.mobileLink}
//                onClick={() => setMobileOpen(false)}>{l.label}</a>
//           ))}
//           <button
//             className={styles.mobileCta}
//             onClick={() => { navigate(isDashboard ? '/' : '/dashboard'); setMobileOpen(false) }}
//           >
//             {isDashboard ? 'Back to Home' : 'Live Dashboard'}
//           </button>
//         </div>
//       )}
//     </header>
//   )
// }

import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import styles from './Navbar.module.css'

const homeLinks = [
  { label: 'About',        href: '#about' },
  { label: 'Features',     href: '#features' },
  { label: 'Architecture', href: '#architecture' },
  { label: 'Pipelines',    href: '#pipelines' },
  { label: 'Team',         href: '#team' },
]

export default function Navbar() {
  const [scrolled, setScrolled]     = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const location  = useLocation()
  const navigate  = useNavigate()

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
          <span className={styles.logoSub}>Agent</span>
        </a>

        <nav className={styles.links}>
          {!isInner
            ? homeLinks.map(l => (
                <a key={l.label} href={l.href} className={styles.link}>{l.label}</a>
              ))
            : <a href="/" className={styles.link}>Home</a>
          }
        </nav>

        <div className={styles.navActions}>
          <button
            className={`${styles.dashBtn} ${isDocs ? styles.dashBtnActive : ''}`}
            onClick={() => navigate(isDocs ? '/' : '/documents')}
          >
            {isDocs ? 'Back to Home' : 'Documents'}
          </button>
          <button
            className={`${styles.dashBtn} ${isDashboard ? styles.dashBtnActive : ''}`}
            onClick={() => navigate(isDashboard ? '/' : '/dashboard')}
          >
            {isDashboard ? 'Back to Home' : 'Dashboard'}
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
          {!isInner && homeLinks.map(l => (
            <a key={l.label} href={l.href} className={styles.mobileLink}
               onClick={() => setMobileOpen(false)}>
              {l.label}
            </a>
          ))}
          <button className={styles.mobileCta}
            onClick={() => { navigate('/documents'); setMobileOpen(false) }}>
            Documents
          </button>
          <button className={styles.mobileCta}
            onClick={() => { navigate('/dashboard'); setMobileOpen(false) }}>
            Dashboard
          </button>
        </div>
      )}
    </header>
  )
}