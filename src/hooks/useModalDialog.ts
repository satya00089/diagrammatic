import { useLayoutEffect, useRef } from "react";

/** Open a native modal so the browser manages focus and blocks the background. */
export function useModalDialog(isOpen = true) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    if (!isOpen || !dialog) return;
    dialog.showModal();
    return () => dialog.close();
  }, [isOpen]);

  return dialogRef;
}
