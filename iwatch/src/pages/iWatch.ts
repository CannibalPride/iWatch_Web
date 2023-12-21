import getUniqueID from '../utils/getUniqueID';
import {timeNow} from '../rtm/utils';
import events, {EventPersistLevel} from '../rtm-events-api';
import {EventNames} from '../rtm-events';

// TODO: -CERTAIN DURATION GETS UPGRADED      

enum AnomalyLevel {
    High = 'High',
    Mid = 'Medium',
    Low = 'Low',
}

// Define a type for the keypoints and predictions
type KeyPoint = [number, number];
type Prediction = { class: string, score: number };

const leftmostindex = 234;
const rightmostindex = 454;
const topmostindex = 10;
const bottommostindex = 152;

const lowThresholdx = 285; //320
const midThresholdx = 309; //320
const lowThresholdy = 202; //240
const midThresholdy = 224; //240
const thresholdx = 43;
const thresholdy = 52;

const baselinex = 202.4783935546875;
const baseliney = 231.13711547851562;

var Calibrating = null;
var leftx, lefty = null;
var rightx, righty = null;
var topx, topy = null;
var bottomx, bottomy = null;

var counter_isLowAnomalyx = 0;
var start_isLowAnomalyx = 0;
var break_isLowAnomalyx = false;

var counter_isLowAnomalyy = 0;
var start_isLowAnomalyy = 0;
var break_isLowAnomalyy = false;

var counter_isMidAnomalyx = 0;
var start_isMidAnomalyx = 0;
var break_isMidAnomalyx = false;

var counter_isMidAnomalyy = 0;
var start_isMidAnomalyy = 0;
var break_isMidAnomalyy = false;

var counter_Headposex = 0;
var start_Headposex = 0;
var break_Headposex = false;
var counter_Headposey = 0;
var start_Headposey = 0;
var break_Headposey = false;

var start_object = 0;
var counter_object = 0;
var break_object = false;

var counter_people = 0; // Counter for people
var start_people; // Variables to store start and end time for people detection
var break_people = false;
var last_face = 0;
var last_obj = 0;

var anomaly_state = null;

var deviation_low_to_mid = 21;
var deviation_mid_to_high = 5;
var pose_mid_to_high = 6;

export default class iWatch {
    private gazeHistory: Array<{ x: number, y: number, timestamp: number }>;
    private log: Array<any>;

    constructor(){
        this.gazeHistory = [];
        this.log = [];
    }
    
