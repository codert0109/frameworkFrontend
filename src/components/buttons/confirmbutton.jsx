import React, { useState } from 'react';
import { Button } from 'primereact/button';
import ConfirmationDialog from '../confirm.jsx'; // Assuming ConfirmationDialog is in the same directory

export default function ConfirmButton({
  label = 'Click me',
  icon = null,
  onConfirm = () => {},
  ...props
}) {
  const [dialogVisible, setDialogVisible] = useState(false);

  const showDialog = (e) => {
    e.preventDefault();
    setDialogVisible(true);
  };
  const hideDialog = () => setDialogVisible(false);

  const handleConfirm = () => {
    onConfirm(); // Perform the confirm action
    hideDialog(); // Close the dialog
  };

  return (
    <React.Fragment>
      <Button
        label={label}
        icon={icon}
        className="mr-1"
        onClick={showDialog}
        {...props}
      />
      <ConfirmationDialog
        visible={dialogVisible}
        onHide={hideDialog}
        onConfirm={handleConfirm}
        {...props}
      />
    </React.Fragment>
  );
}
