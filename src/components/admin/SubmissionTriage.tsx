"use client";

import { useState, useTransition, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { Select } from "@/components/ui";
import type { SubmissionStatus } from "@/lib/types";
import { setSubmissionStatusAction } from "@/app/admin/actions/submissions";

/**
 * Contact-submission status control (design §5.15/§12). Moving the select
 * triggers the triage server action and refreshes the live admin list. Disabled
 * in the degraded no-backend mode.
 */
export interface SubmissionTriageProps {
  id: string;
  status: SubmissionStatus;
  disabled?: boolean;
}

export function SubmissionTriage({ id, status, disabled }: SubmissionTriageProps) {
  const router = useRouter();
  const [value, setValue] = useState<string>(status);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onChange(event: ChangeEvent<HTMLSelectElement>) {
    const next = event.target.value;
    setValue(next);
    setError(null);
    startTransition(async () => {
      const result = await setSubmissionStatusAction(id, next);
      if (result.ok) {
        router.refresh();
      } else {
        setValue(status);
        setError(result.message ?? "Couldn't update.");
      }
    });
  }

  return (
    <div className="flex flex-col gap-1">
      <Select
        value={value}
        onChange={onChange}
        disabled={disabled || pending}
        className="h-9 w-32"
      >
        <option value="New">New</option>
        <option value="Read">Read</option>
        <option value="Archived">Archived</option>
      </Select>
      {error ? <span className="text-small text-accent-red">{error}</span> : null}
    </div>
  );
}
