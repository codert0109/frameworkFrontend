import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import Root from './routes/root.jsx';
import Table from './routes/table.jsx';
import ViewRecord from './routes/viewrecord.jsx';
import View from './routes/view.jsx';
import Token from './routes/token.jsx';
import Home from './routes/home.jsx';
import CreateRecord from './routes/createrecord.jsx';
import Search from './routes/search.jsx';

import 'primereact/resources/themes/lara-light-indigo/theme.css'; // theme
import 'primeflex/primeflex.css'; // css utility
import 'primeicons/primeicons.css';
import 'primereact/resources/primereact.css'; // core css
import './main.css';

function App() {
  const router = createBrowserRouter([
    {
      path: '/',
      element: <Root />,
      children: [
        {
          path: '/',
          element: <Home />,
        },
        {
          path: '/search',
          element: <Search />,
        },
        {
          path: '/:db/:table',
          element: <Table />,
        },
        {
          path: '/:db/:table/create',
          element: <CreateRecord />,
        },
        {
          path: '/:db/:table/:recordId',
          element: <ViewRecord />,
        },
        {
          path: '/:db/:table/view/:view',
          element: <View />,
        },
        {
          path: '/:db/:table/view/:view/:recordId',
          element: <View />,
        },
      ],
    },
    {
      path: '/token',
      element: <Token />,
    },
  ]);
  //return <>hello</>;

  return <RouterProvider router={router} />;
}

export default App;
