import React from 'react';
import { Tooltip } from 'primereact/tooltip';
import Fields from './fields/index.jsx';

/**
 * Form Component
 *
 * @param {Object} props
 * @param {Object} props.schema - The schema object containing only the field definitions to be rendered
 * @param {Object} props.formData - The current form data
 * @param {Function} props.handleChange - Function to handle field value changes
 * @param {React.ReactNode} props.children - Additional content to be rendered inside the form (e.g., buttons)
 *
 * @example
 * <Form
 *   schema={{
 *     field1: { friendlyName: 'Field 1', fieldType: 'string' },
 *     field2: { friendlyName: 'Field 2', fieldType: 'number' }
 *   }}
 *   formData={{ field1: 'value1', field2: 42 }}
 *   handleChange={(fieldName, newValue) => {}}
 * >
 *   <button type="submit">Submit</button>
 * </Form>
 */
export default function Form({
  schema,
  formData,
  handleChange,
  children,
  newRecord,
}) {
  const renderInputField = (columnId, settings) => {
    let Field = Fields.string.edit;

    let value = formData[columnId];
    let valueFriendly = value;

    if (settings.join) {
      valueFriendly =
        formData[columnId + '_' + settings.friendlyColumnName] || value;
    }

    if (settings.readOnly && !(newRecord && settings.createAllowed)) {
      if (Fields[settings.fieldType]?.read) {
        Field = Fields[settings.fieldType].read;
      } else {
        Field = Fields.string.read;
      }
    } else if (settings.join) {
      Field = Fields.reference.edit;
    } else if (Fields[settings.fieldType]?.edit) {
      Field = Fields[settings.fieldType].edit;
    }

    return (
      <Field
        columnId={columnId}
        settings={settings}
        value={value}
        valueFriendly={valueFriendly}
        handleChange={handleChange}
      />
    );
  };

  return (
    <>
      <Tooltip target=".tooltip" />
      <form onSubmit={(e) => e.preventDefault()}>
        {Object.entries(schema || {}).map(([columnId, settings]) => (
          <div className="field grid" key={columnId}>
            <label
              htmlFor={columnId}
              className="col-fixed mb-2 md:mb-0 nowrap align-content-end formLabel"
              style={{ width: '200px' }}
            >
              <div
                data-pr-tooltip={
                  (settings.helpText ? settings.helpText : '') +
                  (settings.required ? ' This field is required.' : '')
                }
                data-pr-position="top"
                className="tooltip"
              >
                {settings.friendlyName || columnId}
                {settings.required && <span className="text-danger"> *</span>}
              </div>
            </label>
            <div className="col">{renderInputField(columnId, settings)}</div>
          </div>
        ))}
        {children}
      </form>
    </>
  );
}
