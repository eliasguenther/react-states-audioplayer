import React from "react";
import { useMachine} from '@xstate/react';
import { Machine, assign } from 'xstate';


const playerMachine = Machine({
    id: "playerMachine",
    initial: "loading",
    context: {
        trackId: null,
        duration: 0,
        elapsed: 0
    },  
    states: {
        loading: {
            on: {
              LOADED: {
                target: "ready",
                actions: assign({
                    audio: (context, event) => event.audio,
                    duration: (context, event) => event.audio.duration
                })
              },
              FAIL: "failure"
            }
        },
        ready: {
            initial: "paused",
            states: {
              paused: {
                on: {
                  PLAY: {
                    target: "playing",
                    actions: ["playAudio"]
                  }
                }
              },
                playing: {
                    on: {
                        TIMING: {
                            target: "playing",
                            actions: assign({
                                elapsed: (context, _event) => context.audio.currentTime
                            })
                        },
                        PAUSE: {
                            target: "paused",
                            actions: ["pauseAudio"]
                        },
                        END: "ended"
                    }
                },
                ended: {
                    on: {
                        PLAY: {
                            target: "playing",
                            action: ["restartAudio"]
                        }
                    }
                }
            }
        },
      failure: {
      type: "final"
      }
    }
  });

const playAudio = (context, _event) => {
    context.audio.play();
};
const pauseAudio = (context, _event) => {
    context.audio.pause();
};

const restartAudio = (context, _event) => {
    context.audio.currentTime = 0;
    video.play();
}

const Podcastplayer = () => {
    
    const [current, send] = useMachine(playerMachine, {
        actions: {playAudio, pauseAudio, restartAudio},
    });
    const ref = React.useRef(null);
    const {duration, elapsed} = current.context;
        if(current.value != "failure") {
        return (
            <div className="player">
                <audio controls ref={ref} onCanPlay={() => {              
                    send("LOADED", {
                        audio: ref.current,
                    
                    });
                }}
                onTimeUpdate={() => {
                    send("TIMING");
                }}
                onError={()=> {
                    send("FAIL");
                }}
                onEnded={()=> {
                    send("END");
                }}
                >
                    <source src="https://d3ctxlq1ktw2nl.cloudfront.net/production/2020-3-21/66323909-44100-2-dcd47921d951c.mp3" type="audio/mpeg" />
                </audio>
                <Button current={current} send={send} />
                <Timer elapsed={elapsed} duration={duration} />
            </div>
        ) } else {
            return("Diese Datei konnte nicht gefunden werden!")
        }
}

const seconds= (n) => {
    if(n){
    let time = n / 60;
    let sec = (time + "").split(".")[0] = 0 + "." + (time + "").split(".")[1];
    return(
        Math.floor((sec * 60)).toString().padStart(2, '0')
    )} else {
        return 0;
    }
} 

const remaining = (curr, total) => {
    let n = total - curr;
    n = Math.floor(n / 60)+ ":" + seconds(n);
    return n;
}

const Timer = ({elapsed, duration}) => (
    <div>
        Elapsed: {(elapsed/60).toFixed()}:{seconds(elapsed)} <br/>
        Duration: {(duration / 60).toFixed()}:{seconds(duration)} <br/>
        Remaining: {remaining(elapsed, duration)}
    </div>
)

const Button = ({current, send}) => {
    if(current.matches({ready: "playing"})) {
        return(
            <button onClick={() =>  send("PAUSE")  }>Pause</button>
        )
    } else {
        return(
            <button onClick={() =>  send("PLAY")  }>Play</button>
        )
    }
}

export default Podcastplayer;