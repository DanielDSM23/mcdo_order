const NTPClient = require('ntp-client');

function syncWithNTPServer() {
  NTPClient.getNetworkTime("ntp.unice.fr", 123, (err, date) => {
    if (err) {
      console.error(err);
      return;
    }

    console.log('NTP server time:', date);

    // Set the system time
    const now = new Date();
    const timeDifference = date.getTime() - now.getTime();
    const newTime = new Date(now.getTime() + timeDifference);
    console.log('Adjusted local time:', newTime);
  });
}

// Call the function to sync with NTP server
syncWithNTPServer();
