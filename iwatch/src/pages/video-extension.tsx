import { Extension, VideoProcessor, Ticker, IProcessorContext } from 'agora-rte-extension'
import webgazer from './node_modules/webgazer'
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import iWatch from './iWatch';

import getUniqueID from '../utils/getUniqueID';
import {timeNow} from '../rtm/utils';
import events, {EventPersistLevel} from '../rtm-events-api';
import {EventNames} from '../rtm-events';

class iWatchVideoExtension extends Extension<iWatchVideoProcessor> {
  protected _createProcessor(): iWatchVideoProcessor {
    return new iWatchVideoProcessor();
  }
}

// TODO: CALIBRATION PROCESS  !
// TODO: -RC PROGRESS         
// TODO: -BASELINE SCORE      
// TODO: MONITORING SYSTEM    !
// TODO: -DEVIATION           !
// TODO: OBJECT DETECTION     !
// TODO: -LAPTOP              !
// TODO: -PHONE               !
// TODO: REPORTING            !
// TODO: -SNAPSHOT            
// TODO: -UI                  ! 
// TODO: -STORE               !
// TODO: -LIVE REPORT         !
// TODO: UI                   !
// TODO: -Elements of Status  !
// TODO: HOST HAS NO CALIBRATION !

// TODO: MULTIPLE FACE
// TODO: TEXT
// TODO: DOWNLOAD LOG
// TODO: FILTER LOG

var regs = null;
var gazeDot = null;
var Calibrating = false;

//Types that regression systems should handle
//Describes the source of data so that regression systems may ignore or handle differently the various generating events
var eventTypes = ['click', 'move'];

class iWatchVideoProcessor extends VideoProcessor {
  public name: string = "iWatch Video Processor";

  private canvas: HTMLCanvasElement;
  private videoElement: HTMLVideoElement;

  private ctx: CanvasRenderingContext2D;
  private ticker: Ticker;
  private canvasTrack: MediaStreamTrack;

  private latestGazeData = null;
  private latestEyeFeatures = null;
  private cocoSsdModel = null;
  private anomalyhandler = null;
  private uid = null;
  private anomaly_state = false;
  private tick_track = 0;

  public constructor() {
    super();
    console.log("iWatch - constructor")
    this.canvas = document.createElement('canvas');
    this.canvas.width = 640;
    this.canvas.height = 480;
    
    this.videoElement = document.createElement('video');
    this.videoElement.muted = true;
    this.videoElement.id = webgazer.params.videoElementId;

    const outputStream = this.canvas.captureStream(30);
    this.canvasTrack = outputStream.getVideoTracks()[0];
    this.anomalyhandler = new iWatch();

    this.loadCocoSsdModel();

    // Gaze dot
    // Starts offscreen
    gazeDot = document.createElement('div');
    gazeDot.id = webgazer.params.gazeDotId;
    gazeDot.style.display = 'block';
    gazeDot.style.position = 'fixed';
    gazeDot.style.zIndex = 99999;
    gazeDot.style.left = '-5px';
    gazeDot.style.top  = '-5px';
    gazeDot.style.background = 'red';
    gazeDot.style.borderRadius = '100%';
    gazeDot.style.opacity = '0.7';
    gazeDot.style.width = '10px';
    gazeDot.style.height = '10px';
    document.body.appendChild(gazeDot);

    this.ctx = this.canvas.getContext('2d')!;
    webgazer.saveDataAcrossSessions(false);
    webgazer.showPredictionPoints(true)
    webgazer.setRegression('ridge').setTracker('TFFacemesh');
    
    document.addEventListener('click', this.clickListener, true);
    document.addEventListener('mousemove', this.moveListener, true);

    console.log("iWatch - curTracker: ", webgazer.getTracker());
    this.ticker = new Ticker("RAF", 1000 / 30);
    this.ticker.add(this.process);
  }

