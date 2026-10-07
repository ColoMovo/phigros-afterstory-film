import React,{useLayoutEffect,useRef,useState} from 'react';
import {AbsoluteFill,Audio,Composition,continueRender,delayRender,registerRoot,staticFile,useCurrentFrame,useVideoConfig} from 'remotion';
import analysis from './data/audio-analysis.json';
import {setMemoryImages,paintShotGraphics} from './paint';
import {loadOpeningAssets} from './opening-world';
import {ShotWorld,shotAt} from './shot-library';
import {createArchiveImages} from './archive-art';
let fonts:Promise<void>|null=null;
function loadFonts(){if(!fonts)fonts=Promise.all(['CJK','Display','Text'].map(async name=>{const f=new FontFace(name,`url(${staticFile(`fonts/${name}.woff2`)})`);await f.load();(document.fonts as FontFaceSet & {add(f:FontFace):void}).add(f)})).then(async()=>{const images=await createArchiveImages();setMemoryImages(images);await loadOpeningAssets(staticFile('fonts/Display.ttf'),images)});return fonts;}
export const Film:React.FC<{quality?:string;openingLook?:'finished'|'silhouette'}>=({openingLook='finished'})=>{
 const frame=useCurrentFrame(),{fps,width,height}=useVideoConfig(),graphic=useRef<HTMLCanvasElement>(null),space=useRef<HTMLCanvasElement>(null),world=useRef<ShotWorld|null>(null);
 const [handle]=useState(()=>delayRender('Load local fonts and original archive surfaces')), [ready,setReady]=useState(false);
 useLayoutEffect(()=>{loadFonts().then(()=>{setReady(true);continueRender(handle)})},[handle]);
 useLayoutEffect(()=>{if(ready&&graphic.current&&space.current){if(!world.current)world.current=new ShotWorld(space.current,openingLook==='silhouette');const time=frame/fps;world.current.render(time);paintShotGraphics(graphic.current,time,frame,fps,shotAt(time));if(openingLook==='silhouette')graphic.current.getContext('2d')!.clearRect(0,0,width,height)}},[frame,fps,ready,openingLook,width,height]);
 useLayoutEffect(()=>()=>{world.current?.dispose();world.current=null},[]);
 return <AbsoluteFill style={{background:'#08121f'}}><canvas ref={space} width={width} height={height} style={{position:'absolute',inset:0,width:'100%',height:'100%'}}/><canvas ref={graphic} width={width} height={height} style={{position:'absolute',inset:0,width:'100%',height:'100%'}}/><Audio src={staticFile('music.mp3')}/></AbsoluteFill>;
};
const Root=()=> <Composition id="Afterstory" component={Film} width={1920} height={1080} fps={60} durationInFrames={Math.ceil(analysis.duration*60)} defaultProps={{}} calculateMetadata={({props}:{props:Record<string,unknown>})=>{const preview=props.quality==='preview',fps=preview?30:60;return {width:preview?960:1920,height:preview?540:1080,fps,durationInFrames:Math.ceil(analysis.duration*fps)}}}/>;
registerRoot(Root);
