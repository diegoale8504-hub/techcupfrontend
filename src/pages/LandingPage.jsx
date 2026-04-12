import '../styles/LandingPage.css'
import Navbar from '../components/landing/Navbar'
import Hero from '../components/landing/Hero'
import Canchas from '../components/landing/Canchas'
import ProximosPartidos from '../components/landing/ProximosPartidos'
import RankingPreview from '../components/landing/RankingPreview'
import StatsSection from '../components/landing/StatsSection'
import CTAFinal from '../components/landing/CTAFinal'

export default function LandingPage() {
  return (
    <div className="landing-page">
      <Navbar />
      <main>
        <Hero />
        <div className="landing-middle">
          <Canchas />
          <ProximosPartidos />
          <RankingPreview />
        </div>
        <StatsSection />
        <CTAFinal />
      </main>
    </div>
  )
}
