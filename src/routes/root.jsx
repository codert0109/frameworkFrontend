import { useRef, useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';

import { Menubar } from 'primereact/menubar';
import { Menu } from 'primereact/menu';
import { Button } from 'primereact/button';
import { Avatar } from 'primereact/avatar';
import { Toast } from 'primereact/toast';

import { useBackend } from '../lib/usebackend.js';

import { Dialog } from 'primereact/dialog';

import Login from '../components/login.jsx';

import useUserStore from '../stores/user.js';

export default function Root() {
  const navigate = useNavigate();
  const userMenu = useRef(null);
  //const [newItems, setNewItems] = useState([]);
  const logout = useUserStore((state) => state.logout);
  const userId = useUserStore((state) => state.userId);
  const setToast = useUserStore((state) => state.setToast);
  const authenticated = useUserStore((state) => state.authenticated);
  const toast = useRef(null);
  const errorMessage = useUserStore((state) => state.errorMessage);
  const clearErrorMessage = useUserStore((state) => state.clearErrorMessage);

  const [newItems] = useBackend({
    packageName: 'core',
    className: 'menu',
    methodName: 'getAllMenuItems',
    filter: (data) => buildMenu(data.data, navigate),
    clear: !authenticated,
    args: { authenticated }, // getAllMenuItems doesn't take any arguments. But this forces a data refresh when the user logs in or out.
  });

  const sendToast = (toastObject) => {
    toast.current.show(toastObject);
  };

  useEffect(() => {
    setToast(sendToast); // This works. Possibly a bad idea.
  }, []);

  const errorFooter = () => {
    return (
      <div>
        <Button
          label="Ok"
          onClick={clearErrorMessage}
          autoFocus
          severity="danger"
        />
      </div>
    );
  };

  const userItems = [
    {
      label: 'Profile',
      icon: 'pi pi-fw pi-user',
      command: () => {
        navigate(`/core/user/${userId}`);
      },
    },
    {
      label: 'Logout',
      icon: 'pi pi-fw pi-sign-out',
      command: () => {
        logout();
        navigate('/');
      },
    },
  ];

  const end = (
    <>
      <Menu popup model={userItems} ref={userMenu} show={false} />
      <Avatar
        icon="pi pi-user"
        size="medium"
        severity="secondary"
        aria-label="User"
        onClick={(event) => userMenu.current.toggle(event)}
      />
    </>
  );

  return (
    <>
      <Dialog
        header="Error"
        visible={errorMessage}
        onHide={clearErrorMessage}
        footer={errorFooter}
        modal
      >
        The server has reported an error.
        <br />
        <br />
        {errorMessage}
      </Dialog>
      <Toast ref={toast} />
      <Menubar model={newItems} className="mb-1" end={end} />
      <Login>
        <Outlet />
      </Login>
    </>
  );
}

function buildMenu(items, navigate) {
  let output = [];

  for (const item of Object.keys(items).sort(
    (a, b) => items[a].order - items[b].order
  )) {
    let itemoutput = {};

    // If it has children, process them first
    if (items[item].children && Object.keys(items[item].children).length > 0) {
      itemoutput.items = buildMenu(items[item].children, navigate);
    }

    itemoutput.label = items[item].label;

    if (items[item].view) {
      itemoutput.command = () => {
        navigate(items[item].navigate, {
          state: {
            view: items[item].view,
            filter: items[item].filter,
            tableHeader: items[item].label,
          },
        });
      };
    }

    if (items[item].icon) {
      itemoutput.icon = `pi pi-fw ${items[item].icon}`;
    }

    output.push(itemoutput);
  }
  return output;
}
