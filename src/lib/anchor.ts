const HIGHLIGHT_CLASS = "bg-yellow-50";
const HIGHLIGHT_DURATION = 2000;

export function scrollToHash() {
  const hash = window.location.hash;
  if (!hash) return;

  const element = document.getElementById(hash.substring(1));
  if (!element) return;

  element.scrollIntoView();

  const container = document.querySelector(".shadow");
  if (container) {
    const observer = new ResizeObserver(() => {
      element.scrollIntoView();
    });
    observer.observe(container);

    const stop = () => {
      observer.disconnect();
      window.removeEventListener("wheel", stop);
      window.removeEventListener("touchmove", stop);
      window.removeEventListener("keydown", stop);
    };

    window.addEventListener("wheel", stop);
    window.addEventListener("touchmove", stop);
    window.addEventListener("keydown", stop);

    setTimeout(stop, 3000);
  }

  element.classList.add(HIGHLIGHT_CLASS);
  const startFadeTimer = () => {
    setTimeout(() => {
      element.classList.remove(HIGHLIGHT_CLASS);
    }, HIGHLIGHT_DURATION);
  };
  if (document.visibilityState === "visible") {
    startFadeTimer();
  } else {
    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      document.removeEventListener("visibilitychange", onVisible);
      startFadeTimer();
    };
    document.addEventListener("visibilitychange", onVisible);
  }
}
