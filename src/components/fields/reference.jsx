import { Dropdown } from 'primereact/dropdown';

export default function Reference({
  columnId,
  settings,
  dropdownOptions,
  value,
  handleChange,
}) {
  let filter = false;
  if (dropdownOptions && dropdownOptions.length > 10) {
    filter = true;
  }

  return (
    <>
      <Dropdown
        value={value}
        onChange={(e) => {
          handleChange(columnId, e.value);
        }}
        optionLabel={settings.friendlyColumnName}
        optionValue="id"
        options={dropdownOptions}
        className="w-full md:w-14rem"
        size={settings.fieldWidth}
        key={columnId}
        filter={filter}
      />
    </>
  );
}
