import { useEffect, useState } from 'react';

const types = { success: 'bg-primary-500', error: 'bg-red-500', info: 'bg-surface-600' };

export function Toast({ message, type = 'info', onClose, duration = 4000 }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 300);
    }, duration);
    return () => clearTimeout(t);
  }, [duration, onClose]);

  if (!visible) return null;

  return (
    <div
      className={`fixed bottom-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-white ${types[type]} opacity-100 transition-opacity duration-300`}
      role="alert"
    >
      {message}
    </div>
  );
}

let toasts = [];
let setToastsState = null;

export function ToastContainer() {
  const [toastsList, setToastsList] = useState([]);
  setToastsState = setToastsList;

  const remove = (id) => setToastsList((prev) => prev.filter((t) => t.id !== id));

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      <div className="pointer-events-auto flex flex-col gap-2">
        {toastsList.map((t) => (
          <Toast key={t.id} message={t.message} type={t.type} onClose={() => remove(t.id)} />
        ))}
      </div>
    </div>
  );
}

export function showToast(message, type = 'info') {
  const id = Date.now();
  if (setToastsState) setToastsState((prev) => [...prev, { id, message, type }]);
}
