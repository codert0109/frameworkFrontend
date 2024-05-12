import React, { useState, useEffect, useRef } from 'react';
import API from '../lib/api.js';

import { TabView, TabPanel } from 'primereact/tabview';

import DataTable from './datatable.jsx';

const api = new API();

export default function Related({ db, table, recordId, reload, forceReload }) {
  const [tables, setTables] = useState([]);
  const tabview = useRef(null);
  console.log('Related', db, table, recordId, tables);

  useEffect(() => {
    const fetchChildren = async () => {
      try {
        const response = await api.fetchCached(
          `/api/db/${db}/${table}/getChildren`
        );
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }

        const tablesTemp = [...response.data]; // copy the cached response since we're going to modify it.

        for (const childTable of tablesTemp) {
          for (const [columna, columnb] of Object.entries(
            childTable.columnmap
          )) {
            if (!childTable.where) {
              childTable.where = [];
            }
            let right = '';
            switch (columnb) {
              case 'id':
                right = recordId;
                break;
              case 'db':
                right = db;
                break;
              case 'table':
                right = table;
                break;
              default:
                right = recordId;
                break;
            }

            childTable.where.push({ [columna]: right });
          }
        }

        setTables(tablesTemp);
      } catch (err) {
        // nothing
      } finally {
        // nothing
      }
    };

    fetchChildren();
  }, [db, table, recordId, reload]);

  const tabs = '';

  return (
    <>
      <TabView scrollable key={table + 'related'} ref={tabview}>
        {tables.length > 0 &&
          tables.map((childTable) => {
            return (
              <TabPanel
                header={childTable.tabName}
                key={
                  table +
                  childTable.tabName +
                  Object.keys(childTable.columnmap)[0]
                } // use the first column we join on as the key
              >
                <DataTable
                  db={childTable.db}
                  table={childTable.table}
                  where={childTable.where}
                  closeOnCreate={true}
                  reload={reload}
                  forceReload={forceReload}
                  key={table + childTable.tabName + childTable.table}
                />
              </TabPanel>
            );
          })}
      </TabView>
    </>
  );
}
