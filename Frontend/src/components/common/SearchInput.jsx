// client/src/components/common/SearchInput.jsx
import React from 'react';
import { HiSearch, HiX } from 'react-icons/hi';

const SearchInput = ({ value, onChange, placeholder, onClear }) => {
  return (
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <HiSearch className="h-5 w-5 text-gray-400" />
      </div>
      
      <input
        type="text"
        value={value}
        onChange={onChange}
        className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
        placeholder={placeholder || "Search..."}
      />
      
      {value && (
        <button
          type="button"
          className="absolute inset-y-0 right-0 pr-3 flex items-center"
          onClick={onClear || (() => onChange({ target: { value: '' } }))}
        >
          <HiX className="h-5 w-5 text-gray-400 hover:text-gray-600" />
        </button>
      )}
    </div>
  );
};

export default SearchInput;