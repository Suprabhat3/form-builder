import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-background dark:bg-background border-t border-outline-variant/50 dark:border-outline/30 full-width">
      <div className="max-w-7xl mx-auto px-margin py-xl flex flex-col md:flex-row justify-between items-center gap-md">
        {/* Brand / Copyright */}
        <div className="flex flex-col items-center md:items-start gap-xs">
          <span className="text-headline-md font-headline-md font-bold text-on-surface dark:text-on-surface flex items-center gap-xs">
            <span
              className="material-symbols-outlined text-primary text-[20px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              layers
            </span>
            ZenForm
          </span>
          <span className="text-body-md font-body-md text-secondary dark:text-secondary-fixed-dim">
            © 2024 ZenForm. All rights reserved.
          </span>
        </div>
        {/* Links */}
        <div className="flex flex-wrap justify-center gap-md md:gap-lg">
          <Link
            className="text-label-sm font-label-sm text-on-surface-variant dark:text-on-secondary-fixed-variant hover:text-primary dark:hover:text-primary-fixed underline underline-offset-4 transition-all duration-200"
            href="#"
          >
            Privacy
          </Link>
          <Link
            className="text-label-sm font-label-sm text-on-surface-variant dark:text-on-secondary-fixed-variant hover:text-primary dark:hover:text-primary-fixed underline underline-offset-4 transition-all duration-200"
            href="#"
          >
            Terms
          </Link>
          <Link
            className="text-label-sm font-label-sm text-on-surface-variant dark:text-on-secondary-fixed-variant hover:text-primary dark:hover:text-primary-fixed underline underline-offset-4 transition-all duration-200"
            href="#"
          >
            Cookie Policy
          </Link>
          <Link
            className="text-label-sm font-label-sm text-on-surface-variant dark:text-on-secondary-fixed-variant hover:text-primary dark:hover:text-primary-fixed underline underline-offset-4 transition-all duration-200"
            href="#"
          >
            Status
          </Link>
        </div>
      </div>
    </footer>
  );
}
