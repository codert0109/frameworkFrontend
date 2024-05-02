import React, { useState } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';

export default function ConfirmationDialog({
  visible = false,
  onHide = () => {},
  onConfirm = () => {},
  onReject = () => {},
  confirmLabel = 'Yes',
  rejectLabel = 'No',
  title = 'Confirmation',
  message = 'Are you sure you want to proceed?',
}) {
  //const [visible, setVisible] = useState(false);

  const handleConfirm = () => {
    onConfirm();
    onHide();
  };

  const handleReject = () => {
    onReject();
    onHide();
  };

  const renderFooter = () => (
    <div>
      <Button
        label={rejectLabel}
        icon="pi pi-times"
        onClick={handleReject}
        className="p-button-text"
      />
      <Button
        label={confirmLabel}
        icon="pi pi-check"
        onClick={handleConfirm}
        autoFocus
      />
    </div>
  );

  return (
    <div>
      <Dialog
        header={title}
        visible={visible}
        style={{ width: '50vw' }}
        footer={renderFooter()}
        onHide={onHide}
      >
        <p>{message}</p>
      </Dialog>
    </div>
  );
}
