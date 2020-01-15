import Peer from "./Peerjs/Peerjs";
import { DataConnection } from 'peerjs';

const { desktopCapturer, remote } = require('electron');

async function getWindows() {
  const sources = await desktopCapturer.getSources({ types: ['window', 'screen'] });
  return sources.map((s) => s.name);
}

async function getMatchingWindow(name: string) {
  const sources = await desktopCapturer.getSources({ types: ['window', 'screen'] });
  const matching = sources.filter((v) => v.name.match(name))[0];
  if (matching !== undefined) {
    return matching;
  }
  throw Error('No matching window');
}

async function getWindowStream(window: Electron.DesktopCapturerSource) {
  const constrains = {
    audio: false,
    video: <MediaTrackConstraints>{
      mandatory: {
        chromeMediaSource: 'desktop',
        chromeMediaSourceId: window.id,
        minWidth: 100,
        maxWidth: 1200,
      },
    }
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia(constrains);
    return stream;
  } catch (e) {
    throw e;
  }
}

function handleStream(stream: MediaStream) {
  const track = stream.getVideoTracks()[0];
  const updateWindowSize = () => {
    const settings = track.getSettings();
    remote.getCurrentWindow().setContentSize((settings.width ?? 0), settings.height ?? 0);
  }

  const video = document.querySelector('video');
  if (!video) {
    throw new Error('No video element');
  }
  video.srcObject = stream;
  video.onloadedmetadata = (e) => {
    video.play();
    setInterval(updateWindowSize, 17);
    updateWindowSize();
    remote.getCurrentWindow().show();
  }
}

function handleError(e: any) {
  console.log(e)
}

let windowsCache: string[] = [];
const updateWindowsCache = () => {
  getWindows()
    .then((windows) => {
      windowsCache = windows;
    });
};
setInterval(updateWindowsCache, 500);
updateWindowsCache();

const peer = new Peer();

async function handleData(conn: DataConnection, data: any) {
  const stream = await getMatchingWindow(data)
    .then(getWindowStream);
  peer.call(conn.peer, stream);
}


peer.on('connection', function (conn) {
  const sendWindows = () => {
    conn.send(windowsCache);
  }
  let inter: NodeJS.Timeout | null = setInterval(sendWindows, 500);
  sendWindows();
  console.log(`${conn.peer} connected.`);

  conn.on('data', function (data) {
    handleData(conn, data)
      .catch((e) => handleError(e));
  });

  conn.on('close', () => {
    if (inter !== null) {
      clearInterval(inter);
      inter = null;
    }
  });
});
