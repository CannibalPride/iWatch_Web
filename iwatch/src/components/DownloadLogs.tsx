import { useChatMessages } from './chat-messages/useChatMessages';

const DownloadLogs = (uid?: any) => {
  const { logsStore } = useChatMessages();

  if (uid) {
    console.log(`Downloading Participant log, ${uid}`);
    const participantLogs = logsStore[uid];
    if (participantLogs) {
      // Download logic for participant logs
      const logsText = JSON.stringify(participantLogs); // Convert logs to JSON string
      const blob = new Blob([logsText], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      // Create a download link and trigger the download
      const a = document.createElement('a');
      a.href = url;
      a.download = `participant_logs_${uid}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      // Revoke the object URL to free up resources
      URL.revokeObjectURL(url);
    } else {
      console.log('Participant logs not found.');
    }
  } else {
    console.log(`Downloading all logs`);
    const allLogs = logsStore;
    if (allLogs) {
      // Download logic for all logs
      const logsText = JSON.stringify(allLogs); // Convert logs to JSON string
      const blob = new Blob([logsText], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      // Create a download link and trigger the download
      const a = document.createElement('a');
      a.href = url;
      a.download = 'all_logs.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      // Revoke the object URL to free up resources
      URL.revokeObjectURL(url);
    } else {
      console.log('Logs not found.');
    }
  }
};

export { DownloadLogs };
