import OmniaUser from './OmniaUser.svelte';
import OmniaPost from './OmniaPost.svelte';
import OmniaThread from './OmniaThread.svelte';
import OmniaControlPanel from './OmniaControlPanel.svelte';
import OmniaHeader from './OmniaHeader.svelte';
import OmniaAdminLogs from './OmniaAdminLogs.svelte';
import "./main.css";

// Omnia (Browser): The emulated Tieba

const params = new URLSearchParams(location.search);
const userType: string = params.get('u');
const userClue: string = params.get('c');
const threadId: number = parseInt(params.get('t'));
let time: string | null = params.get('time') || null;
const searchKeyword: string | null = params.get('s') || null;
let page: number = parseInt(params.get('p'));
const adminLogsType: string | null = params.get("a") || null;
const hideTheShowdown: boolean = (params.get("h") !== 'false'); // everything except strictly "false" is true

let lastTimeDeparted = localStorage.getItem('lastTimeDeparted');

if (!lastTimeDeparted) {
  lastTimeDeparted = '2016-07-27 00:00:00';
  localStorage.setItem('lastTimeDeparted', lastTimeDeparted);
};

if (time === '0') {
  time = lastTimeDeparted;
  const currentUrl = new URL(location.href);
  const params = new URLSearchParams(currentUrl.search);
  params.set('time', time);
  const newUrl = new URL(currentUrl.origin + currentUrl.pathname + '?' + params.toString());
  window.history.pushState({}, null, newUrl);
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
    }
  });
} else document.getElementById('omnia-control-panel').remove();

