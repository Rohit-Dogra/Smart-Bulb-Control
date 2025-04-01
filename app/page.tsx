import BulbControlPanel from "@/components/bulb-control-panel"

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-black">
      <div className="absolute inset-0 bg-[url('/circuit-pattern.svg')] bg-repeat opacity-10 pointer-events-none"></div>
      <main className="container mx-auto px-4 py-8 relative z-10">
        <BulbControlPanel />
      </main>
    </div>
  )
}

