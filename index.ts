import * as slack from 'slack-promise';

const token = process.env.SLACK_TOKEN;
const EMPTY_MEMBERS = 2;
const ARCHIVE_MESSAGE = "Archiving this channel due to lack of activity. Feel free to un-archive if you feel this was done in error.";

(async () => {
  const channels = (await slack.channels.list({token})).channels.filter(c => !c.is_archived);

  for (let i = 0; i < channels.length; i++) {
    try {
      const c = channels[i];
      console.log(`#${c.name} - ${i}/${channels.length}`);
      let kill = false;
      if (c.num_members <= EMPTY_MEMBERS) {
        kill = true;
      } else {
        const messages = (await slack.channels.history({token, channel: c.id})).messages.filter(m => m.type === "message" && (!m.subtype || m.subtype == "bot_message"));
        if(messages.length === 0) {
          kill = true;
        };
      }
      if (kill) {
        console.log(`Archiving #${c.name}`);
        await slack.channels.join({token, name: `#${c.name}`});
        await slack.chat.postMessage({as_user: true, token, channel: c.id, text: ARCHIVE_MESSAGE});
        await slack.channels.archive({token, channel: c.id});
      }
    }  catch (e) {
      if (e.toString().includes("ratelimited")) {
        console.log("Rate limited, waiting 60 seconds")
        await new Promise(resolve => setTimeout(resolve, 60 * 1000))
        i--;
      }
    }
  }
})();
