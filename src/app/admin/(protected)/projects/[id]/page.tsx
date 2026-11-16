import { notFound } from "next/navigation";
import { EntityForm } from "@/components/admin/EntityForm";
import { ProjectGallery } from "@/components/admin/ProjectGallery";
import { buildDefaults } from "@/lib/admin/entities";
import { updateProjectAction } from "@/app/admin/actions/projects";
import { getProjectById } from "@/lib/airtable/read";
import { SEED_PROJECTS } from "@/lib/seed";
import { hasAirtableCreds, hasBlobToken } from "@/lib/utils";

/**
 * Project edit (design §12). The generic entity form plus the inline
 * ProjectImages gallery editor. In the degraded no-creds mode the seed project
 * is shown for preview and every write returns the typed "not configured"
 * result.
 */
export const dynamic = "force-dynamic";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const editable = hasAirtableCreds();
  const project = editable
    ? await getProjectById(id)
    : (SEED_PROJECTS.find((p) => p.id === id) ?? null);
  if (!project) notFound();

  const defaults = buildDefaults(
    "projects",
    project as unknown as Record<string, unknown>,
  );
  const action = updateProjectAction.bind(null, id);

  return (
    <div className="space-y-8">
      <h1 className="text-h2 font-semibold text-text">Edit project</h1>
      {!editable ? (
        <div className="rounded-lg border border-accent-amber/40 bg-accent-amber/10 px-4 py-3 text-small text-text">
          Content backend not configured — saves are disabled. Seed data is
          shown for preview.
        </div>
      ) : null}
      <EntityForm
        entity="projects"
        action={action}
        defaultValues={defaults}
        blobEnabled={hasBlobToken()}
      />
      <ProjectGallery
        projectId={project.id}
        slug={project.slug}
        images={project.images}
        blobEnabled={hasBlobToken()}
        editable={editable}
      />
    </div>
  );
}
