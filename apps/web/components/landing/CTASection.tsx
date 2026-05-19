export function CTASection() {
  return (
    <section className="max-w-5xl mx-auto px-margin py-xl mb-[120px]">
      <div className="bg-surface-container-lowest rounded-[32px] border border-outline-variant/30 p-[64px] text-center relative overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
        {/* Decorative background elements */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50"></div>
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary-fixed/30 rounded-full blur-[80px]"></div>
        <h2 className="text-headline-lg font-headline-lg text-on-surface mb-md relative z-10">
          Ready for Effortless Precision?
        </h2>
        <p className="text-body-lg font-body-lg text-on-surface-variant max-w-2xl mx-auto mb-xl relative z-10">
          Join the professional operators who have upgraded their workflow. Stop
          fighting generic templates and start building beautiful experiences.
        </p>
        <div className="flex flex-col sm:flex-row justify-center items-center gap-md relative z-10">
          <button className="w-full sm:w-auto text-label-md font-label-md bg-gradient-to-r from-primary to-primary-container text-on-primary px-xl py-sm rounded-lg shadow-[0_4px_14px_0_rgba(70,72,212,0.39)] hover:shadow-[0_6px_20px_rgba(70,72,212,0.23)] hover:-translate-y-0.5 transition-all duration-200">
            Create Your First Form
          </button>
          <span className="text-label-sm font-label-sm text-on-surface-variant">
            No credit card required.
          </span>
        </div>
      </div>
    </section>
  );
}