  private process = async () => {
    this.tick_track++;
    //console.log("iWatch - process Start");
    
    // Get gaze prediction (ask clm to track; pass the data to the regressor; get back a prediction)
    //this.latestEyeFeatures = await this.getPupilFeatures(this.canvas, this.canvas.width, this.canvas.height);
    //console.log("iWatch - Eye: ", this.latestEyeFeatures);
    this.anomaly_state = false;

    await this.detectObjects();
    
    this.paintCurrentFrame(this.canvas, this.canvas.width, this.canvas.height);
    
    this.latestGazeData = this.getPrediction();
    //console.log("iWatch - Data: ", this.latestGazeData);
    
    if( webgazer.params.showFaceOverlay || true ){
      var tracker = webgazer.getTracker();
      var keypoints = tracker.getPositions();
      if (keypoints) {
        this.ctx.fillStyle = '#32EEDB';
        this.ctx.strokeStyle = '#32EEDB';
        this.ctx.lineWidth = 0.5;
    
        for (let i = 0; i < keypoints.length; i++) {
          const x = keypoints[i][0];
          const y = keypoints[i][1];
    
          this.ctx.beginPath();
          this.ctx.arc(x, y, 1 /* radius */, 0, 2 * Math.PI);
          this.ctx.closePath();
          this.ctx.fill();
        }

        if(this.anomalyhandler.headPose(keypoints, Date.now())){
          this.anomaly_state = true;
        }
      }
    }

    this.latestGazeData = await this.latestGazeData;
    //console.log("latestGazeData", this.latestGazeData);

    if( this.latestGazeData ) {
      // Smoothing across the most recent 4 predictions, do we need this with Kalman filter?
      webgazer.smoothingVals.push(this.latestGazeData);
      var x = 0;
      var y = 0;
      var len = webgazer.smoothingVals.length;
      for (var d in webgazer.smoothingVals.data) {
        x += webgazer.smoothingVals.get(d).x;
        y += webgazer.smoothingVals.get(d).y;
      }

      var pred = webgazer.util.bound({'x':x/len, 'y':y/len});

      if (webgazer.params.storingPoints || true) {
        //this.drawCoordinates('blue',pred.x,pred.y); //draws the previous predictions
        //store the position of the past fifty occuring tracker preditions
        webgazer.storePoints(pred.x, pred.y, webgazer.smoothingValsk);
        webgazer.smoothingValsk++;
        if (webgazer.smoothingValsk == 52) {
          webgazer.smoothingValsk = 0;
        }
      }
      
      if(!Calibrating){
        this.anomalyhandler.deviationAnomaly(pred.x, pred.y, Date.now());
      }
      gazeDot.style.transform = 'translate3d(' + pred.x + 'px,' + pred.y + 'px,0)';
    } 
    else {
      console.log("NO DATA!!!!");
      //gazeDot.style.display = 'none';
    }
    
    if(this.tick_track % 5 == 0){
      console.log("this.anomaly_state", this.anomaly_state)
      const messageData = {
        msg: "Anomaly State: " + this.anomaly_state,
        createdTimestamp: timeNow(),
        msgId: getUniqueID(),
        isDeleted: false,
      };
      events.send(
        EventNames.ANOMALY_STATUS,
        JSON.stringify({
          value: messageData,
          action: this.anomaly_state ? 'Anomaly_True' : 'Anomaly_False',
        }),
        EventPersistLevel.LEVEL3,
        window.iwatchhostuid,
      );
    }
  }

  protected onEnableChange(enabled: boolean): void | Promise<void> {
    console.log("iWatch - onChange Start");
    if (!this.context) {
      return;
    }

    if (enabled) {
      this.ticker.start();
    } else {
      this.ticker.stop();
    }
    console.log("iWatch - onChange Start end");
  }

  protected onTrack(track: MediaStreamTrack, ctx: IProcessorContext): void | Promise<void> {
    //console.log("iWatch - onTrack Start");

    this.videoElement.srcObject = new MediaStream([track]);
    this.videoElement.play();
    this.videoElement.onplaying = () => {
      this.canvas.width = this.videoElement.videoWidth;
      this.canvas.height = this.videoElement.videoHeight;
    }
    
    if (this.enabled) {
      this.ticker.start();
      this.output(this.canvasTrack, ctx);
    } else {
      this.ticker.stop();
      this.output(track, ctx);
    }

    //console.log("iWatch - onTrack End");
  }

  protected onPiped(context: IProcessorContext): void {
    const messageData = {
      msg: "Monitoring Start",
      createdTimestamp: timeNow(),
      msgId: getUniqueID(),
      isDeleted: false,
    };
    events.send(
      EventNames.LOG_MESSAGE,
      JSON.stringify({
        value: messageData,
        action: 'Create_Chat_Message',
      }),
      EventPersistLevel.LEVEL3,
      window.iwatchhostuid,
    );
  }

  protected onUnpiped(): void {
    console.log("iWatch - onUnpiped Start")
    gazeDot.style.display = 'none'
    this.anomalyhandler.onMonitoringEnd();
    this.ticker.stop();
    console.log("iWatch - onUnpiped End")
  }
  
  protected paintCurrentFrame(canvas, width, height) {
    if (canvas.width != width) {
      canvas.width = width;
    }
    if (canvas.height != height) {
      canvas.height = height;
    }

    this.ctx.drawImage(this.videoElement, 0, 0, canvas.width, canvas.height);
  }

