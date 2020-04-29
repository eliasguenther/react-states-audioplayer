import React from "react";
import { useMachine} from '@xstate/react';
import { Machine, assign } from 'xstate';
import { motion } from "framer-motion"


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
                    },  
                    SCRUBBING: {
                        target: "paused",
                        actions: assign({
                            elapsed: (_context, event) => event.data 
                        })
                        },
                    },
                },
                playing: {
                    on: {
                        TIMING: {
                            target: "playing",
                            actions: assign({
                                elapsed: (context, _event) => context.audio.currentTime
                            })
                        },
                        SCRUBBING: {
                            target: "playing",
                            actions: assign({
                                elapsed: (_context, event) => event.data 
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




//Actions for machine

const playAudio = (context, _event) => {
    context.audio.play();
};
const pauseAudio = (context, _event) => {
    context.audio.pause();
};

const restartAudio = (context, _event) => {
    context.audio.currentTime = 0;
    context.audio.play();
}



//Main Component

const Podcastplayer = () => {
    
    const [current, send] = useMachine(playerMachine, {
        actions: {playAudio, pauseAudio, restartAudio},
    });
    const ref = React.useRef(null);
    const {duration, elapsed} = current.context;
    console.log(current.context);
    
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
                <Bar elapsed={elapsed} duration={duration} current={current} send={send} />
            </div>
        ) } else {
            return("Diese Datei konnte nicht gefunden werden!")
        }
}


//Helpers and subcomponents

const minutes = seconds => Math.floor(seconds / 60).toLocaleString("en-US", {
    minimumIntegerDigits: 2,
    useGrouping: false
  });

const seconds = seconds =>
  Math.floor(seconds % 60).toLocaleString("en-US", {
    minimumIntegerDigits: 2,
    useGrouping: false
});

const percentage = (curr, total) => {
    let p = curr / total;
    return p * 100
}

const remaining = (curr, total) => {
    let n = total - curr;
    n = Math.floor(n / 60)+ ":" + seconds(n);
    return n;
}

const calcAudiotime = (ctx, event) => {

    
    let context = ctx.context;
    let e = event;
    console.log(e.target);
    
    let targetEl = e.target.getBoundingClientRect();

    let clickPercentage = (e.clientX - targetEl.left) / e.target.offsetWidth;

    let newElapsed = clickPercentage * context.duration;

    context.audio.currentTime = newElapsed;

    console.log(newElapsed);

    return newElapsed;

}


const Timer = ({elapsed, duration}) => (
    <div>
        Elapsed: {minutes(elapsed)}:{seconds(elapsed)} <br/>
        Duration: {(duration / 60).toFixed()}:{seconds(duration)} <br/>
        Remaining: {remaining(elapsed, duration)}
    </div>
)

const Bar = ({elapsed, duration, current, send}) => {

    return( 
    <div onClick={() => send({type: "SCRUBBING", data: calcAudiotime(current, event)})} className="bar"  style={{ width: "200px", height: "20px", background: `linear-gradient(to right, grey 0%, grey ${percentage(elapsed, duration)}%, black ${percentage(elapsed, duration)}%, black 100%)`}}>
    </div>)
}

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