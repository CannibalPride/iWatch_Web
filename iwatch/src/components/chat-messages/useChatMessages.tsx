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
import {createHook} from 'customization-implementation';
import React, {useState, useEffect, useRef, useContext} from 'react';
import {useRender} from 'customization-api';
import {SidePanelType} from '../../subComponents/SidePanelEnum';
import {useLocalUid, UidType} from '../../../agora-rn-uikit';
import events, {EventPersistLevel} from '../../rtm-events-api';
import {EventNames} from '../../rtm-events';
import {useChatUIControl} from '../chat-ui/useChatUIControl';
import {useChatNotification} from '../chat-notification/useChatNotification';
import Toast from '../../../react-native-toast-message';
import {timeNow} from '../../rtm/utils';
import {useSidePanel} from '../../utils/useSidePanel';
import { MonitorContext } from '../MonitorContext';
import getUniqueID from '../../utils/getUniqueID';

enum ChatMessageActionEnum {
  Create = 'Create_Chat_Message',
  Update = 'Update_Chat_Message',
  Delete = 'Delete_Chat_Message',
  Log   = 'Create_Log_Message',
  iWatch_Enabled   = 'iWatch_Enabled',
  iWatch_Disabled   = 'iWatch_Disabled',
  iWatch_Calibration_Started   = 'iWatch_Calibration_Started',
  iWatch_Calibration_Ended   = 'iWatch_Calibration_Ended',
  Anomaly_True = 'Anomaly_True',
  Anomaly_False = 'Anomaly_False',
}

interface ChatMessagesProviderProps {
  children: React.ReactNode;
}
export interface messageInterface {
  createdTimestamp: number;
  updatedTimestamp?: number;
  msg: string;
  msgId: string;
  isDeleted: boolean;
}
export interface messageStoreInterface extends messageInterface {
  uid: UidType;
}

interface ChatMessagesInterface {
  messageStore: messageStoreInterface[];
  privateMessageStore: {[key: string]: messageStoreInterface[]};
  logsStore: {[key: string]: messageStoreInterface[]};
  sendLogEntry: (msg: string, toUid?: UidType) => void;
  sendChatMessage: (msg: string, toUid?: UidType) => void;
  editChatMessage: (msgId: string, msg: string, toUid?: UidType) => void;
  deleteChatMessage: (msgId: string, toUid?: UidType) => void;
}

const ChatMessagesContext = React.createContext<ChatMessagesInterface>({
  messageStore: [],
  privateMessageStore: {},
  logsStore: {},
  sendLogEntry: () => {},
  sendChatMessage: () => {},
  editChatMessage: () => {},
  deleteChatMessage: () => {},
});

