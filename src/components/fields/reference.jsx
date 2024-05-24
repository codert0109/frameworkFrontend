import { Dropdown } from 'primereact/dropdown';

export default function Reference({
  columnId,
  settings,
  dropdownOptions,

  value,
  handleChange,
}) {
  return (
    <>
      <Dropdown
        value={value}
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
