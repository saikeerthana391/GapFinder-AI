import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <nav className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <span className="font-bold text-slate-900">GapFinder AI</span>
        </div>
        <div className="flex gap-3">
          <Link href="/login" className="text-sm font-medium text-slate-700 hover:text-blue-600 transition-colors">Sign in</Link>
          <Link href="/register" className="text-sm font-medium bg-blue-600 text-white px-4 py-1.5 rounded-lg hover:bg-blue-700 transition-colors">Get Started</Link>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 pt-16 pb-24 text-center">
        <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-800 text-xs font-medium px-3 py-1.5 rounded-full mb-6">
          🎓 AI-powered knowledge gap diagnosis
        </div>
        <h1 className="text-5xl sm:text-6xl font-bold text-slate-900 leading-tight mb-6">
          Discover your<br />
          <span className="text-blue-600">knowledge gaps.</span><br />
          Study smarter.
        </h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto mb-10">
          Upload your syllabus, textbooks, and notes. GapFinder AI diagnoses exactly which topics you&apos;re weak on
          using RAG-powered quizzes grounded in your own materials — then builds a personalized revision plan.
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <Link href="/register" className="inline-flex items-center gap-2 bg-blue-600 text-white font-semibold px-7 py-3.5 rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200">
            Get Started Free →
          </Link>
          <Link href="/login" className="inline-flex items-center gap-2 bg-white text-slate-800 font-semibold px-7 py-3.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors">
            Sign in to Demo
          </Link>
        </div>

        <div className="mt-20 grid sm:grid-cols-3 gap-6 text-left">
          {[
            { icon: '📤', title: 'Upload Your Materials', desc: 'Syllabus, textbook chapters, notes, and past papers. Text extracted and chunked automatically.' },
            { icon: '🎯', title: 'Grounded Diagnostic Quiz', desc: 'Questions generated from your actual documents — not generic AI knowledge. Full source citations included.' },
            { icon: '📊', title: 'Adaptive Revision Plan', desc: 'Weak-first scheduling that rebuilds after every quiz. Day-by-day tasks with priority and activity types.' },
          ].map((f) => (
            <div key={f.title} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="text-base font-semibold text-slate-900 mb-2">{f.title}</h3>
              <p className="text-sm text-slate-500">{f.desc}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
