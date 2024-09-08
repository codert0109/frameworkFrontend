// src/components/AttachmentUploader.jsx

import React from 'react';
import { FileUpload } from 'primereact/fileupload';
import { api } from '../../lib/usebackend.js';
import useUserStore from '../../stores/user.js';

/**
 * AttachmentUploader component for handling file uploads
 * @param {Object} props - Component props
 * @param {string} props.db - Database name
 * @param {string} props.table - Table name
 * @param {string} props.recordId - Record ID
 * @param {Function} props.onUploadComplete - Callback function to be called after successful upload
 */
export default function AttachmentUploader({
  db,
  table,
  recordId,
  onUploadComplete,
}) {
  const toast = useUserStore((state) => state.toast);
  const uploadRef = React.useRef(null);

  /**
   * Handles multiple file uploads
   * @param {Object} event - The upload event object
   */
  const uploadHandler = async (event) => {
    try {
      const files = event.files;
      const formData = new FormData();

      files.forEach((file, index) => {
        formData.append(`file${index}`, file);
      });

      formData.append('db', db);
      formData.append('table', table);
      formData.append('row', recordId);

      const response = await api.uploadFiles(
        '/api/core/attachment/upload',
        formData
      );

      if (response.ok) {
        toast({
          severity: 'success',
          summary: 'Success',
          detail: `${files.length} file(s) uploaded successfully`,
          life: 3000,
        });
        if (onUploadComplete) {
          onUploadComplete();
        }
      } else {
        throw new Error('File upload failed');
      }
    } catch (error) {
      console.error('Error uploading files:', error);
      toast({
        severity: 'error',
        summary: 'Error',
        detail: `An error occurred while uploading files: ${error.message}`,
        life: 5000,
      });
    }
    uploadRef.current.clear();
  };

  return (
    <FileUpload
      mode="basic"
      name="files"
      url="/api/core/attachment/upload"
      accept="*/*"
      maxFileSize={10000000000000}
      multiple
      auto
      customUpload
      uploadHandler={uploadHandler}
      chooseOptions={{
        iconOnly: false,
        className: 'custom-choose-btn',
      }}
      chooseLabel="Attach File(s)"
      ref={uploadRef}
    />
  );
}
