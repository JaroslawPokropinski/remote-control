import _Peer from 'peerjs';

class Peer extends _Peer {
  constructor() {
    super({
      host: 'screen-sharing-web.herokuapp.com',
      path: '/myapp',
      port: 443,
      secure: true,
      key: 'peerjs',
      debug: 1,
    });
  }
}

export default Peer;