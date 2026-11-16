"use client";

import { useId, useRef, useState } from "react";
import { upload } from "@vercel/blob/client";
import { Upload } from "lucide-react";
import { Button, Input } from "@/components/ui";
import { isAllowedImageUrl } from "@/lib/validation/common";

/**
 * Admin image field (design §10/§12/§13). Two ways to set an image:
 *  1. Upload a file — `@vercel/blob/client` `upload()` posts to
 *     `/api/blob/upload` (admin-guarded, type/size-limited, SVG rejected) and
 *     returns a stable public Blob URL.
 *  2. Paste a URL — accepted ONLY when it is a same-origin asset path or a
 *     `*.public.blob.vercel-storage.com` URL (host-validated here per §13 and
 *     re-validated server-side on save), so every stored image renders through
 *     next/image.
 * When `BLOB_READ_WRITE_TOKEN` is absent (`blobEnabled === false`) the upload
 * button is disabled but a pasted, host-validated URL still works (§10).
 * A paired alt input is shown (and required on save) whenever `altName` is set.
 */
const ACCEPT = "image/jpeg,image/png,image/webp,image/avif";
const MAX_BYTES = 8 * 1024 * 1024;

export interface ImageFieldProps {
  label: string;
  url: string;
  alt: string;
  onUrlChange: (url: string) => void;
  onAltChange: (alt: string) => void;
  /** When false, upload is disabled (missing Blob token); paste still works. */
  blobEnabled: boolean;
  /** Render the alt input (image fields paired with an alt in §5). */
  withAlt: boolean;
  urlError?: string;
  altError?: string;
}

export function ImageField({
  label,
  url,
  alt,
  onUrlChange,
  onAltChange,
  blobEnabled,
  withAlt,
  urlError,
  altError,
}: ImageFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const urlId = useId();
  const altId = useId();

  async function onFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!ACCEPT.split(",").includes(file.type)) {
      setStatus("Unsupported type — use JPEG, PNG, WebP, or AVIF.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setStatus("File is larger than 8MB.");
      return;
    }
    setBusy(true);
    setStatus("Uploading…");
    try {
      const blob = await upload(file.name, file, {
        access: "public",
        handleUploadUrl: "/api/blob/upload",
      });
      onUrlChange(blob.url);
      setStatus("Uploaded.");
    } catch {
      setStatus("Upload failed. You can paste a Blob URL instead.");
    } finally {
      setBusy(false);
    }
  }

  const pasteWarning =
    url.length > 0 && !isAllowedImageUrl(url)
      ? "Not a /relative path or *.public.blob.vercel-storage.com URL."
      : null;

  return (
    <fieldset className="space-y-2 rounded-lg border border-border p-4">
      <legend className="px-1 text-small font-medium text-text">{label}</legend>

      <label htmlFor={urlId} className="block text-small text-muted">
        Image URL
      </label>
      <div className="flex gap-2">
        <Input
          id={urlId}
          value={url}
          onChange={(e) => onUrlChange(e.target.value)}
          placeholder="/seed/cover.png or https://…public.blob.vercel-storage.com/…"
          invalid={Boolean(urlError)}
        />
        <Button
          type="button"
          variant="secondary"
          onClick={() => inputRef.current?.click()}
          disabled={!blobEnabled || busy}
          title={
            blobEnabled
              ? "Upload an image"
              : "Image upload unavailable — set BLOB_READ_WRITE_TOKEN"
          }
        >
          <Upload aria-hidden="true" className="h-4 w-4" />
          Upload
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          className="hidden"
          onChange={onFile}
        />
      </div>
      {!blobEnabled ? (
        <p className="text-small text-muted">
          Image upload unavailable — set <code>BLOB_READ_WRITE_TOKEN</code>. You
          can still paste a Datadive Blob URL.
        </p>
      ) : null}
      {status ? <p className="text-small text-muted">{status}</p> : null}
      {urlError ? <p className="text-small text-accent-red">{urlError}</p> : null}
      {!urlError && pasteWarning ? (
        <p className="text-small text-accent-red">{pasteWarning}</p>
      ) : null}

      {withAlt ? (
        <div className="space-y-1 pt-1">
          <label htmlFor={altId} className="block text-small text-muted">
            Alt text {url ? <span className="text-accent-red">*</span> : null}
          </label>
          <Input
            id={altId}
            value={alt}
            onChange={(e) => onAltChange(e.target.value)}
            placeholder="Describe the image"
            invalid={Boolean(altError)}
          />
          {altError ? (
            <p className="text-small text-accent-red">{altError}</p>
          ) : null}
        </div>
      ) : null}
    </fieldset>
  );
}
