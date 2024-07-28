import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { Button } from 'primereact/button';

import { Tooltip } from 'primereact/tooltip';
import Fields from './fields/index.jsx';

import ActionButton from './buttons/actionbutton.jsx';

import { formatDateTime, unFormatDateTime } from './util.js';

import { useBackend, callBackend } from '../lib/usebackend.js';

import useUserStore from '../stores/user.js';

import './record.css';

export default function Record({
  db,
  table,
  recordId,
  onClose,
  closeOnCreate = false,
  where = [],
  reload,
  forceReload,
}) {
  const [error, setError] = useState(null);
  const [dropdownOptions, setDropdownOptions] = useState({});
  const [formData, setFormData] = useState({});
  const toast = useUserStore((state) => state.toast);

  const navigate = useNavigate();

  const [schema] = useBackend({
    packageName: db,
    className: table,
    methodName: 'schemaGet',
    cache: true,
  });

  const [buttons] = useBackend({
    packageName: db,
    className: table,
    methodName: 'actionsGet',
  });

  let record = null;
  let loading = false;
  let errormsg = null;
  let newRecord = true;
  if (recordId) {
    // this is ok because this component will never be rendered as a new record and then again as an existing component
    [record, loading, errormsg] = useBackend({
      packageName: db,
      className: table,
      methodName: 'recordGet',
      recordId,
      args: {},
      reload,
    });
    newRecord = false;
  }

  // Load in where clauses. This is for creating related records. It prepoulates the form with the related fields.
  if (newRecord && where.length > 0 && Object.keys(formData).length == 0) {
    for (const whereClause of where) {
      setFormData((formData) => ({
        ...formData,
        ...whereClause,
      }));
    }
  }

  useEffect(() => {
    if (record) {
      const newRecord = record.data;

      // Convert datetime fields to a human readable format
      Object.entries(schema?.data?.schema || {}).forEach(
        ([columnId, settings]) => {
          if (settings.columnType === 'datetime') {
            newRecord[columnId] = formatDateTime(newRecord[columnId]);
          }
        }
      );

      setFormData(newRecord);
    }
  }, [record]);

  // Fetch the dropdown options for each dropdown field
  useEffect(() => {
    const fetchDropdownOptions = async () => {
      if (newRecord && schema?.data?.schema?.id) {
        const temp = {};
        for (const [columnId, settings] of Object.entries(schema.data.schema)) {
          if (settings.defaultValue && (!newRecord || settings.createAllowed)) {
            temp[columnId] = settings.defaultValue;
          }
        }

        setFormData((formData) => ({ ...formData, ...temp }));
        console.log('new record sent!', temp);
        return;
      }
    };

    if (schema?.data?.schema) {
      fetchDropdownOptions();
    }
  }, [schema]);

  const handleChange = (columnId, value) => {
    setFormData({
      ...formData,
      [columnId]: value,
    });
  };

  // Create a record
  const handleSubmit = async (params) => {
    setError(null);

    const postData = { ...formData };

    Object.entries(schema?.data?.schema).forEach(([columnId, settings]) => {
      if (settings.columnType === 'datetime') {
        postData[columnId] = unFormatDateTime(formData[columnId]);
      }
    });

    try {
      const response = await callBackend({
        packageName: db,
        className: table,
        methodName: 'recordCreate',
        args: {
          data: postData,
        },
      });

      if (!response.ok) {
        throw new Error('Server response was not ok', response);
      }

      if (onClose) {
        onClose(response.data.id);
      }

      toast({
        severity: 'success',
        summary: 'Success',
        detail: `Record created successfully. ID: ${response.data.id}`,
        life: 3000,
      });

      if (!closeOnCreate) {
        navigate(`/${db}/${table}/${response.data.id}`);
      } else {
        if (onClose) {
          onClose();
        }
      }
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      // nothing
    }
  };

  if (error) return <p>Error: {error}</p>;

  const renderInputField = (columnId, settings) => {
    let Field = Fields.string.edit;

    let value = formData[columnId];
    let valueFriendly = value;

    if (settings.join) {
      valueFriendly =
        formData[columnId + '_' + settings.friendlyColumnName] || value;
    }

    if (settings.readOnly && !newRecord) {
      if (Fields[settings.fieldType]?.read) {
        Field = Fields[settings.fieldType].read;
      } else {
        Field = Fields.string.read;
      }
    } else if (settings.join) {
      // TODO the fields should have a fieldType of reference already.
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

  if (!formData) return <p>Loading...</p>;

  return (
    <>
      <h2>{(newRecord ? 'Create ' : 'Update ') + schema?.data?.name}</h2>
      <Tooltip target=".tooltip" />
      <form onSubmit={(e) => e.preventDefault()}>
        {Object.entries(schema?.data?.schema || {}).map(
          ([columnId, settings]) => {
            if (settings.table != table) return;
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

            if (newRecord && !settings.createAllowed) return; // Don't show readonly fields on new records

            return (
              <div className="field grid" key={columnId}>
                <label
                  htmlFor={columnId}
                  className="col-12 mb-2 md:col-2 md:mb-0 nowrap align-content-end formLabel"
                >
                  <div
                    data-pr-tooltip={settings.helpText}
                    data-pr-position="top"
                    className="tooltip"
                  >
                    {settings.friendlyName || columnId}
                  </div>
                </label>
                <div className="col-12 md:col-10">
                  {renderInputField(columnId, settings)}
                </div>
              </div>
            );
          }
        )}
        <div className="field grid" key="submitbutton">
          <div className="col-12 mb-2 md:col-2 md:mb-0 nowrap align-content-end formLabel"></div>
          <div className="col-12 md:col-10">
            {newRecord && (
              <>
                <Button
                  type="submit"
                  label="Create"
                  tooltip="Create the record"
                  tooltipOptions={{ position: 'top' }}
                  className="mr-1 mb-1"
                  onClick={() => {
                    handleSubmit({ close: false });
                  }}
                />
                <Button
                  type="button"
                  label="Cancel"
                  tooltip="Cancel and go back"
                  tooltipOptions={{ position: 'top' }}
                  severity="secondary"
                  className="mr-1 mb-1"
                  onClick={() => {
                    if (onClose) {
                      onClose();
                    }
                  }}
                />
              </>
            )}
            {!newRecord &&
              buttons &&
              buttons.data.map((button) => {
                return (
                  <ActionButton
                    button={button}
                    key={button.id}
                    db={db}
                    table={table}
                    recordId={recordId}
                    forceReload={forceReload}
                    reload={reload}
                    formData={formData}
                    columns={schema.data.schema}
                  />
                );
              })}
          </div>
        </div>
      </form>
    </>
  );
}