  protected drawCoordinates(colour,x,y){
    // var ctx = document.getElementById("plotting_canvas").getContext('2d');
    this.ctx.fillStyle = colour; // Red color
    this.ctx.beginPath();
    this.ctx.arc(x, y, 5, 0, Math.PI * 2, true);
    this.ctx.fill();
  }

  /**
   * Gets the pupil features by following the pipeline which threads an eyes object through each call:
   * curTracker gets eye patches -> blink detector -> pupil detection
   * @param {Canvas} canvas - a canvas which will have the video drawn onto it
   * @param {Number} width - the width of canvas
   * @param {Number} height - the height of canvas
   */
   protected getPupilFeatures(canvas, width, height) {
    if (!canvas) {
      return;
    }
    try {
      return webgazer.getTracker().getEyePatches(this.videoElement, canvas, width, height);
    } catch(err) {
      console.log("can't get pupil features ", err);
      return null;
    }
  }

  /**
 * Paints the video to a canvas and runs the prediction pipeline to get a prediction
 * @param {Number|undefined} regModelIndex - The prediction index we're looking for
 * @returns {*}
 */
  protected getPrediction = async () => {
    var predictions = [];
    // [20200617 xk] TODO: this call should be made async somehow. will take some work.
    this.latestEyeFeatures = await this.getPupilFeatures(this.canvas, this.canvas.width, this.canvas.height);
    if (this.latestEyeFeatures == 'More than one face detected'){
      console.log('More than one face detected');
      //this.anomalyhandler.sendMultipleFaceLog(Date.now)
      return;
    }

    regs = webgazer.getRegression();

    //console.log("latestEyeFeatures: ", this.latestEyeFeatures);

    if (regs.length === 0) {
      console.log('regression not set, call setRegression()');
      return null;
    }
    for (var reg in regs) {
      predictions.push(regs[reg].predict(this.latestEyeFeatures));
    }
    
    //console.log("predictions: ", predictions);
    
    return predictions.length === 0 || predictions[0] === null ? null : {
      'x' : predictions[0].x,
      'y' : predictions[0].y,
      'eyeFeatures': this.latestEyeFeatures,
      'all' : predictions
    };
  }

  protected detectObjects = async () => {
    if (!this.videoElement) {
      console.log('Video element not available');
      return;
    }
    if (!this.cocoSsdModel) {
      console.log('Model not available');
      this.loadCocoSsdModel();
      return;
    }
  
    const predictions = await this.cocoSsdModel.detect(this.videoElement);

    if(this.anomalyhandler.objectAnomaly(predictions, Date.now)){
      this.anomaly_state = true;
    }

  }

  /**
   * Records click data and passes it to the regression model
   * @param {Event} event - The listened event
   */
  protected clickListener = async (event) => {
    //console.log('window.iWatchisCalibrating = ', window.iWatchisCalibrating)
    Calibrating = window.iWatchisCalibrating;
    if(Calibrating){
      console.log('calibrating - clickListener')
      this.recordScreenPosition(event.clientX, event.clientY, eventTypes[0]); // eventType[0] === 'click'
      return;
    }
    else{
      return;
    }
  }

  /**
   * Records mouse movement data and passes it to the regression model
   * @param {Event} event - The listened event
   */
  protected moveListener = (event)  => {
    //console.log('window.iWatchisCalibrating = ', window.iWatchisCalibrating)
    Calibrating = window.iWatchisCalibrating;
    if(Calibrating){
      console.log('calibrating - moveListener')
      this.recordScreenPosition(event.clientX, event.clientY, eventTypes[1]); //eventType[1] === 'move'
      return;
    }
    else{
      return;
    }
  };

  /**
   * Records screen position data based on current pupil feature and passes it
   * to the regression model.
   * @param {Number} x - The x screen position
   * @param {Number} y - The y screen position
   * @param {String} eventType - The event type to store
   * @returns {null}
   */
  protected recordScreenPosition = (x, y, eventType) => {
    Calibrating = window.iWatchisCalibrating;
    if(!Calibrating){
      console.log('not calibrating')
      return;
    }

    regs = webgazer.getRegression();

    if (regs.length === 0) {
      console.log('regression not set, call setRegression()');
      return null;
    }
    for (var reg in regs) {
      if( this.latestEyeFeatures )
        console.log("ADDING DATA: ")
        regs[reg].addData(this.latestEyeFeatures, [x, y], eventType);
    }
  }

  protected loadCocoSsdModel = async() => {
    this.cocoSsdModel = await cocoSsd.load();
    console.log('cocoSsdModel initialized');
  }

  protected setuid = (uid) => {
    this.uid = uid
    console.log('setuid: ' + this.uid);
  }
}

export { iWatchVideoExtension }