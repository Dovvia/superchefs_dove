// import React, { useState, useEffect } from "react";

// const PWAInstallButton = () => {
//   const [deferredPrompt, setDeferredPrompt] = useState(null);
//   const [isInstallable, setIsInstallable] = useState(false);

//   useEffect(() => {
//     const handleBeforeInstallPrompt = (e) => {
//       e.preventDefault();
//       setDeferredPrompt(e);
//       setIsInstallable(true);
//     };

//     window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

//     return () => {
//       window.removeEventListener(
//         "beforeinstallprompt",
//         handleBeforeInstallPrompt
//       );
//     };
//   }, []);

//   const handleInstallClick = async () => {
//     if (deferredPrompt) {
//       deferredPrompt.prompt();
//       const choiceResult = await deferredPrompt.userChoice;
//       if (choiceResult.outcome === "accepted") {
//         console.log("User accepted the install prompt");
//       } else {
//         console.log("User dismissed the install prompt");
//       }
//       setDeferredPrompt(null);
//     }
//   };

//   return (
//     isInstallable && (
//       <button onClick={handleInstallClick} style={buttonStyle}>
//         Install App
//       </button>
//     )
//   );
// };

// const buttonStyle = {
//   padding: "10px 20px",
//   backgroundColor: "#007BFF",
//   color: "red",
//   border: "none",
//   width: "500px",
//   height: "500px",
//   borderRadius: "5px",
//   cursor: "pointer",
//   fontSize: "16px",
//   zIndex: 80000,
// };

// export default PWAInstallButton;


import { useEffect, useState } from 'react';

const PWAInstallButton = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      console.log('beforeinstallprompt event fired'); // Debugging
      e.preventDefault();
      setDeferredPrompt(e);
      setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();

    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      console.log('PWA installed');
    } else {
      console.log('PWA install dismissed');
    }

    setDeferredPrompt(null);
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <button
      onClick={handleInstall}
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        padding: '10px 16px',
        backgroundColor: '#007bff',
        color: '#fff',
        border: 'none',
        borderRadius: '8px',
        boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
        cursor: 'pointer',
        zIndex: 1000
      }}
    >
      Install App
    </button>
  );
};

export default PWAInstallButton;

