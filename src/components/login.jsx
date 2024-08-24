import React, { useState, useRef, useEffect } from 'react';

import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { Messages } from 'primereact/messages';
import { Divider } from 'primereact/divider';
import { callBackend, clearCache } from '../lib/usebackend.js';

import useUserStore from '../stores/user.js';

export default function LoginModal({ children }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [ssoList, setSSOList] = useState(null);

  const toast = useUserStore((state) => state.toast);

  const setToken = useUserStore((state) => state.setToken);
  const authenticated = useUserStore((state) => state.authenticated);

  const msgs = useRef(null);

  useEffect(() => {
    const fetchSSOList = async () => {
      if (!authenticated) {
        console.log('SSO Start');
        const response = await callBackend({
          packageName: 'core',
          className: 'saml',
          methodName: 'list',
          cache: true,
          auth: false,
        });
        console.log('SSO List:', response.data);
        if (response.data.length > 0) {
          setSSOList(response.data);
        }
      }
    };
    fetchSSOList();
  }, [authenticated]);

  const onLogin = async (e) => {
    e.preventDefault();

    msgs.current.clear(); // Clear any previous errors
    msgs.current.getElement().hidden = true;

    console.log('Email:', email, 'Password:', password);

    try {
      const response = await callBackend({
        packageName: 'core',
        className: 'login',
        methodName: 'getToken',
        args: { email, password },
        auth: false,
        supressDialog: true,
      });

      const data = response.data;

      if (data && data.token) {
        setToken(data.token);

        toast({
          severity: 'success',
          summary: 'Success',
          detail: `Login successful`,
          life: 3000,
        });

        clearCache();
        console.log('Login successful!');
      } else {
        toast({
          severity: 'error',
          summary: 'Failed',
          detail: `Login failed`,
          life: 3000,
        });

        console.log('No token received');
      }
    } catch (error) {
      toast({
        severity: 'error',
        summary: 'Failed',
        detail: `Login failed`,
        life: 3000,
      });
    }
  };

  return (
    <>
      <>
        <div>
          <Dialog
            header="Login"
            visible={!authenticated}
            style={{ width: '45vw' }}
            closable={false}
            modal
          >
            <div className="card flex justify-content-center">
              <form>
                <div className="p-fluid p-5">
                  <div className="field grid">
                    <label
                      htmlFor="email"
                      className="col-12 mb-2 md:col-3 md:mb-0 formLabel"
                    >
                      Email Address
                    </label>
                    <div className="col-12 md:col-9">
                      <InputText
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="field grid">
                    <label
                      htmlFor="password"
                      className="col-12 mb-2 md:col-3 md:mb-0 formLabel"
                    >
                      Password
                    </label>
                    <div className="col-12 md:col-9">
                      <InputText
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="justify-content-center flex">
                    <Button
                      label="Login"
                      icon="pi pi-check"
                      onClick={onLogin}
                      autoFocus
                      style={{ width: '7vw' }}
                    />
                  </div>
                </div>
              </form>

              {ssoList && (
                <>
                  <Divider layout="vertical" />
                  <div>
                    <div className="text-center">Or login with:</div> <br />{' '}
                    <br />
                    {ssoList.map((sso) => (
                      <>
                        <Button
                          label={sso.name}
                          //icon="pi pi-check"
                          onClick={() => {
                            window.location.href = sso.link;
                          }}
                          autoFocus
                          style={{ width: '10vw' }}
                        />
                        <br />
                        <br />
                      </>
                    ))}
                  </div>
                </>
              )}
            </div>
            <Messages ref={msgs} />
          </Dialog>
        </div>
      </>
      <>{children}</>
    </>
  );
}
