import { useState, useEffect, useMemo } from 'react';
import DataTable from '../components/datatable.jsx';
import { Routes, Route, useParams } from 'react-router-dom';
import { Tree } from 'primereact/tree';
import API from '../lib/api.js';
import { Card } from 'primereact/card';
import { Badge } from 'primereact/badge';

const api = new API();

export default function Root() {
  const { db, table } = useParams();
  const [nodes, setNodes] = useState([]);
  const [where, setWhere] = useState({});
  const [selectedNodes, setSelectedNodes] = useState([]);

  useEffect(async () => {
    const response = await api.fetch(`/api/db/${db}/${table}/counts`, {});
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    const config = {
      assignedTo: {
        label: 'Assigned To',
        nullLabel: 'Unassigned',
      },
      group: {
        label: 'Group',
        nullLabel: 'Unassigned',
      },
      status: {
        label: 'Status',
        nullLabel: 'Unknown',
      },
    };

    let parents = [];
    for (const key of Object.keys(response.data)) {
      let children = [];
      for (const row of response.data[key]) {
        children.push({
          key: config[key].label + '-' + row.name,
          label: row.name || config[key].nullLabel,
          data: row,
          onClick: (e) => {
            setWhere({ [key]: row.id });
          },
          count: row.tickets,
          expanded: true,
        });
      }

      parents.push({
        key,
        label: config[key].label,
        children: children,
        expanded: true,
      });
    }

    setNodes(parents);
  }, []);

  const nodeTemplate = (node) => {
    return (
      <>
        {node.label}
        {node.count && <Badge value={node.count} className="ml-2" />}
      </>
    );
  };
  console.log('rendering ticket.jsx');
  return (
    <>
      <div className="grid">
        <div className="col-3">
          <Tree
            value={nodes}
            nodeTemplate={nodeTemplate}
            collapseIcon
            onNodeClick={(e) => {
              if (e.node.onClick) {
                e.node.onClick(e);
              }
            }}
            selectionMode="single"
            selectionKeys={selectedNodes}
            onSelectionChange={(e) => {
              setSelectedNodes(e.value);
            }}
          />
        </div>
        <div className="col-9">
          <DataTable db={db} table={table} where={where} />
        </div>
      </div>
    </>
  );
}
