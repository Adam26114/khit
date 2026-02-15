import { toast } from "sonner";

function getErrorMessage(error: unknown, fallback = "Something went wrong"): string {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }
  if (typeof error === "string" && error.trim().length > 0) {
    return error;
  }
  return fallback;
}

export const notify = {
  success(message: string) {
    toast.success(message);
  },
  created(item: string) {
    toast.success(`${item} created successfully`);
  },
  updated(item: string) {
    toast.success(`${item} updated successfully`);
  },
  deleted(item: string) {
    toast.success(`${item} deleted successfully`);
  },
  validation(message = "Please fix the highlighted fields and try again.") {
    toast.error(message);
  },
  error(message: string, error?: unknown) {
    toast.error(message, {
      description: error ? getErrorMessage(error) : undefined,
    });
  },
  actionError(action: string, error?: unknown) {
    toast.error(`Failed to ${action}`, {
      description: error ? getErrorMessage(error) : undefined,
    });
  },
};
