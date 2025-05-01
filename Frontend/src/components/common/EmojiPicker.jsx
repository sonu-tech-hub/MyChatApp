// client/src/components/common/EmojiPicker.jsx
import React, { useRef, useEffect } from 'react';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';

const EmojiPicker = ({ onSelect, onClose }) => {
  const pickerRef = useRef(null);
  
  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        onClose();
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);
  
  return (
    <div ref={pickerRef} className="z-10 shadow-lg rounded-lg">
      <Picker
        data={data}
        onEmojiSelect={onSelect}
        theme="light"
        previewPosition="none"
        skinTonePosition="none"
      />
    </div>
  );
};

export default EmojiPicker;