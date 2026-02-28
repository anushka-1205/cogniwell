import React, { createContext, useContext, useEffect, useState, useMemo } from "react";
import axiosLib from "axios";

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const cached = localStorage.getItem("cachedUser");
    return cached ? JSON.parse(cached) : null;
  });

  const [role, setRole] = useState(() => localStorage.getItem("cachedRole"));
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [reloading, setReloading] = useState(false); 

  const axios = useMemo(
    () =>
      axiosLib.create({
        baseURL: import.meta.env.VITE_BACKEND_URL,
        withCredentials: true,
      }),
    []
  );

  const cacheSession = (user, role) => {
    if (user && role) {
      localStorage.setItem("cachedUser", JSON.stringify(user));
      localStorage.setItem("cachedRole", role);
    } else {
      localStorage.removeItem("cachedUser");
      localStorage.removeItem("cachedRole");
    }
  };

  
  const checkAuth = async () => {
    try {
      const [userRes, caregiverRes] = await Promise.allSettled([
        axios.get("/api/user/is-auth"),
        axios.get("/api/caregiver/is-auth"),
      ]);

      if (
        userRes.status === "fulfilled" &&
        userRes.value.data.success &&
        userRes.value.data.user
      ) {
        setUser(userRes.value.data.user);
        setRole("user");
        cacheSession(userRes.value.data.user, "user");
      } else if (
        caregiverRes.status === "fulfilled" &&
        caregiverRes.value.data.success &&
        caregiverRes.value.data.caregiver
      ) {
        setUser(caregiverRes.value.data.caregiver);
        setRole("caregiver");
        cacheSession(caregiverRes.value.data.caregiver, "caregiver");
      } else {
        setUser(null);
        setRole(null);
        cacheSession(null, null);
      }
    } catch (err) {
      console.error("Auth check failed:", err);
    } finally {
      setInitialized(true);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  
  const refreshUser = async () => {
    await checkAuth();
  };

  
  const showTemporaryLoader = async (duration = 700) => {
    setReloading(true);
    return new Promise((resolve) => {
      setTimeout(() => {
        setReloading(false);
        resolve();
      }, duration);
    });
  };

  
  const signup = async (form, navigate) => {
    try {
      const { data } = await axios.post("/api/user/register", form);
      if (data.success) {
        await showTemporaryLoader();
        navigate("/login");
        return { success: true };
      }
      return { success: false, message: data.message };
    } catch {
      return { success: false, message: "Signup failed" };
    }
  };

  
  const loginUser = async (email, password, navigate) => {
    try {
      const { data } = await axios.post("/api/user/login", { email, password });
      if (data.success) {
        setUser(data.user);
        setRole("user");
        cacheSession(data.user, "user");
        await showTemporaryLoader();
        navigate("/test");
        return { success: true };
      }
      return { success: false, message: data.message };
    } catch {
      return { success: false, message: "Login failed" };
    }
  };

  
  const loginCaregiver = async (email, password, navigate) => {
    try {
      const { data } = await axios.post("/api/caregiver/login", {
        email,
        password,
      });

      if (data.success) {
        setUser(data.caregiver);
        setRole("caregiver");
        cacheSession(data.caregiver, "caregiver");

        
        await refreshUser(); 
        await showTemporaryLoader(); 
        navigate("/caregiver/dashboard");

        return { success: true };
      }

      return { success: false, message: data.message };
    } catch (err) {
      return { success: false, message: "Login failed" };
    }
  };




  
  const logout = async (navigate) => {
    try {
      if (role === "caregiver") await axios.get("/api/caregiver/logout");
      else if (role === "user") await axios.get("/api/user/logout");
    } catch (err) {
      console.error(err);
    } finally {
      setUser(null);
      setRole(null);
      cacheSession(null, null);
      await showTemporaryLoader();
      navigate("/");
    }
  };

  return (
    <AppContext.Provider
      value={{
        axios,
        user,
        role,
        initialized,
        reloading,
        signup,
        loginUser,
        loginCaregiver,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);
