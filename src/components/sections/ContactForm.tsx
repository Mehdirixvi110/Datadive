"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { contactSchema, type ContactInput } from "@/lib/validation/contact";
import { Button, Input, Textarea, Toast, type ToastTone } from "@/components/ui";
import {
  submitContact,
  type ContactValues,
} from "@/app/actions/contact";

/**
 * Contact form (design §11/§13, FR-12). react-hook-form + the shared contact
 * Zod schema (same rules the server re-validates). Includes the `website`
 * honeypot, preserves entered values on error, and shows inline field errors
 * wired with `aria-describedby`. On success it resets and shows a toast.
 */
type FieldName = keyof ContactInput;

const FIELDS: Array<{
  name: FieldName;
  label: string;
  type?: string;
  required?: boolean;
  half?: boolean;
}> = [
  { name: "name", label: "Name", required: true, half: true },
  { name: "email", label: "Email", type: "email", required: true, half: true },
  { name: "company", label: "Company", half: true },
  { name: "phone", label: "Phone", type: "tel", half: true },
  { name: "subject", label: "Subject" },
];

export function ContactForm() {
  const [toast, setToast] = useState<{ tone: ToastTone; message: string } | null>(
    null,
  );

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ContactInput>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: "",
      email: "",
      company: "",
      subject: "",
      phone: "",
      message: "",
      website: "",
    },
  });

  const onSubmit = async (values: ContactInput) => {
    setToast(null);
    const result = await submitContact(values as ContactValues);

    if (result.ok) {
      reset();
      setToast({
        tone: "success",
        message: "Thanks — your message is on its way. We'll be in touch soon.",
      });
      return;
    }

    if (result.code === "validation") {
      for (const [field, message] of Object.entries(result.fieldErrors)) {
        setError(field as FieldName, { type: "server", message });
      }
      setToast({ tone: "error", message: "Please check the highlighted fields." });
      return;
    }

    setToast({ tone: "error", message: result.message });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
      {toast ? (
        <Toast
          tone={toast.tone}
          message={toast.message}
          onDismiss={() => setToast(null)}
        />
      ) : null}

      <div className="grid gap-5 sm:grid-cols-2">
        {FIELDS.map((field) => {
          const error = errors[field.name];
          const errorId = `${field.name}-error`;
          return (
            <div
              key={field.name}
              className={`flex flex-col gap-1.5 ${field.half ? "" : "sm:col-span-2"}`}
            >
              <label htmlFor={field.name} className="text-small font-medium text-text">
                {field.label}
                {field.required ? (
                  <span className="text-accent-red"> *</span>
                ) : null}
              </label>
              <Input
                id={field.name}
                type={field.type ?? "text"}
                invalid={Boolean(error)}
                aria-describedby={error ? errorId : undefined}
                {...register(field.name)}
              />
              {error ? (
                <p id={errorId} className="text-small text-accent-red">
                  {error.message}
                </p>
              ) : null}
            </div>
          );
        })}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="message" className="text-small font-medium text-text">
          Message
          <span className="text-accent-red"> *</span>
        </label>
        <Textarea
          id="message"
          rows={6}
          invalid={Boolean(errors.message)}
          aria-describedby={errors.message ? "message-error" : undefined}
          {...register("message")}
        />
        {errors.message ? (
          <p id="message-error" className="text-small text-accent-red">
            {errors.message.message}
          </p>
        ) : null}
      </div>

      {/* Honeypot — hidden from humans; a non-empty value marks spam. */}
      <div aria-hidden="true" className="absolute left-[-9999px] top-[-9999px]">
        <label htmlFor="website">Leave this field empty</label>
        <input
          id="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          {...register("website")}
        />
      </div>

      <Button type="submit" size="lg" disabled={isSubmitting} className="self-start">
        {isSubmitting ? "Sending…" : "Send message"}
      </Button>
    </form>
  );
}
