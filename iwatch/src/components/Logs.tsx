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
import React, {useState, useContext} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import LogContainer from './LogContainer';
import ChatInput from '../subComponents/ChatInput';
import PrimaryButton from '../atoms/PrimaryButton';
import LogComponents from './LogComponents';
import ColorContext from './ColorContext';
import {useChatNotification} from './chat-notification/useChatNotification';
import {useString} from '../utils/useString';
import {isIOS, isValidReactComponent, isWebInternal} from '../utils/common';
import {useChatUIControl} from './chat-ui/useChatUIControl';
import {useCustomization} from 'customization-implementation';
import {UidType} from '../../agora-rn-uikit';
import {ChatBubbleProps} from './ChatContext';
import {
  ChatTextInputProps,
  ChatSendButtonProps,
} from '../subComponents/ChatInput';

interface ChatProps {
  chatBubble?: React.ComponentType<ChatBubbleProps>;
  chatInput?: React.ComponentType<ChatTextInputProps>;
  chatSendButton?: React.ComponentType<ChatSendButtonProps>;
}

const Logs = (props?: ChatProps) => {
  // commented for v1 release
  // const groupChatLabel = useString('groupChatLabel')();
  // const privateChatLabel = useString('privateChatLabel')();
  const groupChatLabel = 'Group';
  const privateChatLabel = 'Private';
  const logLabel = 'Logs';
  const [dim, setDim] = useState([
    Dimensions.get('window').width,
    Dimensions.get('window').height,
    Dimensions.get('window').width > Dimensions.get('window').height,
  ]);
  const isSmall = dim[0] < 700;

  const {
    groupActive,
    setGroupActive,
    privateActive,
    setPrivateActive,
    logsActive,
    setLogsActive,
    setSelectedChatUserId: setSelectedUser,
  } = useChatUIControl();
  const {
    unreadIndividualLogsCount,
    setUnreadIndividualLogsCount,
    unreadLogsCount,
    setUnreadLogsCount,
  } = useChatNotification();

  const {primaryColor} = useContext(ColorContext);

  React.useEffect(() => {
    return () => {
      // reset both the active tabs
      setGroupActive(false);
      setPrivateActive(false);
      setLogsActive(false);
      setSelectedUser(0);
    };
  }, []);

  const selectUserLogs = (userUID: UidType) => {
    setSelectedUser(userUID);
    setLogsActive(true);
    setPrivateActive(false);
    setUnreadIndividualLogsCount((prevState) => {
      return {
        ...prevState,
        [userUID]: 0,
      };
    });
    setUnreadLogsCount(
      unreadLogsCount - (unreadIndividualLogsCount[userUID] || 0),
    );
  };

  const {ChatAfterView, ChatBeforeView} = useCustomization((data) => {
    let components: {
      ChatAfterView: React.ComponentType;
      ChatBeforeView: React.ComponentType;
    } = {
      ChatAfterView: React.Fragment,
      ChatBeforeView: React.Fragment,
    };
    if (
      data?.components?.videoCall &&
      typeof data?.components?.videoCall === 'object'
    ) {
      // commented for v1 release
      // if (
      //   data?.components?.videoCall?.chat &&
      //   typeof data?.components?.videoCall?.chat === 'object'
      // ) {
      //   if (
      //     data?.components?.videoCall?.chat?.after &&
      //     isValidReactComponent(data?.components?.videoCall?.chat?.after)
      //   ) {
      //     components.ChatAfterView = data?.components?.videoCall?.chat?.after;
      //   }
      //   if (
      //     data?.components?.videoCall?.chat?.before &&
      //     isValidReactComponent(data?.components?.videoCall?.chat?.before)
      //   ) {
      //     components.ChatBeforeView = data?.components?.videoCall?.chat?.before;
      //   }
      // }
    }
    return components;
  });

  const Label = "iWatch"

  const DownloadLogsTitle = 'Download Logs';
  const DownloadParticipantLogsTitle = 'Download Participant Logs';
  const disabled = false;

  return (
    <>
      <View
        style={
          isWebInternal()
            ? !isSmall
              ? style.chatView
              : style.chatViewNative
            : style.chatViewNative
        }>
        {/**
         * In Native device we are setting absolute view. so placed ChatBeforeView and ChatAfterView inside the main view
         */}
        <ChatBeforeView />
        <View style={[style.padding10]}>
          <View style={style.lineUnderHeading}>
            <Text style={style.mainHeading}>{Label}</Text>
          </View>
        </View>
        {!logsActive ? (
            <>
            <LogComponents selectUserLogs={selectUserLogs} />
            </>
          ) : (
            <>
              <LogContainer {...props} />
              <View
                style={[style.chatInputLineSeparator, {marginBottom: 0}]}
              />
            </>
          )}
        <ChatAfterView />
      </View>
    </>
  );
};

