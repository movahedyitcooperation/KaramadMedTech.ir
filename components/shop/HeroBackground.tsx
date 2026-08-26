export function HeroBackground() {
  return (
    <div aria-hidden="true" className="absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-linear-to-br from-brand-700 via-brand-600 to-teal-600" />
      <svg className="absolute -end-16 -top-16 h-64 w-64 opacity-20" viewBox="0 0 200 200">
        <circle cx="100" cy="100" r="100" fill="white" />
      </svg>
      <svg className="absolute -start-16 bottom-0 h-56 w-56 opacity-10" viewBox="0 0 200 200">
        <circle cx="100" cy="100" r="100" fill="white" />
      </svg>
      <svg className="absolute end-24 top-10 h-8 w-8 opacity-30" viewBox="0 0 24 24">
        <path d="M11 2h2v9h9v2h-9v9h-2v-9H2v-2h9z" fill="white" />
      </svg>
      <svg className="absolute start-32 bottom-16 h-6 w-6 opacity-20" viewBox="0 0 24 24">
        <path d="M11 2h2v9h9v2h-9v9h-2v-9H2v-2h9z" fill="white" />
      </svg>
      <svg className="absolute end-1/3 bottom-8 h-4 w-4 opacity-25" viewBox="0 0 24 24">
        <path d="M11 2h2v9h9v2h-9v9h-2v-9H2v-2h9z" fill="white" />
      </svg>
    </div>
  );
}
