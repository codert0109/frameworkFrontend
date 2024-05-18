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

  // JSDOC
  /**
   * Fetch data from the API
   * @param {string} url - The URL to fetch data from
   * @param {object} body - The body of the request
   * @param {boolean} auth - Whether to wait for authentication
   * @param {boolean} supressDialog - Whether to supress error dialogs
   * @returns {Promise} - A promise that resolves to the fetched data
   * @throws {Error} - Throws an error if the fetch fails
   *
   *
   *  **/
  async fetch(url, body = {}, auth = true, supressDialog = false) {
    console.log('Trying URL: ', url);
    while (true) {
      if (auth) {
        await this.waitForAuthentication();
      }

      const token = useUserStore.getState().token;

      let response = null;
      try {
        response = await fetch(
          url,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(body),
          },
          token
        );
      } catch (error) {
        throw new Error('API call failed with fetch error.');
      }

      // not logged in
      if (response.status == 401) {
        console.log('Got 401 for URL: ', url);

        useUserStore.getState().logout(); // clear out everything after recieving 401
        this.clearCache();

        console.log(`Recieved 401, Waiting for re-authentication... `);
        continue;
      }

      if (response.status == 403) {
        throw new Error(
          'Access Denied: You do not have permission to access this resource.'
        );
      }

      // failed
      if (response.status !== 200) {
        console.log('Failed to fetch URL: ', url);

        const json = await response.json();
        if (json.error) {
          if (!supressDialog)
            useUserStore.getState().setErrorMessage(json.error);
          throw new Error(json.error);
        }

        throw new Error(`API call failed with unknown error.`);
      }

      // Success!
      console.log('Success! URL: ', url);
      const data = await response.json();

      if (data.messages) {
        for (const message of data.messages) {
          useUserStore.getState().toast(message); //
        }
      }

      return {
        ok: response.ok,
        data: data.data,
        messages: data.messages,
      };
    }
  }

  // Add a method to check and return cached data if available
  getCached(url, ttl) {
    const cachedItem = this.cache[url];
    if (cachedItem && Date.now() - cachedItem.timestamp < ttl) {
      // Check if TTL is not exceeded
      console.log('Cache Hit!', url, cachedItem.data);
      //return cachedItem.data;
      // Return a deep copy of the cached data to prevent modification
      return JSON.parse(JSON.stringify(cachedItem.data));
    }
    console.log('Cache Miss!', url);
    return null; // If no cache available or cache is expired
  }

  // Add a method to update the cache
  updateCache(url, data) {
    this.cache[url] = {
      data: JSON.parse(JSON.stringify(data)), // Store a deep copy so it doesnt get modified
      timestamp: Date.now(), // Store the current time as the timestamp
    };
  }

  async fetchCached(url, options = {}, ttl = 1000 * 60 * 60, auth = true) {
    console.log('Trying cached URL: ', url);

    // Try to return cached data if available and valid
    const cachedData = this.getCached(url, ttl);
    if (cachedData) return Promise.resolve(cachedData);

    // If cache is not valid, proceed with fetch
    const response = await this.fetch(url, options, auth);

    // Assuming the response is JSON and fetch was successful
    if (response.ok) {
      this.updateCache(url, response); // Update cache with the new data
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