const style = StyleSheet.create({
  // Add the style for the "Download" button
  downloadButton: {
    backgroundColor: $config.PRIMARY_FONT_COLOR, // Change to your desired button color
    borderRadius: 5,
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignSelf: 'center',
    marginTop: 10, // Adjust the spacing from the chat messages
  },

  // Style for the text inside the "Download" button
  downloadButtonText: {
    color: $config.PRIMARY_FONT_COLOR + '60',
    fontSize: 16, // Change to your desired font size
    fontWeight: 'bold', // Change to your desired font weight
  },
  
  padding10: {
    padding: 10,
  },
  lineUnderHeading: {
    borderBottomWidth: 2,
    borderBottomColor: $config.PRIMARY_COLOR,
  },
  mainHeading: {
    fontSize: 20,
    letterSpacing: 0.8,
    lineHeight: 30,
    color: $config.PRIMARY_FONT_COLOR,
  },
  chatView: {
    width: '20%',
    minWidth: 200,
    maxWidth: 300,
    backgroundColor: $config.SECONDARY_FONT_COLOR,
    flex: 1,
    shadowColor: $config.PRIMARY_FONT_COLOR + '80',
    shadowOpacity: 0.5,
    shadowOffset: {width: -2, height: 1},
    shadowRadius: 3,
  },
  chatViewNative: {
    position: 'absolute',
    zIndex: 5,
    width: '100%',
    height: '100%',
    right: 0,
    bottom: 0,
    backgroundColor: $config.SECONDARY_FONT_COLOR,
  },
  heading: {
    backgroundColor: $config.SECONDARY_FONT_COLOR,
    width: 150,
    height: '7%',
    paddingLeft: 20,
    flexDirection: 'row',
  },
  headingText: {
    flex: 1,
    paddingLeft: 5,
    marginVertical: 'auto',
    fontWeight: '700',
    color: $config.PRIMARY_FONT_COLOR,
    fontSize: 25,
    alignSelf: 'center',
    justifyContent: 'center',
  },
  chatNav: {
    flexDirection: 'row',
    height: '6%',
  },
  chatInputContainer: {
    backgroundColor: $config.SECONDARY_FONT_COLOR,
    paddingBottom: 10,
  },
  chatInputLineSeparator: {
    backgroundColor: $config.PRIMARY_FONT_COLOR + '80',
    width: '100%',
    height: 1,
    marginHorizontal: -20,
    alignSelf: 'center',
    opacity: 0.5,
    marginBottom: 10,
  },
  groupActive: {
    backgroundColor: $config.SECONDARY_FONT_COLOR,
    flex: 1,
    height: '100%',
    textAlign: 'center',
    alignItems: 'center',
    justifyContent: 'center',
  },
  group: {
    backgroundColor: $config.PRIMARY_FONT_COLOR + 22,
    flex: 1,
    height: '100%',
    textAlign: 'center',
    borderBottomRightRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  privateActive: {
    backgroundColor: $config.SECONDARY_FONT_COLOR,
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  private: {
    backgroundColor: $config.PRIMARY_FONT_COLOR + 22,
    flex: 1,
    height: '100%',
    borderBottomLeftRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupTextActive: {
    marginVertical: 'auto',
    fontWeight: '700',
    textAlign: 'center',
    fontSize: 16,
    color: $config.PRIMARY_FONT_COLOR,
    justifyContent: 'center',
    paddingVertical: 5,
  },
  groupText: {
    marginVertical: 'auto',
    fontWeight: '700',
    textAlign: 'center',
    fontSize: 16,
    paddingVertical: 5,
    justifyContent: 'center',
    color: $config.PRIMARY_FONT_COLOR + 50,
  },
  chatNotification: {
    width: 20,
    height: 20,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: $config.PRIMARY_COLOR,
    color: $config.SECONDARY_FONT_COLOR,
    fontFamily: isIOS() ? 'Helvetica' : 'sans-serif',
    borderRadius: 10,
    position: 'absolute',
    left: 25,
    top: -5,
  },
  chatNotificationPrivate: {
    width: 20,
    height: 20,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: $config.PRIMARY_COLOR,
    color: $config.SECONDARY_FONT_COLOR,
    fontFamily: isIOS() ? 'Helvetica' : 'sans-serif',
    borderRadius: 10,
    position: 'absolute',
    right: 20,
    top: 0,
  },
});

export default Logs;