const ChatMessagesProvider = (props: ChatMessagesProviderProps) => {
  const {renderList} = useRender();
  const localUid = useLocalUid();
  const {setSidePanel} = useSidePanel();
  const {
    groupActive,
    logsActive,
    selectedChatUserId,
    setGroupActive,
    setPrivateActive,
    setLogsActive,
    setSelectedChatUserId,
  } = useChatUIControl();
  const {
    setUnreadGroupMessageCount,
    setUnreadIndividualMessageCount,
    unreadPrivateMessageCount,
    unreadIndividualMessageCount,
    setUnreadPrivateMessageCount,
    
    unreadIndividualLogsCount,
    setUnreadIndividualLogsCount,
    unreadLogsCount,
    setUnreadLogsCount,
  } = useChatNotification();
  const [messageStore, setMessageStore] = useState<messageStoreInterface[]>([]);
  const [privateMessageStore, setPrivateMessageStore] = useState<{
    [key: string]: messageStoreInterface[];
  }>({});
  const [logsStore, setLogsStore] = useState<{
    [key: string]: messageStoreInterface[];
  }>({});

  const renderListRef = useRef({renderList: renderList});
  const groupActiveRef = useRef<boolean>();
  const individualActiveRef = useRef<string | number>();

  const { 
    setCalibratingStatus, setMonitoringStatus, setCalibratedStatus, AnomalyTrue, AnomalyFalse
  } = useContext(MonitorContext);

  //commented for v1 release
  //const fromText = useString('messageSenderNotificationLabel');
  const fromText = (name: string) => `From : ${name}`;
  useEffect(() => {
    renderListRef.current.renderList = renderList;
  }, [renderList]);

  useEffect(() => {
    groupActiveRef.current = groupActive;
  }, [groupActive]);

  useEffect(() => {
    individualActiveRef.current = selectedChatUserId;
  }, [selectedChatUserId]);

  React.useEffect(() => {
    const showMessageNotification = (
      msg: string,
      uid: string,
      isPrivateMessage: boolean = false,
    ) => {
      const uidAsNumber = parseInt(uid);
      Toast.show({
        type: 'success',
        text1: msg.length > 30 ? msg.slice(0, 30) + '...' : msg,
        text2: renderListRef.current.renderList[uidAsNumber]?.name
          ? fromText(renderListRef.current.renderList[uidAsNumber]?.name)
          : '',
        visibilityTime: 1000,
        onPress: () => {
          if (isPrivateMessage) {
            setUnreadPrivateMessageCount(
              unreadPrivateMessageCount -
                (unreadIndividualMessageCount[uidAsNumber] || 0),
            );
            setUnreadIndividualMessageCount((prevState) => {
              return {
                ...prevState,
                [uidAsNumber]: 0,
              };
            });
            setGroupActive(false);
            setSelectedChatUserId(uidAsNumber);
            setPrivateActive(true);
          } else {
            setUnreadGroupMessageCount(0);
            setPrivateActive(false);
            setSelectedChatUserId(0);
            setGroupActive(true);
          }
          setSidePanel(SidePanelType.Chat);
        },
      });
    };
    
    const showLogNotification = (
      msg: string,
      uid: string,
    ) => {
      const uidAsNumber = parseInt(uid);
      Toast.show({
        type: 'success',
        text1: msg.length > 30 ? msg.slice(0, 30) + '...' : msg,
        text2: renderListRef.current.renderList[uidAsNumber]?.name
          ? fromText(renderListRef.current.renderList[uidAsNumber]?.name)
          : '',
        visibilityTime: 1000,
        onPress: () => {
          setUnreadLogsCount(
            unreadLogsCount -
              (unreadIndividualLogsCount[uidAsNumber] || 0),
          );
          setUnreadIndividualLogsCount((prevState) => {
            return {
              ...prevState,
              [uidAsNumber]: 0,
            };
          });
          setGroupActive(false);
          setSelectedChatUserId(uidAsNumber);
          setPrivateActive(false);
          setLogsActive(true);
          
          setSidePanel(SidePanelType.Logs);
        },
      });
    };

    events.on(EventNames.PUBLIC_CHAT_MESSAGE, (data) => {
      const payload = JSON.parse(data.payload);
      const messageAction = payload.action;
      const messageData = payload.value;
      switch (messageAction) {
        case ChatMessageActionEnum.Create:
          showMessageNotification(messageData.msg, `${data.sender}`);
          addMessageToStore(data.sender, {
            msg: messageData.msg,
            createdTimestamp: messageData.createdTimestamp,
            isDeleted: messageData.isDeleted,
            msgId: messageData.msgId,
          });
          /**
           * if chat group window is not active.
           * then we will increment the unread count
           */
          if (!groupActiveRef.current) {
            setUnreadGroupMessageCount((prevState) => {
              return prevState + 1;
            });
          }
          break;
        case ChatMessageActionEnum.Update:
          setMessageStore((prevState) => {
            const newState = prevState.map((item) => {
              if (
                item.msgId === messageData.msgId &&
                item.uid === data.sender
              ) {
                return {
                  ...item,
                  msg: messageData.msg,
                  updatedTimestamp: messageData.updatedTimestamp,
                };
              } else {
                return item;
              }
            });
            return newState;
          });
          break;
        case ChatMessageActionEnum.Delete:
          setMessageStore((prevState) => {
            const newState = prevState.map((item) => {
              if (
                item.msgId === messageData.msgId &&
                item.uid === data.sender
              ) {
                return {
                  ...item,
                  isDeleted: true,
                  updatedTimestamp: messageData.updatedTimestamp,
                };
              } else {
                return item;
              }
            });
            return newState;
          });
          break;
        default:
          break;
      }
    });
    events.on(EventNames.PRIVATE_CHAT_MESSAGE, (data) => {
      const payload = JSON.parse(data.payload);
      const messageAction = payload.action;
      const messageData = payload.value;
      switch (messageAction) {
        case ChatMessageActionEnum.Create:
          showMessageNotification(messageData.msg, `${data.sender}`, true);
          addMessageToPrivateStore(
            data.sender,
            {
              msg: messageData.msg,
              createdTimestamp: messageData.createdTimestamp,
              msgId: messageData.msgId,
              isDeleted: messageData.isDeleted,
            },
            false,
          );
          /**
           * if user's private window is active.
           * then we will not increment the unread count
           */

          if (!(individualActiveRef.current === data.sender)) {
            setUnreadIndividualMessageCount((prevState) => {
              const prevCount =
                prevState && prevState[data.sender]
                  ? prevState[data.sender]
                  : 0;
              return {
                ...prevState,
                [data.sender]: prevCount + 1,
              };
            });
          }
          break;
        case ChatMessageActionEnum.Update:
          setPrivateMessageStore((prevState) => {
            const privateChatOfUid = prevState[data.sender];
            const updatedData = privateChatOfUid.map((item) => {
              if (
                item.msgId === messageData.msgId &&
                item.uid === data.sender
              ) {
                return {
                  ...item,
                  msg: messageData.msg,
                  updatedTimestamp: messageData.updatedTimestamp,
                };
              } else {
                return item;
              }
            });
            const newState = {
              ...prevState,
              [data.sender]: updatedData,
            };
            return newState;
          });
          break;
        case ChatMessageActionEnum.Delete:
          setPrivateMessageStore((prevState) => {
            const privateChatOfUid = prevState[data.sender];
            const updatedData = privateChatOfUid.map((item) => {
              if (
                item.msgId === messageData.msgId &&
                item.uid === data.sender
              ) {
                return {
                  ...item,
                  isDeleted: true,
                  updatedTimestamp: messageData.updatedTimestamp,
                };
              } else {
                return item;
              }
            });
            const newState = {
              ...prevState,
              [data.sender]: updatedData,
            };
            return newState;
          });
          break;
        default:
          break;
      }
    });
    // IWATCH -------------------------------------------------------------//
    events.on(EventNames.LOG_MESSAGE, (data) => {
      const payload = JSON.parse(data.payload);
      const messageData = payload.value;
      
      if(messageData.msg.Level == 'High'){
        showLogNotification(messageData.msg.Details.Type, `${data.sender}`);
      }

      addLogToStore(localUid, messageData, true);
      console.log("addLogToStore: ",localUid, messageData, true)

      addLogToStore(
        data.sender,
        {
          msg: messageData.msg,
          createdTimestamp: messageData.createdTimestamp,
          msgId: messageData.msgId,
          isDeleted: messageData.isDeleted,
        },
        false,
      );
      console.log(
        "addLogToStore: ",
        data.sender,
        {
          msg: messageData.msg,
          createdTimestamp: messageData.createdTimestamp,
          msgId: messageData.msgId,
          isDeleted: messageData.isDeleted,
        },
        false
      )
      
      /**
       * if user's private window is active.
       * then we will not increment the unread count
       */

      if(messageData.msg.Level == 'High'){
        if (!(individualActiveRef.current === data.sender)) {
          setUnreadIndividualLogsCount((prevState) => {
            const prevCount =
              prevState && prevState[data.sender]
                ? prevState[data.sender]
                : 0;
            return {
              ...prevState,
              [data.sender]: prevCount + 1,
            };
          });
        }
      }
    });
    // IWATCH -------------------------------------------------------------//
    // IWATCH -------------------------------------------------------------//
    events.on(EventNames.UPDATE_STATUS, (data) => {
      const payload = JSON.parse(data.payload);
      const messageAction = payload.action;
      const messageData = payload.value;
      
      switch (messageAction) {
        case ChatMessageActionEnum.iWatch_Enabled:
          setMonitoringStatus(data.sender, true);
          console.log("DEBUG IWATCH ENABLED");
          break;
        case ChatMessageActionEnum.iWatch_Calibration_Started:
          setCalibratingStatus(data.sender, true);
          break;
        case ChatMessageActionEnum.iWatch_Calibration_Ended:
          setCalibratingStatus(data.sender, false);
          setCalibratedStatus(data.sender, true);
          break;
        case ChatMessageActionEnum.iWatch_Disabled:
          setCalibratingStatus(data.sender, false);
          setMonitoringStatus(data.sender, false);
          console.log("DEBUG IWATCH DISABLED");
          break;
        default:
          break;
      }
      
      
    });
    // IWATCH -------------------------------------------------------------//
    events.on(EventNames.ANOMALY_STATUS, (data) => {
      const payload = JSON.parse(data.payload);
      const messageAction = payload.action;
      const messageData = payload.value;
      
      switch (messageAction) {
        case ChatMessageActionEnum.Anomaly_True:
          AnomalyTrue(data.sender)
          break;
        case ChatMessageActionEnum.Anomaly_False:
          AnomalyFalse(data.sender)
          break;
        default:
          break;
      }
      
      
    });
    // IWATCH -------------------------------------------------------------//
  }, []);

  const addMessageToStore = (uid: UidType, body: messageInterface) => {
    setMessageStore((m: messageStoreInterface[]) => {
      return [
        ...m,
        {
          createdTimestamp: body.createdTimestamp,
          uid,
          msg: body.msg,
          msgId: body.msgId,
          isDeleted: body.isDeleted,
        },
      ];
    });
  };

  const addMessageToPrivateStore = (
    uid: UidType,
    body: messageInterface,
    local: boolean,
  ) => {
    setPrivateMessageStore((state) => {
      let newState = {...state};
      newState[uid] !== undefined
        ? (newState[uid] = [
            ...newState[uid],
            {
              createdTimestamp: body.createdTimestamp,
              uid: local ? localUid : uid,
              msg: body.msg,
              msgId: body.msgId,
              isDeleted: body.isDeleted,
            },
          ])
        : (newState = {
            ...newState,
            [uid]: [
              {
                createdTimestamp: body.createdTimestamp,
                uid: local ? localUid : uid,
                msg: body.msg,
                msgId: body.msgId,
                isDeleted: body.isDeleted,
              },
            ],
          });
      return {...newState};
    });
  };
  
  const addLogToStore = (
    uid: UidType,
    body: messageInterface,
    local: boolean,
  ) => {
    setLogsStore((state) => {
      let newState = {...state};
      newState[uid] !== undefined
        ? (newState[uid] = [
            ...newState[uid],
            {
              createdTimestamp: body.createdTimestamp,
              uid: local ? localUid : uid,
              msg: body.msg,
              msgId: body.msgId,
              isDeleted: body.isDeleted,
            },
          ])
        : (newState = {
            ...newState,
            [uid]: [
              {
                createdTimestamp: body.createdTimestamp,
                uid: local ? localUid : uid,
                msg: body.msg,
                msgId: body.msgId,
                isDeleted: body.isDeleted,
              },
            ],
          });
      return {...newState};
    });
  };

  const sendLogEntry = (msg: string, toUid?: UidType) => {
    if (typeof msg == 'string' && msg.trim() === '') return;
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
        action: ChatMessageActionEnum.Create,
      }),
      EventPersistLevel.LEVEL1,
      toUid,
    );
    addLogToStore(toUid, messageData, true);
  };

  const sendChatMessage = (msg: string, toUid?: UidType) => {
    if (typeof msg == 'string' && msg.trim() === '') return;
    if (toUid) {
      const messageData = {
        msg,
        createdTimestamp: timeNow(),
        msgId: getUniqueID(),
        isDeleted: false,
      };
      events.send(
        EventNames.PRIVATE_CHAT_MESSAGE,
        JSON.stringify({
          value: messageData,
          action: ChatMessageActionEnum.Create,
        }),
        EventPersistLevel.LEVEL1,
        toUid,
      );
      addMessageToPrivateStore(toUid, messageData, true);
    } else {
      const messageData = {
        msg,
        msgId: getUniqueID(),
        isDeleted: false,
        createdTimestamp: timeNow(),
      };
      events.send(
        EventNames.PUBLIC_CHAT_MESSAGE,
        JSON.stringify({
          value: messageData,
          action: ChatMessageActionEnum.Create,
        }),
        EventPersistLevel.LEVEL1,
      );
      addMessageToStore(localUid, messageData);
    }
  };

  const editChatMessage = (msgId: string, msg: string, toUid?: UidType) => {
    if (typeof msg == 'string' && msg.trim() === '') return;
    if (toUid) {
      const checkData = privateMessageStore[toUid].filter(
        (item) => item.msgId === msgId && item.uid === localUid,
      );
      if (checkData && checkData.length) {
        const editMsgData = {msg, updatedTimestamp: timeNow()};
        events.send(
          EventNames.PRIVATE_CHAT_MESSAGE,
          JSON.stringify({
            value: {msgId, ...editMsgData},
            action: ChatMessageActionEnum.Update,
          }),
          EventPersistLevel.LEVEL1,
          toUid,
        );
        setPrivateMessageStore((prevState) => {
          const privateChatOfUid = prevState[toUid];
          const updatedData = privateChatOfUid.map((item) => {
            if (item.msgId === msgId) {
              return {...item, ...editMsgData};
            } else {
              return item;
            }
          });
          const newState = {...prevState, [toUid]: updatedData};
          return newState;
        });
      } else {
        console.log("You don't have permission to edit");
      }
    } else {
      //check if user has permission to edit
      const checkData = messageStore.filter(
        (item) => item.msgId === msgId && item.uid === localUid,
      );
      if (checkData && checkData.length) {
        const editMsgData = {msg, updatedTimestamp: timeNow()};
        events.send(
          EventNames.PUBLIC_CHAT_MESSAGE,
          JSON.stringify({
            value: {msgId, ...editMsgData},
            action: ChatMessageActionEnum.Update,
          }),
          EventPersistLevel.LEVEL1,
        );
        setMessageStore((prevState) => {
          const newState = prevState.map((item) => {
            if (item.msgId === msgId) {
              return {...item, ...editMsgData};
            } else {
              return item;
            }
          });
          return newState;
        });
      } else {
        console.log("You don't have permission to edit");
      }
    }
  };

  const deleteChatMessage = (msgId: string, toUid?: UidType) => {
    if (toUid) {
      const checkData = privateMessageStore[toUid].filter(
        (item) => item.msgId === msgId && item.uid === localUid,
      );
      if (checkData && checkData.length) {
        const deleteMsgData = {updatedTimestamp: timeNow()};
        events.send(
          EventNames.PRIVATE_CHAT_MESSAGE,
          JSON.stringify({
            value: {msgId, ...deleteMsgData},
            action: ChatMessageActionEnum.Delete,
          }),
          EventPersistLevel.LEVEL1,
          toUid,
        );
        setPrivateMessageStore((prevState) => {
          const privateChatOfUid = prevState[toUid];
          const updatedData = privateChatOfUid.map((item) => {
            if (item.msgId === msgId) {
              return {...item, isDeleted: true, ...deleteMsgData};
            } else {
              return item;
            }
          });
          const newState = {...prevState, [toUid]: updatedData};
          return newState;
        });
      } else {
        console.log("You don't have permission to delete");
      }
    } else {
      //check if user has permission to delete
      const checkData = messageStore.filter(
        (item) => item.msgId === msgId && item.uid === localUid,
      );
      if (checkData && checkData.length) {
        const deleteMsgData = {updatedTimestamp: timeNow()};
        events.send(
          EventNames.PUBLIC_CHAT_MESSAGE,
          JSON.stringify({
            value: {msgId, ...deleteMsgData},
            action: ChatMessageActionEnum.Delete,
          }),
          EventPersistLevel.LEVEL1,
        );
        setMessageStore((prevState) => {
          const newState = prevState.map((item) => {
            if (item.msgId === msgId) {
              return {...item, isDeleted: true, ...deleteMsgData};
            } else {
              return item;
            }
          });
          return newState;
        });
      } else {
        console.log("You don't have permission to delete");
      }
    }
  };

  return (
    <ChatMessagesContext.Provider
      value={{
        messageStore,
        privateMessageStore,
        logsStore,
        sendLogEntry,
        sendChatMessage,
        editChatMessage,
        deleteChatMessage,
      }}>
      {props.children}
    </ChatMessagesContext.Provider>
  );
};

const useChatMessages = createHook(ChatMessagesContext);

export {ChatMessagesProvider, useChatMessages};
