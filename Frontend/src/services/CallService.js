import { emitEvent, onEvent } from './socketService';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
    ...(import.meta.env.VITE_TURN_URLS
      ? [{
          urls: import.meta.env.VITE_TURN_URLS.split(','),
          username: import.meta.env.VITE_TURN_USERNAME || 'username',
          credential: import.meta.env.VITE_TURN_CREDENTIAL || 'password',
        }]
      : []),
  ],
  iceCandidatePoolSize: 10,
};

class CallService {
  constructor() {
    this.peerConnections = {};
    this.localStream = null;
    this.remoteStreams = {};
    this.callListeners = {};
    this.currentCallId = null;
    this.isInCall = false;
    this.eventHandlers = {};
    this.negotiationTimer = null;
  }

  initialize(eventHandlers) {
    this.eventHandlers = eventHandlers;
    this.setupEventListeners();
    return this;
  }

  setupEventListeners() {
    this.removeEventListeners();

    this.callListeners.onCallOffer = onEvent('callOffer', (data) => {
      this.handleIncomingCall(data);
    });

    this.callListeners.onCallAccepted = onEvent('callAccepted', (data) => {
      this.handleCallAccepted(data);
    });

    this.callListeners.onCallRejected = onEvent('callRejected', (data) => {
      this.handleCallRejected(data);
    });

    this.callListeners.onIceCandidate = onEvent('iceCandidate', (data) => {
      this.handleIceCandidate(data);
    });

    this.callListeners.onCallEnded = onEvent('callEnded', (data) => {
      this.handleCallEnded(data);
    });

    this.callListeners.onCallUnavailable = onEvent('callUnavailable', (data) => {
      this.handleCallUnavailable(data);
    });

    this.callListeners.onCallRenegotiate = onEvent('callRenegotiate', (data) => {
      this.handleCallRenegotiate(data);
    });
  }

  removeEventListeners() {
    Object.entries(this.callListeners).forEach(([_, off]) => {
      if (typeof off === 'function') off();
    });
    this.callListeners = {};
  }

  async handleIncomingCall(data) {
    const { callId, callerId, callerName, callerPhoto, offer, callType } = data;

    this.currentCallId = callId;
    if (this.eventHandlers.onIncomingCall) {
      this.eventHandlers.onIncomingCall(callId, callerId, callerName, callerPhoto, callType);
    }

    this.peerConnections[callerId] = new RTCPeerConnection(ICE_SERVERS);

    try {
      await this.peerConnections[callerId].setRemoteDescription(new RTCSessionDescription(offer));
      this.setupPeerConnectionHandlers(callerId);
    } catch (error) {
      console.error('Error setting remote description:', error);
      this.sendCallRejected(callerId, callId, 'Failed to set description');
      this.cleanupCall(callerId);
    }
  }

  async handleCallAccepted(data) {
    const { callId, recipientId, answer } = data;

    if (this.peerConnections[recipientId]) {
      try {
        await this.peerConnections[recipientId].setRemoteDescription(new RTCSessionDescription(answer));
        this.isInCall = true;
        if (this.eventHandlers.onCallConnected) {
          this.eventHandlers.onCallConnected(callId, recipientId);
        }
      } catch (error) {
        console.error('Error setting remote description:', error);
        this.cleanupCall(recipientId);
        this.isInCall = false;
      }
    }
  }

  handleCallRejected(data) {
    const { callId, recipientId } = data;
    this.cleanupCall(recipientId);
    if (this.eventHandlers.onCallRejected) {
      this.eventHandlers.onCallRejected(callId, recipientId);
    }
  }

  handleIceCandidate(data) {
    const { senderId, candidate } = data;
    if (this.peerConnections[senderId]) {
      this.peerConnections[senderId].addIceCandidate(new RTCIceCandidate(candidate)).catch((e) =>
        console.error('Error adding ICE candidate', e)
      );
    }
  }

  handleCallEnded(data) {
    const { callId, endedBy } = data;
    this.cleanupCall(endedBy);
    if (this.eventHandlers.onCallEnded) {
      this.eventHandlers.onCallEnded(callId, endedBy);
    }
  }

  handleCallUnavailable(data) {
    const { callId, recipientId, reason } = data;
    this.cleanupCall(recipientId);
    if (this.eventHandlers.onCallUnavailable) {
      this.eventHandlers.onCallUnavailable(callId, recipientId, reason);
    }
  }

  async handleCallRenegotiate(data) {
    const { senderId, offer } = data;
    const pc = this.peerConnections[senderId];
    if (!pc) return;

    try {
      const isCaller = senderId !== this.getPeerId();
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      if (isCaller) {
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        emitEvent('callRenegotiate', {
          recipientId: senderId,
          answer,
        });
      }
    } catch (error) {
      console.error('Renegotiation error:', error);
      this.endCall(senderId);
    }
  }

  getPeerId() {
    const track = this.localStream?.getTracks()[0];
    return track?.id || null;
  }

  async startCall(recipientId, callType = 'audio') {
    try {
      if (this.isInCall) throw new Error('Already in a call');

      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: callType === 'video',
      });

      const pc = new RTCPeerConnection(ICE_SERVERS);
      this.peerConnections[recipientId] = pc;

      this.localStream.getTracks().forEach((track) => pc.addTrack(track, this.localStream));
      this.setupPeerConnectionHandlers(recipientId);

