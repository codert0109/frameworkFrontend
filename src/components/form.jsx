import React, { useState } from 'react';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { Tooltip } from 'primereact/tooltip';

import { Password } from 'primereact/password';
import './record.css';

export default function Form({
  fields = {}, // Required
  where = [],
  table = null,
  recordId = null,
  defaults = {},
  onSubmit = null,
  onCancel = null,
  confirmLabel = 'Update',
}) {
  const [formData, setFormData] = useState({});
  const newRecord = !recordId;

  const handleSubmit = async () => {
    if (onSubmit) {
      onSubmit(formData);
    }
  };

  const handleChange = (columnId, value) => {
    setFormData({ ...formData, [columnId]: value });
  };

  const renderInputField = (columnId, settings) => {
    if (settings.join) {
      // The field is a reference to another table
      return (
        <Dropdown
          value={defaults[columnId]}
          onChange={(e) => {
            handleChange(columnId, e.value);
          }}
          optionLabel={settings.friendlyColumnName}
          optionValue="id"
          options={dropdownOptions[columnId]}
          className="w-full md:w-14rem"
          size={settings.fieldWidth}
        />
      );
    }
    switch (settings.fieldType) {
      case 'select':
        return (
          <Dropdown
            value={defaults[columnId]}
            onChange={(e) => {
              handleChange(columnId, e.value);
            }}
            options={settings.options}
            className="w-full md:w-14rem"
            size={settings.fieldWidth}
          />
        );
      case 'textArea':
      case 'html':
        return (
          <InputTextarea
            id={columnId}
            name={columnId}
            placeholder={settings.helpText}
            onChange={(e) => handleChange(columnId, e.target.value)}
            value={defaults[columnId]}
            style={{
              width: settings.fieldWidth * 10,
            }}
            autoResize
          />
        );
      /*case 'html':
            return (
              <Interweave content={formData[columnId]} />
            );
        */
      case 'password':
        return (
          <Password
            value={defaults[columnId]}
            onChange={(e) => handleChange(columnId, e.target.value)}
            toggleMask
          />
        );
      default:
        // 'text' or other types
        return (
          <InputText
            id={columnId}
            name={columnId}
            placeholder={settings.helpText}
            onChange={(e) => handleChange(columnId, e.target.value)}
            value={defaults[columnId]}
            size={settings.fieldWidth}
          />
        );
    }
  };

  return (
    <>
      <Tooltip target=".reference" />
      <form onSubmit={(e) => e.preventDefault()}>
        {Object.entries(fields).map(([columnId, settings]) => {
          if (table && settings.table != table) return;
          if (settings.primaryKey) return;
          if (settings.hidden) return;
          if (settings.hiddenRecord) return;
          if (settings.hiddenCreate && newRecord) return;
          if (settings.hiddenUpdate && !newRecord) return;
          if (
            where &&
            where.some((obj) => obj.hasOwnProperty(columnId)) &&
            newRecord
          )
            return; // Dont show the column that contains a forgien key that was supplied for new records

          return (
            <div className="field grid" key={columnId}>
              <label
                htmlFor={columnId}
                className="col-12 mb-2 md:col-2 md:mb-0 nowrap align-content-end formLabel"
              >
                {settings.friendlyName || columnId}
              </label>
              <div className="col-12 md:col-10">
                {renderInputField(columnId, settings)}
                {settings.join && (
                  <i
                    className="ml-3 pi pi-external-link reference"
                    style={{ color: 'var(--primary-color)' }}
                    onClick={() => {
                      navigate(`/${db}/${settings.join}/${defaults[columnId]}`);
                    }}
                    data-pr-tooltip="View the related record"
                  ></i>
                )}
              </div>
            </div>
          );
        })}
        <div className="field grid" key="submitbutton">
          <div className="col-12 mb-2 md:col-2 md:mb-0 nowrap align-content-end formLabel"></div>
          <div className="col-12 md:col-10">
            <Button
              type="submit"
              label={confirmLabel}
              className="mr-1 mb-1"
              onClick={() => {
                handleSubmit({ close: false });
              }}
            />
            <Button
              label="Cancel"
              severity="secondary"
              className="mr-1 mb-1"
              onClick={() => {
                if (onCancel) onCancel();
              }}
            />
          </div>
        </div>
      </form>
    </>
  );
}
