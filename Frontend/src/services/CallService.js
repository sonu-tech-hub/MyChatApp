import { emitEvent, onEvent } from './socketService';

// ICE servers configuration for WebRTC
const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
    // Add TURN servers for production (these are examples, use your own)
    {
      urls: [
        import.meta.env.VITE_TURN_URLS || 'turn:example.com:3478',
      ],
      username: import.meta.env.VITE_TURN_USERNAME || 'username',
      credential: import.meta.env.VITE_TURN_CREDENTIAL || 'password',
    },
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
    this.eventHandlers = {}; // Initialize eventHandlers here
    this.negotiationTimer = null;
  }

  // Initialize call service with event handlers
  initialize(eventHandlers) {
    this.eventHandlers = eventHandlers;
    this.setupEventListeners();
    return this;
  }

  // Set up socket event listeners for call-related events
  setupEventListeners() {
    // Incoming call offer
    this.callListeners.onCallOffer = (data) => {
      this.handleIncomingCall(data);
    };

    // Call accepted
    this.callListeners.onCallAccepted = (data) => {
      this.handleCallAccepted(data);
    };

    // Call rejected
    this.callListeners.onCallRejected = (data) => {
      this.handleCallRejected(data);
    };

    // ICE candidate received
    this.callListeners.onIceCandidate = (data) => {
      this.handleIceCandidate(data);
    };

    // Call ended
    this.callListeners.onCallEnded = (data) => {
      this.handleCallEnded(data);
    };

    // Call unavailable (recipient offline or busy)
    this.callListeners.onCallUnavailable = (data) => {
      this.handleCallUnavailable(data);
    };

    //listen to callRenegotiate event
    this.callListeners.onCallRenegotiate = (data) => {
      this.handleCallRenegotiate(data);
    };
  }

  async handleIncomingCall(data) {
    const { callId, callerId, callerName, callerPhoto, offer, callType } = data;

    this.currentCallId = callId;

    // Notify UI layer
    if (this.eventHandlers.onIncomingCall) {
      this.eventHandlers.onIncomingCall(
        callId,
        callerId,
        callerName,
        callerPhoto,
        callType
      );
    }

    // Store the connection for later use if the call is accepted
    this.peerConnections[callerId] = new RTCPeerConnection(ICE_SERVERS);

    // Set remote description
    try {
      await this.peerConnections[callerId].setRemoteDescription(
        new RTCSessionDescription(offer)
      );
      this.setupPeerConnectionHandlers(callerId); // Set handlers here
    } catch (error) {
      console.error('Error setting remote description:', error);
      // Handle the error appropriately, e.g., reject the call
      this.sendCallRejected(callerId, callId, 'Failed to set description');
      this.cleanupCall(callerId);
    }
  }

  async handleCallAccepted(data) {
    const { callId, recipientId, answer } = data;

    // Set remote description (answer from recipient)
    if (this.peerConnections[recipientId]) {
      try {
        await this.peerConnections[recipientId].setRemoteDescription(
          new RTCSessionDescription(answer)
        );

        // Call is now established
        this.isInCall = true;

        // Notify UI layer
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

    // Clean up connection
    this.cleanupCall(recipientId);

    // Notify UI layer
    if (this.eventHandlers.onCallRejected) {
      this.eventHandlers.onCallRejected(callId, recipientId);
    }
  }

  handleIceCandidate(data) {
    const { senderId, candidate } = data;

    if (this.peerConnections[senderId]) {
      this.peerConnections[senderId]
        .addIceCandidate(new RTCIceCandidate(candidate))
        .catch((e) => console.error('Error adding ICE candidate', e));
    }
  }

  handleCallEnded(data) {
    const { callId, endedBy } = data;

    // Clean up connection
    this.cleanupCall(endedBy);

    // Notify UI layer
    if (this.eventHandlers.onCallEnded) {
      this.eventHandlers.onCallEnded(callId, endedBy);
    }
  }

  handleCallUnavailable(data) {
    const { callId, recipientId, reason } = data;

    // Clean up connection
    this.cleanupCall(recipientId);

    // Notify UI layer
    if (this.eventHandlers.onCallUnavailable) {
      this.eventHandlers.onCallUnavailable(callId, recipientId, reason);
    }
  }

  async handleCallRenegotiate(data) {
    const { senderId, offer } = data;
    const pc = this.peerConnections[senderId];

    if (!pc) {
      console.warn('Received renegotiation offer for non-existent PC:', senderId);
      return;
    }

    try {
      const isCaller = senderId !== this.getPeerId(); // Determine who initiated

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
      console.error('handleCallRenegotiate error', error);
      this.endCall(senderId);
    }
  }

  getPeerId() {
    if (this.localStream) {
      const tracks = this.localStream.getTracks();
      if (tracks.length > 0) {
        return tracks[0].id; //changed from label to id
      }
    }
    return null;
  }

  // Start a new call
  async startCall(recipientId, callType = 'audio') {
    try {
      if (this.isInCall) {
        throw new Error('Already in a call');
      }

      // Get media stream based on call type
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: callType === 'video',
      });

      // Create peer connection
      this.peerConnections[recipientId] = new RTCPeerConnection(ICE_SERVERS);

      // Add local stream tracks to the connection
      this.localStream.getTracks().forEach((track) => {
        this.peerConnections[recipientId].addTrack(track, this.localStream);
      });

      // Set up event handlers for this connection
      this.setupPeerConnectionHandlers(recipientId);

      // Create offer
      const offer = await this.peerConnections[recipientId].createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: callType === 'video',
      });

      // Set local description
      await this.peerConnections[recipientId].setLocalDescription(offer);

      // Send offer to recipient
      emitEvent('callOffer', {
        recipientId,
        offer,
        callType,
      });

      this.isInCall = true;
      this.currentCallId = crypto.randomUUID();
      return this.localStream;
    } catch (error) {
      this.cleanupCall(recipientId);
      console.error('Error starting call:', error);
      throw error;
    }
  }

  // Answer an incoming call
  async answerCall(callerId, accepted = true) {
    try {
      if (accepted) {
        // Get the call type (check if video tracks exist in the offer)
        const hasVideo = this.peerConnections[callerId]
          ?.getTransceivers()
          .some((transceiver) => transceiver.receiver.track?.kind === 'video');

        // Get local media
        this.localStream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: hasVideo,
        });

        // Add local stream to peer connection
        this.localStream.getTracks().forEach((track) => {
          this.peerConnections[callerId].addTrack(track, this.localStream);
        });

        // Set up connection handlers
        this.setupPeerConnectionHandlers(callerId);

        // Create answer
        const answer = await this.peerConnections[callerId].createAnswer();
        await this.peerConnections[callerId].setLocalDescription(answer);

        // Send answer to caller
        emitEvent('callAccepted', {
          callId: this.currentCallId,
          recipientId: callerId, // Changed to callerId
          answer,
          accepted: true,
        });

        this.isInCall = true;
        return this.localStream;
      } else {
        // Reject the call
        emitEvent('callRejected', {
          callId: this.currentCallId,
          recipientId: callerId, // Changed to callerId
        });

        this.cleanupCall(callerId);
        return null;
      }
    } catch (error) {
      this.cleanupCall(callerId);
      console.error('Error answering call:', error);
      throw error;
    }
  }

  sendCallRejected(targetId, callId, reason) {
    emitEvent('callRejected', {
      callId,
      recipientId: targetId,
      reason,
    });
  }

  // End an ongoing call
  endCall(userId) {
    if (!this.isInCall && !this.currentCallId) {
      return;
    }

    // Notify the other user
    emitEvent('callEnded', {
      callId: this.currentCallId,
      endedBy: userId, //send endedBy
    });

    // Clean up call resources
    this.cleanupCall(userId);
  }

  // Set up WebRTC peer connection event handlers
  setupPeerConnectionHandlers(userId) {
    const peerConnection = this.peerConnections[userId];

    if (!peerConnection) return;

    // ICE candidate generation
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        emitEvent('iceCandidate', {
          senderId: userId, // Changed to senderId
          candidate: event.candidate,
        });
      }
    };
    // Improved connection state monitoring
    peerConnection.oniceconnectionstatechange = () => {
      console.log(`ICE connection state: ${peerConnection.iceConnectionState}`);

      switch (peerConnection.iceConnectionState) {
        case 'checking':
          // Show connecting UI
          if (this.eventHandlers.onCallConnecting) {
            this.eventHandlers.onCallConnecting(this.currentCallId, userId);
          }
          break;

        case 'connected':
        case 'completed':
          // Connection established
          if (this.eventHandlers.onCallConnected) {
            this.eventHandlers.onCallConnected(this.currentCallId, userId);
          }
          break;

        case 'disconnected':
          // Connection lost temporarily, can recover
          if (this.eventHandlers.onCallDisconnected) {
            this.eventHandlers.onCallDisconnected(this.currentCallId, userId);
          }

          // Try to restart ICE if disconnected
          try {
            peerConnection.restartIce();
          } catch (e) {
            console.error('Failed to restart ICE:', e);
          }
          break;

        case 'failed':
          // Connection failed, attempt recovery
          console.error('ICE connection failed, attempting recovery');

          // Try to restart ICE
          try {
            peerConnection.restartIce();

            // If we have a negotiation timer, clear it
            if (this.negotiationTimer) {
              clearTimeout(this.negotiationTimer);
            }

            // Set a timer to create a new offer if restart doesn't work
            this.negotiationTimer = setTimeout(async () => {
              if (peerConnection.iceConnectionState === 'failed') {
                try {
                  // Create new offer
                  const offer = await peerConnection.createOffer({
                    iceRestart: true,
                  });
                  await peerConnection.setLocalDescription(offer);

                  // Send offer to recipient
                  emitEvent('callRenegotiate', {
                    recipientId: userId,
                    offer,
                  });
                } catch (error) {
                  console.error('Renegotiation failed:', error);
                  this.endCall(userId);
                }
              }
            }, 3000);
          } catch (e) {
            console.error('Failed to recover connection:', e);
            this.endCall(userId);
          }
          break;

        case 'closed':
          // Connection closed
          this.cleanupCall(userId);
          break;
      }
    };
    // Connection state monitoring for newer browsers
    peerConnection.onconnectionstatechange = () => {
      console.log(`Connection state: ${peerConnection.connectionState}`);

      if (peerConnection.connectionState === 'failed') {
        if (this.eventHandlers.onCallFailed) {
          this.eventHandlers.onCallFailed(this.currentCallId, userId);
        }
        this.endCall(userId);
      }
    };

    // New remote track received
    peerConnection.ontrack = (event) => {
      // Store remote stream
      this.remoteStreams[userId] = event.streams[0];

      // Notify UI layer
      if (this.eventHandlers.onRemoteStream) {
        this.eventHandlers.onRemoteStream(userId, event.streams[0]);
      }
    };
  }

  // Clean up resources for a call
  cleanupCall(userId) {
    // Close peer connection
    if (this.peerConnections[userId]) {
      this.peerConnections[userId].close();
      delete this.peerConnections[userId];
    }

    // Clean up remote stream
    if (this.remoteStreams[userId]) {
      delete this.remoteStreams[userId];
    }

    // Stop local media tracks
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

  // Toggle audio mute status
  toggleAudio(mute) {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach((track) => {
        track.enabled = !mute;
      });
      return !mute;
    }
    return false;
  }

  // Toggle video mute status
  toggleVideo(hide) {
    if (this.localStream) {
      this.localStream.getVideoTracks().forEach((track) => {
        track.enabled = !hide;
      });
      return !hide;
    }
    return false;
  }

  // Switch camera (mobile devices)
  async switchCamera() {
    if (!this.localStream) return;

    // Get current video track
    const videoTrack = this.localStream.getVideoTracks()[0];
    if (!videoTrack) return;

    // Get current camera facing mode
    const currentFacingMode = videoTrack.getSettings().facingMode;
    const newFacingMode =
      currentFacingMode === 'user' ? 'environment' : 'user';

    // Stop current track
    videoTrack.stop();

    // Get new video track with different camera
    const newStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: newFacingMode },
    });

    const newVideoTrack = newStream.getVideoTracks()[0];

    // Replace track in local stream
    this.localStream.removeTrack(videoTrack);
    this.localStream.addTrack(newVideoTrack);

    // Replace track in all peer connections
    Object.values(this.peerConnections).forEach((pc) => {
      const sender = pc
        .getSenders()
        .find((s) => s.track && s.track.kind === 'video');
      if (sender) {
        sender.replaceTrack(newVideoTrack);
      }
    });

    return newFacingMode;
  }

  // Clean up all resources
  cleanup() {
    // Close all peer connections
    Object.keys(this.peerConnections).forEach((userId) => {
      this.cleanupCall(userId);
    });

    // Remove all event listeners
    Object.values(this.callListeners).forEach((removeFn) => {
      if (typeof removeFn === 'function') {
        //removeFn(); //not removing listeners
      }
    });

    this.callListeners = {};
    if (this.negotiationTimer) {
      clearTimeout(this.negotiationTimer);
      this.negotiationTimer = null;
    }
  }
}

export default new CallService();
