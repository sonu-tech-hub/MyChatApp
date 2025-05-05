// client/src/context/CallContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import callService from '../services/callService';
import { useAuth } from './AuthContext';
import { toast } from 'react-hot-toast';

const CallContext = createContext();

export const useCallContext = () => useContext(CallContext);

export const CallProvider = ({ children }) => {
  const { user } = useAuth();
  const [callState, setCallState] = useState({
    isActive: false,
    status: null, // null, 'incoming', 'outgoing', 'connected', 'ended'
    type: null, // 'audio' or 'video'
    callId: null,
    callerId: null,
    callerName: null,
    callerPhoto: null,
    recipientId: null,
    recipientName: null,
    recipientPhoto: null,
    isOutgoing: false,
    isAudioMuted: false,
    isVideoMuted: false,
    isSpeakerOn: true
  });
  
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);

  // Initialize call service
  useEffect(() => {
    callService.initialize({
      onIncomingCall: handleIncomingCall,
      onCallConnected: handleCallConnected,
      onCallRejected: handleCallRejected,
      onCallEnded: handleCallEnded,
      onCallUnavailable: handleCallUnavailable,
      onCallDisconnected: handleCallDisconnected,
      onRemoteStream: handleRemoteStream
    });

    return () => {
      callService.cleanup();
      // Cleanup local stream when component is unmounted
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [user, localStream]);

  // Handle incoming call
  const handleIncomingCall = (callId, callerId, callerName, callerPhoto, callType) => {
    setCallState({
      isActive: true,
      status: 'incoming',
      type: callType,
      callId,
      callerId,
      callerName,
      callerPhoto,
      isOutgoing: false,
      isAudioMuted: false,
      isVideoMuted: false,
      isSpeakerOn: true
    });

    // Show toast notification
    toast((t) => (
      <div>
        <p>Incoming {callType} call from {callerName}</p>
        <div className="flex justify-center space-x-2 mt-2">
          <button 
            className="px-2 py-1 bg-red-500 text-white rounded"
            onClick={() => {
              answerCall(false);
              toast.dismiss(t.id);
            }}
          >
            Decline
          </button>
          <button 
            className="px-2 py-1 bg-green-500 text-white rounded"
            onClick={() => {
              answerCall(true);
              toast.dismiss(t.id);
            }}
          >
            Answer
          </button>
        </div>
      </div>
    ), { duration: 30000 });
  };

  // Handle call connected
  const handleCallConnected = (callId) => {
    setCallState(prev => ({
      ...prev,
      status: 'connected',
      callId
    }));
  };

  // Handle call rejected
  const handleCallRejected = () => {
    toast.error('Call was rejected');
    resetCallState();
  };

  // Handle call ended
  const handleCallEnded = () => {
    toast.info('Call ended');
    resetCallState();
  };

  // Handle call unavailable
  const handleCallUnavailable = (reason = 'User is offline') => {
    toast.error(`Call unavailable: ${reason}`);
    resetCallState();
  };

  // Handle call disconnected (connection lost)
  const handleCallDisconnected = () => {
    toast.error('Call disconnected');
    resetCallState();
  };

  // Handle remote stream (video/audio stream)
  const handleRemoteStream = (stream) => {
    setRemoteStream(stream);
  };

  // Initiate a call
  const initiateCall = async (recipientId, recipientName, callType = 'audio') => {
    try {
      setCallState({
        isActive: true,
        status: 'outgoing',
        type: callType,
        recipientId,
        recipientName,
        isOutgoing: true,
        isAudioMuted: false,
        isVideoMuted: false,
        isSpeakerOn: true
      });

      const stream = await callService.startCall(recipientId, callType);
      setLocalStream(stream);
    } catch (error) {
      console.error('Error initiating call:', error);
      toast.error('Failed to start call');
      resetCallState();
    }
  };

  // Answer incoming call
  const answerCall = async (accept = true) => {
    try {
      if (accept) {
        const stream = await callService.acceptCall(callState.callerId);
        setLocalStream(stream);
      } else {
        await callService.endCall(callState.callerId);
        resetCallState();
      }
    } catch (error) {
      console.error('Error answering call:', error);
      toast.error('Failed to answer call');
      resetCallState();
    }
  };

  // End current call
  const endCall = () => {
    if (callState.isActive) {
      const userId = callState.isOutgoing ? callState.recipientId : callState.callerId;
      callService.endCall(userId);
      resetCallState();
    }
  };

  // Toggle audio mute
  const toggleAudio = () => {
    const newMuteState = !callState.isAudioMuted;
    const enabled = callService.toggleAudio(newMuteState);

    setCallState(prev => ({
      ...prev,
      isAudioMuted: !enabled
    }));
  };

  // Toggle video mute
  const toggleVideo = () => {
    const newMuteState = !callState.isVideoMuted;
    const enabled = callService.toggleVideo(newMuteState);

    setCallState(prev => ({
      ...prev,
      isVideoMuted: !enabled
    }));
  };

  // Toggle speaker
  const toggleSpeaker = () => {
    setCallState(prev => ({
      ...prev,
      isSpeakerOn: !prev.isSpeakerOn
    }));

    // Actual speaker toggling logic might involve manipulating the audio output device
  };

  // Switch camera (for mobile)
  const switchCamera = async () => {
    try {
      const newFacingMode = await callService.switchCamera();
      toast.success(`Switched to ${newFacingMode === 'user' ? 'front' : 'back'} camera`);
    } catch (error) {
      console.error('Error switching camera:', error);
      toast.error('Failed to switch camera');
    }
  };

  // Reset call state and stop all streams
  const resetCallState = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }

    setRemoteStream(null);
    
    setCallState({
      isActive: false,
      status: null,
      type: null,
      callId: null,
      callerId: null,
      callerName: null,
      callerPhoto: null,
      recipientId: null,
      recipientName: null,
      recipientPhoto: null,
      isOutgoing: false,
      isAudioMuted: false,
      isVideoMuted: false,
      isSpeakerOn: true
    });
  };

  return (
    <CallContext.Provider
      value={{
        callState,
        localStream,
        remoteStream,
        initiateCall,
        answerCall,
        endCall,
        toggleAudio,
        toggleVideo,
        toggleSpeaker,
        switchCamera
      }}
    >
      {children}
      {callState.isActive && <CallUI />} {/* CallUI component should be implemented */}
    </CallContext.Provider>
  );
};
