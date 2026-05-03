// import { BrowserRouter, Routes, Route } from 'react-router-dom'
// import Navbar from './components/Navbar'
// import Hero from './components/Hero'
// import About from './components/About'
// import Architecture from './components/Architecture'
// import Features from './components/Features'
// import Pipelines from './components/Pipelines'
// import Team from './components/Team'
// import Footer from './components/Footer'
// import Dashboard from './pages/Dashboard'

// function Home() {
//   return (
//     <>
//       <Hero />
//       <About />
//       <Features />
//       <Architecture />
//       <Pipelines />
//       <Team />
//       <Footer />
//     </>
//   )
// }

// export default function App() {
//   return (
//     <BrowserRouter>
//       <Navbar />
//       <Routes>
//         <Route path="/" element={<Home />} />
//         <Route path="/dashboard" element={<Dashboard />} />
//       </Routes>
//     </BrowserRouter>
//   )
// }

import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import About from './components/About'
import Architecture from './components/Architecture'
import Features from './components/Features'
import Pipelines from './components/Pipelines'
import Team from './components/Team'
import Footer from './components/Footer'
import Dashboard from './pages/Dashboard'
import DocumentExplorer from './pages/DocumentExplorer'

function Home() {
  return (
    <>
      <Hero />
      <About />
      <Features />
      <Architecture />
      <Pipelines />
      <Team />
      <Footer />
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/documents" element={<DocumentExplorer />} />
      </Routes>
    </BrowserRouter>
  )
}