/**
 * The copyright in this software is being made available under the BSD License,
 * included below. This software may be subject to other third party and contributor
 * rights, including patent rights, and no such rights are granted under this license.
 *
 * Copyright (c) 2013, Dash Industry Forum.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without modification,
 * are permitted provided that the following conditions are met:
 *  * Redistributions of source code must retain the above copyright notice, this
 *  list of conditions and the following disclaimer.
 *  * Redistributions in binary form must reproduce the above copyright notice,
 *  this list of conditions and the following disclaimer in the documentation and/or
 *  other materials provided with the distribution.
 *  * Neither the name of Dash Industry Forum nor the names of its
 *  contributors may be used to endorse or promote products derived from this software
 *  without specific prior written permission.
 *
 *  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS AS IS AND ANY
 *  EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 *  WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
 *  IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT,
 *  INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT
 *  NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 *  PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY,
 *  WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 *  ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 *  POSSIBILITY OF SUCH DAMAGE.
 */'use strict';Object.defineProperty(exports,'__esModule',{value:true});function _interopRequireDefault(obj){return obj && obj.__esModule?obj:{'default':obj};}var _coreFactoryMaker=require('../../core/FactoryMaker');var _coreFactoryMaker2=_interopRequireDefault(_coreFactoryMaker);var _coreEventBus=require('../../core/EventBus');var _coreEventBus2=_interopRequireDefault(_coreEventBus);var _coreEventsEvents=require('../../core/events/Events');var _coreEventsEvents2=_interopRequireDefault(_coreEventsEvents);var _coreDebug=require('../../core/Debug');var _coreDebug2=_interopRequireDefault(_coreDebug);function VideoModel(){var instance=undefined,logger=undefined,element=undefined,TTMLRenderingDiv=undefined,videoContainer=undefined,previousPlaybackRate=undefined;var VIDEO_MODEL_WRONG_ELEMENT_TYPE='element is not video or audio DOM type!';var context=this.context;var eventBus=(0,_coreEventBus2['default'])(context).getInstance();var stalledStreams=[];function setup(){logger = (0,_coreDebug2['default'])(context).getInstance().getLogger(instance);}function initialize(){eventBus.on(_coreEventsEvents2['default'].PLAYBACK_PLAYING,onPlaying,this);}function reset(){eventBus.off(_coreEventsEvents2['default'].PLAYBACK_PLAYING,onPlaying,this);}function onPlaybackCanPlay(){if(element){element.playbackRate = previousPlaybackRate || 1;element.removeEventListener('canplay',onPlaybackCanPlay);}}function setPlaybackRate(value){if(!element)return;if(element.readyState <= 2 && value > 0){ // If media element hasn't loaded enough data to play yet, wait until it has
element.addEventListener('canplay',onPlaybackCanPlay);}else {element.playbackRate = value;}} //TODO Move the DVR window calculations from MediaPlayer to Here.
function setCurrentTime(currentTime,stickToBuffered){if(element){ //_currentTime = currentTime;
// We don't set the same currentTime because it can cause firing unexpected Pause event in IE11
// providing playbackRate property equals to zero.
if(element.currentTime == currentTime)return; // TODO Despite the fact that MediaSource 'open' event has been fired IE11 cannot set videoElement.currentTime
// immediately (it throws InvalidStateError). It seems that this is related to videoElement.readyState property
// Initially it is 0, but soon after 'open' event it goes to 1 and setting currentTime is allowed. Chrome allows to
// set currentTime even if readyState = 0.
// setTimeout is used to workaround InvalidStateError in IE11
try{currentTime = stickToBuffered?stickTimeToBuffered(currentTime):currentTime;element.currentTime = currentTime;}catch(e) {if(element.readyState === 0 && e.code === e.INVALID_STATE_ERR){setTimeout(function(){element.currentTime = currentTime;},400);}}}}function stickTimeToBuffered(time){var buffered=getBufferRange();var closestTime=time;var closestDistance=9999999999;if(buffered){for(var i=0;i < buffered.length;i++) {var start=buffered.start(i);var end=buffered.end(i);var distanceToStart=Math.abs(start - time);var distanceToEnd=Math.abs(end - time);if(time >= start && time <= end){return time;}if(distanceToStart < closestDistance){closestDistance = distanceToStart;closestTime = start;}if(distanceToEnd < closestDistance){closestDistance = distanceToEnd;closestTime = end;}}}return closestTime;}function getElement(){return element;}function setElement(value){ //add check of value type
if(value === null || value === undefined || value && /^(VIDEO|AUDIO)$/i.test(value.nodeName)){element = value; // Workaround to force Firefox to fire the canplay event.
if(element){element.preload = 'auto';}}else {throw VIDEO_MODEL_WRONG_ELEMENT_TYPE;}}function setSource(source){if(element){if(source){element.src = source;}else {element.removeAttribute('src');element.load();}}}function getSource(){return element?element.src:null;}function getVideoContainer(){return videoContainer;}function setVideoContainer(value){videoContainer = value;}function getTTMLRenderingDiv(){return TTMLRenderingDiv;}function setTTMLRenderingDiv(div){TTMLRenderingDiv = div; // The styling will allow the captions to match the video window size and position.
TTMLRenderingDiv.style.position = 'absolute';TTMLRenderingDiv.style.display = 'flex';TTMLRenderingDiv.style.overflow = 'hidden';TTMLRenderingDiv.style.pointerEvents = 'none';TTMLRenderingDiv.style.top = 0;TTMLRenderingDiv.style.left = 0;}function setStallState(type,state){stallStream(type,state);}function isStalled(){return stalledStreams.length > 0;}function addStalledStream(type){var event=undefined;if(type === null || element.seeking || stalledStreams.indexOf(type) !== -1){return;}stalledStreams.push(type);if(element && stalledStreams.length === 1){ // Halt playback until nothing is stalled.
event = document.createEvent('Event');event.initEvent('waiting',true,false);previousPlaybackRate = element.playbackRate;setPlaybackRate(0);element.dispatchEvent(event);}}function removeStalledStream(type){var index=stalledStreams.indexOf(type);var event=undefined;if(type === null){return;}if(index !== -1){stalledStreams.splice(index,1);} // If nothing is stalled resume playback.
if(element && isStalled() === false && element.playbackRate === 0){setPlaybackRate(previousPlaybackRate || 1);if(!element.paused){event = document.createEvent('Event');event.initEvent('playing',true,false);element.dispatchEvent(event);}}}function stallStream(type,isStalled){if(isStalled){addStalledStream(type);}else {removeStalledStream(type);}} //Calling play on the element will emit playing - even if the stream is stalled. If the stream is stalled, emit a waiting event.
function onPlaying(){if(element && isStalled() && element.playbackRate === 0){var _event=document.createEvent('Event');_event.initEvent('waiting',true,false);element.dispatchEvent(_event);}}function getPlaybackQuality(){if(!element){return null;}var hasWebKit='webkitDroppedFrameCount' in element && 'webkitDecodedFrameCount' in element;var hasQuality=('getVideoPlaybackQuality' in element);var result=null;if(hasQuality){result = element.getVideoPlaybackQuality();}else if(hasWebKit){result = {droppedVideoFrames:element.webkitDroppedFrameCount,totalVideoFrames:element.webkitDroppedFrameCount + element.webkitDecodedFrameCount,creationTime:new Date()};}return result;}function play(){if(element){element.autoplay = true;var p=element.play();if(p && typeof Promise !== 'undefined' && p instanceof Promise){p['catch'](function(e){if(e.name === 'NotAllowedError'){eventBus.trigger(_coreEventsEvents2['default'].PLAYBACK_NOT_ALLOWED);}logger.warn('Caught pending play exception - continuing (' + e + ')');});}}}function isPaused(){return element?element.paused:null;}function pause(){if(element){element.pause();element.autoplay = false;}}function isSeeking(){return element?element.seeking:null;}function getTime(){return element?element.currentTime:null;}function getPlaybackRate(){return element?element.playbackRate:null;}function getPlayedRanges(){return element?element.played:null;}function getEnded(){return element?element.ended:null;}function addEventListener(eventName,eventCallBack){if(element){element.addEventListener(eventName,eventCallBack);}}function removeEventListener(eventName,eventCallBack){if(element){element.removeEventListener(eventName,eventCallBack);}}function getReadyState(){return element?element.readyState:NaN;}function getBufferRange(){return element?element.buffered:null;}function getClientWidth(){return element?element.clientWidth:NaN;}function getClientHeight(){return element?element.clientHeight:NaN;}function getVideoWidth(){return element?element.videoWidth:NaN;}function getVideoHeight(){return element?element.videoHeight:NaN;}function getVideoRelativeOffsetTop(){return element && element.parentNode?element.getBoundingClientRect().top - element.parentNode.getBoundingClientRect().top:NaN;}function getVideoRelativeOffsetLeft(){return element && element.parentNode?element.getBoundingClientRect().left - element.parentNode.getBoundingClientRect().left:NaN;}function getTextTracks(){return element?element.textTracks:[];}function getTextTrack(kind,label,lang,isTTML,isEmbedded){if(element){for(var i=0;i < element.textTracks.length;i++) { //label parameter could be a number (due to adaptationSet), but label, the attribute of textTrack, is a string => to modify...
//label could also be undefined (due to adaptationSet)
if(element.textTracks[i].kind === kind && (label?element.textTracks[i].label == label:true) && element.textTracks[i].language === lang && element.textTracks[i].isTTML === isTTML && element.textTracks[i].isEmbedded === isEmbedded){return element.textTracks[i];}}}return null;}function addTextTrack(kind,label,lang){if(element){return element.addTextTrack(kind,label,lang);}return null;}function appendChild(childElement){if(element){element.appendChild(childElement); //in Chrome, we need to differenciate textTrack with same lang, kind and label but different format (vtt, ttml, etc...)
if(childElement.isTTML !== undefined){element.textTracks[element.textTracks.length - 1].isTTML = childElement.isTTML;element.textTracks[element.textTracks.length - 1].isEmbedded = childElement.isEmbedded;}}}function removeChild(childElement){if(element){element.removeChild(childElement);}}instance = {initialize:initialize,setCurrentTime:setCurrentTime,play:play,isPaused:isPaused,pause:pause,isSeeking:isSeeking,getTime:getTime,getPlaybackRate:getPlaybackRate,getPlayedRanges:getPlayedRanges,getEnded:getEnded,setStallState:setStallState,getElement:getElement,setElement:setElement,setSource:setSource,getSource:getSource,getVideoContainer:getVideoContainer,setVideoContainer:setVideoContainer,getTTMLRenderingDiv:getTTMLRenderingDiv,setTTMLRenderingDiv:setTTMLRenderingDiv,getPlaybackQuality:getPlaybackQuality,addEventListener:addEventListener,removeEventListener:removeEventListener,getReadyState:getReadyState,getBufferRange:getBufferRange,getClientWidth:getClientWidth,getClientHeight:getClientHeight,getTextTracks:getTextTracks,getTextTrack:getTextTrack,addTextTrack:addTextTrack,appendChild:appendChild,removeChild:removeChild,getVideoWidth:getVideoWidth,getVideoHeight:getVideoHeight,getVideoRelativeOffsetTop:getVideoRelativeOffsetTop,getVideoRelativeOffsetLeft:getVideoRelativeOffsetLeft,reset:reset};setup();return instance;}VideoModel.__dashjs_factory_name = 'VideoModel';exports['default'] = _coreFactoryMaker2['default'].getSingletonFactory(VideoModel);module.exports = exports['default'];
//# sourceMappingURL=VideoModel.js.map
