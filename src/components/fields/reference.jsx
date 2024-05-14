import { Dropdown } from 'primereact/dropdown';

export default function Reference({
  columnId,
  settings,
  dropdownOptions,
  formData,
  handleChange,
}) {
  return (
    <>
      <Dropdown
        value={formData[columnId]}
        onChange={(e) => {
          handleChange(columnId, e.value);
        }}
        optionLabel={settings.friendlyColumnName}
        optionValue="id"
        options={dropdownOptions[columnId]}
        className="w-full md:w-14rem"
        size={settings.fieldWidth}
        key={columnId}
      />
    </>
  );
}
