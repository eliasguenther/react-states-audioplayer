import React from "react";
import { useMachine} from '@xstate/react';
import { Machine, assign } from 'xstate';
import { motion } from "framer-motion"
/** @jsx jsx */
import { css, jsx } from '@emotion/core'



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

const standardboxsh = "0px 25px 55px rgba(0, 0, 0, 0.4)";


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
            <motion.div 
            className="player" 
            css={css`
                width: 400px; 
                height: 100px; 
                height: 100px; 
                position: relative;
                border-radius: 4px;
                overflow: hidden;
                box-shadow: ${standardboxsh};
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 1rem;
                box-sizing: border-box;
                font-family: Montserrat, sans-serif;
            `}>
                <audio ref={ref} onCanPlay={() => {              
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
                <Bar elapsed={elapsed} duration={duration} current={current} send={send}></Bar>
                <Button current={current} send={send} />
                <PodcastMeta elapsed={elapsed} duration={duration}  />
                
            </motion.div>
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
    let targetEl = e.target.getBoundingClientRect();

    let clickPercentage = (e.clientX - targetEl.left) / e.target.offsetWidth;

    let newElapsed = clickPercentage * context.duration;

    context.audio.currentTime = newElapsed;
    
    return newElapsed;

}


const PodcastMeta = ({elapsed, duration}) => (
    <div
    css={css`
        position: relative;
        user-select: none;
        pointer-events: none;
        height: 100%;
        flex-grow: 1;
        display: flex;
        flex-flow: column;
        justify-content: space-between;
        padding-left: 1rem;

    `}>
        <div className="title">Titel der Episode</div>
        <div 
        css={css`
            display: flex;
            justify-content: space-between;
        `}>
            <span className="date">Datum</span>
            <span className="duration">noch {remaining(elapsed, duration)}</span>
        </div>
        
    
        {/* Elapsed: {minutes(elapsed)}:{seconds(elapsed)} <br/>
        Duration: {(duration / 60).toFixed()}:{seconds(duration)} <br/> */}
    </div>

)

const Bar = ({elapsed, duration, current, send}) => {

    return( 
    <div onClick={() => send({type: "SCRUBBING", data: calcAudiotime(current, event)})} className="bar"
        css={css`
            position: absolute;
            top: 0;
            bottom: 0;
            left: 0;
            right: 0;
            background: linear-gradient(to right, #CECECE 0%, #CECECE ${percentage(elapsed, duration)}%, #FFFFFF ${percentage(elapsed, duration) + .2}%, #FFFFFF 100%);
        `}
      >
         
    </div>)
}

const Button = ({current, send}) => {
    const generalCss = `
        width: 4rem;
        height: 4rem;
        transform: translateY(0);
        background: #F0F0F0;
        border-radius: 10px;
        border: 0;
        user-select: none;
        padding: 0;
        display: flex;
        justify-content: center;
        align-items: center
        overflow: hidden;
        svg{
            transform-origin: 50% 50% !important;
        }
    `;
    if(current.matches({ready: "playing"})) {
        return(
            <button 
            css={css`
                ${generalCss}
            `} 
            onClick={() =>  send("PAUSE")  }>
                <motion.svg 
                style={{scale: 1.5}}
                whileHover={{ scale: 1.7 }}
                whileTap={{ scale: 0.9 }} 
                xmlns="http://www.w3.org/2000/svg" height="35" viewBox="0 0 24 24" width="35"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/><path d="M0 0h24v24H0z" fill="none"/></motion.svg></button>
        )
    } else {
        return(
            <button onClick={() =>  send("PLAY")} css={css`${generalCss}`}>
                <motion.svg 
                style={{scale: 1.5, transformOrigin: "0px 0px"}} 
                whileHover={{ scale: 1.7 }}
                whileTap={{ scale: 0.9 }}  
                xmlns="http://www.w3.org/2000/svg" height="35" viewBox="0 0 24 24" width="35"><path d="M8 5v14l11-7z"/><path d="M0 0h24v24H0z" fill="none"/></motion.svg>
            </button>
        )
    }
}

export default Podcastplayer;