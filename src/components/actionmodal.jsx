import { useEffect, useState } from 'react';
import { Dialog } from 'primereact/dialog';
import Form from './form.jsx';
import API from '../lib/api.js';
import useUserStore from '../stores/user.js';
import { useNavigate } from 'react-router-dom';
import { unFormatDateTime } from './util.js';

const api = new API();

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
      const response = await api.fetch(
        `/api/${db}/${table}/${button.method}/${recordId}`,
        { ...formData, data: recordFormData }
      );
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
