"use client";

import { useState } from "react";
import Image from "next/image";
import { FileImage, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type ImageLightboxProps = {
  src: string;
  alt?: string;
  thumbnailClassName?: string;
};

/** API invoice routes need session cookies — skip next/image optimizer */
function usesDirectImageLoad(src: string): boolean {
  return src.startsWith("/api/");
}

function InvoiceImage({
  src,
  alt,
  className,
  fill,
  width,
  height,
  sizes,
  onError,
}: {
  src: string;
  alt: string;
  className?: string;
  fill?: boolean;
  width?: number;
  height?: number;
  sizes?: string;
  onError?: () => void;
}) {
  if (usesDirectImageLoad(src)) {
    if (fill) {
      return (
        // eslint-disable-next-line @next/next/no-img-element -- auth cookie required
        <img
          src={src}
          alt={alt}
          className={cn("size-full object-cover", className)}
          onError={onError}
        />
      );
    }
    return (
      // eslint-disable-next-line @next/next/no-img-element -- auth cookie required
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={className}
        onError={onError}
      />
    );
  }

  if (fill) {
    return (
      <Image
        src={src}
        alt={alt}
        fill
        className={className}
        sizes={sizes}
        onError={onError}
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      onError={onError}
    />
  );
}

export function ImageLightbox({
  src,
  alt = "فاکتور",
  thumbnailClassName,
}: ImageLightboxProps) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState(false);

  if (!src || error) {
    return (
      <div
        className={cn(
          "flex size-14 items-center justify-center rounded-lg border bg-muted text-muted-foreground",
          thumbnailClassName,
        )}
      >
        <FileImage className="size-6" />
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        className={cn(
          "relative size-14 overflow-hidden rounded-lg border transition hover:ring-2 hover:ring-primary/40",
          thumbnailClassName,
        )}
        onClick={() => setOpen(true)}
        aria-label="مشاهده فاکتور"
      >
        <InvoiceImage
          src={src}
          alt={alt}
          fill
          className="object-cover"
          sizes="56px"
          onError={() => setError(true)}
        />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[95vh] max-w-4xl gap-4">
          <DialogHeader className="flex-row items-center justify-between gap-4 space-y-0">
            <DialogTitle>پیش‌نمایش فاکتور</DialogTitle>
            <Button variant="outline" size="sm" className="gap-1" asChild>
              <a href={src} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="size-4" />
                تب جدید
              </a>
            </Button>
          </DialogHeader>
          <div className="relative max-h-[75vh] min-h-[200px] w-full overflow-hidden rounded-xl bg-muted">
            <InvoiceImage
              src={src}
              alt={alt}
              width={1200}
              height={900}
              className="mx-auto h-auto max-h-[75vh] w-full object-contain"
              onError={() => setError(true)}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
