import styles from './Team.module.css'
import { useLanguage } from '../context/LanguageContext'

const members = [
  {
    name: 'Ahibhruth A',
    year: '3rd Year',
    branch: 'AI & Machine Learning',
    email: 'ahibhrutha.ai23@rvce.edu.in',
    initials: 'AA',
  },
  {
    name: 'Amogh A P',
    year: '3rd Year',
    branch: 'AI & Machine Learning',
    email: 'amoghap.ai23@rvce.edu.in',
    initials: 'AP',
  },
  {
    name: 'Abhinav Krishna Rayachoti',
    year: '3rd Year',
    branch: 'Computer Science Engineering',
    email: 'abhinavkrishna.cs23@rvce.edu.in',
    initials: 'AK',
  },
  {
    name: 'Srikanth R',
    year: '3rd Year',
    branch: 'Information Science Engineering',
    email: 'srikanthr.is23@rvce.edu.in',
    initials: 'SR',
  },
]

const mentors = [
  {
    name: 'Dr. Mohana',
    role: 'team.projectMentor',
    title: 'team.associateProfessor',
    institution: 'RV College of Engineering, Bengaluru',
    initials: 'DM',
  },
  {
    name: 'Dr. Sudharshan',
    role: 'team.projectMentor',
    title: 'team.associateProfessor',
    institution: 'RV College of Engineering, Bengaluru',
    initials: 'DS',
  },
  {
    name: 'Siddharth Dash',
    role: 'team.projectMentor',
    title: 'team.industryMentor',
    institution: 'Unisys',
    email: '',
    initials: 'SD',
  },
]

export default function Team() {
  const { t } = useLanguage()

  return (
    <section id="team" className={styles.section}>
      <div className={styles.inner}>
        <div className={styles.header}>
          <p className={styles.eyebrow}>{t('team.thePeople')}</p>
          <h2 className={styles.heading}>{t('team.projectTeam')}</h2>
          <p className={styles.sub}>
            {t('team.sub')}
          </p>
        </div>

        {/* Students first */}
        <div className={styles.grid}>
          {members.map((m, i) => (
            <div key={i} className={styles.card}>
              <div className={styles.cardTop}>
                <div className={styles.avatar}>{m.initials}</div>
                <div className={styles.cardInfo}>
                  <h3 className={styles.name}>{m.name}</h3>
                  <p className={styles.branch}>{t(m.year)} — {t(m.branch)}</p>
                </div>
              </div>
              <div className={styles.cardBody}>
                <a href={`mailto:${m.email}`} className={styles.email}>{m.email}</a>
              </div>
            </div>
          ))}
        </div>

        {/* Mentors below */}
        <div className={styles.mentorsRow}>
          {mentors.map((mentor, i) => (
            <div key={i} className={styles.mentorCard}>
              <div className={styles.mentorLeft}>
                <div className={`${styles.avatar} ${styles.avatarMentor}`}>{mentor.initials}</div>
                <div>
                  <p className={styles.mentorRole}>{t(mentor.role)}</p>
                  <h3 className={styles.mentorName}>{mentor.name}</h3>
                  <p className={styles.mentorTitle}>{t(mentor.title)}</p>
                  <p className={styles.mentorInst}>{t(mentor.institution)}</p>
                </div>
              </div>
              {mentor.email ? (
                <a href={`mailto:${mentor.email}`} className={styles.mentorEmail}>
                  {mentor.email}
                </a>
              ) : null}
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}
