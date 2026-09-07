import { toast } from "sonner";

/** Show an error toast and return void, so it can be used as `return warn(...)`. */
export function warn(message: string): void {
  toast.error(message);
}
