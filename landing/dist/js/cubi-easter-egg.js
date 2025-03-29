// CUBI Easter Egg Script
// Listen for the "!cubi" key sequence and display a large neon text

(function() {
    // Keep track of keys pressed
    let keyBuffer = '';
    const triggerSequence = '!cubi';
    
    // Create the display element (but don't add it to DOM yet)
    const cubiElement = document.createElement('div');
    cubiElement.style.position = 'fixed';
    cubiElement.style.top = '0';
    cubiElement.style.left = '0';
    cubiElement.style.width = '100%';
    cubiElement.style.height = '100%';
    cubiElement.style.display = 'flex';
    cubiElement.style.justifyContent = 'center';
    cubiElement.style.alignItems = 'center';
    cubiElement.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    cubiElement.style.zIndex = '9999';
    cubiElement.style.opacity = '0';
    cubiElement.style.transition = 'opacity 0.5s ease-in';
    cubiElement.style.pointerEvents = 'none'; // So it doesn't interfere with clicks
    
    // Create the text element
    const textElement = document.createElement('div');
    textElement.textContent = 'CUBI le Goat';
    textElement.style.fontFamily = "'Orbitron', sans-serif";
    textElement.style.fontSize = '10vw';
    textElement.style.fontWeight = 'bold';
    textElement.style.color = '#00E0FF'; // Electric blue neon color
    textElement.style.textShadow = `
      0 0 5px #00E0FF,
      0 0 10px #00E0FF,
      0 0 20px #00E0FF,
      0 0 40px #00E0FF
    `;
    textElement.style.animation = 'neonFlicker 2s infinite alternate';
    
    // Add the style for the neon flicker animation
    const styleElement = document.createElement('style');
    styleElement.textContent = `
      @keyframes neonFlicker {
        0%, 18%, 22%, 25%, 53%, 57%, 100% {
          text-shadow: 
            0 0 5px #00E0FF,
            0 0 10px #00E0FF, 
            0 0 20px #00E0FF, 
            0 0 40px #00E0FF;
        }
        20%, 24%, 55% {
          text-shadow: none;
        }
      }
    `;
    document.head.appendChild(styleElement);
    
    // Add the text element to the main container
    cubiElement.appendChild(textElement);
    
    // Listen for keydown events
    document.addEventListener('keydown', function(event) {
      // Add the key to the buffer
      keyBuffer += event.key;
      
      // Keep only the last 5 characters
      if (keyBuffer.length > 5) {
        keyBuffer = keyBuffer.slice(-5);
      }
      
      // Check if the buffer matches the trigger sequence
      if (keyBuffer === triggerSequence) {
        // Reset the buffer
        keyBuffer = '';
        
        // Show the CUBI message
        showCubiMessage();
      }
    });
    
    function showCubiMessage() {
      // Add the element to the DOM
      document.body.appendChild(cubiElement);
      
      // Force reflow to ensure the transition works
      void cubiElement.offsetWidth;
      
      // Make it visible
      cubiElement.style.opacity = '1';
      
      // Set a timeout to remove it
      setTimeout(function() {
        // Start fading out
        cubiElement.style.opacity = '0';
        
        // Remove from DOM after transition completes
        setTimeout(function() {
          document.body.removeChild(cubiElement);
        }, 1500); // This should match or exceed the transition duration (500ms)
      }, 3000); // Show for 3 seconds
    }
  })();
