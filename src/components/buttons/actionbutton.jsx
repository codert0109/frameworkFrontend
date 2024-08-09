import { useState } from 'react';
import { Button } from 'primereact/button';
import ActionModal from '../actionmodal.jsx';
import { Tooltip } from 'primereact/tooltip';

export default function ActionButton({
  button,
  db,
  table,
  recordId,
  reload,
  forceReload,
  formData,
  columns,
}) {
  const [showModal, setShowModal] = useState(false);

  const onClick = () => {
    setShowModal(true);
  };

  const onClose = () => {
    setShowModal(false);
  };

  if (button.newLine) {
    return <br />;
  }

  return (
    <>
      <ActionModal
        db={db}
        table={table}
        recordId={recordId}
        show={showModal}
        button={button}
        onClose={onClose}
        reload={reload}
        forceReload={forceReload}
        recordFormData={formData}
        columns={columns}
      />

      <Button
        type="button"
        label={button.label}
        key={button.label}
        disabled={button.disabled ? true : false}
        className="mr-1 mb-1"
        onClick={onClick}
        severity={button.color || 'primary'}
        tooltip={button.disabled || button.helpText}
        tooltipOptions={{ position: 'top', showOnDisabled: true }}
      />
    </>
  );
}
