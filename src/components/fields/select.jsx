import { Dropdown } from 'primereact/dropdown';

export default function Select({
  columnId,
  settings,
  dropdownOptions,
  formData,
  handleChange,
}) {
  return (
    <Dropdown
      value={formData[columnId]}
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
