// src/context/UserContext.js
import React, { createContext, useState, useEffect } from 'react'; 
export const UserContext = createContext();
export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [project, setProject] = useState(null)

  useEffect(() => {
    const userId = localStorage.getItem("userId");
    const userName = localStorage.getItem("userName");
    const profileImage = localStorage.getItem("profileImage");

    if (userId && userName) {
      setUser({
        id: userId,
        name: userName,
        profile_image: profileImage || "",
      });
    }
  }, []);

  return (
    <UserContext.Provider value={{ user, setUser,project,setProject }}>
      {children}
    </UserContext.Provider>
  );
};
