import { useState } from 'react';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import CreateRecord from '../record.jsx'; // Adjust the path as per your project structure

export default function AddRecordButton({
  db,
  table,
  onClose,
  closeOnCreate,
  header = 'Create Record',
  where,
}) {
  const [showDialog, setShowDialog] = useState(false);

  const openDialog = () => setShowDialog(true);
  const closeDialog = () => {
    setShowDialog(false);
    if (onClose) {
      onClose();
    }
  };

  return (
    <>
      <Button icon="pi pi-plus" onClick={openDialog} />

      <Dialog
        header={header}
        visible={showDialog}
        style={{ width: '50vw' }}
        onHide={closeDialog}
        draggable={false}
      >
        <CreateRecord
          db={db}
          table={table}
          onClose={() => {
            closeDialog();
          }}
          where={where}
          closeOnCreate={closeOnCreate}
        />
      </Dialog>
    </>
  );
}
