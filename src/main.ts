import OmniaUser from './OmniaUser.svelte';
import OmniaPost from './OmniaPost.svelte';
import OmniaThread from './OmniaThread.svelte';
import OmniaControlPanel from './OmniaControlPanel.svelte';
import OmniaHeader from './OmniaHeader.svelte';
import OmniaAdminLogs from './OmniaAdminLogs.svelte';
import { currentParams, makeNewUrl } from './util';

// Omnia (Browser): The emulated Tieba

const userType: string = currentParams.get('u');
const userClue: string = currentParams.get('c');
const threadId: number = parseInt(currentParams.get('t'));
let time: string | null = currentParams.get('time') || null;
const searchKeyword: string | null = currentParams.get('s') || null;
let page: number = parseInt(currentParams.get('p'));
const adminLogsType: string | null = currentParams.get("a") || null;
const hideTheShowdown: boolean = (currentParams.get("h") !== 'false'); // everything except strictly "false" is true

let lastTimeDeparted = localStorage.getItem('lastTimeDeparted');

if (!lastTimeDeparted) {
  lastTimeDeparted = '2016-07-27 00:00:00';
  localStorage.setItem('lastTimeDeparted', lastTimeDeparted);
};

if (time === '0') { // time=0 indicates time machine mode and will be immediately replaced with the last time departed
  time = lastTimeDeparted;
  const newParams = new URLSearchParams();
  newParams.set('time', time);
  location.href = makeNewUrl(newParams);
};

if (!page) page = 1;

const mainNode = document.getElementById('omnia-main');
if (adminLogsType) {
  new OmniaAdminLogs({
    target: mainNode,
    props: {
      page,
      adminLogsType,
      hideTheShowdown
    }
  });
} else if (userType) {
  new OmniaUser({
    target: mainNode,
    props: {
      page,
      time,
      userType,
      userClue,
    }
  });
} else if (threadId) {
  new OmniaPost({
    target: mainNode,
    props: {
      page,
      time,
      threadId,
    }
  });
} else {
  new OmniaThread({
    target: mainNode,
    props: {
      page,
      time,
      searchKeyword,
    }
  });
};

// https://stackoverflow.com/a/65853771/10144204
const placeholder = document.getElementById("omnia-header-placeholder");
new OmniaHeader({
  target: placeholder.parentElement,
  anchor: placeholder,
  props: {
    time,
  }
});
placeholder.remove();

if (!adminLogsType) {
  new OmniaControlPanel({
    target: document.getElementById('omnia-control-panel'),
    props: {
      time,
      threadId,
      userType,
      searchKeyword
    }
  });
} else document.getElementById('omnia-control-panel').remove();