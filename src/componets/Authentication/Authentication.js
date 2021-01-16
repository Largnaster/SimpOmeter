const jwt = require("jsonwebtoken");

/**
 * Allows the storage of a token to be accessed across components
 */
export default class Authentication {
  constructor(token, opaque_id) {
    this.state = {
      token,
      opaque_id,
      user_id: false,
      isMod: false,
      role: "",
    };
  }

  // Guarantee the user is a mod
  // Render client UI
  isModerator() {
    return this.state.isMod;
  }

  // Verify user id
  hasSharedId() {
    return !!this.state.user_id;
  }

  getUserId() {
    return this.state.user_id;
  }

  // Set the token in the authentication component state
  setToken(token, opaque_id) {
    let mod = false;
    let role = "";
    let user_id = "";

    try {
      let decoded = jwt.decode(token);

      if (decoded.role === "broadcaster" || decoded.role === "moderator") {
        mod = true;
      }

      user_id = decoded.user_id;
      role = decoded.role;
    } catch (e) {
      console.log("Invalid token.");
      token = "";
      opaque_id = "";
    }

    this.state = {
      token,
      opaque_id,
      isMod: mod,
      user_id,
      role,
    };
  }

  // Cheks to ensure there is a valid token in this state
  isAuthenticated() {
    if (this.state.token && this.state.opaque_id) {
      return true;
    } else {
      return false;
    }
  }

  /**
   * Makes a call against a given endpoint using a specific method
   * Returns a Promise with the Request() object per fetch documentation
   */

  makeCall(url, method = "GET") {
    return new Promise((resolve, reject) => {
      if (this.isAuthenticated()) {
        let headers = {
          'Authorization': `Bearer ${this.state.token}`,
        };

        fetch(url, { method, headers })
          .then(response => resolve(response))
          .catch(e => reject(e));
      } else {
        reject("Unauthorized");
      }
    });
  }
}
