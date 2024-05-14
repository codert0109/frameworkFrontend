import { InputText } from 'primereact/inputtext';

export default function InputText2({
  columnId,
  settings,
  dropdownOptions,
  formData,
  handleChange,
}) {
  return (
    <InputText
      id={columnId}
      name={columnId}
      placeholder={settings.helpText}
      onChange={(e) => handleChange(columnId, e.target.value)}
      value={formData[columnId]}
      size={settings.fieldWidth}
      key={columnId}
    />
  );
}
