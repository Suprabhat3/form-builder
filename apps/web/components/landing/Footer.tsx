"use client"
import Image from "next/image";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-surface-container-lowest dark:bg-background border-t border-outline-variant/40 dark:border-outline/20 full-width transition-all duration-300">
      <div className="max-w-7xl mx-auto px-margin pt-ds-xl pb-ds-lg">

        {/* Main Grid */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-ds-lg mb-ds-xl">

          {/* Brand Info & Newsletter */}
          <div className="col-span-2 flex flex-col items-start gap-ds-md">
            <Link
              href="/"
              className="text-headline-sm font-bold text-on-surface dark:text-on-surface flex items-center gap-ds-xs hover:opacity-85 transition-opacity"
            >
              <Image src="/logo.png" alt="Logo" width={28} height={28} className="rounded-full" />
              <span>ZenForm</span>
            </Link>

            <p className="text-body-sm text-on-surface-variant max-w-60 leading-normal">
              Form building crafted like art. Create high-converting interfaces with pixel-perfect control.
            </p>
          </div>

          {/* Column 1: Product */}
          <div className="flex flex-col gap-ds-sm">
            <span className="text-label-sm font-bold text-on-surface dark:text-on-surface uppercase tracking-wider">
              Product
            </span>
            <div className="flex flex-col gap-ds-xs">
              <Link className="text-label-sm text-on-surface-variant hover:text-primary transition-colors" href="#">
                Features
              </Link>
              <Link className="text-label-sm text-on-surface-variant hover:text-primary transition-colors" href="#">
                Marketplace
              </Link>
              <Link className="text-label-sm text-on-surface-variant hover:text-primary transition-colors" href="/templates">
                Templates
              </Link>
              <Link className="text-label-sm text-on-surface-variant hover:text-primary transition-colors" href="#">
                Pricing
              </Link>
            </div>
          </div>

          {/* Column 2: Resources */}
          <div className="flex flex-col gap-ds-sm">
            <span className="text-label-sm font-bold text-on-surface dark:text-on-surface uppercase tracking-wider">
              Resources
            </span>
            <div className="flex flex-col gap-ds-xs">
              <Link className="text-label-sm text-on-surface-variant hover:text-primary transition-colors" href="#">
                Documentation
              </Link>
              <Link className="text-label-sm text-on-surface-variant hover:text-primary transition-colors" href="#">
                Help Center
              </Link>
              <Link className="text-label-sm text-on-surface-variant hover:text-primary transition-colors" href="#">
                Guides
              </Link>
              <Link className="text-label-sm text-on-surface-variant hover:text-primary transition-colors" href="#">
                APIs
              </Link>
            </div>
          </div>

          {/* Column 3: Company */}
          <div className="flex flex-col gap-ds-sm">
            <span className="text-label-sm font-bold text-on-surface dark:text-on-surface uppercase tracking-wider">
              Company
            </span>
            <div className="flex flex-col gap-ds-xs">
              <Link className="text-label-sm text-on-surface-variant hover:text-primary transition-colors" href="#">
                About Us
              </Link>
              <Link className="text-label-sm text-on-surface-variant hover:text-primary transition-colors" href="#">
                Blog
              </Link>
              <Link className="text-label-sm text-on-surface-variant hover:text-primary transition-colors" href="#">
                Careers
              </Link>
              <Link className="text-label-sm text-on-surface-variant hover:text-primary transition-colors" href="#">
                Press Kit
              </Link>
            </div>
          </div>

          {/* Column 4: Legal */}
          <div className="flex flex-col gap-ds-sm">
            <span className="text-label-sm font-bold text-on-surface dark:text-on-surface uppercase tracking-wider">
              Legal
            </span>
            <div className="flex flex-col gap-ds-xs">
              <Link className="text-label-sm text-on-surface-variant hover:text-primary transition-colors" href="#">
                Privacy Policy
              </Link>
              <Link className="text-label-sm text-on-surface-variant hover:text-primary transition-colors" href="#">
                Terms of Use
              </Link>
              <Link className="text-label-sm text-on-surface-variant hover:text-primary transition-colors" href="#">
                Cookie Settings
              </Link>
              <Link className="text-label-sm text-on-surface-variant hover:text-primary transition-colors" href="#">
                Status
              </Link>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="border-t border-outline-variant/30 dark:border-outline/10 pt-ds-lg flex flex-col sm:flex-row justify-between items-center gap-ds-md">
          <span className="text-label-sm text-on-surface-variant">
            © 2026 ZenForm. All rights reserved.
          </span>

          {/* Social Links */}
          <div className="flex items-center gap-ds-md">
            {/* Twitter / X */}
            <a href="https://x.com/suprabhat_3" target="_blank" className="text-on-surface-variant hover:text-primary transition-colors" aria-label="Twitter">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>

            {/* GitHub */}
            <a href="https://github.com/suprabhat3" target="_blank" className="text-on-surface-variant hover:text-primary transition-colors" aria-label="GitHub">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.577.688.479C19.138 20.164 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
              </svg>
            </a>

            {/* LinkedIn */}
            <a href="https://www.linkedin.com/in/suprabhatt" target="_blank" className="text-on-surface-variant hover:text-primary transition-colors" aria-label="LinkedIn">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 1.75.779 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" clipRule="evenodd" />
              </svg>
            </a>
          </div>
        </div>

      </div>
    </footer>
  );
}
