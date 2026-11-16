"use client";

import { useState, useTransition } from "react";
import { useForm, type FieldValues } from "react-hook-form";
import { useRouter } from "next/navigation";
import { Button, Input, Select, Textarea, Toast } from "@/components/ui";
import { ImageField } from "./ImageField";
import {
  ENTITY_FORMS,
  buildDefaults,
  coerceValues,
  type EntityKey,
  type FieldDef,
} from "@/lib/admin/entities";
import { toFieldErrors, type AdminFormState } from "@/lib/admin/result";

/**
 * Generic admin create/edit form (design §12/§13). Driven by the declarative
 * field config in `lib/admin/entities`. Uses react-hook-form for field state
 * and re-runs the entity Zod schema client-side for instant UX; the server
 * action re-validates authoritatively. On a returned non-success result it
 * surfaces field errors + a toast; on success the action redirects (lists) or
 * returns `ok` (singletons), shown as a success toast.
 */
export interface EntityFormProps {
  entity: EntityKey;
  action: (values: Record<string, unknown>) => Promise<AdminFormState | void>;
  defaultValues?: Record<string, unknown>;
  blobEnabled: boolean;
  submitLabel?: string;
}

export function EntityForm({
  entity,
  action,
  defaultValues,
  blobEnabled,
  submitLabel,
}: EntityFormProps) {
  const config = ENTITY_FORMS[entity];
  const router = useRouter();
  const form = useForm<FieldValues>({
    defaultValues: defaultValues ?? buildDefaults(entity),
  });
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    formState: { errors },
  } = form;
  const [pending, startTransition] = useTransition();
  const [toast, setToast] = useState<
    { tone: "success" | "error"; message: string } | null
  >(null);

  function applyErrors(fieldErrors: Record<string, string>) {
    for (const [name, message] of Object.entries(fieldErrors)) {
      setError(name, { type: "server", message });
    }
  }

  function onSubmit(raw: FieldValues) {
    setToast(null);
    const payload = coerceValues(entity, raw);
    const parsed = config.schema.safeParse(payload);
    if (!parsed.success) {
      applyErrors(toFieldErrors(parsed.error));
      setToast({ tone: "error", message: "Please fix the highlighted fields." });
      return;
    }
    startTransition(async () => {
      const result = await action(parsed.data as Record<string, unknown>);
      if (!result) return; // action redirected — navigation already happened.
      if (result.ok) {
        setToast({ tone: "success", message: result.message ?? "Saved." });
        router.refresh();
      } else {
        if (result.fieldErrors) applyErrors(result.fieldErrors);
        setToast({
          tone: "error",
          message: result.message ?? "Couldn't save. Please try again.",
        });
      }
    });
  }

  function errorFor(name: string): string | undefined {
    const e = errors[name];
    return typeof e?.message === "string" ? e.message : undefined;
  }

  function renderField(field: FieldDef) {
    const err = errorFor(field.name);
    const labelNode = (
      <label
        htmlFor={field.name}
        className="block text-small font-medium text-text"
      >
        {field.label}
        {field.required ? <span className="text-accent-red"> *</span> : null}
      </label>
    );
    const help = field.help ? (
      <p className="text-small text-muted">{field.help}</p>
    ) : null;
    const errNode = err ? (
      <p className="text-small text-accent-red">{err}</p>
    ) : null;

    if (field.kind === "image") {
      const url = String(watch(field.name) ?? "");
      const altValue = field.altName ? String(watch(field.altName) ?? "") : "";
      return (
        <ImageField
          key={field.name}
          label={field.label}
          url={url}
          alt={altValue}
          withAlt={Boolean(field.altName)}
          blobEnabled={blobEnabled}
          urlError={err}
          altError={field.altName ? errorFor(field.altName) : undefined}
          onUrlChange={(v) =>
            setValue(field.name, v, { shouldDirty: true, shouldValidate: false })
          }
          onAltChange={(v) =>
            field.altName
              ? setValue(field.altName, v, { shouldDirty: true })
              : undefined
          }
        />
      );
    }

    if (field.kind === "checkbox") {
      return (
        <div key={field.name} className="flex items-center gap-2">
          <input
            id={field.name}
            type="checkbox"
            className="h-4 w-4 rounded border-border"
            {...register(field.name)}
          />
          <label htmlFor={field.name} className="text-body text-text">
            {field.label}
          </label>
          {errNode}
        </div>
      );
    }

    let control: React.ReactNode;
    if (field.kind === "textarea" || field.kind === "lines" || field.kind === "metrics") {
      control = (
        <Textarea
          id={field.name}
          rows={field.rows ?? 4}
          placeholder={field.placeholder}
          invalid={Boolean(err)}
          {...register(field.name)}
        />
      );
    } else if (field.kind === "select") {
      control = (
        <Select id={field.name} invalid={Boolean(err)} {...register(field.name)}>
          {field.options?.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
      );
    } else {
      const type =
        field.kind === "number" ? "number" : field.kind === "date" ? "date" : "text";
      control = (
        <Input
          id={field.name}
          type={type}
          placeholder={field.placeholder}
          invalid={Boolean(err)}
          {...register(field.name)}
        />
      );
    }

    return (
      <div key={field.name} className="space-y-1">
        {labelNode}
        {control}
        {help}
        {errNode}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
      {toast ? (
        <Toast
          tone={toast.tone}
          message={toast.message}
          onDismiss={() => setToast(null)}
        />
      ) : null}
      {config.fields.map(renderField)}
      <div className="flex gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : (submitLabel ?? "Save")}
        </Button>
        <Button type="button" variant="ghost" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
