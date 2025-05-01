import React, { useState, useEffect, useRef } from 'react';
import { HiMicrophone, HiMicrophoneOff, HiVideoCamera, HiVideoCameraOff, HiPhone, HiVolumeUp, HiVolumeOff, HiSwitchHorizontal } from 'react-icons/hi';
import { useCallContext } from '../../context/CallContext';
import Avatar from '../common/Avatar';

const CallUI = () => {
  const { 
    callState, 
    endCall, 
    toggleAudio, 
    toggleVideo, 
    toggleSpeaker,
    switchCamera,
    localStream,
    remoteStream
  } = useCallContext();
  
  const [elapsedTime, setElapsedTime] = useState(0);
  const [screenWidth, setScreenWidth] = useState(window.innerWidth);
  
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const timerRef = useRef(null);
  
  // Update screen width on resize
  useEffect(() => {
    const handleResize = () => {
      setScreenWidth(window.innerWidth);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Set local stream to video element
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);
  
  // Set remote stream to video element
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);
  
  // Track call duration
  useEffect(() => {
    if (callState.status === 'connected') {
      // Start timer
      timerRef.current = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    } else {
      // Clear timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [callState.status]);
  
  // Format elapsed time
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };
  
  // Determine the correct styling based on call status and type
  const getLayoutStyle = () => {
    // If the call is not connected or is audio only, use the compact view
    if (callState.status !== 'connected' || callState.type === 'audio') {
      return 'flex flex-col items-center justify-center';
    }
    
    // For video calls, use full-screen layout
    return 'relative h-full';
  };
  
  // Render different UI based on call status
  const renderCallContent = () => {
    switch (callState.status) {
      case 'outgoing':
        return (
          <div className="text-center">
            <Avatar 
              src={callState.recipientPhoto} 
              name={callState.recipientName} 
              size="xl" 
            />
            <h3 className="mt-4 text-xl font-medium">{callState.recipientName}</h3>
            <p className="mt-2 text-gray-500">Calling...</p>
          </div>
        );
      
      case 'incoming':
        return (
          <div className="text-center">
            <Avatar 
              src={callState.callerPhoto} 
              name={callState.callerName} 
              size="xl" 
            />
            <h3 className="mt-4 text-xl font-medium">{callState.callerName}</h3>
            <p className="mt-2 text-gray-500">Incoming {callState.type} call</p>
            
            <div className="mt-6 flex justify-center space-x-6">
              {/* Reject button */}
              <button 
                className="p-4 bg-red-500 rounded-full text-white shadow-lg hover:bg-red-600"
                onClick={() => endCall(false)}
              >
                <HiPhone className="w-6 h-6 transform rotate-135" />
              </button>
              
              {/* Accept button */}
              <button 
                className="p-4 bg-green-500 rounded-full text-white shadow-lg hover:bg-green-600"
                onClick={() => endCall(true)}
              >
                <HiPhone className="w-6 h-6" />
              </button>
            </div>
          </div>
        );
      
      case 'connected':
        return callState.type === 'audio' ? (
          // Audio call UI
          <div className="text-center">
            <Avatar 
              src={callState.isOutgoing ? callState.recipientPhoto : callState.callerPhoto} 
              name={callState.isOutgoing ? callState.recipientName : callState.callerName} 
              size="xl" 
            />
            <h3 className="mt-4 text-xl font-medium">
              {callState.isOutgoing ? callState.recipientName : callState.callerName}
            </h3>
            <p className="mt-2 text-gray-500">{formatTime(elapsedTime)}</p>
          </div>
        ) : (
          // Video call UI
          <div className="relative h-full">
            {/* Remote video (full screen) */}
            {remoteStream ? (
              <video 
                ref={remoteVideoRef} 
                autoPlay 
                playsInline
                className="w-full h-full object-cover rounded-lg"
              />
            ) : (
              <div className="w-full h-full bg-gray-800 flex items-center justify-center rounded-lg">
                <Avatar 
                  src={callState.isOutgoing ? callState.recipientPhoto : callState.callerPhoto}
                  name={callState.isOutgoing ? callState.recipientName : callState.callerName}
                  size="xl" 
                />
              </div>
            )}
            
            {/* Call duration */}
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 px-3 py-1 bg-black bg-opacity-50 rounded-full text-white text-sm">
              {formatTime(elapsedTime)}
            </div>
            
            {/* Local video (picture-in-picture) */}
            <div className="absolute top-4 right-4 w-1/4 max-w-[120px] aspect-video rounded-lg overflow-hidden border-2 border-white shadow-lg">
              <video 
                ref={localVideoRef} 
                autoPlay 
                playsInline 
                muted
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl overflow-hidden w-full max-w-md">
        {/* Call header */}
        <div className="bg-primary text-white p-4">
          <h2 className="text-center font-medium">
            {callState.type.charAt(0).toUpperCase() + callState.type.slice(1)} Call
          </h2>
        </div>
        
        {/* Call content */}
        <div className="p-6 h-96">
          <div className={getLayoutStyle()}>
            {renderCallContent()}
          </div>
        </div>
        
        {/* Call controls */}
        <div className="bg-gray-100 p-4 flex justify-center space-x-4">
          {/* Mute button */}
          <button 
            className={`p-3 rounded-full ${callState.isAudioMuted ? 'bg-red-100 text-red-600' : 'bg-gray-200 text-gray-700'} hover:bg-opacity-80`}
            onClick={toggleAudio}
            disabled={callState.status !== 'connected'}
          >
            {callState.isAudioMuted ? (
              <HiMicrophoneOff className="w-6 h-6" />
            ) : (
              <HiMicrophone className="w-6 h-6" />
            )}
          </button>
          
          {/* End call button */}
          <button 
            className="p-3 bg-red-500 rounded-full text-white hover:bg-red-600"
            onClick={() => endCall()}
          >
            <HiPhone className="w-6 h-6 transform rotate-135" />
          </button>
          
          {/* Video toggle (only for video calls) */}
          {callState.type === 'video' && (
            <button 
              className={`p-3 rounded-full ${callState.isVideoMuted ? 'bg-red-100 text-red-600' : 'bg-gray-200 text-gray-700'} hover:bg-opacity-80`}
              onClick={toggleVideo}
              disabled={callState.status !== 'connected'}
            >
              {callState.isVideoMuted ? (
                <HiVideoCameraOff className="w-6 h-6" />
              ) : (
                <HiVideoCamera className="w-6 h-6" />
              )}
            </button>
          )}
          
          {/* Speaker toggle */}
          <button 
            className={`p-3 rounded-full ${callState.isSpeakerOn ? 'bg-gray-200 text-gray-700' : 'bg-red-100 text-red-600'} hover:bg-opacity-80`}
            onClick={toggleSpeaker}
            disabled={callState.status !== 'connected'}
          >
            {callState.isSpeakerOn ? (
              <HiVolumeUp className="w-6 h-6" />
            ) : (
              <HiVolumeOff className="w-6 h-6" />
            )}
          </button>
          
          {/* Camera switch (mobile only) */}
          {callState.type === 'video' && screenWidth < 768 && (
            <button 
              className="p-3 rounded-full bg-gray-200 text-gray-700 hover:bg-opacity-80"
              onClick={switchCamera}
              disabled={callState.status !== 'connected'}
            >
              <HiSwitchHorizontal className="w-6 h-6" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CallUI;