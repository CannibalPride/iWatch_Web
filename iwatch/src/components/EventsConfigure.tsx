/*
********************************************
 Copyright © 2022 Agora Lab, Inc., all rights reserved.
 AppBuilder and all associated components, source code, APIs, services, and documentation 
 (the “Materials”) are owned by Agora Lab, Inc. and its licensors. The Materials may not be 
 accessed, used, modified, or distributed for any purpose without a license from Agora Lab, Inc.  
 Use without a license or in violation of any license terms and conditions (including use for 
 any purpose competitive to Agora Lab, Inc.’s business) is strictly prohibited. For more 
 information visit https://appbuilder.agora.io. 
*********************************************
*/
import React, {useContext, useEffect} from 'react';
import {RtcContext} from '../../agora-rn-uikit';
import {controlMessageEnum} from '../components/ChatContext';
import { MonitorContext } from './MonitorContext';

import getUniqueID from '../utils/getUniqueID';
import {timeNow} from '../rtm/utils';
import events, {EventPersistLevel} from '../rtm-events-api';
import {EventNames} from '../rtm-events';
interface Props {
  children: React.ReactNode;
}

const EventsConfigure: React.FC<Props> = (props) => {
  
  const { 
    isMonitoring, isGlobalMonitoring, setGlobalMonitoring,
    isCalibrating, isCalibrated, isModalOpen, ProcessorEnabled,
    startMonitoring, endMonitoring, toggleCalibrating, toggleCalibrated,
    toggleModalOpen, toggleProcessor, reportLogs, addReportLogs
  } = useContext(MonitorContext);
  const {RtcEngine, dispatch} = useContext(RtcContext);
  useEffect(() => {
    events.on(controlMessageEnum.muteVideo, () => {
      RtcEngine.muteLocalVideoStream(true);
      dispatch({
        type: 'LocalMuteVideo',
        value: [0],
      });
    });
    events.on(controlMessageEnum.muteAudio, () => {
      RtcEngine.muteLocalAudioStream(true);
      dispatch({
        type: 'LocalMuteAudio',
        value: [0],
      });
    });
    events.on(controlMessageEnum.kickUser, () => {
      dispatch({
        type: 'EndCall',
        value: [],
      });
    });
    events.on(controlMessageEnum.sendLog, (data) => {
      const parsedPayload = JSON.parse(data.payload);
      const logUser = parsedPayload.value.User;
      const logUID = parsedPayload.value.uid;
      const logTime = parsedPayload.value.Time;
      const logEntry = parsedPayload.value.Log;
      console.log("Log User:", logUser);
      console.log("Log UID:", logUID);
      console.log("Log Time:", logTime);
      console.log("Log Entry:", logEntry);
      console.log('RECEIVED LOG', parsedPayload);

      addReportLogs(logUser, logUID, logTime, logEntry);
    });
    events.on(controlMessageEnum.initiateMonitoring, () => {
      const uid = window.iwatchuid
      console.log('iWatch EVENT: initiateMonitoring');
      if(!isGlobalMonitoring){
        startMonitoring(uid);
        //SEND TO HOST TO ADD STATUS
        const messageData = {
          msg: "Monitoring Started",
          createdTimestamp: timeNow(),
          msgId: getUniqueID(),
          isDeleted: false,
        };
        events.send(
          EventNames.UPDATE_STATUS,
          JSON.stringify({
            value: messageData,
            action: 'iWatch_Enabled',
          }),
          EventPersistLevel.LEVEL3,
          window.iwatchhostuid,
        );
      }
      else{
        endMonitoring(uid);
        //SEND TO HOST TO ADD STATUS
        const messageData = {
          msg: "Monitoring Ended",
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
      }
    });
    return () => {
      events.off(controlMessageEnum.muteVideo);
      events.off(controlMessageEnum.muteAudio);
      events.off(controlMessageEnum.kickUser);
      events.off(controlMessageEnum.sendLog);
      events.off(controlMessageEnum.initiateMonitoring);
      events.off(controlMessageEnum.sendAnomalyStatus);
    };
  }, []);

  return <>{props.children}</>;
};

export default EventsConfigure;
