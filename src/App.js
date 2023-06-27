import React, { useEffect, useRef, useState } from 'react';

const RTCReceiver = () => {
  const localSessionDescriptionRef = useRef(null);
  const remoteSessionDescriptionRef = useRef(null);
  const logsRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const pcRef = useRef(null);
  const [localStream, setLocalStream] = useState(null);

  const log = (msg) => {
    logsRef.current.innerHTML += msg + '<br>';
  };

  const startSession = () => {
    const sd = remoteSessionDescriptionRef.current.value;
    if (sd === '') {
      return alert('Session Description must not be empty');
    }
    try {
      const remoteDescription = new RTCSessionDescription(JSON.parse(atob(sd)));
      pcRef.current.setRemoteDescription(remoteDescription);
    } catch (e) {
      alert(e);
    }
  };

  useEffect(() => {
    const init = async () => {
      const config = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };
      pcRef.current = new RTCPeerConnection(config);

      pcRef.current.ontrack = (event) => {
        const stream = event.streams[0];
        remoteVideoRef.current.srcObject = stream;
      };

      pcRef.current.oniceconnectionstatechange = () => log(pcRef.current.iceConnectionState);
      pcRef.current.onicecandidate = (event) => {
        if (event.candidate === null && pcRef.current.localDescription) {
          localSessionDescriptionRef.current.value = btoa(JSON.stringify(pcRef.current.localDescription));
        }
      };

      // Add the video track to the peer connection
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      setLocalStream(mediaStream);
      mediaStream.getTracks().forEach((track) => {
        pcRef.current.addTrack(track, mediaStream);
      });

      // Create an offer
      const offer = await pcRef.current.createOffer();
      await pcRef.current.setLocalDescription(offer);

      // Send the local description to the backend
      const localDescription = pcRef.current.localDescription;
      const signalData = btoa(JSON.stringify(localDescription));
      // Replace `YOUR_BACKEND_URL` with the actual backend URL
      await fetch('YOUR_BACKEND_URL', {
        method: 'POST',
        body: signalData,
        headers: {
          'Content-Type': 'text/plain',
        },
      });
    };

    init();
  }, []);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  return (
    <div>
      <h2>Video</h2>
      <h3>Browser base64 Session Description</h3>
      <textarea ref={localSessionDescriptionRef} readOnly={true}></textarea>

      <h3>Golang base64 Session Description</h3>
      <textarea ref={remoteSessionDescriptionRef}></textarea>
      <button onClick={startSession}>Start Session</button>

      <h3>Local Video</h3>
      <video ref={localVideoRef} muted autoPlay controls></video>

      <h3>Received Video</h3>
      <video ref={remoteVideoRef} autoPlay controls></video>

      <h3>Logs</h3>
      <div ref={logsRef}></div>
    </div>
  );
};

export default RTCReceiver;
