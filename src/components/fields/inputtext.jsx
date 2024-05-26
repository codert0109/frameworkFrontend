import { InputText } from 'primereact/inputtext';

export default function InputText2({
  columnId,
  settings,
  dropdownOptions,

  value,
  handleChange,
}) {
  return (
    <InputText
      id={columnId}
      name={columnId}
      placeholder={settings.helpText}
      onChange={(e) => handleChange(columnId, e.target.value)}
      value={value || ''}
      size={settings.fieldWidth}
      key={columnId}
    />
  );
}
