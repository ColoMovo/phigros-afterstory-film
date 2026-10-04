import React, {useLayoutEffect,useRef,useState} from 'react';
import {AbsoluteFill,Audio,Composition,continueRender,delayRender,registerRoot,staticFile,useCurrentFrame,useVideoConfig} from 'remotion';
import analysis from './data/audio-analysis.json';
import {paint} from './paint';
let fonts: Promise<void>|null=null;
function loadFonts(){
 if(!fonts) fonts=Promise.all(['CJK','Display','Text'].map(async name=>{const f=new FontFace(name,`url(${staticFile(`fonts/${name}.woff2`)})`);await f.load();(document.fonts as FontFaceSet & {add(f:FontFace):void}).add(f);})).then(()=>{});
 return fonts;
}
export const Film:React.FC=()=>{
 const frame=useCurrentFrame(); const {fps,width,height}=useVideoConfig(); const canvas=useRef<HTMLCanvasElement>(null);
 const [handle]=useState(()=>delayRender('Load bundled CJK and Latin fonts'));const [ready,setReady]=useState(false);
 useLayoutEffect(()=>{loadFonts().then(()=>{setReady(true);continueRender(handle);});},[handle]);
 useLayoutEffect(()=>{if(ready&&canvas.current)paint(canvas.current,frame/fps,frame,fps);},[frame,fps,ready]);
 return <AbsoluteFill style={{background:'#050505'}}><canvas ref={canvas} width={width} height={height} style={{width:'100%',height:'100%'}}/><Audio src={staticFile('music.mp3')}/></AbsoluteFill>;
};
const Root=()=> <Composition id="Afterstory" component={Film} width={1920} height={1080} fps={60} durationInFrames={Math.ceil(analysis.duration*60)} defaultProps={{}} calculateMetadata={({props}: {props:Record<string,unknown>})=>{const preview=props.quality==='preview';const fps=preview?30:60;return {width:preview?960:1920,height:preview?540:1080,fps,durationInFrames:Math.ceil(analysis.duration*fps)};}}/>;
registerRoot(Root);
