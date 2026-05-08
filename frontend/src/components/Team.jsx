// import styles from './Team.module.css'

// const members = [
//   {
//     name: 'Ahibhruth A',
//     year: '3rd Year',
//     branch: 'AI & Machine Learning',
//     role: 'Team Member',
//     email: 'ahibhrutha.ai23@rvce.edu.in',
//     initials: 'AA',
//   },
//   {
//     name: 'Amogh A P',
//     year: '3rd Year',
//     branch: 'AI & Machine Learning',
//     role: 'Team Member',
//     email: 'amoghap.ai23@rvce.edu.in',
//     initials: 'AP',
//   },
//   {
//     name: 'Abhinav Krishna Rayachoti',
//     year: '3rd Year',
//     branch: 'Computer Science Engineering',
//     role: 'Team Member',
//     email: 'abhinavkrishna.cs23@rvce.edu.in',
//     initials: 'AK',
//   },
//   {
//     name: 'Srikanth R',
//     year: '3rd Year',
//     branch: 'Information Science Engineering',
//     role: 'Team Member',
//     email: 'srikanthr.is23@rvce.edu.in',
//     initials: 'SR',
//   },
// ]

// const mentor = {
//   name: 'Dr. Mohana',
//   title: 'Associate Professor',
//   institution: 'RV College of Engineering, Bengaluru',
//   email: 'mohana@rvce.edu.in',
//   initials: 'DM',
// }

// export default function Team() {
//   return (
//     <section id="team" className={styles.section}>
//       <div className={styles.inner}>
//         <div className={styles.header}>
//           <p className={styles.eyebrow}>The People</p>
//           <h2 className={styles.heading}>Project Team</h2>
//           <p className={styles.sub}>
//             Third-year undergraduate students from RV College of Engineering, Bengaluru,
//             developing the RegIntel Agent for the Unisys Innovation Program 2026.
//           </p>
//         </div>

//         <div className={styles.mentorCard}>
//           <div className={styles.mentorLeft}>
//             <div className={`${styles.avatar} ${styles.avatarMentor}`}>{mentor.initials}</div>
//             <div>
//               <p className={styles.mentorRole}>Project Mentor</p>
//               <h3 className={styles.mentorName}>{mentor.name}</h3>
//               <p className={styles.mentorTitle}>{mentor.title}</p>
//               <p className={styles.mentorInst}>{mentor.institution}</p>
//             </div>
//           </div>
//           <a href={`mailto:${mentor.email}`} className={styles.mentorEmail}>
//             {mentor.email}
//           </a>
//         </div>

//         <div className={styles.grid}>
//           {members.map((m, i) => (
//             <div key={i} className={styles.card}>
//               <div className={styles.cardTop}>
//                 <div className={styles.avatar}>{m.initials}</div>
//                 <div className={styles.cardInfo}>
//                   <h3 className={styles.name}>{m.name}</h3>
//                   <p className={styles.branch}>{m.year} — {m.branch}</p>
//                 </div>
//               </div>
//               <div className={styles.cardBody}>
//                 <a href={`mailto:${m.email}`} className={styles.email}>{m.email}</a>
//               </div>
//             </div>
//           ))}
//         </div>

//         {/* <div className={styles.institution}>
//           <div className={styles.instBadge}>
//             <div className={styles.instDot} />
//             RV College of Engineering
//           </div>
//           <p className={styles.instDetail}>
//             Autonomous institution affiliated with Visvesvaraya Technological University (VTU), Bengaluru, Karnataka, India.
//             Recognised as an Institute of Eminence by the Government of Karnataka.
//           </p>
//         </div> */}
//       </div>
//     </section>
//   )
// }

// import styles from './Team.module.css'

// const members = [
//   {
//     name: 'Ahibhruth A',
//     year: '3rd Year',
//     branch: 'AI & Machine Learning',
//     email: 'ahibhrutha.ai23@rvce.edu.in',
//     initials: 'AA',
//   },
//   {
//     name: 'Amogh A P',
//     year: '3rd Year',
//     branch: 'AI & Machine Learning',
//     email: 'amoghap.ai23@rvce.edu.in',
//     initials: 'AP',
//   },
//   {
//     name: 'Abhinav Krishna Rayachoti',
//     year: '3rd Year',
//     branch: 'Computer Science Engineering',
//     email: 'abhinavkrishna.cs23@rvce.edu.in',
//     initials: 'AK',
//   },
//   {
//     name: 'Srikanth R',
//     year: '3rd Year',
//     branch: 'Information Science Engineering',
//     email: 'srikanthr.is23@rvce.edu.in',
//     initials: 'SR',
//   },
// ]

