import { useState } from 'react'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import About from './components/About'
import Architecture from './components/Architecture'
import Features from './components/Features'
import Pipelines from './components/Pipelines'
import Team from './components/Team'
import Footer from './components/Footer'

export default function App() {
  return (
    <div>
      <Navbar />
      <Hero />
      <About />
      <Features />
      <Architecture />
      <Pipelines />
      <Team />
      <Footer />
    </div>
  )
}
