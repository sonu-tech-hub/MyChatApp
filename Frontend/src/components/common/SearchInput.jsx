import React from 'react';
import { HiSearch, HiX } from 'react-icons/hi';

const SearchInput = ({ value, onChange, placeholder = "Search...", onClear }) => {
  return (
    <div className="relative">
      {/* Search Icon */}
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <HiSearch className="h-5 w-5 text-gray-400" />
      </div>

      {/* Input Field */}
      <input
        type="text"
        value={value}
        onChange={onChange}
        className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
        placeholder={placeholder}
        aria-label="Search input"  // Adding aria-label for accessibility
      />

      {/* Clear Button */}
      {value && (
        <button
          type="button"
          className="absolute inset-y-0 right-0 pr-3 flex items-center"
          onClick={onClear || (() => onChange({ target: { value: '' } }))}
          aria-label="Clear search input"  // Accessibility label for the button
        >
          <HiX className="h-5 w-5 text-gray-400 hover:text-gray-600" />
        </button>
      )}
    </div>
  );
};

export default SearchInput;
