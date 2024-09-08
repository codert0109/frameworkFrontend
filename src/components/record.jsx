import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from 'primereact/button';
import { useBackend, callBackend } from '../lib/usebackend.js';
import useUserStore from '../stores/user.js';
import Form from './form.jsx';
import ActionButton from './buttons/actionbutton.jsx';
import { formatDateTime, unFormatDateTime } from './util.js';
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
  showHeader = false,
}) {
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({});
  const toast = useUserStore((state) => state.toast);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const userId = useUserStore((state) => state.userId);

  const [schema, schemaLoading] = useBackend({
    packageName: db,
    className: table,
    methodName: 'schemaGet',
    cache: true,
  });

  const newRecord = !recordId;

  const [buttons, buttonsLoading] = useBackend({
    packageName: db,
    className: table,
    methodName: 'actionsGet',
    args: {
      id: recordId,
    },
    reload,
    skip: newRecord,
  });

  const [record, recordLoading] = useBackend({
    packageName: db,
    className: table,
    methodName: 'recordGet',
    recordId,
    reload,
    skip: newRecord,
  });

  useEffect(() => {
    if (newRecord) {
      // For new records, initialize with default values from schema
      const initialData = {};
      Object.entries(schema?.data?.schema || {}).forEach(
        ([columnId, settings]) => {
          if (settings.defaultValue !== undefined) {
            initialData[columnId] = settings.defaultValue;
          }
        }
      );
      // Apply any pre-filled values from 'where'
      where.forEach((whereClause) => {
        Object.assign(initialData, whereClause);
      });
      setFormData(initialData);
      setLoading(false);
    } else if (record) {
      setFormData(record.data);
      setLoading(false);
    }
  }, [record, schema]);

  useEffect(() => {
    if (newRecord && where.length > 0 && Object.keys(formData).length === 0) {
      const newFormData = {};
      where.forEach((whereClause) => {
        Object.assign(newFormData, whereClause);
      });
      setFormData(newFormData);
    }
  }, [newRecord, where, formData]);

  const handleChange = (columnId, value) => {
    setFormData((prevFormData) => ({
      ...prevFormData,
      [columnId]: value,
    }));
  };

  const handleSubmit = async (params) => {
    setError(null);
    const postData = { ...formData };
    Object.entries(schema?.data?.schema || {}).forEach(
      ([columnId, settings]) => {
        if (settings.columnType === 'datetime') {
          postData[columnId] = unFormatDateTime(formData[columnId]); // TODO: get rid of this. may not actually be needed
        }
      }
    );

    try {
      const response = await callBackend({
        packageName: db,
        className: table,
        methodName: 'recordCreate',
        args: { data: postData },
        supressDialog: true,
      });

      if (!response.ok) {
        throw new Error('Server response was not ok');
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
      } else if (onClose) {
        onClose();
      }
    } catch (error) {
      console.error('Error creating record:', error);
      toast({
        severity: 'error',
        summary: 'Error',
        detail: `An error occurred: ${error.message}`,
        life: 5000,
      });
    }
  };

  const filteredSchema = useMemo(() => {
    if (!schema?.data?.schema) return {};

    return Object.entries(schema.data.schema).reduce(
      (acc, [columnId, settings]) => {
        if (settings.table !== table) return acc;
        if (settings.primaryKey) return acc;
        if (settings.hidden) return acc;
        if (settings.hiddenRecord) return acc;
        if (settings.hiddenCreate && newRecord) return acc;
        if (settings.hiddenUpdate && !newRecord) return acc;
        if (
          where &&
          where.some((obj) => obj.hasOwnProperty(columnId)) &&
          newRecord
        )
          return acc;
        if (newRecord && !settings.createAllowed) return acc;

        acc[columnId] = settings;
        return acc;
      },
      {}
    );
  }, [schema, table, newRecord, where]);

  if (error) return <p>Error: {error}</p>;
  if (loading || recordLoading || schemaLoading || buttonsLoading) return <></>;

  return (
    <>
      {showHeader ? (
        <h2>{(newRecord ? 'Create ' : 'Update ') + schema?.data?.name}</h2>
      ) : (
        ''
      )}
      <Form
        schema={filteredSchema}
        formData={formData}
        handleChange={handleChange}
        key={`${db}${table}${recordId}`}
        newRecord={newRecord}
        recordId={recordId}
      >
        <div className="field grid" key="submitbutton">
          <div
            className="col-fixed mb-2 md:mb-0 nowrap align-content-end formLabel"
            style={{ width: '200px' }}
          ></div>
          <div className="col">
            {newRecord && (
              <>
                <Button
                  type="submit"
                  label="Create"
                  tooltip="Create the record"
                  tooltipOptions={{ position: 'top' }}
                  className="mr-1 mb-1"
                  onClick={() => handleSubmit({ close: false })}
                />
                <Button
                  type="button"
                  label="Cancel"
                  tooltip="Cancel and go back"
                  tooltipOptions={{ position: 'top' }}
                  severity="secondary"
                  className="mr-1 mb-1"
                  onClick={onClose}
                />
              </>
            )}

            {!newRecord &&
              buttons?.data &&
              Object.entries(buttons.data).map(([key, button]) => (
                <ActionButton
                  button={button}
                  key={key}
                  db={db}
                  table={table}
                  recordId={recordId}
                  forceReload={forceReload}
                  reload={reload}
                  formData={formData}
                  columns={schema.data.schema}
                />
              ))}
            
          </div>
        </div>
      </Form>
    </>
  );
}
