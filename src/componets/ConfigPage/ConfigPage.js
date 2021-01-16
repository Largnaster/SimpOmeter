import React from "react";
import Authentication from "../Authentication/Authentication";

import "./Config.css";

export default class ConfigPage extends React.Component {
  constructor(props) {
    super(props);
    this.Authentication = new Authentication();

    // If extension is running on twitch or devrig set shorthand, otherwise null
    this.twitch = window.Twitch ? window.Twitch.ext : null;
    this.state = {
      finishedLoading: false,
      theme: "light",
      checked: "cat",
    };
  }

  contextUpdate(context, delta) {
    if (delta.includes("theme")) {
      this.setState(() => {
        return { theme: context.theme };
      });
    }
  }

  componentDidMount() {
    // Do config page setup as needed here
    if (this.twitch) {
      this.twitch.onAuthorized((auth) => {
        this.Authentication.setToken(auth.token, auth.userId);
        if (!this.state.finishedLoading) {
          // If the component hasn't finished loading, let's set a token
          // Force a rerender with the correct data setting state to true
          this.setState(() => {
            return { finishedLoading: true };
          });
        }
      });

      this.twitch.onContext((context, delta) => {
        this.contextUpdate(context, delta);
      });

      this.twitch.configuration.onChanged(() => {
        let config = this.twitch.configuration.broadcaster;
        this.setState(() => {
          return {
            checked: config ? config.content : "cat",
          };
        });
      });
    }
  }

  handleRadioButtonChange(e) {
    let checked = e.target.value;
    this.setState(() => {
      return {
        checked,
      };
    });
  }

  saveConfig(e) {
    e.preventDefault();
    this.twitch.configuration.set("broadcaster", "", this.state.checked);
    console.log(this.Authentication.state.token);
    this.Authentication.makeCall("https://localhost:8081/api/randomfact")
      .then((response) => {
        if (response.status != 200) {
          this.twitch.rig.log("Error updating configuration.");
        }
      })
      .catch(this.twitch.rig.log("Error updating configuration."));
  }

  render() {
    if (this.state.finishedLoading && this.Authentication.isModerator()) {
      return (
        <div className="Config">
          <div
            className={
              this.state.theme === "ligh" ? "Config-light" : "Config-dark"
            }
          >
            <form onSubmit={(e) => this.saveConfig(e)}>
              <fieldset>
                <legend>Select an animal</legend>
                <div>
                  <input
                    type="radio"
                    name="animal"
                    value="cat"
                    checked={this.state.checked === "cat"}
                    onChange={(e) => this.handleRadioButtonChange(e)}
                  />
                  <label htmlFor="cat">Cat</label>
                </div>
                <div>
                  <input
                    type="radio"
                    name="animal"
                    value="dog"
                    checked={this.state.checked === "dog"}
                    onChange={(e) => this.handleRadioButtonChange(e)}
                  />
                  <label htmlFor="cat">Dog</label>
                </div>
              </fieldset>
              <input type="submit" value="Save" />
            </form>
          </div>
        </div>
      );
    } else {
      return (
        <div className="Config">
          <div
            className={
              this.state.theme === "light" ? "Config-light" : "Config-dark"
            }
          >
            Loading...
          </div>
        </div>
      );
    }
  }
}
