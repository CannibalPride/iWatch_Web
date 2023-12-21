import React, { useState, useContext } from 'react';
import { Modal, View, Text, StyleSheet, ScrollView, Button, TouchableOpacity, Platform } from 'react-native';
import { MonitorContext } from './MonitorContext';
import { useChatMessages } from './chat-messages/useChatMessages';
import { useLocalUid } from '../../agora-rn-uikit';
import { useRender } from 'customization-api';

const LogReportModal = () => {
    const { logsStore } = useChatMessages();
    const localUid = useLocalUid();
    const { openReportModal, setOpenReportModal } = useContext(MonitorContext);
    const { renderList } = useRender();
    const [activeTab, setActiveTab] = useState(null);

    const closeModal = () => {
        setOpenReportModal(false);
    };

    const formatMessageObject = (msgObject) => {
      if (typeof msgObject !== 'object' || msgObject === null) {
          return msgObject;
      }

      return Object.entries(msgObject).map(([key, value]) => {
          if (typeof value === 'object' && value !== null) {
              const nestedDetails = formatMessageObject(value);
              return `${key}: { ${nestedDetails} }`;
          } else {
              return `${key}: ${value}`;
          }
      }).join('\n');
  };

    return (
        <Modal
            visible={openReportModal}
            onRequestClose={closeModal}
            transparent={true}
            animationType="slide"
        >
            <View style={styles.modalView}>
                <Text style={styles.modalTitle}>Logs Report</Text>
                <ScrollView horizontal style={styles.tabsScrollView}>
                    {Object.keys(logsStore).map((userId) => {
                        if (userId === localUid.toString()) return null; // Exclude current user's logs
                        return (
                            <TouchableOpacity
                                key={userId}
                                style={[styles.tab, activeTab === userId ? styles.activeTab : null]}
                                onPress={() => setActiveTab(userId)}
                            >
                                <Text style={styles.tabText}>
                                    {renderList[userId]?.name || `User ${userId}`}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
                <ScrollView style={styles.logsScrollView}>
                    {activeTab && logsStore[activeTab]?.map((log, index) => (
                        <Text style={styles.logText} key={index}>
                            {formatMessageObject(log.msg)}
                        </Text>
                    ))}
                </ScrollView>
                <Button title="Close" onPress={closeModal} />
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
  tabsScrollView: {
    flexDirection: 'row',
    marginBottom: 10,
    maxHeight: 50, // Set a maximum height for the scroll view
  },
  logsScrollView: {
      flex: 1,
      width: '100%',
  },
  tab: {
      paddingVertical: 5, // Reduced vertical padding
      paddingHorizontal: 10, // Adjust horizontal padding as needed
      marginHorizontal: 5, // Reduced horizontal margin
      borderWidth: 1,
      borderColor: '#ccc',
      borderRadius: 10,
      justifyContent: 'center', // Center content vertically
  },
  activeTab: {
      backgroundColor: '#ddd',
  },
  tabText: {
      fontSize: 16,
  },
  modalView: {
      margin: 20,
      backgroundColor: "white",
      borderRadius: 20,
      padding: 35,
      alignItems: "center",
      shadowColor: "#000",
      shadowOffset: {
          width: 0,
          height: 2
      },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 5,
      flex: 1, // This will allow the modal to take up the whole screen
  },
  scrollView: {
      marginBottom: 10,
      width: '100%',
      flex: 1, // Make the ScrollView flex to fill the available space
  },
  modalTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      marginBottom: 10,
  },
  userLogsContainer: {
      marginBottom: 10,
  },
  userLogTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      marginTop: 5,
  },
  logText: {
      fontSize: 12,
      fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
      marginTop: 6,
  },
});


export default LogReportModal;
