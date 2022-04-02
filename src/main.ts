import OmniaUser from './OmniaUser.svelte';
import OmniaPost from './OmniaPost.svelte';
import OmniaThread from './OmniaThread.svelte';
import OmniaControlPanel from './OmniaControlPanel.svelte';
import OmniaHeader from './OmniaHeader.svelte';
import "./main.css";

// Omnia (Browser): The emulated Tieba

const params = new URLSearchParams(location.search);
const userType: string = params.get('u');
const userClue: string = params.get('c');
const threadId: number = parseInt(params.get('t'));
let time: string | null = params.get('time') || null;
const searchKeyword: string | null = params.get('s') || null;
let page: number = parseInt(params.get('p'));

let lastTimeDeparted = localStorage.getItem('lastTimeDeparted');

if (!lastTimeDeparted) {
  lastTimeDeparted = '2016-07-28 00:42:42';
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

if (userType) {
  new OmniaUser({
    target: document.getElementById('omnia-main'),
    props: {
      page,
      time,
      userType,
      userClue,
    }
  });
} else if (threadId) {
  new OmniaPost({
    target: document.getElementById('omnia-main'),
    props: {
      page,
      time,
      threadId,
    }
  });
} else {
  new OmniaThread({
    target: document.getElementById('omnia-main'),
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

new OmniaControlPanel({
  target: document.getElementById('omnia-control-panel'),
  props: {
    time,
  }
});
