/**
 * Keyboard/ARIA support for the WS modal variants (REST modals are untouched).
 *
 * Applies dialog semantics and closes on Escape while the modal is open.
 */

import { useEffect } from "react";

export interface ModalA11yProps {
    role: "dialog";
    "aria-modal": true;
}

export function useModalA11y(
    open: boolean,
    onClose?: () => void
): ModalA11yProps {
    useEffect(() => {
        if (!open) {
            return;
        }
        const onKeyDown = (event: KeyboardEvent): void => {
            if (event.key === "Escape") {
                onClose?.();
            }
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [open, onClose]);

    return { role: "dialog", "aria-modal": true };
}
