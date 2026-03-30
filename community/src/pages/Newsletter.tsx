import { NewsletterForm } from '../../../newsletter/NewsletterForm'

export default function Newsletter() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center">
      <div className="text-5xl mb-6">✈️</div>
      <h1 className="text-4xl font-bold text-white mb-4">The Wing</h1>
      <p className="text-xl text-blue-400 font-medium mb-2">AviationHub Weekly Digest</p>
      <p className="text-slate-400 mb-8">
        Every Wednesday: top trip reports, fare deals, route deep-dives, and aviation stories from the community.
        100% free. Unsubscribe anytime.
      </p>

      <div className="bg-slate-800 rounded-2xl p-8 border border-slate-700">
        <h2 className="text-xl font-bold mb-2">Get the weekly digest</h2>
        <p className="text-slate-400 text-sm mb-6">
          Join thousands of aviation enthusiasts who start their week with The Wing.
        </p>
        <NewsletterForm
          placeholder="your@email.com"
          buttonLabel="Subscribe — It's Free"
          description="No spam. One email per week. Unsubscribe anytime."
        />
      </div>

      <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
        {[
          { icon: '📝', title: 'Trip Reports', desc: 'Highest-rated reports from the community' },
          { icon: '💰', title: 'Fare Deals', desc: 'Mistake fares and flash sales spotted by members' },
          { icon: '🛫', title: 'Route Picks', desc: 'Curated routes worth the journey' },
        ].map(item => (
          <div key={item.title} className="bg-slate-800 rounded-xl p-4 border border-slate-700">
            <div className="text-2xl mb-2">{item.icon}</div>
            <div className="font-semibold text-white mb-1">{item.title}</div>
            <div className="text-slate-400 text-sm">{item.desc}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
