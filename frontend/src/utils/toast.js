let toastHandler = null;

export function setToastHandler(handler) {
  toastHandler = handler;
}

export function toast(message, type = 'info') {
  if (toastHandler) toastHandler({ message, type });
  else console.log(`[${type}]`, message);
}
