import { InputTextarea } from 'primereact/inputtextarea';

export function edit({
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

export function read({ value }) {
  return <pre>{value}</pre>;
}
