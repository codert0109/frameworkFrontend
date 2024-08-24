// api.js
import useUserStore from '../stores/user.js';

class API {
  constructor() {
    this.cache = {};
  }

  async waitForAuthentication() {
    const isAuthenticated = useUserStore.getState().isAuthenticated();
    if (isAuthenticated) return;

    console.log('Not authenticated, waiting for authentication...');
    this.clearCache();

    return new Promise((resolve) => {
      const unsubscribe = useUserStore.subscribe(
        (store) => {
          if (store.authenticated) {
            unsubscribe();
            resolve();
          }
        },
        (state) => state.authenticated
      );
    });
  }

  /**
   * Adds a timeout to a Promise
   * @param {Promise} promise - The Promise to add a timeout to
   * @param {number} timeoutMs - The timeout in milliseconds
   * @returns {Promise} - A Promise that rejects if the timeout is reached
   */
  timeoutPromise(promise, timeoutMs) {
    return Promise.race([
      promise,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timed out')), timeoutMs)
      ),
    ]);
  }

  /**
   * Fetch data from the API
   * @param {string} url - The URL to fetch data from
   * @param {object} body - The body of the request
   * @param {boolean} auth - Whether to wait for authentication
   * @param {boolean} suppressDialog - Whether to suppress error dialogs
   * @param {number} timeoutMs - The timeout in milliseconds
   * @returns {Promise} - A promise that resolves to the fetched data
   * @throws {Error} - Throws an error if the fetch fails or times out
   */
  async fetch(
    url,
    body = {},
    auth = true,
    suppressDialog = false,
    timeoutMs = 30000
  ) {
    while (true) {
      if (auth) {
        await this.waitForAuthentication();
      }

      const token = useUserStore.getState().token;

      try {
        const response = await this.timeoutPromise(
          fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(body),
          }),
          timeoutMs
        );

        if (response.status === 401) {
          console.log('Got 401 for URL: ', url);
          useUserStore.getState().logout();
          this.clearCache();
          console.log(`Received 401, Waiting for re-authentication... `);
          continue;
        }

        if (response.status === 403) {
          throw new Error(
            'Access Denied: You do not have permission to access this resource.'
          );
        }

        if (response.status !== 200) {
          console.log('Failed to fetch URL: ', url);
          const json = await response.json();
          if (json.error) {
            if (!suppressDialog)
              useUserStore.getState().setErrorMessage(json.error);
            throw new Error(json.error);
          }
          throw new Error(`API call failed with status: ${response.status}`);
        }

        const data = await response.json();

        if (data.messages) {
          for (const message of data.messages) {
            useUserStore.getState().toast(message);
          }
        }

        if (this.cache[url]) {
          delete this.cache[url];
        }

        return {
          ok: response.ok,
          data: data.data,
          messages: data.messages,
        };
      } catch (error) {
        if (error.message === 'Request timed out') {
          throw new Error(`API call timed out after ${timeoutMs}ms`);
        }
        throw new Error(`API call failed: ${error.message}`);
      }
    }
  }

  getCached(url, ttl) {
    const cachedItem = this.cache[url];
    if (cachedItem && Date.now() - cachedItem.timestamp < ttl) {
      console.log('Cache Hit!', url, cachedItem.data);
      return JSON.parse(JSON.stringify(cachedItem.data));
    }
    console.log('Cache Miss!', url);
    return null;
  }

  updateCache(url, data) {
    this.cache[url] = {
      data: JSON.parse(JSON.stringify(data)),
      timestamp: Date.now(),
    };
  }

  /**
   * Fetch data from the API with caching
   * @param {string} url - The URL to fetch data from
   * @param {object} options - The options for the request
   * @param {number} ttl - The time-to-live for the cache in milliseconds
   * @param {boolean} auth - Whether to wait for authentication
   * @param {boolean} suppressDialog - Whether to suppress error dialogs
   * @param {number} timeoutMs - The timeout in milliseconds
   * @returns {Promise} - A promise that resolves to the fetched or cached data
   * @throws {Error} - Throws an error if the fetch fails or times out
   */
  async fetchCached(
    url,
    options = {},
    ttl = 1000 * 60 * 60,
    auth = true,
    suppressDialog = false,
    timeoutMs = 30000
  ) {
    const cachedData = this.getCached(url, ttl);
    if (cachedData) return Promise.resolve(cachedData);

    const response = await this.fetch(
      url,
      options,
      auth,
      suppressDialog,
      timeoutMs
    );

    if (response.ok) {
      this.updateCache(url, response);
      return response;
    } else {
      throw new Error(`Fetch failed with status: ${response.status}`);
    }
  }

  clearCache() {
    this.cache = {};
  }
}

export default API;
