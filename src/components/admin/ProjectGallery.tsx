"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Input } from "@/components/ui";
import { ImageField } from "./ImageField";
import { DeleteButton } from "./DeleteButton";
import type { ProjectImage } from "@/lib/types";
import {
  addProjectImageAction,
  updateProjectImageAction,
  deleteProjectImageAction,
} from "@/app/admin/actions/projects";

/**
 * Inline ProjectImages gallery editor (design §12). Create / update / delete
 * gallery rows via the FEAT-002 ProjectImages DAL writers; each write
 * revalidates the parent project's `project:{slug}` + `projects` tags (§7).
 * Disabled in the degraded no-backend mode.
 */
interface RowValues {
  name: string;
  imageUrl: string;
  alt: string;
  order: number;
}

function GalleryRow({
  image,
  slug,
  blobEnabled,
  editable,
}: {
  image: ProjectImage;
  slug: string;
  blobEnabled: boolean;
  editable: boolean;
}) {
  const router = useRouter();
  const [values, setValues] = useState<RowValues>({
    name: image.name,
    imageUrl: image.url,
    alt: image.alt,
    order: image.order,
  });
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function save() {
    setError(null);
    startTransition(async () => {
      const result = await updateProjectImageAction(image.id, slug, values);
      if (result.ok) router.refresh();
      else setError(result.message ?? "Couldn't save.");
    });
  }

  return (
    <Card className="space-y-3">
      <Input
        value={values.name}
        onChange={(e) => setValues({ ...values, name: e.target.value })}
        placeholder="Label"
      />
      <ImageField
        label="Gallery image"
        url={values.imageUrl}
        alt={values.alt}
        withAlt
        blobEnabled={blobEnabled}
        onUrlChange={(v) => setValues({ ...values, imageUrl: v })}
        onAltChange={(v) => setValues({ ...values, alt: v })}
      />
      <div className="flex items-center gap-3">
        <label className="text-small text-muted">Order</label>
        <Input
          type="number"
          className="w-24"
          value={values.order}
          onChange={(e) =>
            setValues({ ...values, order: Number(e.target.value) })
          }
        />
        <Button type="button" size="sm" disabled={!editable || pending} onClick={save}>
          {pending ? "Saving…" : "Save"}
        </Button>
        <DeleteButton
          action={() => deleteProjectImageAction(image.id, slug)}
          label={image.name}
          disabled={!editable}
        />
      </div>
      {error ? <p className="text-small text-accent-red">{error}</p> : null}
    </Card>
  );
}

function GalleryAdd({
  projectId,
  slug,
  blobEnabled,
  editable,
  nextOrder,
}: {
  projectId: string;
  slug: string;
  blobEnabled: boolean;
  editable: boolean;
  nextOrder: number;
}) {
  const router = useRouter();
  const [values, setValues] = useState<RowValues>({
    name: "",
    imageUrl: "",
    alt: "",
    order: nextOrder,
  });
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function add() {
    setError(null);
    startTransition(async () => {
      const result = await addProjectImageAction(projectId, slug, values);
      if (result.ok) {
        setValues({ name: "", imageUrl: "", alt: "", order: nextOrder + 1 });
        router.refresh();
      } else {
        setError(result.message ?? "Couldn't add the image.");
      }
    });
  }

  return (
    <Card className="space-y-3 border-dashed">
      <p className="font-medium text-text">Add a gallery image</p>
      <Input
        value={values.name}
        onChange={(e) => setValues({ ...values, name: e.target.value })}
        placeholder="Label"
      />
      <ImageField
        label="Gallery image"
        url={values.imageUrl}
        alt={values.alt}
        withAlt
        blobEnabled={blobEnabled}
        onUrlChange={(v) => setValues({ ...values, imageUrl: v })}
        onAltChange={(v) => setValues({ ...values, alt: v })}
      />
      <div className="flex items-center gap-3">
        <label className="text-small text-muted">Order</label>
        <Input
          type="number"
          className="w-24"
          value={values.order}
          onChange={(e) =>
            setValues({ ...values, order: Number(e.target.value) })
          }
        />
        <Button type="button" size="sm" disabled={!editable || pending} onClick={add}>
          {pending ? "Adding…" : "Add image"}
        </Button>
      </div>
      {error ? <p className="text-small text-accent-red">{error}</p> : null}
    </Card>
  );
}

export interface ProjectGalleryProps {
  projectId: string;
  slug: string;
  images: ProjectImage[];
  blobEnabled: boolean;
  editable: boolean;
}

export function ProjectGallery({
  projectId,
  slug,
  images,
  blobEnabled,
  editable,
}: ProjectGalleryProps) {
  const nextOrder = images.length;
  return (
    <section className="space-y-4">
      <h2 className="text-h3 font-semibold text-text">Gallery images</h2>
      {images.length === 0 ? (
        <p className="text-muted">No gallery images yet.</p>
      ) : (
        <div className="space-y-4">
          {images.map((image) => (
            <GalleryRow
              key={image.id}
              image={image}
              slug={slug}
              blobEnabled={blobEnabled}
              editable={editable}
            />
          ))}
        </div>
      )}
      <GalleryAdd
        projectId={projectId}
        slug={slug}
        blobEnabled={blobEnabled}
        editable={editable}
        nextOrder={nextOrder}
      />
    </section>
  );
}
