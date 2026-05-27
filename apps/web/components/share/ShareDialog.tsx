"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import QRCode from "react-qr-code";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import { Separator } from "~/components/ui/separator";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "~/components/ui/input-group";
import {
  CheckIcon,
  CopyIcon,
  DownloadIcon,
  ExternalLinkIcon,
  LinkedinIcon,
  MailIcon,
  Share2Icon,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "~/lib/utils";

export type ShareDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Display name shown in the dialog header */
  title?: string;
  description?: string;
  /** Full URL to share. If omitted, built from `slug` and current origin. */
  url?: string;
  /** Form slug — used to build `/f/{slug}` when `url` is not provided */
  slug?: string;
  /** Filename stem for QR download (defaults to slug or "form") */
  downloadName?: string;
  /** Show "Open live preview" footer action when slug is available */
  showPreviewLink?: boolean;
};

type SocialPlatform = {
  id: string;
  label: string;
  className: string;
  icon: React.ReactNode;
  getShareUrl: (url: string, title: string) => string;
};

function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

const socialPlatforms: SocialPlatform[] = [
  {
    id: "x",
    label: "X",
    className: "bg-slate-900 hover:bg-slate-800 text-white",
    icon: <XIcon className="size-4" />,
    getShareUrl: (url, title) =>
      `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
  },
  {
    id: "linkedin",
    label: "LinkedIn",
    className: "bg-[#0A66C2] hover:bg-[#004182] text-white",
    icon: <LinkedinIcon className="size-4" />,
    getShareUrl: (url) =>
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
  },
  {
    id: "facebook",
    label: "Facebook",
    className: "bg-[#1877F2] hover:bg-[#0d5fd4] text-white",
    icon: <FacebookIcon className="size-4" />,
    getShareUrl: (url) =>
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
  },
  {
    id: "whatsapp",
    label: "WhatsApp",
    className: "bg-[#25D366] hover:bg-[#1da851] text-white",
    icon: <WhatsAppIcon className="size-4" />,
    getShareUrl: (url, title) =>
      `https://wa.me/?text=${encodeURIComponent(`${title}\n${url}`)}`,
  },
  {
    id: "email",
    label: "Email",
    className: "bg-slate-600 hover:bg-slate-700 text-white",
    icon: <MailIcon className="size-4" />,
    getShareUrl: (url, title) =>
      `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`Check out this form:\n${url}`)}`,
  },
];

function buildShareUrl(url?: string, slug?: string) {
  if (url) return url;
  if (typeof window === "undefined" || !slug) return "";
  return `${window.location.origin}/f/${slug}`;
}

async function downloadQrCode(svgElement: SVGSVGElement, filename: string) {
  const svgData = new XMLSerializer().serializeToString(svgElement);
  const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
  const svgUrl = URL.createObjectURL(svgBlob);

  try {
    const image = new Image();
    image.crossOrigin = "anonymous";

    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error("Failed to render QR code"));
      image.src = svgUrl;
    });

    const size = 512;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas not supported");

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, size, size);
    ctx.drawImage(image, 0, 0, size, size);

    const pngBlob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/png")
    );
    if (!pngBlob) throw new Error("Failed to create PNG");

    const downloadUrl = URL.createObjectURL(pngBlob);
    const anchor = document.createElement("a");
    anchor.href = downloadUrl;
    anchor.download = `${filename}-qr.png`;
    anchor.click();
    URL.revokeObjectURL(downloadUrl);
  } finally {
    URL.revokeObjectURL(svgUrl);
  }
}

