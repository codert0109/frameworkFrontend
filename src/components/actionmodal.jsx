import { useEffect, useState } from 'react';
import { Dialog } from 'primereact/dialog';
import Form from './form.jsx';
import useUserStore from '../stores/user.js';
import { useNavigate } from 'react-router-dom';
import { unFormatDateTime } from './util.js';
import { callBackend } from '../lib/usebackend.js';
import { method } from 'lodash';

export default function ActionModal({
  show,
  onClose,
  button,
  db,
  table,
  recordId,
  reload,
  forceReload,
  recordFormData,
  columns,
  ...props
}) {
  const toast = useUserStore((state) => state.toast);
  const [showDialog, setShowDialog] = useState(false);
  const navigate = useNavigate();

  // Sometimes the button fires but the button doesn't have a dialog. So in that case we dont really need to show the dialog, but we just execute the action.
  useEffect(() => {
    if (show && !button.inputs && !button.verify) {
      onSubmit();
    } else if (show) {
      setShowDialog(true);
    } else {
      setShowDialog(false);
    }
  }, [show]);

  const closeDialog = async () => {
    if (onClose) {
      await onClose();
    }
  };

  const onSubmit = async (formData) => {
    for (const column in columns) {
      if (columns[column].columnType == 'datetime') {
        // Convert the date to a timestamp
        if (recordFormData[column]) {
          recordFormData[column] = unFormatDateTime(recordFormData[column]);
        }
      }
    }
    if (button.method) {
      callBackend({
        packageName: db,
        className: table,
        methodName: button.method,
        recordId,
        args: { ...formData, data: recordFormData },
      });
    }

    await closeDialog();
    await forceReload();

    if (button.showSuccess) {
      toast({
        severity: 'success',
        summary: 'Success',
        detail: `${button.label} completed successfully`,
        life: 3000,
      });
    }

    if (button.close) {
      navigate(-1);
    }
  };

  return (
    <>
      <Dialog
        header={button.label}
        visible={showDialog}
        onHide={closeDialog}
        size="large"
        style={{ width: '800px' }}
      >
        {button.verify && (
          <>
            {button.verify}
            <br />
            <br />
          </>
        )}
        {(button.verify || button.inputs) && (
          <>
            <Form
              fields={button.inputs}
              onSubmit={onSubmit}
              onCancel={closeDialog}
              confirmLabel={button.label}
            />
          </>
        )}
      </Dialog>
    </>
  );
}