      const offer = await pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: callType === 'video' });
      await pc.setLocalDescription(offer);

      this.isInCall = true;
      this.currentCallId = crypto.randomUUID();

      emitEvent('callOffer', {
        recipientId,
        offer,
        callType,
        callId: this.currentCallId,
      });

      return this.localStream;
    } catch (error) {
      this.cleanupCall(recipientId);
      console.error('Error starting call:', error);
      throw error;
    }
  }

  async answerCall(callerId, accepted = true) {
    try {
      if (!accepted) {
        this.sendCallRejected(callerId, this.currentCallId);
        this.cleanupCall(callerId);
        return null;
      }

      const hasVideo = this.peerConnections[callerId]
        ?.getTransceivers()
        .some((t) => t.receiver.track?.kind === 'video');

      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: hasVideo,
      });

      this.localStream.getTracks().forEach((track) => {
        this.peerConnections[callerId].addTrack(track, this.localStream);
      });

      this.setupPeerConnectionHandlers(callerId);

      const answer = await this.peerConnections[callerId].createAnswer();
      await this.peerConnections[callerId].setLocalDescription(answer);

      emitEvent('callAccepted', {
        callId: this.currentCallId,
        recipientId: callerId,
        answer,
        accepted: true,
      });

      this.isInCall = true;
      return this.localStream;
    } catch (error) {
      this.cleanupCall(callerId);
      console.error('Error answering call:', error);
      throw error;
    }
  }

  sendCallRejected(recipientId, callId, reason = 'Rejected by user') {
    emitEvent('callRejected', { callId, recipientId, reason });
  }

  endCall(userId) {
    if (!this.isInCall && !this.currentCallId) return;

    emitEvent('callEnded', {
      callId: this.currentCallId,
      endedBy: userId,
    });

    this.cleanupCall(userId);
  }

  setupPeerConnectionHandlers(userId) {
    const pc = this.peerConnections[userId];
    if (!pc) return;

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        emitEvent('iceCandidate', {
          senderId: userId,
          candidate: event.candidate,
        });
      }
    };

    pc.oniceconnectionstatechange = () => {
      const state = pc.iceConnectionState;
      console.log(`ICE state: ${state}`);

      switch (state) {
        case 'checking':
          this.eventHandlers.onCallConnecting?.(this.currentCallId, userId);
          break;
        case 'connected':
        case 'completed':
          this.eventHandlers.onCallConnected?.(this.currentCallId, userId);
          break;
        case 'disconnected':
          this.eventHandlers.onCallDisconnected?.(this.currentCallId, userId);
          try {
            pc.restartIce();
          } catch (e) {}
          break;
        case 'failed':
          try {
            pc.restartIce();
            clearTimeout(this.negotiationTimer);
            this.negotiationTimer = setTimeout(async () => {
              if (pc.iceConnectionState === 'failed') {
                try {
                  const offer = await pc.createOffer({ iceRestart: true });
                  await pc.setLocalDescription(offer);
                  emitEvent('callRenegotiate', { recipientId: userId, offer });
                } catch (e) {
                  this.endCall(userId);
                }
              }
            }, 3000);
          } catch (e) {
            this.endCall(userId);
          }
          break;
        case 'closed':
          this.cleanupCall(userId);
          break;
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'failed') {
        this.eventHandlers.onCallFailed?.(this.currentCallId, userId);
        this.endCall(userId);
      }
    };

    pc.ontrack = (event) => {
      this.remoteStreams[userId] = event.streams[0];
      this.eventHandlers.onRemoteStream?.(userId, event.streams[0]);
    };
  }

  cleanupCall(userId) {
    const pc = this.peerConnections[userId];
    if (pc) {
      pc.close();
      delete this.peerConnections[userId];
    }
    delete this.remoteStreams[userId];

    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
      this.localStream = null;
    }

    this.isInCall = false;
    this.currentCallId = null;

    if (this.negotiationTimer) {
      clearTimeout(this.negotiationTimer);
      this.negotiationTimer = null;
    }
  }

  toggleAudio(mute) {
    if (!this.localStream) return false;
    this.localStream.getAudioTracks().forEach((track) => (track.enabled = !mute));
    return !mute;
  }

  toggleVideo(hide) {
    if (!this.localStream) return false;
    this.localStream.getVideoTracks().forEach((track) => (track.enabled = !hide));
    return !hide;
  }

  async switchCamera() {
    if (!this.localStream) return;

    const videoTrack = this.localStream.getVideoTracks()[0];
    if (!videoTrack) return;

    const currentFacing = videoTrack.getSettings().facingMode || 'user';
    const newFacing = currentFacing === 'user' ? 'environment' : 'user';

    videoTrack.stop();

    const newStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: newFacing } });
    const newVideoTrack = newStream.getVideoTracks()[0];

    this.localStream.removeTrack(videoTrack);
    this.localStream.addTrack(newVideoTrack);

    Object.values(this.peerConnections).forEach((pc) => {
      const sender = pc.getSenders().find((s) => s.track?.kind === 'video');
      if (sender) sender.replaceTrack(newVideoTrack);
    });

    return newFacing;
  }

  cleanup() {
    Object.keys(this.peerConnections).forEach((userId) => {
      this.cleanupCall(userId);
    });
    this.removeEventListeners();
  }
}

export default new CallService();