export function ShareDialog({
  open,
  onOpenChange,
  title = "Share",
  description = "Copy the link, scan the QR code, or share directly to social platforms.",
  url,
  slug,
  downloadName,
  showPreviewLink = true,
}: ShareDialogProps) {
  const qrRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const [shareUrl, setShareUrl] = useState("");

  useEffect(() => {
    if (open) {
      setShareUrl(buildShareUrl(url, slug));
      setCopied(false);
    }
  }, [open, url, slug]);

  const shareTitle = useMemo(
    () => (title && title !== "Share" ? title : "Check out this form"),
    [title]
  );

  const fileName = downloadName ?? slug ?? "form";

  const handleCopy = useCallback(async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Link copied to clipboard!");
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy link. Please copy it manually.");
    }
  }, [shareUrl]);

  const handleDownloadQr = useCallback(async () => {
    const svg = qrRef.current?.querySelector("svg");
    if (!svg) {
      toast.error("QR code is not ready yet.");
      return;
    }
    try {
      await downloadQrCode(svg, fileName);
      toast.success("QR code downloaded!");
    } catch {
      toast.error("Failed to download QR code.");
    }
  }, [fileName]);

  const handleSocialShare = useCallback(
    (platform: SocialPlatform) => {
      if (!shareUrl) return;
      const shareLink = platform.getShareUrl(shareUrl, shareTitle);
      if (platform.id === "email") {
        window.location.href = shareLink;
        return;
      }
      window.open(shareLink, "_blank", "noopener,noreferrer,width=600,height=500");
    },
    [shareUrl, shareTitle]
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md gap-0 p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <Share2Icon className="size-5 text-primary" />
            </div>
            <div className="min-w-0 text-left">
              <DialogTitle className="text-lg font-bold leading-tight">
                Share your form
              </DialogTitle>
              {title && title !== "Share" && (
                <p className="mt-0.5 truncate text-sm font-medium text-slate-700">{title}</p>
              )}
            </div>
          </div>
          <DialogDescription className="text-left">{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-5 px-6 pb-2">
          {/* Copy link */}
          <div className="space-y-2">
            <Label htmlFor="share-link" className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Public link
            </Label>
            <InputGroup className="h-10 bg-slate-50">
              <InputGroupInput
                id="share-link"
                readOnly
                value={shareUrl}
                className="font-mono text-xs text-slate-700"
                onFocus={(e) => e.target.select()}
              />
              <InputGroupAddon align="inline-end">
                <InputGroupButton
                  aria-label={copied ? "Copied" : "Copy link"}
                  onClick={handleCopy}
                  className={cn(
                    "gap-1.5 font-semibold",
                    copied && "text-green-600"
                  )}
                >
                  {copied ? (
                    <>
                      <CheckIcon className="size-3.5" />
                      Copied
                    </>
                  ) : (
                    <>
                      <CopyIcon className="size-3.5" />
                      Copy
                    </>
                  )}
                </InputGroupButton>
              </InputGroupAddon>
            </InputGroup>
          </div>

          <Separator />

          {/* QR code */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                QR code
              </Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 text-xs font-semibold"
                onClick={handleDownloadQr}
                disabled={!shareUrl}
              >
                <DownloadIcon className="size-3.5" />
                Download
              </Button>
            </div>
            <div className="flex justify-center">
              <div
                ref={qrRef}
                className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                {shareUrl ? (
                  <QRCode
                    value={shareUrl}
                    size={160}
                    level="M"
                    bgColor="#ffffff"
                    fgColor="#0f172a"
                    style={{ height: "auto", maxWidth: "100%", width: "160px" }}
                  />
                ) : (
                  <div className="flex size-40 items-center justify-center text-xs text-muted-foreground">
                    Loading…
                  </div>
                )}
              </div>
            </div>
            <p className="text-center text-xs text-slate-500">
              Scan to open the form on any device
            </p>
          </div>

          <Separator />

          {/* Social share */}
          <div className="space-y-3">
            <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Share on social
            </Label>
            <div className="grid grid-cols-5 gap-2">
              {socialPlatforms.map((platform) => (
                <button
                  key={platform.id}
                  type="button"
                  disabled={!shareUrl}
                  onClick={() => handleSocialShare(platform)}
                  className={cn(
                    "flex flex-col items-center gap-1.5 rounded-xl px-1 py-2.5 text-[10px] font-semibold transition-all",
                    "disabled:cursor-not-allowed disabled:opacity-40",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  )}
                  title={`Share on ${platform.label}`}
                >
                  <span
                    className={cn(
                      "flex size-9 items-center justify-center rounded-full transition-colors",
                      platform.className
                    )}
                  >
                    {platform.icon}
                  </span>
                  <span className="text-slate-600">{platform.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="mt-4 flex-col gap-2 border-t bg-slate-50/80 px-6 py-4 sm:flex-row sm:justify-between">
          {showPreviewLink && slug ? (
            <Button
              type="button"
              variant="ghost"
              className="gap-2 text-slate-600 hover:text-primary"
              onClick={() => window.open(`/f/${slug}`, "_blank", "noopener,noreferrer")}
            >
              <ExternalLinkIcon className="size-4" />
              Open live preview
            </Button>
          ) : (
            <span />
          )}
          <Button type="button" className="px-6 font-semibold" onClick={() => onOpenChange(false)}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
