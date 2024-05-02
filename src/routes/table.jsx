import * as React from 'react';
import DataTable from '../components/datatable.jsx';
import { Routes, Route, useParams } from 'react-router-dom';

export default function Root() {
  const { db, table } = useParams();
  const [reload, setReload] = React.useState(0);

  const forceReload = () => {
    setReload(reload + 1);
  };

  return (
    <DataTable
      db={db}
      table={table}
      reload={reload}
      forceReload={forceReload}
    />
  );
}
