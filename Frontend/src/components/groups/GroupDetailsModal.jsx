// client/src/components/groups/GroupDetailsModal.jsx
import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { toast } from "react-hot-toast";
import {
  HiX,
  HiCamera,
  HiPencil,
  HiTrash,
  HiUserAdd,
  HiUserRemove,
  HiLogout,
} from "react-icons/hi";
import Avatar from "../common/Avatar";
import LoadingSpinner from "../common/LoadingSpinner";
import api from "../../services/api";
import {
  updateGroup,
  deleteGroup,
  removeGroupMember,
  addGroupMembers,
} from "../../services/groupService";
import AddMembersModal from "./AddMembersModal";

const GroupDetailsModal = ({ group, onClose, setGroup }) => {
  const [tab, setTab] = useState("info"); // 'info', 'members'
  const [isEditing, setIsEditing] = useState(false);
  const [groupData, setGroupData] = useState({
    name: group.name,
    description: group.description || "",
  });
  const [avatar, setAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(group.avatar);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddMembers, setShowAddMembers] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const { user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // Check user permissions
  const isAdmin = group.members.some(
    (m) => m.user._id === user._id && m.role === "admin"
  );
  const isCreator = group.creator._id === user._id;
  const canManageGroup = isAdmin || isCreator;

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setGroupData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle avatar click
  const handleAvatarClick = () => {
    if (canManageGroup) {
      fileInputRef.current.click();
    }
  };

  // Handle avatar change
  const handleAvatarChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      if (file.type.startsWith("image/")) {
        setAvatar(file);

        // Create preview
        const reader = new FileReader();
        reader.onload = (event) => {
          setAvatarPreview(event.target.result);
        };
        reader.readAsDataURL(file);
      } else {
        toast.error("Please select an image file");
      }
    }
  };

  // Toggle edit mode
  const toggleEditMode = () => {
    if (isEditing) {
      // Cancel editing - revert to original data
      setGroupData({
        name: group.name,
        description: group.description || "",
      });
      setAvatarPreview(group.avatar);
      setAvatar(null);
    }

    setIsEditing(!isEditing);
  };

  // Save group changes
  const handleSaveChanges = async () => {
    if (!groupData.name.trim()) {
      toast.error("Group name is required");
      return;
    }

    try {
      setIsLoading(true);

      // Create form data
      const formData = new FormData();
      formData.append("name", groupData.name);
      formData.append("description", groupData.description);

      if (avatar) {
        formData.append("avatar", avatar);
      }

      // Update group
      const updatedGroup = await updateGroup(group._id, formData);

      // Update local state
      setGroup(updatedGroup);

      // Exit edit mode
      setIsEditing(false);
      toast.success("Group updated successfully");
    } catch (error) {
      console.error("Error updating group:", error);
      toast.error(error.message || "Failed to update group");
    } finally {
      setIsLoading(false);
    }
  };

  // Delete group
  const handleDeleteGroup = async () => {
    try {
      setIsLoading(true);

      await deleteGroup(group._id);

      toast.success("Group deleted successfully");
      onClose();
      navigate("/");
    } catch (error) {
      console.error("Error deleting group:", error);
      toast.error(error.message || "Failed to delete group");
    } finally {
      setIsLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  // Leave group
  const handleLeaveGroup = async () => {
    try {
      setIsLoading(true);

      await removeGroupMember(group._id, user._id);

      toast.success(`You left ${group.name}`);
      onClose();
      navigate("/");
    } catch (error) {
      console.error("Error leaving group:", error);
      toast.error(error.message || "Failed to leave group");
    } finally {
      setIsLoading(false);
    }
  };

  // Remove member
  const handleRemoveMember = async (memberId) => {
    try {
      if (!canManageGroup) {
        toast.error("You don't have permission to remove members");
        return;
      }

      // Cannot remove yourself through this method
      if (memberId === user._id) {
        toast.error('Use the "Leave Group" button to leave the group');
        return;
      }

      // Cannot remove the creator unless you are the creator
      const memberToRemove = group.members.find((m) => m.user._id === memberId);
      if (memberToRemove.role === "admin" && !isCreator) {
        toast.error("Only the group creator can remove admins");
        return;
      }

      setIsLoading(true);

      const updatedGroup = await removeGroupMember(group._id, memberId);

      // Update local state
      setGroup(updatedGroup);

      toast.success("Member removed successfully");
    } catch (error) {
      console.error("Error removing member:", error);
      toast.error(error.message || "Failed to remove member");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle adding new members
  const handleMembersAdded = (updatedGroup) => {
    setGroup(updatedGroup);
    setShowAddMembers(false);
    toast.success("Members added successfully");
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md h-full md:h-auto md:max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b">
          <div className="flex items-center space-x-4">
            <h2 className="text-xl font-semibold">Group Details</h2>

            {/* Tabs */}
            <div className="flex space-x-2">
              <button
                onClick={() => setTab("info")}
                className={`px-3 py-1 rounded-md text-sm ${
                  tab === "info"
                    ? "bg-primary text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
                aria-label="Group Info"
              >
                Info
              </button>
              <button
                onClick={() => setTab("members")}
                className={`px-3 py-1 rounded-md text-sm ${
                  tab === "members"
                    ? "bg-primary text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
                aria-label="Group Members"
              >
                Members ({group.members.length})
              </button>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100"
            aria-label="Close group details"
          >
            <HiX className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {tab === "info" ? (
            // Group Info Tab
            <div className="space-y-4">
              {/* Group Avatar */}
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <div
                    onClick={handleAvatarClick}
                    className={`w-24 h-24 rounded-full overflow-hidden flex items-center justify-center cursor-pointer ${
                      avatarPreview ? "" : "bg-gray-200"
                    } ${canManageGroup ? "hover:opacity-80" : ""}`}
                    aria-label="Change Avatar"
                  >
                    {avatarPreview ? (
                      <img
                        src={avatarPreview}
                        alt="Group avatar"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-2xl font-bold text-gray-400">
                        {group.name.substring(0, 2).toUpperCase()}
                      </div>
                    )}
                  </div>
                  {canManageGroup && (
                    <button
                      type="button"
                      className="absolute bottom-0 right-0 bg-primary text-white p-2 rounded-full shadow-lg"
                      onClick={handleAvatarClick}
                      aria-label="Change group avatar"
                    >
                      <HiCamera className="w-5 h-5" />
                    </button>
                  )}
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleAvatarChange}
                    className="hidden"
                    accept="image/*"
                  />
                </div>
              </div>

              {/* Group Info */}
              {isEditing ? (
                // Edit Mode
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Group Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={groupData.name}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="Enter group name"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Group Description
                    </label>
                    <textarea
                      name="description"
                      value={groupData.description}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="Enter group description (optional)"
                    />
                  </div>

                  {/* Save or Cancel */}
                  <div className="flex justify-end space-x-2 mt-4">
                    <button
                      onClick={toggleEditMode}
                      className="px-4 py-2 border border-gray-300 rounded-md text-gray-600 bg-gray-100 hover:bg-gray-200"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveChanges}
                      disabled={isLoading}
                      className={`px-4 py-2 rounded-md text-white ${
                        isLoading
                          ? "bg-gray-400"
                          : "bg-primary hover:bg-primary-dark"
                      }`}
                    >
                      {isLoading ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                </div>
              ) : (
                // Display Mode
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold">{groupData.name}</h3>
                    <p className="text-sm text-gray-600">
                      {groupData.description || "No description available"}
                    </p>
                  </div>

                  <div className="flex justify-between items-center">
                    <button
                      onClick={toggleEditMode}
                      className="text-sm text-primary hover:underline"
                      aria-label="Edit group info"
                    >
                      <HiPencil className="w-5 h-5 inline-block mr-1" />
                      Edit Info
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            // Group Members Tab
            <div className="space-y-4">
              <div className="space-y-2">
                {group.members.map((member) => (
                  <div
                    key={member.user._id}
                    className="flex justify-between items-center"
                  >
                    <div className="flex items-center space-x-3">
                      <Avatar user={member.user} size="sm" />
                      <div>
                        <p className="font-semibold">{member.user.name}</p>
                        <p className="text-xs text-gray-500">{member.role}</p>
                      </div>
                    </div>

                    {/* Member Action Buttons */}
                    {canManageGroup && member.user._id !== user._id && (
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleRemoveMember(member.user._id)}
                          className="text-red-500 hover:text-red-600"
                          aria-label={`Remove ${member.user.name}`}
                        >
                          <HiUserRemove className="w-5 h-5" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Add Member Button */}
              {canManageGroup && (
                <div className="flex justify-end">
                  <button
                    onClick={() => setShowAddMembers(true)}
                    className="flex items-center space-x-2 text-primary hover:bg-gray-100 px-4 py-2 rounded-md"
                    aria-label="Add members to the group"
                  >
                    <HiUserAdd className="w-5 h-5" />
                    <span>Add Members</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between p-4 border-t">
          {/* Leave Group */}
          <button
            onClick={handleLeaveGroup}
            className="px-4 py-2 text-sm text-red-600 hover:bg-red-100 rounded-md"
            disabled={isLoading}
            aria-label="Leave group"
          >
            {isLoading ? "Leaving..." : "Leave Group"}
          </button>

          {/* Delete Group */}
          {canManageGroup && !showDeleteConfirm && (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="px-4 py-2 text-sm text-red-600 hover:bg-red-100 rounded-md"
              aria-label="Delete group"
            >
              Delete Group
            </button>
          )}

          {/* Confirm Delete */}
          {showDeleteConfirm && (
            <div className="flex space-x-2">
              <button
                onClick={handleDeleteGroup}
                className="px-4 py-2 text-sm text-white bg-red-600 hover:bg-red-700 rounded-md"
                disabled={isLoading}
                aria-label="Confirm delete group"
              >
                {isLoading ? "Deleting..." : "Confirm Delete"}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-md"
                aria-label="Cancel delete group"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Add Members Modal */}
      {showAddMembers && (
        <AddMembersModal
          group={group}
          onClose={() => setShowAddMembers(false)}
          onMembersAdded={handleMembersAdded}
        />
      )}
    </div>
  );
};

export default GroupDetailsModal;
