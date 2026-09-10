import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { X } from 'lucide-react';

export default function WorkspaceDialog({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
    const ref = useRef<HTMLDialogElement>(null);
    useEffect(() => {
        const dialog = ref.current;
        dialog?.showModal();
        return () => dialog?.close();
    }, []);
    return <dialog ref={ref} className="workspace-dialog" onCancel={onClose} onClick={event => { if (event.target === event.currentTarget) onClose(); }} aria-labelledby="workspace-dialog-title">
        <div className="dialog-heading"><h2 id="workspace-dialog-title">{title}</h2><button className="icon-button" onClick={onClose} aria-label="Close"><X size={20} /></button></div>
        {children}
    </dialog>;
}
