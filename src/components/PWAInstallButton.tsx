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
    <>
      {isVisible && (
      <div
        style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: 'rgba(0,0,0,0.3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
        }}
      >
        <div
        style={{
          background: '#fff',
          padding: '32px 24px',
          borderRadius: '12px',
          boxShadow: '0 4px 24px rgba(0,0,0,0.15)',
          minWidth: '320px',
          textAlign: 'center',
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="pwa-install-title"
        >
        <h2 id="pwa-install-title" style={{ marginBottom: 16, fontWeight: 600 }}>Install App</h2>
        <p style={{ marginBottom: 24 }}>Add this app to your home screen for a better experience.</p>
        <button
          onClick={handleInstall}
          style={{
          padding: '10px 24px',
          backgroundColor: '#007bff',
          color: '#fff',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '16px',
          marginRight: '12px',
          }}
        >
          Install
        </button>
        <button
          onClick={() => setIsVisible(false)}
          style={{
          padding: '10px 24px',
          backgroundColor: '#eee',
          color: '#333',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '16px',
          }}
        >
          Cancel
        </button>
        </div>
      </div>
      )}
    </>
  );
};

export default PWAInstallButton;

