export default function Hero() {
  return (
    <section className="relative min-h-screen overflow-hidden bg-black">
      <img
        src="/tats_wideass_hero.svg"
        alt="Tats & Wideass Ultimate Showdown Arena"
        className="hero-art absolute inset-0 h-full w-full object-cover object-[center_42%] max-md:object-[center_38%] max-sm:object-[center_36%] max-sm:scale-[1.04]"
      />

      <div
        className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-b from-black/80 via-black/10 to-black/80"
        aria-hidden="true"
      />

      <nav className="relative z-10 flex h-20 items-center justify-between px-4 text-orange-50 md:px-8">
        <a href="/" className="font-['Permanent_Marker'] text-xl font-black tracking-tight md:text-2xl">
          Tats & Wideass
        </a>

        <div className="hidden gap-8 md:flex">
          <a href="#arena" className="text-sm font-extrabold uppercase tracking-wider hover:text-red-500">
            Arena
          </a>
          <a href="#rankings" className="text-sm font-extrabold uppercase tracking-wider hover:text-red-500">
            Rankings
          </a>
          <a href="#challenges" className="text-sm font-extrabold uppercase tracking-wider hover:text-red-500">
            Challenges
          </a>
          <a href="#about" className="text-sm font-extrabold uppercase tracking-wider hover:text-red-500">
            About
          </a>
        </div>

        <button
          type="button"
          className="rounded-full border-2 border-red-500 bg-black/60 px-4 py-2.5 text-sm font-black uppercase text-white shadow-[0_0_20px_rgba(239,68,68,0.3)] backdrop-blur-sm transition hover:bg-red-500/15 hover:shadow-[0_0_28px_rgba(239,68,68,0.5)] md:px-6 md:py-3"
        >
          Enter Arena 🔥
        </button>
      </nav>
    </section>
  );
}
