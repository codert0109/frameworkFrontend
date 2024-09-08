import { Button } from 'primereact/button';
import { api } from '../../lib/usebackend';

export function read(...args) {
  return <pre>{args[0].value}</pre>;
}

export function edit({ formData, value, recordId }) {
  return (
    <div className="flex align-items-center">
      <span className="mr-2">{value}</span>

      <Button
        icon="pi pi-download"
        onClick={(e) => {
          e.preventDefault();
          api.downloadFile(`/api/core/attachment/download/${recordId}`, value);
        }}
      />
    </div>
  );
}
