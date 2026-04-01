import { sileo } from "sileo";

export const showSuccess = (message: string) => {
  sileo.success(message);
};

export const showError = (message: string) => {
  sileo.error(message);
};

export const showLoading = (message: string) => {
  return sileo.info(message);
};

export const showPromise = <T,>(
  promise: Promise<T>,
  msgs: { loading: string; success: string; error: string }
) => {
  return sileo.promise(promise, msgs);
};

export const dismissToast = (toastId?: string) => {
  // Sileo might not have a direct dismiss export that we can use here easily
  // but if it's based on sonner/react-hot-toast, it might.
};

export { sileo as toast };