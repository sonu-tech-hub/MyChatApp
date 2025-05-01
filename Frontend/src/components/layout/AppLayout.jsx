// client/src/components/layout/AppLayout.jsx
import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { HiChat, HiUserGroup, HiUser, HiMenu, HiX } from 'react-icons/hi';
import { useAuth } from '../../context/AuthContext';
import Avatar from '../common/Avatar';

const AppLayout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Navigation items
  const navItems = [
    { path: '/', label: 'Chats', icon: <HiChat className="w-6 h-6" /> },
    { path: '/groups', label: 'Groups', icon: <HiUserGroup className="w-6 h-6" /> },
    { path: '/profile', label: 'Profile', icon: <HiUser className="w-6 h-6" /> }
  ];
  
  // Toggle mobile menu
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };
  
  // Close mobile menu
  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };
  
  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar for desktop */}
      <div className="hidden md:flex md:flex-col md:w-64 bg-white shadow-md">
        {/* App logo and title */}
        <div className="p-4 border-b">
          <h1 className="text-xl font-bold text-primary">Chat App</h1>
        </div>
        
        {/* Navigation menu */}
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-2 px-2">
            {navItems.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                    location.pathname === item.path
                      ? 'bg-primary text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {item.icon}
                  <span className="ml-3">{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        
        {/* User profile and logout */}
        <div className="p-4 border-t">
          <div className="flex items-center">
            <Avatar src={user?.profilePhoto} name={user?.name} size="md" />
            <div className="ml-3">
              <p className="font-medium text-gray-800">{user?.name}</p>
              <p className="text-sm text-gray-500 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="mt-4 w-full py-2 px-4 bg-gray-200 hover:bg-gray-300 rounded-lg text-gray-800 transition-colors"
          >
            Logout
          </button>
        </div>
      </div>
      
      {/* Mobile header */}
      <div className="md:hidden fixed top-0 inset-x-0 bg-white shadow-md z-10">
        <div className="flex items-center justify-between p-4">
          <h1 className="text-xl font-bold text-primary">Chat App</h1>
          <button onClick={toggleMobileMenu} className="p-2 rounded-md">
            {isMobileMenuOpen ? (
              <HiX className="w-6 h-6 text-gray-600" />
            ) : (
              <HiMenu className="w-6 h-6 text-gray-600" />
            )}
          </button>
        </div>
      </div>
      
      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 bg-gray-800 bg-opacity-75 z-20">
          <div className="bg-white h-screen w-64 shadow-xl">
            {/* App logo and title */}
            <div className="p-4 border-b flex justify-between items-center">
              <h1 className="text-xl font-bold text-primary">Chat App</h1>
              <button onClick={closeMobileMenu}>
                <HiX className="w-6 h-6 text-gray-600" />
              </button>
            </div>
            
            {/* Navigation menu */}
            <nav className="py-4">
              <ul className="space-y-2 px-2">
                {navItems.map((item) => (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                        location.pathname === item.path
                          ? 'bg-primary text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                      onClick={closeMobileMenu}
                    >
                      {item.icon}
                      <span className="ml-3">{item.label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
            
            {/* User profile and logout */}
            <div className="p-4 border-t absolute bottom-0 w-full">
              <div className="flex items-center">
                <Avatar src={user?.profilePhoto} name={user?.name} size="md" />
                <div className="ml-3">
                  <p className="font-medium text-gray-800">{user?.name}</p>
                  <p className="text-sm text-gray-500 truncate">{user?.email}</p>
                </div>
              </div>
              <button
                onClick={logout}
                className="mt-4 w-full py-2 px-4 bg-gray-200 hover:bg-gray-300 rounded-lg text-gray-800 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden md:ml-0 mt-16 md:mt-0">
        <main className="flex-1 overflow-y-auto bg-gray-50">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;