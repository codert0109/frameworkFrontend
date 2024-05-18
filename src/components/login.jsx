import React, { useState, useRef, useEffect } from 'react';

import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { Messages } from 'primereact/messages';
import { Divider } from 'primereact/divider';

import useUserStore from '../stores/user.js';
import API from '../lib/api.js';

const api = new API();

export default function LoginModal({ children }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [ssoList, setSSOList] = useState(null);
  const setToken = useUserStore((state) => state.setToken);
  const authenticated = useUserStore((state) => state.authenticated);

  const msgs = useRef(null);

  useEffect(() => {
    const fetchSSOList = async () => {
      if (!authenticated) {
        console.log('SSO Start');
        const response = await api.fetchCached(
          '/api/core/saml/list',
          {},
          500 * 1000,
          false
        );
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
      const response = await api.fetch(
        '/api/core/login/getToken',
        { email, password },
        false,
        true
      );

      const data = response.data;

      if (data && data.token) {
        setToken(data.token);

        console.log('Login successful!');
      } else {
        msgs.current.getElement().hidden = false;
        msgs.current.replace({
          id: '1',
          sticky: true,
          severity: 'error',
          summary: 'Error',
          detail: 'Authentication Failed',
          closable: true,
        });
        console.log('No token received');
      }
    } catch (error) {
      msgs.current.getElement().hidden = false;
      msgs.current.replace({
        id: '1',
        sticky: true,
        severity: 'error',
        summary: 'Error',
        detail: 'Authentication Error',
        closable: true,
      });
      //console.error('There was an error logging in', error);
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
