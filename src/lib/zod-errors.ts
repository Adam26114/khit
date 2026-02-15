import { z } from "zod";

export type FormErrors = Record<string, string>;

export function zodToFormErrors(error: z.ZodError): FormErrors {
  const errors: FormErrors = {};

  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key !== "string") continue;
    if (!errors[key]) {
      errors[key] = issue.message;
    }
  }

  return errors;
}
