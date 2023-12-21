import React, { useContext } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import useGetName from '../utils/useGetName';
import useLocalUid from '../../agora-rn-uikit/src/Utils/useLocalUid';

import { MonitorContext } from './MonitorContext';

const EndModal = () => {
  const { isModalOpen, isCalibrated, ProcessorEnabled, isCalibrating, cleanStates } = useContext(MonitorContext);
  if(!window.iwatchusername){
      window.iwatchusername = useGetName();
  }
  if(!window.iwatchuid){
    window.iwatchuid = useLocalUid();
  }
  const uid = window.iwatchuid;

  const closeModal = () => {
    cleanStates(uid);
    console.log("IWATCH - CLEANUP!");
  };

  return (
    <Modal
      visible={isModalOpen.includes(uid) && isCalibrated.includes(uid) && ProcessorEnabled.includes(uid) && isCalibrating.includes(uid)}
      onRequestClose={closeModal}
      transparent={true}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalText}>Monitoring Ended</Text>
          <Text style={styles.modalText}>You may now exit.</Text>
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalText: {
    fontSize: 18,
    marginBottom: 10,
  },
  closeButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  closeButtonText: {
    color: 'white',
    fontSize: 16,
  },
});

export default EndModal;
