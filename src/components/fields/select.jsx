import { Dropdown } from 'primereact/dropdown';

export function edit({
  columnId,
  settings,
  dropdownOptions,
  value,
  handleChange,
}) {
  return (
    <Dropdown
      value={value}
      onChange={(e) => {
        handleChange(columnId, e.value);
      }}
      options={settings.options.map((item) => ({
        label: item,
        value: item,
      }))}
      className="w-full md:w-14rem"
      size={settings.fieldWidth}
      key={columnId}
    />
  );
}
