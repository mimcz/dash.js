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
 */'use strict';Object.defineProperty(exports,'__esModule',{value:true});function _interopRequireDefault(obj){return obj && obj.__esModule?obj:{'default':obj};}var _streamingVoDataChunk=require('../streaming/vo/DataChunk');var _streamingVoDataChunk2=_interopRequireDefault(_streamingVoDataChunk);var _streamingVoFragmentRequest=require('../streaming/vo/FragmentRequest');var _streamingVoFragmentRequest2=_interopRequireDefault(_streamingVoFragmentRequest);var _MssFragmentInfoController=require('./MssFragmentInfoController');var _MssFragmentInfoController2=_interopRequireDefault(_MssFragmentInfoController);var _MssFragmentProcessor=require('./MssFragmentProcessor');var _MssFragmentProcessor2=_interopRequireDefault(_MssFragmentProcessor);var _parserMssParser=require('./parser/MssParser');var _parserMssParser2=_interopRequireDefault(_parserMssParser);function MssHandler(config){config = config || {};var context=this.context;var eventBus=config.eventBus;var events=config.events;var constants=config.constants;var initSegmentType=config.initSegmentType;var metricsModel=config.metricsModel;var playbackController=config.playbackController;var protectionController=config.protectionController;var mssFragmentProcessor=(0,_MssFragmentProcessor2['default'])(context).create({metricsModel:metricsModel,playbackController:playbackController,protectionController:protectionController,eventBus:eventBus,constants:constants,ISOBoxer:config.ISOBoxer,debug:config.debug,errHandler:config.errHandler});var mssParser=undefined;var instance=undefined;function setup(){}function onInitializationRequested(e){var streamProcessor=e.sender.getStreamProcessor();var request=new _streamingVoFragmentRequest2['default']();var representationController=streamProcessor.getRepresentationController();var representation=representationController.getCurrentRepresentation();var period=undefined,presentationStartTime=undefined;period = representation.adaptation.period;request.mediaType = representation.adaptation.type;request.type = initSegmentType;request.range = representation.range;presentationStartTime = period.start; //request.availabilityStartTime = timelineConverter.calcAvailabilityStartTimeFromPresentationTime(presentationStartTime, representation.adaptation.period.mpd, isDynamic);
//request.availabilityEndTime = timelineConverter.calcAvailabilityEndTimeFromPresentationTime(presentationStartTime + period.duration, period.mpd, isDynamic);
request.quality = representation.index;request.mediaInfo = streamProcessor.getMediaInfo();request.representationId = representation.id;var chunk=createDataChunk(request,streamProcessor.getStreamInfo().id,e.type !== events.FRAGMENT_LOADING_PROGRESS); // Generate initialization segment (moov)
chunk.bytes = mssFragmentProcessor.generateMoov(representation);eventBus.trigger(events.INIT_FRAGMENT_LOADED,{chunk:chunk,fragmentModel:streamProcessor.getFragmentModel()}); // Change the sender value to stop event to be propagated
e.sender = null;}function createDataChunk(request,streamId,endFragment){var chunk=new _streamingVoDataChunk2['default']();chunk.streamId = streamId;chunk.mediaInfo = request.mediaInfo;chunk.segmentType = request.type;chunk.start = request.startTime;chunk.duration = request.duration;chunk.end = chunk.start + chunk.duration;chunk.index = request.index;chunk.quality = request.quality;chunk.representationId = request.representationId;chunk.endFragment = endFragment;return chunk;}function onSegmentMediaLoaded(e){if(e.error){return;} // Process moof to transcode it from MSS to DASH
var streamProcessor=e.sender.getStreamProcessor();mssFragmentProcessor.processFragment(e,streamProcessor);}function onPlaybackSeekAsked(){if(playbackController.getIsDynamic() && playbackController.getTime() !== 0){ //create fragment info controllers for each stream processors of active stream (only for audio, video or fragmentedText)
var streamController=playbackController.getStreamController();if(streamController){var processors=streamController.getActiveStreamProcessors();processors.forEach(function(processor){if(processor.getType() === constants.VIDEO || processor.getType() === constants.AUDIO || processor.getType() === constants.FRAGMENTED_TEXT){ // check that there is no fragment info controller registered to processor
var i=undefined;var alreadyRegistered=false;var externalControllers=processor.getExternalControllers();for(i = 0;i < externalControllers.length;i++) {if(externalControllers[i].controllerType && externalControllers[i].controllerType === 'MssFragmentInfoController'){alreadyRegistered = true;}}if(!alreadyRegistered){var fragmentInfoController=(0,_MssFragmentInfoController2['default'])(context).create({streamProcessor:processor,eventBus:eventBus,metricsModel:metricsModel,playbackController:playbackController,ISOBoxer:config.ISOBoxer,debug:config.debug});fragmentInfoController.initialize();fragmentInfoController.start();}}});}}}function onTTMLPreProcess(ttmlSubtitles){if(!ttmlSubtitles || !ttmlSubtitles.data){return;}while(ttmlSubtitles.data.indexOf('http://www.w3.org/2006/10/ttaf1') !== -1) {ttmlSubtitles.data = ttmlSubtitles.data.replace('http://www.w3.org/2006/10/ttaf1','http://www.w3.org/ns/ttml');}}function registerEvents(){eventBus.on(events.INIT_REQUESTED,onInitializationRequested,instance,dashjs.FactoryMaker.getSingletonFactoryByName(eventBus.getClassName()).EVENT_PRIORITY_HIGH); /* jshint ignore:line */eventBus.on(events.PLAYBACK_SEEK_ASKED,onPlaybackSeekAsked,instance,dashjs.FactoryMaker.getSingletonFactoryByName(eventBus.getClassName()).EVENT_PRIORITY_HIGH); /* jshint ignore:line */eventBus.on(events.FRAGMENT_LOADING_COMPLETED,onSegmentMediaLoaded,instance,dashjs.FactoryMaker.getSingletonFactoryByName(eventBus.getClassName()).EVENT_PRIORITY_HIGH); /* jshint ignore:line */eventBus.on(events.TTML_TO_PARSE,onTTMLPreProcess,instance);}function reset(){eventBus.off(events.INIT_REQUESTED,onInitializationRequested,this);eventBus.off(events.PLAYBACK_SEEK_ASKED,onPlaybackSeekAsked,this);eventBus.off(events.FRAGMENT_LOADING_COMPLETED,onSegmentMediaLoaded,this);eventBus.off(events.TTML_TO_PARSE,onTTMLPreProcess,this);}function createMssParser(){mssParser = (0,_parserMssParser2['default'])(context).create(config);return mssParser;}instance = {reset:reset,createMssParser:createMssParser,registerEvents:registerEvents};setup();return instance;}MssHandler.__dashjs_factory_name = 'MssHandler';exports['default'] = dashjs.FactoryMaker.getClassFactory(MssHandler); /* jshint ignore:line */module.exports = exports['default'];
//# sourceMappingURL=MssHandler.js.map
