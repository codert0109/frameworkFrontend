import * as React from 'react';
import DataTable from '../components/datatable.jsx';

import { Routes, Route, useParams } from 'react-router-dom';

import * as Views from '../views/index.js';

//TODO: finish implementing this component

export default function View() {
  const { db, table, view, record } = useParams();

  const ViewComponent = Views[view];

  if (!ViewComponent) {
    return <div>View not found</div>;
  }

  return <ViewComponent db={db} table={table} record={record} />;
}
