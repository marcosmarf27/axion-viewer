import { useEffect, useRef } from 'react';

export default function ConfirmDialog({
  open,
  title,
  message,
  onConfirm,
  onCancel,
  variant = 'danger',
}) {
  const dialogRef = useRef(null);

  useEffect(() => {
    if (open) {
      dialogRef.current?.showModal();
    } else {
      dialogRef.current?.close();
    }
  }, [open]);

  const buttonClass =
    variant === 'danger'
      ? 'bg-red-600 text-white hover:bg-red-700'
      : 'bg-indigo-600 text-white hover:bg-indigo-700';

  return (
    <dialog ref={dialogRef} onClose={onCancel} className="rounded-lg p-0 backdrop:bg-black/50">
      <div className="w-80 p-6 sm:w-96">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <p className="mt-2 text-sm text-gray-600">{message}</p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="rounded-md px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className={`rounded-md px-4 py-2 text-sm font-medium ${buttonClass}`}
          >
            Confirmar
          </button>
        </div>
      </div>
    </dialog>
  );
}
