(() => {
"use strict";
const $=selector=>document.querySelector(selector);
const all=selector=>[...document.querySelectorAll(selector)];
const classify=$("#classify"), ensemble=$("#ensemble"), percussion=$("#percussion");
const room=$("#gallery-room"), finder=$("#viewfinder"), world=$("#room-world");
const player=$("#performance-player"), video=$("#performance-video");
const next=$("#next-exhibit"), rhythm=$("#rhythm-video"), rhythmStage=$("#rhythm-stage");
const rhythmStart=$("#rhythm-start"), rhythmStatus=$("#rhythm-status");
const reduced=matchMedia("(prefers-reduced-motion: reduce)");
const clips={
  intro:{src:"scene-02-wujiatou-intro.mp4",title:"五架头介绍"},
  performance:{src:"scene-03-bubugao.mp4",title:"《步步高》演奏"}
};
const instruments={
  gaohu:["高胡","拉弦乐器","用琴弓擦动两根弦，左手按弦改变音高。","明亮、灵活，旋律线条清晰。","常担任主奏，带出旋律和装饰音。"],
  yehu:["椰胡","拉弦乐器","以琴弓擦弦，用椰壳琴筒共鸣。","圆润柔和，与明亮的高胡形成对照。","常衬托旋律，丰富拉弦声部。"],
  yangqin:["扬琴","击弦乐器","双手持琴竹，交替敲击金属琴弦。","清脆明亮，颗粒感强。","可加花或为旋律补充节奏。"],
  qinqin:["秦琴","弹拨乐器","左手按品，右手拨弦。","拨弦音头清楚，音色清润。","常衬托节奏，也可与主旋律呼应。"],
  xiao:["笛箫","吹管乐器","笛通常横吹；箫通常竖吹。两者都用手指开闭音孔来改变音高。","笛音清亮，箫音柔和。","吹管声部可与弦声形成对比，衬托旋律。"]
};
let heading=0, zoom=1, drag=null, ignoreClickUntil=0;
function paint(){
  const turn=((heading%360)+360)%360, width=finder.clientWidth;
  world.style.setProperty("--pan",(-turn/360*width)+"px");
  world.style.setProperty("--drift",(-Math.sin(turn*Math.PI/180)*width*.024)+"px");
  world.style.setProperty("--scale",zoom);
  all("[data-zoom]").forEach(button=>{button.disabled=Number(button.dataset.zoom)<0?zoom<=1:zoom>=1.7});
}
function reset(){ heading=0;zoom=1;paint(); }
function changeZoom(delta){zoom=Math.max(1,Math.min(1.7,Math.round((zoom+delta)*100)/100));paint();}
finder.addEventListener("pointerdown",event=>{
  if(!event.isPrimary||event.button!==0) return;
  drag={id:event.pointerId,x:event.clientX,y:event.clientY,heading,moved:false};
});
finder.addEventListener("pointermove",event=>{
  if(!drag||drag.id!==event.pointerId) return;
  const dx=event.clientX-drag.x, dy=event.clientY-drag.y;
  if(!drag.moved){
    if(Math.abs(dx)<6||Math.abs(dx)<Math.abs(dy)) return;
    drag.moved=true;
    finder.setPointerCapture(event.pointerId);
    finder.classList.add("dragging");
  }
  heading=drag.heading-dx*360/Math.max(1,finder.clientWidth);
  paint();
});
function release(event){
  if(!drag||drag.id!==event.pointerId) return;
  if(drag.moved) ignoreClickUntil=performance.now()+250;
  drag=null;
  finder.classList.remove("dragging");
}
["pointerup","pointercancel","lostpointercapture","pointerleave"].forEach(type=>finder.addEventListener(type,event=>{
  if(type!=="pointerleave"||!drag?.moved) release(event);
}));
finder.addEventListener("wheel",event=>{
  event.preventDefault();
  changeZoom(event.deltaY<0?.12:-.12);
},{passive:false});
all("[data-pan]").forEach(button=>button.addEventListener("click",()=>{heading+=Number(button.dataset.pan)*24;paint();}));
all("[data-zoom]").forEach(button=>button.addEventListener("click",()=>changeZoom(Number(button.dataset.zoom)*.14)));
$("#reset-view").addEventListener("click",reset);
function fitRhythm(){
  if(percussion.hidden) return;
  const fit=Math.min(percussion.clientWidth/1920,percussion.clientHeight/1080);
  if(fit>0) rhythmStage.style.setProperty("--rhythm-fit",fit);
}
window.addEventListener("resize",()=>{paint();fitRhythm();});
const detail=$("#instrument-detail");
all(".exhibit").forEach(button=>button.addEventListener("click",event=>{
  if(event.detail&&performance.now()<ignoreClickUntil) return;
  const data=instruments[button.dataset.key];
  ["title","kind","how","tone","role"].forEach((key,index)=>{$("#instrument-"+key).textContent=data[index];});
  detail.showModal();
}));
function message(text){
  const node=$("#performance-status");
  node.textContent=text;
  node.hidden=!text;
}
function stopVideo(){video.pause();player.hidden=true;}
function startClip(key){
  const clip=clips[key];
  $("#performance-title").textContent=clip.title;
  if(video.getAttribute("src")!==clip.src) video.setAttribute("src",clip.src);
  else if(video.readyState>0) video.currentTime=0;
  message("");
  next.hidden=true;
  video.volume=1;
  player.hidden=false;
  video.play().catch(error=>{
    if(player.hidden||error.name==="AbortError") return;
    message(video.error?"无法读取视频，请确认视频与网页同在课件文件夹。":"请点击视频上的播放键。");
    if(video.error) next.hidden=false;
  });
}
video.addEventListener("timeupdate",()=>{
  if(Number.isFinite(video.duration)&&!video.paused) video.volume=Math.max(0,Math.min(1,(video.duration-video.currentTime)/.65));
});
video.addEventListener("ended",()=>{
  message("播放结束");
  next.hidden=false;
});
video.addEventListener("error",()=>{
  if(player.hidden) return;
  message("无法读取视频，请确认视频与网页同在课件文件夹。");
  next.hidden=false;
});
$("#close-performance").addEventListener("click",()=>{stopVideo();next.hidden=false;$("#open-performance").focus();});
$("#open-performance").addEventListener("click",()=>startClip("performance"));
$("#open-introduction").addEventListener("click",()=>startClip("intro"));
function rhythmMessage(text){
  rhythmStatus.textContent=text;
  rhythmStatus.hidden=!text;
}
function playRhythm(restart){
  if(restart) rhythm.currentTime=0;
  rhythmMessage("");
  rhythm.play().catch(error=>{
    if(percussion.hidden||error.name==="AbortError") return;
    rhythmMessage(rhythm.error?"无法读取视频，请确认已完整解压课件。":"请点视频下方的播放键。");
  });
}
rhythmStart.addEventListener("click",()=>playRhythm(false));
$("#rhythm-replay").addEventListener("click",()=>playRhythm(true));
rhythm.addEventListener("playing",()=>{
  const moveFocus=document.activeElement===rhythmStart;
  rhythmStart.hidden=true;
  rhythmMessage("");
  if(moveFocus) rhythm.focus({preventScroll:true});
});
rhythm.addEventListener("error",()=>rhythmMessage("无法读取视频，请确认已完整解压课件。"));
let currentScene;
let departureTimer;
const scenes={classify,ensemble,percussion};
function showScene(moveFocus){
  const key=location.hash.slice(1);
  const target=Object.prototype.hasOwnProperty.call(scenes,key)?scenes[key]:scenes[document.body.dataset.initialScene];
  if(currentScene!==target){
    clearTimeout(departureTimer);
    room.classList.remove("departing");
    next.disabled=false;
    classify.hidden=target!==classify;
    ensemble.hidden=target!==ensemble;
    percussion.hidden=target!==percussion;
    if(target!==ensemble){
      stopVideo();
      if(detail.open) detail.close();
    }
    if(target!==percussion) rhythm.pause();
    percussion.classList.toggle("entering",target===percussion);
    currentScene=target;
    if(target===ensemble) reset();
    if(target===percussion) fitRhythm();
    window.scrollTo(0,0);
  }
  if(moveFocus) target.querySelector("h1").focus({preventScroll:true});
}
$("#listen").addEventListener("click",()=>{
  location.hash="ensemble";
  showScene(true);
  startClip("intro");
});
next.addEventListener("click",()=>{
  if(next.disabled) return;
  next.disabled=true;
  stopVideo();
  room.classList.add("departing");
  departureTimer=setTimeout(()=>{
    location.hash="percussion";
    showScene(true);
  },reduced.matches?0:710);
});
window.addEventListener("hashchange",()=>showScene(true));
window.addEventListener("pagehide",()=>{video.pause();rhythm.pause();});
showScene(false);
})();
