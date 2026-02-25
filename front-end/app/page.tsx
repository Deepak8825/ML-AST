import Navigation from '@/components/navigation'
import HeroSection from '@/components/hero-section'
import DataExplorer from '@/components/data-explorer'
import AnalyticsView from '@/components/analytics-view'
import MLModels from '@/components/ml-models'
import LivePrediction from '@/components/live-prediction'
import Footer from '@/components/footer'
import ScrollObserver from '@/components/scroll-observer'

export default function Home() {
  return (
    <main className="text-foreground">
      <Navigation />
      <ScrollObserver />
      <HeroSection />
      <div className="relative bg-[#020409]">
        <DataExplorer />
        <AnalyticsView />
        <MLModels />
        <LivePrediction />
        <Footer />
      </div>
    </main>
  )
}
