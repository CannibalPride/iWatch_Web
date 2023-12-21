import React, { useContext, useState } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import useGetName from '../utils/useGetName';
import useLocalUid from '../../agora-rn-uikit/src/Utils/useLocalUid';

import { MonitorContext } from './MonitorContext';
import { useMeetingInfo } from './meeting-info/useMeetingInfo';

const IWatchReport = () => {
  const {
    data: { isHost },
  } = useMeetingInfo();

  const {
    openReportModal,
    logs,
    isGlobalMonitoring,
    isCalibrating,
    isCalibrated,
    isModalOpen,
    isMonitoring,
    ProcessorEnabled,
    setOpenReportModal,
    reportLogs,
  } = useContext(MonitorContext);

  const [selectedUser, setSelectedUser] = useState(null);
  const uniqueUsers = Array.from(new Set(reportLogs.map(log => log.User)));

  if (!window.iwatchusername) {
    window.iwatchusername = useGetName();
  }
  if (!window.iwatchuid) {
    window.iwatchuid = useLocalUid();
  }
  const uid = window.iwatchuid;
  const user = window.iwatchusername;

  const downloadFile = (content, filename, contentType) => {
    const a = document.createElement('a');
    const file = new Blob([content], { type: contentType });
    a.href = URL.createObjectURL(file);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const handleDownloadJson = () => {
    const dataStr = JSON.stringify(reportLogs, null, 4);
    downloadFile(dataStr, 'reportLogs.json', 'text/json');
  };
  
  const handleDownloadCsv = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'User,UID,Time,Level,Type,Details,Time\n';
  
    reportLogs.forEach(log => {
      const detailsArray = parseLogMessage(log.logMessage);
      detailsArray.forEach(detail => {
        const row = `${log.User},${log.UID},${new Date(log.Time).toLocaleString()},${detail.Level},${detail.Type},${detail.Details},${new Date(detail.Time).toLocaleString()}`;
        csvContent += row + '\n';
      });
    });
  
    downloadFile(encodeURI(csvContent), 'reportLogs.csv', 'text/csv');
  };

  const closeModal = () => {
    console.log('IWATCH - CLOSE REPORT!', logs);
    console.log('uid: ' + uid);
    console.log('user: ' + user);
    console.log('isCalibrating', isCalibrating.includes(uid));
    console.log('isCalibrated', isCalibrated.includes(uid));
    console.log('isModalOpen', isModalOpen.includes(uid));
    console.log('isGlobalMonitoring', isGlobalMonitoring);
    console.log('isMonitoring', isMonitoring.includes(uid));
    console.log('ProcessorEnabled', ProcessorEnabled.includes(uid));
    console.log('isHost', isHost);
    console.log('openReportModal', openReportModal);

    setOpenReportModal(false);
  };

  const parseLogMessage = (logMessage) => {
    try {
      return JSON.parse(logMessage);
    } catch (e) {
      console.error('Error parsing log message:', e);
      return []; // Return an empty array in case of an error
    }
  };

  return (
    <Modal
      visible={openReportModal && reportLogs && reportLogs.length > 0}
      onRequestClose={closeModal}
      transparent={true}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Monitoring Report</Text>

          {/* User Tabs */}
          <View style={styles.tabsContainer}>
            {uniqueUsers.map(user => (
              <TouchableOpacity
                key={user}
                style={[styles.tab, selectedUser === user && styles.activeTab]}
                onPress={() => setSelectedUser(user)}
              >
                <Text style={styles.tabText}>{user}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Logs ScrollView */}
          <ScrollView style={styles.logContainer}>
            {reportLogs
              .filter(log => log.User === selectedUser || selectedUser === null)
              .map((log, index) => {
                const detailsArray = parseLogMessage(log.logMessage);
                return (
                  <View key={index} style={styles.logEntry}>
                    <Text style={styles.logText}>User: {log.User}</Text>
                    <Text style={styles.logText}>UID: {log.UID}</Text>
                    <Text style={styles.logText}>Time: {new Date(log.Time).toLocaleString()}</Text>
                    {detailsArray.map((detail, idx) => (
                      <View key={idx} style={styles.detailEntry}>
                        <Text style={styles.detailText}>Level: {detail.Level}</Text>
                        <Text style={styles.detailText}>Type: {detail.Type}</Text>
                        {detail.Details && typeof detail.Details === 'object' ? (
                          <>
                            <Text style={styles.detailText}>Details: </Text>
                            {detail.Details.Type && <Text style={styles.detailText}>| subtype: {detail.Details.Type}</Text>}
                            {detail.Details.Distance && <Text style={styles.detailText}>| Distance: {detail.Details.Distance}</Text>}
                            {detail.Details.Axis && <Text style={styles.detailText}>| Coordinate: {detail.Details.Axis}</Text>}
                            {detail.Details.Score && <Text style={styles.detailText}>| Score: {detail.Details.Score}</Text>}
                            {/* Add other properties as needed */}
                          </>
                        ) : (
                          <Text style={styles.detailText}>Details: {detail.Details}</Text>
                        )}

                        <Text style={styles.detailText}>Count: {detail.Counts}</Text>
                        <Text style={styles.detailText}>Begin: {new Date(detail.Begin).toLocaleString()}</Text>
                        <Text style={styles.detailText}>End: {new Date(detail.End).toLocaleString()}</Text>
                        <View style={styles.separator} />
                      </View>
                    ))}
                  </View>
                );
              })}
          </ScrollView>

          {/* Download Button */}
          <TouchableOpacity style={styles.downloadButton} onPress={handleDownloadJson}>
            <Text style={styles.downloadButtonText}>Download JSON</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.downloadButton} onPress={handleDownloadCsv}>
            <Text style={styles.downloadButtonText}>Download CSV</Text>
          </TouchableOpacity>

          {/* Close Button */}
          <TouchableOpacity style={styles.closeButton} onPress={closeModal}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)', // Slightly darker for better contrast
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 30, // More padding for a spacious look
    borderRadius: 20,
    width: '95%', // Wider modal
    maxHeight: '90%', // Taller modal
    shadowColor: '#000', // Adding shadow for depth
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  separator: {
    backgroundColor: '#ddd',
    height: 1,
    marginVertical: 15,
  },
  modalTitle: {
    fontSize: 24, // Bigger and bolder title
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 25,
  },
  logContainer: {
    maxHeight: 400, // More space for logs
  },
  logEntry: {
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    paddingBottom: 15,
  },
  logText: {
    fontSize: 18, // More prominent text
    color: '#333',
    marginBottom: 8,
  },
  detailEntry: {
    paddingLeft: 25,
    paddingTop: 8,
  },
  detailText: {
    fontSize: 16,
    marginBottom: 5,
    color: '#555',
  },
  closeButton: {
    backgroundColor: '#28a745', // Changed to a green shade
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
    marginTop: 25,
  },
  closeButtonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  tabsContainer: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  tab: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 8,
    marginRight: 8,
  },
  activeTab: {
    backgroundColor: '#007AFF',
  },
  tabText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '500',
  },
  downloadButton: {
    backgroundColor: 'green',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
    marginTop: 20,
    marginBottom: 20,
  },
  downloadButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});


export default IWatchReport;
