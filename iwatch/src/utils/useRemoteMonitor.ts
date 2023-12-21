import {useMeetingInfo} from '../components/meeting-info/useMeetingInfo';
import {controlMessageEnum} from '../components/ChatContext';
import {UidType} from '../../agora-rn-uikit';
import events, {EventPersistLevel} from '../rtm-events-api';

export enum MONITOR_REMOTE_TYPE {
  sendLog,
  monitor,
}
/**
 * Returns an asynchronous function to toggle muted state of the given track type for a remote user with the given uid or if no uid provided, mutes everyone else in the meeting.
 */
function useRemoteMonitor() {
  const {
    data: {isHost},
  } = useMeetingInfo();
  return async (type: MONITOR_REMOTE_TYPE, uid?: UidType, log?: object) => {
    if (isHost || true) {
      switch (type) {
        case MONITOR_REMOTE_TYPE.sendLog:
          if (uid) {
            events.send(
              controlMessageEnum.sendLog,
              JSON.stringify({
                value: log
              }),
              EventPersistLevel.LEVEL1,
              uid,
            );
          } else {
            events.send(
              controlMessageEnum.sendLog,
              '',
              EventPersistLevel.LEVEL1,
            );
          }
          break;
        case MONITOR_REMOTE_TYPE.monitor:
          if (uid) {
            events.send(
              controlMessageEnum.initiateMonitoring,
              '',
              EventPersistLevel.LEVEL1,
              uid,
            );
          } else {
            events.send(
              controlMessageEnum.initiateMonitoring,
              '',
              EventPersistLevel.LEVEL1,
            );
          }
          break;
      }
    } else {
      console.error('Only a host can access this.');
    }
  };
}

export default useRemoteMonitor;
