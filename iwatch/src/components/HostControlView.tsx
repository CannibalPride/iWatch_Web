/*
********************************************
 Copyright © 2021 Agora Lab, Inc., all rights reserved.
 AppBuilder and all associated components, source code, APIs, services, and documentation 
 (the “Materials”) are owned by Agora Lab, Inc. and its licensors. The Materials may not be 
 accessed, used, modified, or distributed for any purpose without a license from Agora Lab, Inc.  
 Use without a license or in violation of any license terms and conditions (including use for 
 any purpose competitive to Agora Lab, Inc.’s business) is strictly prohibited. For more 
 information visit https://appbuilder.agora.io. 
*********************************************
*/
import React, {useContext} from 'react';
import {View, Text, StyleSheet} from 'react-native';
import SecondaryButton from '../atoms/SecondaryButton';
import {useString} from '../utils/useString';
import useRemoteMute, {MUTE_REMOTE_TYPE} from '../utils/useRemoteMute';
import { MonitorContext } from './MonitorContext';
import {useChatMessages} from '../components/chat-messages/useChatMessages';

import useGetName from '../utils/useGetName';
import useRemoteMonitor, { MONITOR_REMOTE_TYPE } from '../utils/useRemoteMonitor';

import getUniqueID from '../utils/getUniqueID';
import events, {EventPersistLevel} from '../rtm-events-api';
import {EventNames} from '../rtm-events';
import {timeNow} from '../rtm/utils';

export interface MuteAllAudioButtonProps {
  render?: (onPress: () => void) => JSX.Element;
}

export const MuteAllAudioButton = (props: MuteAllAudioButtonProps) => {
  const muteRemoteAudio = useRemoteMute();
  //commented for v1 release
  //const muteAllAudioButton = useString('muteAllAudioButton')();
  const muteAllAudioButton = 'Mute all audios';
  const onPress = () => muteRemoteAudio(MUTE_REMOTE_TYPE.audio);

  return props?.render ? (
    props.render(onPress)
  ) : (
    <SecondaryButton onPress={onPress} text={muteAllAudioButton} />
  );
};

export interface MuteAllVideoButtonProps {
  render?: (onPress: () => void) => JSX.Element;
}
export const MuteAllVideoButton = (props: MuteAllVideoButtonProps) => {
  const muteRemoteVideo = useRemoteMute();

  //commented for v1 release
  //const muteAllVideoButton = useString('muteAllVideoButton')();
  const muteAllVideoButton = 'Mute all videos';
  const onPress = () => muteRemoteVideo(MUTE_REMOTE_TYPE.video);

  return props?.render ? (
    props.render(onPress)
  ) : (
    <SecondaryButton onPress={onPress} text={muteAllVideoButton} />
  );
};

export interface StartMonitoringButtonProps {
  render?: (onPress: () => void) => JSX.Element;
}
export const StartMonitoringButton = (props: StartMonitoringButtonProps) => {
  const startMonitoring = useRemoteMonitor();
  const { 
    isMonitoring, isGlobalMonitoring, setGlobalMonitoring, setOpenReportModal
  } = useContext(MonitorContext);
  
  const onPress = () => {
    if(isGlobalMonitoring){
      setOpenReportModal(true)
    }
    startMonitoring(MONITOR_REMOTE_TYPE.monitor);

    setGlobalMonitoring(!isGlobalMonitoring);
    const monitoringStatus = isGlobalMonitoring ? 'Stopped Monitoring' : 'Started Monitoring';
    console.log(monitoringStatus);
  };

  return props?.render ? (
    props.render(onPress)
  ) : (
    <SecondaryButton onPress={onPress} text={isGlobalMonitoring ? 'Stop Monitoring' : 'Start Monitoring'} />
  );
};

export interface RefreshProps {
  render?: (onPress: () => void) => JSX.Element;
}
export const Refresh = (props: RefreshProps) => {
  const { 
    isMonitoring, isGlobalMonitoring,
    isCalibrating, isCalibrated, isAnomalous, setOpenReportModal,
  } = useContext(MonitorContext);
  
  const onPress = () => {
    const uid = window.iwatchuid;
    setOpenReportModal(true);
    console.log('uid: ' + uid);
    console.log('isMonitoring', isMonitoring);
    console.log('isGlobalMonitoring', isGlobalMonitoring);
    console.log('isCalibrating', isCalibrating);
    console.log('isCalibrated', isCalibrated);
    console.log('isAnomalous', isAnomalous);
  };

  return props?.render ? (
    props.render(onPress)
  ) : (
    <SecondaryButton onPress={onPress} text={'Debug'} />
  );
};

export interface ShowProps {
  render?: (onPress: () => void) => JSX.Element;
}

const HostControlView = () => {
  //commented for v1 release
  //const hostControlsLabel = useString('hostControlsLabel')();
  const hostControlsLabel = 'Host Controls';
  return (
    <>
      <Text style={style.heading}>{hostControlsLabel}</Text>
      <View>
        <View style={style.btnContainer}>
          <MuteAllAudioButton />
        </View>
        {!$config.AUDIO_ROOM && (
          <View style={style.btnContainer}>
            <MuteAllVideoButton />
          </View>
        )}
        <View style={style.btnContainer}>
          <StartMonitoringButton />
        </View>
        <View style={style.btnContainer}>
          <Refresh />
        </View>
      </View>
    </>
  );
};

const style = StyleSheet.create({
  heading: {
    fontSize: 20,
    fontWeight: '700',
    color: $config.PRIMARY_FONT_COLOR,
    // marginBottom: 20,
    alignSelf: 'center',
  },
  btnContainer: {
    alignItems: 'center',
    marginVertical: 15,
  },
});

export default HostControlView;
