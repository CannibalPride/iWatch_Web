import React, {useContext, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  useWindowDimensions,
  StyleSheet,
  Image,
  TextStyle,
} from 'react-native';
import { MonitorContext } from './MonitorContext';
import {RFValue} from 'react-native-responsive-fontsize';
import TextWithTooltip from '../subComponents/TextWithTooltip';
import {useString} from '../utils/useString';
import {isIOS, isWebInternal} from '../utils/common';
import {useChatNotification} from './chat-notification/useChatNotification';
import {UidType, useLocalUid} from '../../agora-rn-uikit/src';
import {useRender} from 'customization-api';
import ColorContext from '../components/ColorContext';
import PrimaryButton from '../atoms/PrimaryButton';
import { DownloadLogs } from './DownloadLogs';
import {
  ButtonTemplateName,
  useButtonTemplate,
} from '../utils/useButtonTemplate';
import {
  BtnTemplate,
  BtnTemplateInterface,
  ImageIcon,
} from '../../agora-rn-uikit';
import Styles from './styles';
// @ts-ignore
import iwatch_disabled from './assets/icons/iwatch_disabled.png'
// @ts-ignore
import iwatch_monitoring from './assets/icons/iwatch_monitoring.png'
// @ts-ignore
import iwatch_calibrating from './assets/icons/iwatch_calibrating.png'
// @ts-ignore
import iwatch_active from './assets/icons/iwatch_active.png'
// @ts-ignore
import iwatch_offline from './assets/icons/iwatch_offline.png'

const LogComponents = (props: any) => {
  //commented for v1 release
  //const remoteUserDefaultLabel = useString('remoteUserDefaultLabel')();
  const remoteUserDefaultLabel = 'User';
  const {selectUserLogs} = props;
  const {height, width} = useWindowDimensions();
  const {renderList} = useRender();
  const localUid = useLocalUid();
  const {unreadIndividualLogsCount} = useChatNotification();
  const isChatUser = (userId: UidType, userInfo: any) => {
    return (
      userId !== localUid //user can't chat with own user
      &&
      userInfo?.type === 'rtc'
    );
  };

  const {primaryColor} = useContext(ColorContext);
  
  const { 
    isMonitoring, 
    isCalibrating, 
    isAnomalous,
    AnomalyTrue,
    AnomalyFalse,
  } = useContext(MonitorContext);

  const handleDownloadLogs = () => {
    DownloadLogs(); // Call the function from the imported module
  };

  return (
    <>
    <ScrollView>
      {Object.entries(renderList).map(([uid, value]) => {
        const uidAsNumber = parseInt(uid);
        if (isChatUser(uidAsNumber, value)) {
          return (
            <TouchableOpacity
              style={style.participantContainer}
              key={uid}
              onPress={() => {
                selectUserLogs(uidAsNumber);
              }}>
              {unreadIndividualLogsCount &&
              unreadIndividualLogsCount[uidAsNumber] ? (
                <View style={style.chatNotificationPrivate}>
                  <Text>{unreadIndividualLogsCount[uidAsNumber]}</Text>
                </View>
              ) : null}
              <View style={{flex: 1}}>
                <TextWithTooltip
                  touchable={false}
                  style={[
                    style.participantText,
                    {
                      fontSize: RFValue(16, height > width ? height : width),
                    },
                  ]}
                  value={
                    renderList[uidAsNumber]
                      ? renderList[uidAsNumber].name + ''
                      : remoteUserDefaultLabel
                  }
                />
              </View>

              <View style={style.participantActionContainer}>

                {(!renderList[uidAsNumber]?.offline && !isMonitoring.includes(uidAsNumber)) && 
                  <View style={[style.actionBtnIcon, {marginRight: 30}]}>
                  <Image
                    source={iwatch_disabled}
                    
                    style={[
                      style.buttonIconMic,
                      {
                        tintColor: primaryColor,
                      },
                    ]}
                  />
                  </View>
                }
                {(!renderList[uidAsNumber]?.offline && !isCalibrating.includes(uidAsNumber) && isMonitoring.includes(uidAsNumber)) && 
                  <View style={[style.actionBtnIcon, {marginRight: 30}]}>
                  <Image
                    source={iwatch_active}
                    
                    style={[
                      style.buttonIconMic,
                      {
                        tintColor: isAnomalous.includes(uidAsNumber) ? 'red' : primaryColor,
                      },
                    ]}
                  />
                  </View>
                }
                {(!renderList[uidAsNumber]?.offline && isCalibrating.includes(uidAsNumber)) && 
                  <View style={[style.actionBtnIcon, {marginRight: 30}]}>
                  <Image
                    source={iwatch_calibrating}
                    
                    style={[
                      style.buttonIconMic,
                      {
                        tintColor: 'yellow',
                      },
                    ]}
                  />
                  </View>
                }
                {renderList[uidAsNumber]?.offline && 
                  <View style={[style.actionBtnIcon, {marginRight: 30}]}>
                  <Image
                    source={iwatch_offline}
                    
                    style={[
                      style.buttonIconMic,
                      {
                        tintColor: primaryColor,
                      },
                    ]}
                  />
                  </View>
                }
                

              </View>

              <View>
                <Text
                  style={{
                    color: $config.PRIMARY_FONT_COLOR,
                    fontSize: 18,
                  }}>{`>`}</Text>
              </View>
            </TouchableOpacity>
          );
        }
      })}
    </ScrollView>
    {/* Download all Logs */}
    <View style={{ padding: 5 }}>
      <PrimaryButton onPress={handleDownloadLogs} disabled={false} text={'Download Logs'} />
    </View>
    </>
  );
};

const style = StyleSheet.create({
  participantActionContainer: {
    flexDirection: 'row',
    paddingRight: 5,
    justifyContent: 'flex-end',
  },
  actionBtnIcon: {
    width: 25,
    height: 25,
  },
  buttonIconMic: {
    width: 25,
    height: 24,
  },
  participantContainer: {
    flexDirection: 'row',
    flex: 1,
    height: 20,
    marginTop: 10,
    backgroundColor: $config.SECONDARY_FONT_COLOR,
    overflow: 'hidden',
    marginHorizontal: 10,
  },
  participantText: {
    flex: 1,
    fontWeight: isWebInternal() ? '500' : '700',
    flexDirection: 'row',
    color: $config.PRIMARY_FONT_COLOR,
    textAlign: 'left',
    flexShrink: 1,
    marginRight: 30,
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

export default LogComponents;
