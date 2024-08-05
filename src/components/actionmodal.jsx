import { useEffect, useState } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import Form from './form.jsx';
import useUserStore from '../stores/user.js';
import { useNavigate } from 'react-router-dom';
import { unFormatDateTime } from './util.js';
import { callBackend } from '../lib/usebackend.js';

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
  const [formData, setFormData] = useState({});

  useEffect(() => {
    if (show && !button.inputs && !button.verify) {
      onSubmit();
    } else if (show) {
      setShowDialog(true);
      setFormData({}); // Reset form data when dialog opens
    } else {
      setShowDialog(false);
    }
  }, [show]);

  const closeDialog = async () => {
    setShowDialog(false);
    if (onClose) {
      await onClose();
    }
  };

  const handleChange = (columnId, value) => {
    setFormData((prev) => ({ ...prev, [columnId]: value }));
  };

  const onSubmit = async () => {
    for (const column in columns) {
      if (columns[column].columnType == 'datetime') {
        if (recordFormData[column]) {
          recordFormData[column] = unFormatDateTime(recordFormData[column]);
        }
      }
    }
    if (button.method) {
      try {
        await callBackend({
          packageName: db,
          className: table,
          methodName: button.method,
          recordId,
          args: { ...formData, data: recordFormData },
        });

        if (button.showSuccess) {
          toast({
            severity: 'success',
            summary: 'Success',
            detail: `${button.label} completed successfully`,
            life: 3000,
          });
        }

        await closeDialog();
        await forceReload();

        if (button.close) {
          navigate(-1);
        }
      } catch (error) {
        console.error('Error in button action:', error);
        toast({
          severity: 'error',
          summary: 'Error',
          detail: `An error occurred: ${error.message}`,
          life: 5000,
        });
      }
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
              schema={button.inputs}
              formData={formData}
              handleChange={handleChange}
            >
              <div className="field grid" key="submitbutton">
                <div className="col-12 mb-2 md:col-2 md:mb-0 nowrap align-content-end formLabel"></div>
                <div className="col-12 md:col-10">
                  <Button
                    label={button.label}
                    className="mr-1 mb-1"
                    onClick={onSubmit}
                  />
                  <Button
                    label="Cancel"
                    severity="secondary"
                    className="mr-1 mb-1"
                    onClick={closeDialog}
                  />
                </div>
              </div>
            </Form>
          </>
        )}
      </Dialog>
    </>
  );
}
