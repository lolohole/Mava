<script>
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker
      .register("/service-worker.js")
      .then((registration) => {
        console.log("✅ Service worker registered with scope:", registration.scope);

        // مراقبة التحديثات
        registration.addEventListener("updatefound", () => {
          const installingWorker = registration.installing;
          console.log("🆕 A new service worker is being installed...", installingWorker);

          installingWorker.addEventListener("statechange", () => {
            console.log("🔄 Service worker state changed to:", installingWorker.state);

            if (installingWorker.state === "installed") {
              if (navigator.serviceWorker.controller) {
                console.log("📢 New content is available; please refresh.");
              } else {
                console.log("✅ Content is cached for offline use.");
              }
            }
          });
        });
      })
      .catch((error) => {
        console.error("❌ Service worker registration failed:", error);
      });
  } else {
    console.warn("⚠️ Service workers are not supported in this browser.");
  }
</script>
