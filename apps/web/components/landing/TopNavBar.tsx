import Link from "next/link";

export function TopNavBar() {
  return (
    <nav className="bg-surface/80 dark:bg-surface/80 backdrop-blur-xl border-b border-outline-variant/30 dark:border-outline/20 shadow-sm dark:shadow-none docked full-width top-0 sticky z-50">
      <div className="flex justify-between items-center w-full px-margin py-4 max-w-7xl mx-auto">
        {/* Brand */}
        <Link
          className="text-headline-md font-headline-md md:text-headline-md md:font-headline-md font-bold tracking-tight text-on-surface dark:text-on-surface flex items-center gap-xs hover:opacity-80 transition-opacity"
          href="#"
        >
          <span
            className="material-symbols-outlined text-primary"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            layers
          </span>
          FormFlow
        </Link>
        {/* Navigation Links (Desktop) */}
        <div className="hidden md:flex items-center gap-lg">
          <Link
            className="text-label-md font-label-md text-on-surface-variant hover:text-primary transition-colors"
            href="#"
          >
            Marketplace
          </Link>
          <Link
            className="text-label-md font-label-md text-on-surface-variant hover:text-primary transition-colors"
            href="#"
          >
            Features
          </Link>
          <Link
            className="text-label-md font-label-md text-on-surface-variant hover:text-primary transition-colors"
            href="#"
          >
            Templates
          </Link>
          <Link
            className="text-label-md font-label-md text-on-surface-variant hover:text-primary transition-colors"
            href="#"
          >
            Pricing
          </Link>
        </div>
        {/* Actions */}
        <div className="flex items-center gap-md">
          <Link
            className="hidden md:block text-label-md font-label-md text-on-surface-variant hover:text-primary transition-colors"
            href="/login"
          >
            Sign In
          </Link>
          <Link
            className="text-label-md font-label-md bg-gradient-to-r from-primary to-primary-container text-on-primary px-md py-xs rounded-full hover:shadow-md hover:opacity-95 transition-all scale-95 duration-150 ease-in-out"
            href="/signup"
          >
            Get Started
          </Link>
        </div>
      </div>
    </nav>
  );
}
