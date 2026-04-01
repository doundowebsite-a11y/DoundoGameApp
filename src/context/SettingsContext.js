import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SettingsContext = createContext({});

export const SettingsProvider = ({ children }) => {
  const [highContrast, setHighContrast] = useState(false);

  useEffect(() => {
    // Load preference on mount
    AsyncStorage.getItem('settings_high_contrast').then((val) => {
      if (val !== null) setHighContrast(val === 'true');
    }).catch(console.error);
  }, []);

  const toggleHighContrast = async (val) => {
    setHighContrast(val);
    try {
      await AsyncStorage.setItem('settings_high_contrast', val.toString());
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <SettingsContext.Provider value={{ highContrast, toggleHighContrast }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => useContext(SettingsContext);
