import React, { useEffect, useState } from "react";

const IosInstallPrompt = () => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const isIos = /iphone|ipad|ipod/i.test(window.navigator.userAgent);
    const isSafari = /^((?!chrome|android).)*safari/i.test(
      window.navigator.userAgent
    );
    const isInStandaloneMode =
      "standalone" in window.navigator && window.navigator.standalone;

    if (isIos && isSafari && !isInStandaloneMode) {
      setShow(true);
    }
  }, []);

  if (!show) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 9999,
      }}
    >
      <div
        style={{
          background: "#fff",
          padding: "2em",
          borderRadius: "10px",
          maxWidth: "350px",
          textAlign: "center",
        }}
      >
        <h2>Install this app</h2>
        <p>
          To install this app on your iPhone/iPad, tap <strong>Share</strong>{" "}
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/6/6b/Ios_share_icon.png"
            alt="Share Icon"
            style={{ verticalAlign: "middle", width: 24 }}
          />{" "}
          and then <strong>Add to Home Screen</strong>.
        </p>
        <img
          src="https://developer.apple.com/design/human-interface-guidelines/images/intro/add-to-home-screen_2x.png"
          alt="Add to Home Screen Example"
          style={{ width: 60, margin: "1em 0" }}
        />
        <button
          style={{
            marginTop: "1em",
            padding: "0.5em 1.5em",
            border: "none",
            background: "#007aff",
            color: "#fff",
            borderRadius: "5px",
            fontSize: "1em",
            cursor: "pointer",
          }}
          onClick={() => setShow(false)}
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default IosInstallPrompt;
