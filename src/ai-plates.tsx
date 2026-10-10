import React from 'react';
import {OffthreadVideo,Sequence,staticFile,useCurrentFrame,useVideoConfig} from 'remotion';
import selections from './data/ai-shot-selections.json';
import assets from './data/ai-asset-index.json';

// Readable text, music and spatial control stay in the deterministic composition.
// Optional availability is resolved before bundling; no remote fetch or generator.
type Selection={id:string;clipId:string;start:number;end:number;sourceIn:number;sourceOut:number;scale?:number;focus?:string;fadeOutSeconds?:number};
export const AIPlates:React.FC=()=>{
 const {fps}=useVideoConfig(),frame=useCurrentFrame();
 return <>{(selections as Selection[]).map(s=>{
  const asset=(assets as Record<string,{file:string}>)[s.clipId];if(!asset)return null;
  const from=Math.ceil(s.start*fps),end=Math.ceil(s.end*fps),rate=(s.sourceOut-s.sourceIn)/(s.end-s.start);
  const opacity=s.fadeOutSeconds?Math.min(1,Math.max(0,(end-frame)/(s.fadeOutSeconds*fps))):1;
  return <Sequence key={s.id} from={from} durationInFrames={end-from}>
   <OffthreadVideo src={staticFile(asset.file)} muted trimBefore={Math.round(s.sourceIn*fps)} playbackRate={rate} style={{width:'100%',height:'100%',objectFit:'cover',opacity,transform:`scale(${s.scale??1})`,transformOrigin:s.focus??'50% 50%'}}/>
  </Sequence>;
 })}</>;
};
