const { LiveChat } = require('youtube-chat');
const fs           = require('fs');
const path         = require('path');
const dotenv       = require('dotenv');

dotenv.config({ override: true });

const logFilePath = path.join(__dirname, process.env.LOG_FILE_NAME);
const liveChat    = new LiveChat({channelId: process.env.YOUTUBE_CHANNEL_ID});

function replacePlaceholders(str, obj) {
  return str.replace(/\{([^}]+)\}/g, (_, placeholder) => {
    const levels = placeholder.split('.');
    let currentPart = obj;

    for (let i = 0; i < levels.length; i++) {
      if (currentPart[levels[i]] !== undefined) {
        currentPart = currentPart[levels[i]];
      } else {
        return `{${placeholder}}`; // Return the original placeholder if not found
      }
    }

    return currentPart;
  });
}

liveChat.on('chat', (chatItem) => {
  var messageText = '';
  for (var i=0; i<chatItem.message.length; i++) {
    if (('text' in chatItem.message[i]) && !('url' in chatItem.message[i])) {
      messageText = `${messageText} ${chatItem.message[i].text}`;
    }
    if ('url' in chatItem.message[i]) {
      messageText = `${messageText} ${chatItem.message[i].alt}`;
    }
    if ('emojiText' in chatItem.message[i]) {
      messageText = `${messageText} ${chatItem.message[i].emojiText}`;
    }
  }
  chatItem.messageText = messageText;
  const logLine = replacePlaceholders(process.env.LOG_FORMAT, chatItem);
  console.log(logLine);
  fs.appendFile(logFilePath, logLine + '\n', (err) => {
    if (err) {
        console.error('Error appending to the file:', err);
        return;
    }
  });
});

async function init() {
  const ok = await liveChat.start();
  if (!ok) {
    console.log('Failed to start, check emitted error');
  }
}
init();
