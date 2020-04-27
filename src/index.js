import React from "react";
import ReactDOM from "react-dom";
import Podcastplayer from "./components/podcastplayer"

const App = () => (
    <>
    Hello World.
    <Podcastplayer />
    </>
)


ReactDOM.render(<App />, document.getElementById('app'))

