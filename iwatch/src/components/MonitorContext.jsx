import React, { createContext, useState } from 'react';
import useGetName from '../utils/useGetName';
import useLocalUid from '../../agora-rn-uikit/src/Utils/useLocalUid';
import getUniqueID from '../utils/getUniqueID';
import events, {EventPersistLevel} from '../rtm-events-api';
import {EventNames} from '../rtm-events';
import {timeNow} from '../rtm/utils';

export const MonitorContext = createContext({
    isGlobalMonitoring: false,
    isMonitoring: [],
    isCalibrating: [],
    isCalibrated: [],
    isAnomalous: [],
    isModalOpen: [],
    isEndModalOpen: [],
    ProcessorEnabled: [],
    openReportModal: false,
    hostuid: null,
    startMonitoring: (uid) => {},
    endMonitoring: (uid) => {},
    toggleCalibrating: (uid) => {},
    toggleCalibrated: (uid) => {},
    toggleModalOpen: (uid) => {},
    toggleEndModalOpen: (uid) => {},
    toggleProcessor: (uid) => {},
    setGlobalMonitoring: (val) => {},
    setOpenReportModal: (val) => {},
    addReportLogs: (User, UID, Time, Message) => {},
    setCalibratingStatus: (uid, status) => {},
    setCalibratedStatus: (uid, status) => {},
    setMonitoringStatus: (uid, status) => {},
    AnomalyTrue: (uid) => {},
    AnomalyFalse: (uid) => {},
    logs: [], // New property for logs
    reportLogs: [],
    addLog: (logMessage) => {}, // Function to add a new log entry
    
});  

const MonitorProvider = ({ children }) => {
    const [isGlobalMonitoring, setisGlobalMonitoring] = useState(false);
    const [isMonitoring, setIsMonitoring] = useState([]);
    const [isAnomalous, setIsAnomalous] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState([]);
    const [isEndModalOpen, setIsEndModalOpen] = useState([]);
    const [ProcessorEnabled, setProcessor] = useState([]);
    const [isCalibrating, setIsCalibrating] = useState([]); // State for calibrating
    const [isCalibrated, setIsCalibrated] = useState([]); 
    const [logs, setLogs] = useState([]); // State to hold logs
    const [openReportModal, setisOpenReportModal] = useState(false); // State to hold logs
    const [reportLogs, setReportLogs] = useState([]);
    
    if(!window.iwatchusername){
        window.iwatchusername = useGetName();
    }
    if(!window.iwatchuid){
      window.iwatchuid = useLocalUid();
    }
    const uid = window.iwatchuid;

    if(!isCalibrating.includes(uid)){
        window.iWatchisCalibrating = false;
    }
    else{
        window.iWatchisCalibrating = true;
    }

    const updateStateArray = (stateArray, setState, uid, value) => {
        setState(currentState => {
          const updatedState = new Set(currentState);
          if (value) {
            updatedState.add(uid);
          } else {
            updatedState.delete(uid);
          }
          return Array.from(updatedState);
        });
    };
      
    const startMonitoring = (uid) => {
        
        console.log("HOST IS: " + window.iwatchhostuid);
        if(!window.iwatchusername){
            window.iwatchusername = useGetName();
        }

        updateStateArray(isMonitoring, setIsMonitoring, uid, true);
        
        if (!isCalibrated.includes(uid)) {
            console.log("IWATCH - SETTING CALIBRATION TO TRUE!");
            setisGlobalMonitoring(true)
            toggleCalibrating(uid);
            toggleModalOpen(uid);
        }
    };

    const endMonitoring = (uid) => {
        updateStateArray(isMonitoring, setIsMonitoring, uid, false);
        
        cleanStates(uid);
    };

    const setMonitoringStatus = (uid, status) => {
        updateStateArray(isMonitoring, setIsMonitoring, uid, status);
    }
    const setCalibratingStatus = (uid, status) => {
        updateStateArray(isCalibrating, setIsCalibrating, uid, status);
    } 
    const setCalibratedStatus = (uid, status) => {
        updateStateArray(isCalibrated, setIsCalibrated, uid, status);
    } 

    const cleanStates = (uid) => {
        setGlobalMonitoring(false);
        //setOpenReportModal(true);
        updateStateArray(isMonitoring, setIsMonitoring, uid, false);
        updateStateArray(isCalibrating, setIsCalibrating, uid, false);
        updateStateArray(isCalibrated, setIsCalibrated, uid, false);
        updateStateArray(isModalOpen, setIsModalOpen, uid, false);
        updateStateArray(ProcessorEnabled, setProcessor, uid, false);
    }

    const toggleCalibrating = (uid) => {
        console.log("Calibrating toggleCalibrating", window.iWatchisCalibrating);
        window.iWatchisCalibrating = !isCalibrating.includes(uid);
        console.log("Calibrating toggleCalibrating", window.iWatchisCalibrating);
        updateStateArray(isCalibrating, setIsCalibrating, uid, !isCalibrating.includes(uid));
        
        if(window.iWatchisCalibrating){
            const messageData = {
                msg: "Calibration Started",
                createdTimestamp: timeNow(),
                msgId: getUniqueID(),
                isDeleted: false,
            };
            events.send(
                EventNames.UPDATE_STATUS,
                JSON.stringify({
                value: messageData,
                action: 'iWatch_Calibration_Started',
                }),
                EventPersistLevel.LEVEL3,
                window.iwatchhostuid,
            );
        }
    };

    const AnomalyTrue = (uid) => {
        updateStateArray(isAnomalous, setIsAnomalous, uid, true);
    };
    const AnomalyFalse = (uid) => {
        updateStateArray(isAnomalous, setIsAnomalous, uid, false);
    };

    const toggleCalibrated = (uid) => {
        updateStateArray(isCalibrated, setIsCalibrated, uid, !isCalibrated.includes(uid));
    };

    const toggleEndModalOpen = (uid) => {
        updateStateArray(isModalOpen, setIsEndModalOpen, uid, !isEndModalOpen.includes(uid));
    };

    const toggleModalOpen = (uid) => {
        updateStateArray(isModalOpen, setIsModalOpen, uid, !isModalOpen.includes(uid));
    };

    const toggleProcessor = (uid) => {
        updateStateArray(ProcessorEnabled, setProcessor, uid, !ProcessorEnabled.includes(uid));
    };

    // Function to add a new log entry
    const addLog = (logMessage) => {
        setLogs(currentLogs => [...currentLogs, { logMessage }]);
    };

    // Function to add a new log entry
    const addReportLogs = (User, UID, Time, logMessage) => {
        setReportLogs(currentLogs => [
            ...currentLogs, 
            { User, UID, Time, logMessage }
        ]);
    };

    const setGlobalMonitoring = (val) => {
        setisGlobalMonitoring(val)
    }

    const setOpenReportModal = (val) => {
        setisOpenReportModal(val)
    }

    return (
        <MonitorContext.Provider value={{
            isGlobalMonitoring, setGlobalMonitoring,
            isMonitoring, startMonitoring, endMonitoring, setIsMonitoring,
            isCalibrating, toggleCalibrating,
            isModalOpen, toggleModalOpen,
            ProcessorEnabled, toggleProcessor,
            isCalibrated, toggleCalibrated,
            cleanStates, updateStateArray,
            openReportModal, setOpenReportModal,
            logs, reportLogs, addLog, addReportLogs,
            setMonitoringStatus, setCalibratingStatus, setCalibratedStatus,
            isAnomalous, AnomalyTrue, AnomalyFalse
        }}>
        {children}
        </MonitorContext.Provider>
    );
};

export default MonitorProvider;