    logAnomaly(msg: any) {
        const uid = window.iwatchuid
        const user = window.iwatchusername

        //console.log('SENDING LOG TO:', window.iwatchhostuid)
        
        const messageData = {
          msg,
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
    
    addGazePoint(x: number, y: number, timestamp: number) {
        this.gazeHistory.push({ x, y, timestamp });

        if (this.gazeHistory.length > 100) {
            this.gazeHistory.shift();
        }
    }
    
    deviationAnomaly(x: number, y: number, timestamp: number) {
        Calibrating = window.iWatchisCalibrating;
        if(Calibrating){
            return false;
        }
        anomaly_state = false;

        const centerX = 320;
        const centerY = 240;

        x = (x/window.innerWidth)*640;
        y = (y/window.innerHeight)*480;

        const distance = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
        const xDistance = Math.abs(x - centerX);
        const yDistance = Math.abs(y - centerY);

        // Check for low and mid-level deviations
        const isLowAnomalyx = xDistance > lowThresholdx;
        const isMidAnomalyx = xDistance > midThresholdx;

        // Check for low and mid-level deviations
        const isLowAnomalyy = yDistance > lowThresholdy;
        const isMidAnomalyy = yDistance > midThresholdy;
        
        if(isLowAnomalyx){
            if(counter_isLowAnomalyx == 1){
                start_isLowAnomalyx = timestamp
            }
            //console.log('counter_isLowAnomalyx', counter_isLowAnomalyx);
            counter_isLowAnomalyx++
            if(break_isLowAnomalyx){
                //console.log('logAnomaly', "LowAnomalyx", counter_isLowAnomalyx);
                this.logAnomaly({
                    'Level' : (counter_isLowAnomalyx < deviation_low_to_mid) ? AnomalyLevel.Low : AnomalyLevel.Mid,
                    'Type' : 'Gaze Deviation',
                    'Details': {
                        'Type':'x-axis deviation', 
                        'Distance': xDistance, 
                        'Axis': x
                    },
                    'Counts' : counter_isLowAnomalyx,
                    'Begin': start_isLowAnomalyx,
                    'End': timestamp
                })
                break_isLowAnomalyx = false;
                counter_isLowAnomalyx = 1;
            }
        }
        else{
            break_isLowAnomalyx = true;
        }

        if(isLowAnomalyy){
            if(counter_isLowAnomalyy == 1){
                start_isLowAnomalyy = timestamp
            }
            //console.log('counter_isLowAnomalyy', counter_isLowAnomalyy);
            counter_isLowAnomalyy++
            if(break_isLowAnomalyy){
                //console.log('logAnomaly', "LowAnomalyy", counter_isLowAnomalyy);
                this.logAnomaly({
                    'Level' : (counter_isLowAnomalyy < deviation_low_to_mid) ? AnomalyLevel.Low : AnomalyLevel.Mid,
                    'Type' : 'Gaze Deviation',
                    'Details': {
                        'Type':'y-axis deviation', 
                        'Distance': yDistance, 
                        'Axis': y
                    },
                    'Counts' : counter_isLowAnomalyy,
                    'Begin': start_isLowAnomalyy,
                    'End': timestamp
                })
                break_isLowAnomalyy = false;
                counter_isLowAnomalyy = 1;
            }
        }
        else{
            break_isLowAnomalyy = true;
        }

        if(isMidAnomalyx){
            if(counter_isMidAnomalyx == 1){
                start_isMidAnomalyx = timestamp
            }
            //console.log('counter_isMidAnomalyx', counter_isMidAnomalyx);
            counter_isMidAnomalyx++
            if(break_isMidAnomalyx){
                //console.log('logAnomaly', "MidAnomalyx", counter_isMidAnomalyx);
                this.logAnomaly({
                    'Level' : (counter_isMidAnomalyx < deviation_mid_to_high) ? AnomalyLevel.Mid : AnomalyLevel.High,
                    'Type' : 'Gaze Deviation',
                    'Details': {
                        'Type':'x-axis deviation', 
                        'Distance': xDistance, 
                        'Axis': x
                    },
                    'Counts' : counter_isMidAnomalyx,
                    'Begin': start_isMidAnomalyx,
                    'End': timestamp
                })
                break_isMidAnomalyx = false;
                counter_isMidAnomalyx = 1;
            }
        }
        else{
            break_isMidAnomalyx = true;
        }

        if(isMidAnomalyy){
            if(counter_isMidAnomalyy == 1){
                start_isMidAnomalyy = timestamp
            }
            //console.log('counter_isMidAnomalyy', counter_isMidAnomalyy);
            counter_isMidAnomalyy++
            if(break_isMidAnomalyy){
                //console.log('logAnomaly', "MidAnomalyy", counter_isMidAnomalyy);
                this.logAnomaly({
                    'Level' : (counter_isMidAnomalyy < deviation_mid_to_high) ? AnomalyLevel.Mid : AnomalyLevel.High,
                    'Type' : 'Gaze Deviation',
                    'Details': {
                        'Type':'y-axis deviation', 
                        'Distance': yDistance, 
                        'Axis': y
                    },
                    'Counts' : counter_isMidAnomalyy,
                    'Begin': start_isMidAnomalyy,
                    'End': timestamp
                })
                break_isMidAnomalyy = false;
                counter_isMidAnomalyy = 1;
            }
        }
        else{
            break_isMidAnomalyy = true;
        }
    
        // Record the gaze point and its anomaly status
        this.addGazePoint(x, y, timestamp);

        return anomaly_state;
    }

    isTurningSideways(currentWidth: number): boolean {
        return Math.abs(currentWidth - baselinex) > thresholdx;
    }

    isLookingUpDown(currentHeight: number): boolean {
        return Math.abs(currentHeight - baseliney) > thresholdy;
    }

    headPose(keypoints: KeyPoint[], timestamp: number) {
        Calibrating = window.iWatchisCalibrating;
        if(Calibrating){
            return false;
        }
        anomaly_state = false;

        const left = keypoints[234][0];
        const right = keypoints[454][0];
        const top = keypoints[10][1];
        const bottom = keypoints[152][1];

        const width = right - left;
        const height = bottom - top;

        this.isTurningSideways(width);
        this.isLookingUpDown(height);

        if(this.isTurningSideways(width)){
            if(counter_Headposex == 1){
                start_Headposex = timestamp
            }
            //console.log('counter_Headposex', counter_Headposex);
            counter_Headposex++
            if(break_Headposex){
                //console.log('logAnomaly');
                //console.log('logAnomaly', "counter_Headposex", counter_Headposex);
                this.logAnomaly({
                    'Level' : (counter_Headposex < pose_mid_to_high) ? AnomalyLevel.Mid : AnomalyLevel.High,
                    'Type' : 'Head Pose Deviation',
                    'Details': {
                        'Type': 'Turned left/right'
                    },
                    'Counts' : counter_Headposex,
                    'Begin': start_Headposex,
                    'End': timestamp
                })
                break_Headposex = false;
                counter_Headposex = 1;
                if(!(counter_Headposex < pose_mid_to_high)){
                    anomaly_state = true;
                }
            }
        }
        else{
            break_Headposex = true
        }

        if(this.isLookingUpDown(height)){
            if(counter_Headposey == 1){
                start_Headposey = timestamp
            }
            //console.log('counter_Headposey', counter_Headposey);
            counter_Headposey++
            if(break_Headposey){
                //console.log('logAnomaly');
                //console.log('logAnomaly', "counter_Headposey", counter_Headposey);
                this.logAnomaly({
                    'Level' : (counter_Headposey < pose_mid_to_high) ? AnomalyLevel.Mid : AnomalyLevel.High,
                    'Type' : 'Head Pose Deviation',
                    'Details': {
                        'Type': 'Turned up/down'
                    },
                    'Counts' : counter_Headposey,
                    'Begin': start_Headposey,
                    'End': timestamp
                })
                break_Headposey = false;
                counter_Headposey = 1;
                if(!(counter_Headposey < pose_mid_to_high)){
                    anomaly_state = true;
                }
            }
        }
        else{
            break_Headposey = true;
        }

        return false; //change this to 'return anomaly_state' after testing
    }

    objectAnomaly(predictions: Prediction[], timestamp: number) {
        const Calibrating = window.iWatchisCalibrating;
        if (Calibrating) {
            return;
        }
        anomaly_state = false;
        let num_people = 0; // Counter for people
        timestamp = new Date().getSeconds()

        for (const prediction of predictions) {
            if (prediction.class === 'person') {
                num_people++;
            }
            if(prediction.class == 'laptop' || prediction.class == 'cell phone'){
                anomaly_state = true;
                if (Math.abs(last_obj - timestamp) > 5) {
                    last_obj = new Date().getSeconds()
        
                    console.log('logAnomaly', "counter_object");
                    this.logAnomaly({
                        'Level' : AnomalyLevel.High,
                        'Type': 'Object Detected',
                        'Details': {
                            'Type': prediction.class + ' detected',
                            'score': prediction.score
                        },
                        'Counts' : 1,
                        'Begin': start_object,
                        'End': timestamp
                    });
                }
            }
        }

        if (num_people > 1 && Math.abs(last_face - timestamp) > 5) {
            console.log('last_face - timestamp:', Math.abs(last_face - timestamp));
            last_face = timestamp

            console.log('People Detected:', num_people);
            this.logAnomaly({
                'Level': AnomalyLevel.High, // Set level as per your requirement
                'Type': 'Object Detected',
                'Details': {
                    'Type': 'Multiple People Detected',
                    'Number of People': num_people
                },
                'Begin': timestamp,
                'End': timestamp
            });
            anomaly_state = true;
        }

        console.log('returning anomaly_state', anomaly_state)
        return anomaly_state;
    }

    sendMultipleFaceLog(timestamp: number) {
        this.logAnomaly({
            'Level' : AnomalyLevel.High,
            'Type': 'Object Detected',
            'Details': {
                'Type': 'Multiple Face Detected',
            },
            'Counts' : 1,
            'Begin': timestamp,
            'End': timestamp
        })
    }

    onMonitoringEnd() {
        
        //SEND TO HOST TO ADD STATUS
        const messageData = {
            msg: "Monitoring End",
            createdTimestamp: timeNow(),
            msgId: getUniqueID(),
            isDeleted: false,
        };

        events.send(
            EventNames.UPDATE_STATUS,
            JSON.stringify({
                value: messageData,
                action: 'iWatch_Disabled',
            }),
            EventPersistLevel.LEVEL3,
            window.iwatchhostuid,
        );
        
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
    
    sendLogs = async (): Promise<void> => {
        const messageData = {
          msg: "Monitoring End",
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
}