// client/src/components/chat/VirtualizedMessageList.jsx
import React, { useEffect, useRef, useCallback } from 'react';
import { VariableSizeList as List } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import { format } from 'date-fns';
import MessageItem from './MessageItem';
import { throttle } from 'lodash'; // Optional, you can use lodash for debouncing or throttling.

const VirtualizedMessageList = ({ messages, currentUser, otherUser, loadMoreMessages, hasMore }) => {
  const listRef = useRef(null);
  const sizeMap = useRef({});
  const dateHeaderHeight = 40;
  const messageGap = 12;
  
  // Group messages by date
  const messagesByDate = messages.reduce((groups, message) => {
    const date = new Date(message.createdAt).toDateString();
    
    if (!groups[date]) {
      groups[date] = [];
    }
    
    groups[date].push(message);
    return groups;
  }, {});
  
  // Create flatten list with date headers
  const items = [];
  Object.entries(messagesByDate).forEach(([date, dateMessages]) => {
    // Add date header
    items.push({ type: 'header', date });
    
    // Add messages for this date
    dateMessages.forEach(message => {
      items.push({ type: 'message', message });
    });
  });
  
  // Calculate approximate row heights
  const getItemHeight = index => {
    if (index in sizeMap.current) {
      return sizeMap.current[index];
    }
    
    const item = items[index];
    
    if (item.type === 'header') {
      return dateHeaderHeight;
    }
    
    // Approximate message height based on content length
    const message = item.message;
    let height = 60; // Base height
    
    if (message.content) {
      const contentLength = message.content.length;
      const lineHeight = 20;
      const charsPerLine = 40;
      const estimatedLines = Math.ceil(contentLength / charsPerLine);
      height += estimatedLines * lineHeight;
    }
    
    if (message.attachments && message.attachments.length > 0) {
      height += 150; // Additional height for attachments
    }
    
    sizeMap.current[index] = height + messageGap; // Cache the height
    return height + messageGap;
  };
  
  // Set size memoization
  const setSize = (index, size) => {
    sizeMap.current = { ...sizeMap.current, [index]: size };
    listRef.current.resetAfterIndex(index);
  };
  
  // Scroll to bottom on initial load and new messages
  useEffect(() => {
    if (listRef.current && messages.length > 0) {
      listRef.current.scrollToItem(items.length - 1);
    }
  }, [messages.length]);
  
  // Debounced scroll handler to prevent frequent network calls
  const handleScroll = useCallback(
    throttle(({ scrollOffset }) => {
      if (scrollOffset < 200 && hasMore) {
        loadMoreMessages();
      }
    }, 200),
    [hasMore, loadMoreMessages] // Only recreate the throttle function when these values change
  );
  
  // Render a row (date header or message)
  const Row = ({ index, style }) => {
    const item = items[index];
    
    if (item.type === 'header') {
      return (
        <div style={style}>
          <div className="flex justify-center my-2">
            <span className="px-3 py-1 bg-gray-200 rounded-full text-xs text-gray-600">
              {format(new Date(item.date), 'MMMM d, yyyy')}
            </span>
          </div>
        </div>
      );
    }
    
    const message = item.message;
    
    return (
      <div style={style}>
        <MessageItem 
          message={message}
          isOwnMessage={message.sender._id === currentUser._id}
          otherUser={otherUser}
        />
      </div>
    );
  };
  
  return (
    <AutoSizer>
      {({ height, width }) => (
        <List
          ref={listRef}
          height={height}
          width={width}
          itemCount={items.length}
          itemSize={getItemHeight}
          onScroll={handleScroll}
        >
          {Row}
        </List>
      )}
    </AutoSizer>
  );
};

export default VirtualizedMessageList;
