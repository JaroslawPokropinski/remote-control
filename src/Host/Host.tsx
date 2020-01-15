import React, { useEffect, useState } from 'react';
import Peer from "../Peerjs/Peerjs";
import { DTO } from '../DTO';

const robot = window.require('robotjs');
const { desktopCapturer, ipcRenderer } = window.require('electron');


async function getWindowStream(window: Electron.DesktopCapturerSource) {
  const constrains = {
    audio: false,
    video: {
      mandatory: {
        chromeMediaSource: 'desktop',
        chromeMediaSourceId: window.id,
      },
    } as MediaTrackConstraints
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia(constrains);
    return stream;
  } catch (e) {
    throw e;
  }
}

async function getScreenStreams() {
  const sources = await desktopCapturer.getSources({ types: ['screen'] });
  const streams = new Array<MediaStream>();
  for (let index = 0; index < sources.length; index++) {
    const element = sources[index];
    streams.push(await getWindowStream(element));
  }

  return streams;
}

const Host: React.FC = () => {
  useEffect(() => {
    const peer = new Peer();

    peer.on('open', function (id) {
      ipcRenderer.send('set-peer', id);
    });

    peer.on('connection', function (conn) {
      console.log(`${conn.peer} connected.`);

      let screens: null | MediaStream[] = null;
      getScreenStreams()
        .then((data) => {
          screens = data;
          const firstScreen = screens[0];
          peer.call(conn.peer, firstScreen);
        });
    
      conn.on('data', function (data) {
        if (data.type) {
          
          switch(data.type) {
            case 'mousedown': {
              const mouseDownDTO: DTO = { type: 'mousedown', x: data.x, y: data.y };
              if (screens === null) {
                return;
              }
              const width = screens[0].getVideoTracks()[0].getSettings().width ?? 1;
              const height = screens[0].getVideoTracks()[0].getSettings().height ?? 1;

              robot.moveMouse(mouseDownDTO.x * width, mouseDownDTO.y * height);
            }
          }
        }
        console.log(data);
      });
    
      conn.on('close', () => {
        
      });
    });

    peer.on('close', () => console.log('Peer closed'));
    peer.on('error', (err) => console.error(err));

    return function() {
      peer.destroy();
      ipcRenderer.send('set-peer', null);
    }
  }, [])
  
  return null;
}

export default Host;