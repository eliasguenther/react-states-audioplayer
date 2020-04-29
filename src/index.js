import React from "react";
import ReactDOM from "react-dom";
import Podcastplayer from "./components/podcastplayer"

const App = () => (
    <>
    <Podcastplayer />
    </>
)


ReactDOM.render(<App />, document.getElementById('app'))

