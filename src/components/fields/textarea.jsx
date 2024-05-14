import { InputTextarea } from 'primereact/inputtextarea';

export default function TextArea2({
  columnId,
  settings,
  dropdownOptions,
  formData,
  handleChange,
}) {
  return (
    <InputTextarea
      id={columnId}
      name={columnId}
      placeholder={settings.helpText}
      onChange={(e) => handleChange(columnId, e.target.value)}
      value={formData[columnId]}
      key={columnId}
      style={{ height: '100px' }}
    />
  );
}
