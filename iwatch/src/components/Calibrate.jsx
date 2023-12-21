import React, { useState, useContext, useEffect } from 'react';
import { Text, Modal, View, TouchableOpacity, StyleSheet, Button, useWindowDimensions } from 'react-native';
import {timeNow} from '../rtm/utils';
import events, {EventPersistLevel} from '../rtm-events-api';
import { MonitorContext } from './MonitorContext';
import getUniqueID from '../utils/getUniqueID';
import {EventNames} from '../rtm-events';

const Calibrate = () => {
    const { 
        isCalibrating, toggleCalibrating, 
        isCalibrated, toggleCalibrated,
        isModalOpen, toggleModalOpen, isGlobalMonitoring, isMonitoring,
        ProcessorEnabled
    } = useContext(MonitorContext);
    const [clickCounts, setClickCounts] = useState(Array(9).fill(0));
    const uid = window.iwatchuid
    const count_limit = 1

    // Get the window dimensions
    const windowDimensions = useWindowDimensions();
    const itemSizeWidth = (windowDimensions.width * 0.3)*0.2;
    const itemSizeHeight = (windowDimensions.height * 0.3)*0.2;

    // Handler for button clicks
    const handlePress = (index) => {
        const newClickCounts = clickCounts.map((count, i) => 
            i === index ? count + 1 : count
        );
        if(!window.iWatchisCalibrating){
            console.log("Calibrating Calibrate", window.iWatchisCalibrating);
            window.iWatchisCalibrating = true;
            console.log("Calibrating Calibrate", window.iWatchisCalibrating);
        }
        setClickCounts(newClickCounts);
    };

    const closeModal = () => {
        toggleModalOpen(uid);
        toggleCalibrated(uid);
        toggleCalibrating(uid);
        console.log("IWATCH - SETTING CALIBRATION TO FALSE!");
        const messageData = {
            msg: "Calibration Ended",
            createdTimestamp: timeNow(),
            msgId: getUniqueID(),
            isDeleted: false,
        };
        events.send(
            EventNames.UPDATE_STATUS,
            JSON.stringify({
                value: messageData,
                action: 'iWatch_Calibration_Ended',
            }),
            EventPersistLevel.LEVEL3,
            window.iwatchhostuid,
        );
    };

    const cancelledModal = () => {
        console.log('uid: ' + uid);
        console.log('isCalibrating', isCalibrating.includes(uid));
        console.log('isCalibrated', isCalibrated.includes(uid));
        console.log('isModalOpen', isModalOpen.includes(uid));
        console.log('isGlobalMonitoring', isGlobalMonitoring);
        console.log('isMonitoring', isMonitoring.includes(uid));
        console.log('ProcessorEnabled', ProcessorEnabled.includes(uid));
        
        //Testing
        toggleModalOpen(uid);
        toggleCalibrated(uid);
        toggleCalibrating(uid);

        const messageData = {
            msg: "Calibration Ended",
            createdTimestamp: timeNow(),
            msgId: getUniqueID(),
            isDeleted: false,
        };
        events.send(
            EventNames.UPDATE_STATUS,
            JSON.stringify({
                value: messageData,
                action: 'iWatch_Calibration_Ended',
            }),
            EventPersistLevel.LEVEL3,
            window.iwatchhostuid,
        );
    };

    useEffect(() => {
        // Check if all circles are gone (count is 5 or more)
        if (clickCounts.every((count) => count >= count_limit)) {
            closeModal();
        }

    }, [clickCounts]);

    return (
        <Modal
            visible={isModalOpen.includes(uid) && !isCalibrated.includes(uid) && ProcessorEnabled.includes(uid)}
            onRequestClose={cancelledModal}
            transparent={true}
        >
            <View style={styles.modalContainer}>
                <Text style={styles.instructionText}>
                    Look at the red circles and click them {count_limit} times each.
                </Text>
                <View style={[styles.grid, { width: windowDimensions.width*0.9, height: windowDimensions.height*0.9 }]}>
                    {clickCounts.map((count, index) => {
                        let positionStyle = {};
                        switch(index) {
                            case 0: 
                                // Top-left corner
                                positionStyle = { top: 0, left: 0 };
                                break;
                            case 1: 
                                // Top center
                                positionStyle = { top: 0, left: '50%', transform: [{ translateX: '-50%' }] };
                                break;
                            case 2:
                                // Top-right corner
                                positionStyle = { top: 0, right: 0 };
                                break;
                            case 3:
                                // Middle-left
                                positionStyle = { top: '50%', left: 0, transform: [{ translateY: '-50%' }]};
                                break;
                            case 4:
                                // Center
                                positionStyle = { top: '50%', left: '50%', transform: [{ translateX: '-50%' }, { translateY: '-50%' }] };
                                break;
                            case 5:
                                // Middle-right
                                positionStyle = { top: '50%', right: 0, transform: [{ translateY: '-50%' }]};
                                break;
                            case 6:
                                // Bottom-left corner
                                positionStyle = { bottom: 0, left: 0 };
                                break;
                            case 7:
                                // Bottom center
                                positionStyle = { bottom: 0 , left: '50%', transform: [{ translateX: '-50%' }] };
                                break;
                            case 8:
                                // Bottom-right corner
                                positionStyle = { bottom: 0, right: 0 };
                                break;
                            default:
                                break;
                        }
                        
                        return (
                            <View
                                key={index}
                                style={[
                                    styles.gridItem,
                                    {
                                        width: itemSizeWidth,
                                        height: itemSizeHeight,
                                        ...positionStyle,
                                    },
                                ]}
                            >
                                <TouchableOpacity
                                    style={[
                                        styles.circle,
                                        count >= count_limit && styles.hiddenCircle,
                                    ]}
                                    onPress={() => handlePress(index)}
                                />
                            </View>
                        );
                    })}
                </View>
                
                {/* 
                    <Button title="Close" onPress={cancelledModal} /> 
                */}
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    instructionText: {
        position: 'absolute',
        top: 190, // Adjust as needed
        left: 0,
        right: 0,
        color: 'white',
        fontSize: 18,
        textAlign: 'center',
        zIndex: 2, // Ensure it's above other elements
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)', // Semi-transparent black background
    },
    grid: {
        position: 'relative', // Position children relative to this container
        backgroundColor: 'rgba(0, 255, 0, 0.1)', // Semi-transparent black background
    },
    gridItem: {
        position: 'absolute', // Position items within the grid container
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 0, 0, 0.1)', // Semi-transparent black background
    },
    circle: {
        width: 40, // Adjust size as needed
        height: 40, // Adjust size as needed
        borderRadius: 20, // Half of width/height to make it circular
        backgroundColor: 'red',
        justifyContent: 'center',
        alignItems: 'center',
    },
    hiddenCircle: {
        display: 'none', // Hide the circle when count is 5 or more
    },
});

export default Calibrate;
