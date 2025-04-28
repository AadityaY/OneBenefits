import { apiRequest, queryClient } from "./queryClient";
import { User } from "@shared/schema";

// Get all users for the company
export async function getUsers() {
  const response = await apiRequest("GET", "/api/users");
  if (!response.ok) {
    throw new Error("Failed to fetch users");
  }
  return await response.json() as User[];
}

// Get user by ID
export async function getUser(id: number) {
  const response = await apiRequest("GET", `/api/users/${id}`);
  if (!response.ok) {
    throw new Error("Failed to fetch user");
  }
  return await response.json() as User;
}

// Create a new user
export async function createUser(userData: {
  username: string;
  password: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  role: "user" | "admin";
}) {
  const response = await apiRequest("POST", "/api/users", userData);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to create user");
  }
  
  // Invalidate users cache
  queryClient.invalidateQueries({ queryKey: ["/api/users"] });
  
  return await response.json() as User;
}

// Update a user
export async function updateUser(id: number, userData: {
  username?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  role?: "user" | "admin";
  active?: boolean;
  password?: string; // Optional for password changes
}) {
  const response = await apiRequest("PATCH", `/api/users/${id}`, userData);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to update user");
  }
  
  // Invalidate both the user and users list cache
  queryClient.invalidateQueries({ queryKey: ["/api/users"] });
  queryClient.invalidateQueries({ queryKey: [`/api/users/${id}`] });
  
  return await response.json() as User;
}

// Delete a user
export async function deleteUser(id: number) {
  const response = await apiRequest("DELETE", `/api/users/${id}`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to delete user");
  }
  
  // Invalidate users cache
  queryClient.invalidateQueries({ queryKey: ["/api/users"] });
  
  return await response.json();
}