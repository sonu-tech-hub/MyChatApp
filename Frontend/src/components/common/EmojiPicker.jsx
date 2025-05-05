// client/src/components/common/EmojiPicker.jsx
import React, { useRef, useEffect, useCallback } from 'react';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';

const EmojiPicker = ({ onSelect, onClose }) => {
  const pickerRef = useRef(null);

  // Handle click outside to close
  const handleClickOutside = useCallback((event) => {
    if (pickerRef.current && !pickerRef.current.contains(event.target)) {
      onClose();
    }
  }, [onClose]);

  // Handle ESC key to close the picker
  const handleEscKey = useCallback((event) => {
    if (event.key === 'Escape') {
      onClose();
    }
  }, [onClose]);

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscKey);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [handleClickOutside, handleEscKey]);

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
