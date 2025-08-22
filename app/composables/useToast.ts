// composables/useToast.ts
type ToastType = "success" | "error" | "info" | "warning";

export interface ToastInput {
  title?: string;
  description?: string;
  type?: ToastType;
  duration?: number; // ms (default 4000)
  action?: { label: string; onClick?: (id: string) => void };
  dismissible?: boolean;
}

export interface Toast extends Required<ToastInput> {
  id: string;
}

export const useToast = () => {
  const toasts = useState<Toast[]>("toasts", () => []);
  // timers por id (solo cliente)
  const timers = useState<
    Record<string, ReturnType<typeof setTimeout> | undefined>
  >("toastTimers", () => ({}));

  const dismiss = (id: string) => {
    const t = timers.value[id];
    if (t) {
      clearTimeout(t);
      delete timers.value[id];
    }
    toasts.value = toasts.value.filter((x) => x.id !== id);
  };

  const add = (input: ToastInput) => {
    const id = Math.random().toString(36).slice(2);
    const toast: Toast = {
      id,
      title: input.title ?? "",
      description: input.description ?? "",
      type: input.type ?? "info",
      duration: input.duration ?? 4000,
      action: input.action ?? { label: "", onClick: undefined },
      dismissible: input.dismissible ?? true,
    };
    toasts.value.push(toast);
    if (process.client) {
      timers.value[id] = setTimeout(() => dismiss(id), toast.duration);
    }
    return id;
  };

  const clear = () => {
    Object.keys(timers.value).forEach((id) => {
      const t = timers.value[id];
      if (t) clearTimeout(t);
      delete timers.value[id];
    });
    toasts.value = [];
  };

  // Pausa el autocierre (hover)
  const pause = (id: string) => {
    const t = timers.value[id];
    if (t) {
      clearTimeout(t);
      delete timers.value[id];
    }
  };

  // Reanuda el autocierre; si no se pasa duration, usa la del toast
  const resume = (id: string, duration?: number) => {
    if (timers.value[id]) return;
    const d =
      duration ?? toasts.value.find((x) => x.id === id)?.duration ?? 4000;
    if (process.client) {
      timers.value[id] = setTimeout(() => dismiss(id), d);
    }
  };

  // helpers
  const success = (
    title: string,
    opts: Omit<ToastInput, "type" | "title"> = {}
  ) => add({ ...opts, title, type: "success" });
  const error = (
    title: string,
    opts: Omit<ToastInput, "type" | "title"> = {}
  ) => add({ ...opts, title, type: "error" });
  const info = (title: string, opts: Omit<ToastInput, "type" | "title"> = {}) =>
    add({ ...opts, title, type: "info" });
  const warning = (
    title: string,
    opts: Omit<ToastInput, "type" | "title"> = {}
  ) => add({ ...opts, title, type: "warning" });

  return {
    toasts,
    add,
    dismiss,
    clear,
    success,
    error,
    info,
    warning,
    pause,
    resume,
  };
};