// const mentors = [
//   {
//     name: 'Dr. Mohana',
//     title: 'Associate Professor',
//     institution: 'RV College of Engineering, Bengaluru',
//     email: 'mohana@rvce.edu.in',
//     initials: 'DM',
//   },
//   {
//     name: 'Dr. Sudharshan',
//     title: 'Associate Professor',
//     institution: 'RV College of Engineering, Bengaluru',
//     email: 'sudharshan@rvce.edu.in',
//     initials: 'DS',
//   },
// ]

// export default function Team() {
//   return (
//     <section id="team" className={styles.section}>
//       <div className={styles.inner}>
//         <div className={styles.header}>
//           <p className={styles.eyebrow}>The People</p>
//           <h2 className={styles.heading}>Project Team</h2>
//           <p className={styles.sub}>
//             Third-year undergraduate students from RV College of Engineering, Bengaluru,
//             developing the RegIntel Agent for the Unisys Innovation Program 2026.
//           </p>
//         </div>

//         {/* Students first */}
//         <div className={styles.grid}>
//           {members.map((m, i) => (
//             <div key={i} className={styles.card}>
//               <div className={styles.cardTop}>
//                 <div className={styles.avatar}>{m.initials}</div>
//                 <div className={styles.cardInfo}>
//                   <h3 className={styles.name}>{m.name}</h3>
//                   <p className={styles.branch}>{m.year} — {m.branch}</p>
//                 </div>
//               </div>
//               <div className={styles.cardBody}>
//                 <a href={`mailto:${m.email}`} className={styles.email}>{m.email}</a>
//               </div>
//             </div>
//           ))}
//         </div>

//         {/* Mentors below */}
//         <div className={styles.mentorsRow}>
//           {mentors.map((mentor, i) => (
//             <div key={i} className={styles.mentorCard}>
//               <div className={styles.mentorLeft}>
//                 <div className={`${styles.avatar} ${styles.avatarMentor}`}>{mentor.initials}</div>
//                 <div>
//                   <p className={styles.mentorRole}>Project Mentor</p>
//                   <h3 className={styles.mentorName}>{mentor.name}</h3>
//                   <p className={styles.mentorTitle}>{mentor.title}</p>
//                   <p className={styles.mentorInst}>{mentor.institution}</p>
//                 </div>
//               </div>
//               <a href={`mailto:${mentor.email}`} className={styles.mentorEmail}>
//                 {mentor.email}
//               </a>
//             </div>
//           ))}
//         </div>

//       </div>
//     </section>
//   )
// }

import styles from './Team.module.css'

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
    role: 'Project Mentor',
    title: 'Associate Professor',
    institution: 'RV College of Engineering, Bengaluru',
    // email: 'mohana@rvce.edu.in',
    initials: 'DM',
  },
  {
    name: 'Dr. Sudharshan',
    role: 'Project Mentor',
    title: 'Associate Professor',
    institution: 'RV College of Engineering, Bengaluru',
    // email: 'sudharshan@rvce.edu.in',
    initials: 'DS',
  },
  {
    name: 'Siddharth Dash',
    role: 'Project Mentor',
    title: 'Industry Mentor',
    institution: 'Unisys',
    email: '',
    initials: 'SD',
  },
]

export default function Team() {
  return (
    <section id="team" className={styles.section}>
      <div className={styles.inner}>
        <div className={styles.header}>
          <p className={styles.eyebrow}>The People</p>
          <h2 className={styles.heading}>Project Team</h2>
          <p className={styles.sub}>
            Third-year undergraduate students from RV College of Engineering, Bengaluru,
            developing the RegIntel Agent for the Unisys Innovation Program 2026.
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
                  <p className={styles.branch}>{m.year} — {m.branch}</p>
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
                  <p className={styles.mentorRole}>{mentor.role}</p>
                  <h3 className={styles.mentorName}>{mentor.name}</h3>
                  <p className={styles.mentorTitle}>{mentor.title}</p>
                  <p className={styles.mentorInst}>{mentor.institution}</p>
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