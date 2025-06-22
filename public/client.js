// public/client.js
const socket = io();
let peerConnection;
let dataChannel;

const configuration = {
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
};

peerConnection = new RTCPeerConnection(configuration);
dataChannel = peerConnection.createDataChannel('file');

peerConnection.onicecandidate = event => {
  if (event.candidate) {
    socket.emit('signal', { candidate: event.candidate });
  }
};

peerConnection.ondatachannel = event => {
  const receiveChannel = event.channel;
  let receivedChunks = [];

  receiveChannel.onmessage = e => {
    receivedChunks.push(e.data);
  };

  receiveChannel.onclose = () => {
    const blob = new Blob(receivedChunks);
    const url = URL.createObjectURL(blob);
    const download = document.getElementById('download');
    download.innerHTML = `<a href="${url}" download="received_file">Download File</a>`;
  };
};

socket.on('signal', async data => {
  if (data.offer) {
    await peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer));
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    socket.emit('signal', { answer });
  } else if (data.answer) {
    await peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
  } else if (data.candidate) {
    try {
      await peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
    } catch (e) {
      console.error('Error adding ICE candidate', e);
    }
  }
});

// Start connection
(async function startConnection() {
  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);
  socket.emit('signal', { offer });
})();

function sendFile() {
  const file = document.getElementById('fileInput').files[0];
  const chunkSize = 16 * 1024; // 16 KB
  let offset = 0;

  const reader = new FileReader();
  reader.onload = e => {
    while (offset < e.target.result.byteLength) {
      const slice = e.target.result.slice(offset, offset + chunkSize);
      dataChannel.send(slice);
      offset += chunkSize;
    }
    dataChannel.close(); // Signal completion
  };

  reader.readAsArrayBuffer(file);
}
