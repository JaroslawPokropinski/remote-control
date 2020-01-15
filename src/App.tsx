import Host from './Host/Host';
import React, { useEffect, useState, useRef } from 'react';
import SvgComponent from './SvgComponent';
import Peer from './Peerjs/Peerjs';
import { DTO } from './DTO'


const { remote, ipcRenderer } = window.require('electron');

const App: React.FC = () => {
  const [peerId, setPeerId] = useState('');
  const [hostId, setHostId] = useState('');
  const [videoMode, toogleVideoMode] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    remote.getCurrentWindow().show();
    setPeerId('↻');
    ipcRenderer.send('subscribe-peer');
    ipcRenderer.on('peer-reply', (_e, arg) => {
      setPeerId(arg);
    });

    return function () {
      ipcRenderer.send('unsubscribe-peer');
    }
  }, []);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    const clientPeer = new Peer();
    clientPeer.on('open', () => {
      const conn = clientPeer.connect(hostId);

      clientPeer.on('call', (call) => {
        console.log('Call recieved');
        if (call.peer !== hostId) {
          alert('Peer id doesnt match');
          return;
        }
        call.answer();
        toogleVideoMode(true);
        call.on('stream', (stream) => {
          console.log('Stream recieved');
          if (videoRef.current !== null) {
            const v = videoRef.current;
            v.srcObject = stream;
            v.play();

            v.onmousedown = (ev) => {
              if (ev.type !== 'mousedown') {
                throw new Error('Mousedown doesn\' have mousedown type');
              }

              const mouseDownDTO: DTO = {
                type: ev.type,
                x: ev.x / v.clientWidth,
                y: ev.y / v.clientHeight,
              }
              conn.send( mouseDownDTO );
            };
            return;
          }
          console.error('videoRef.current is null');
        });
      });
    });
  };

  const renderThis = () => {
    return (
    <div>
      
      <div className="flex-container">
        <div>
          <SvgComponent width='60vw' />
        </div>
        
        <div>
          { `Your id is: ${peerId}` }
          <form onSubmit={onSubmit}>
            <label>Connect: </label>
            <input value={hostId} onChange={(e) => setHostId(e.currentTarget.value)} />
            <input type='submit' value='→' />
          </form>
        </div>
      </div>
    </div>
    );
  }

  return (
    <div>
      <Host />
      { 
        (!videoMode)
        ? renderThis()
        : <video muted ref={videoRef} style={{ width: '100vw' }}/>
      }
    </div>
  );
}

export default App;