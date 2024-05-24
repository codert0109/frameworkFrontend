import { InputTextarea } from 'primereact/inputtextarea';

export default function TextArea2({
  columnId,
  settings,
  dropdownOptions,

  value,
  handleChange,
}) {
  return (
    <InputTextarea
      id={columnId}
      name={columnId}
      placeholder={settings.helpText}
      onChange={(e) => handleChange(columnId, e.target.value)}
      value={value}
      key={columnId}
      style={{ height: '100px' }}
    />
  );
}
