# Marble Game

This game is a 3D physics-based platformer where you control a marble navigating through challenging levels.

## Requirements

- A modern web browser with WebGL support and hardware acceleration enabled.
- Recommended browsers: Chrome, Firefox, or Edge.

## Controls

- **Movement:**  
  - **W / Up Arrow:** Move forward  
  - **S / Down Arrow:** Move backward  
  - **A / Left Arrow:** Move left  
  - **D / Right Arrow:** Move right  

- **Jump:** Press **Space** (only when on the ground).

- **Boost:** Hold **Shift** to activate boost.

- **Camera Control:**  
  - **Right Mouse Button:** Click and drag to rotate the camera.  
  - **Mouse Wheel:** Zoom in and out.

- **Reset Level:** Press **R** to restart the level.

## Troubleshooting

- **Low Performance:**  
  - Verify that hardware acceleration is enabled (e.g., visit `chrome://gpu` in Chrome).  
  - Ensure your dedicated GPU is being used instead of integrated graphics.  
  - Consider lowering the resolution or tweaking graphical settings if needed.

- **WebGL Issues:**  
  - Update your graphics drivers.  
  - Try an alternative browser with robust WebGL support.

- **Chrome WebGPU Flags:**  
  - Note: Enabling experimental WebGPU flags in Chrome can sometimes interfere with proper hardware acceleration for WebGL. If you experience issues, consider disabling these flags.
 
## ⚠️ Performance Warning  

- **FPS Drops on Battery (MacBooks)**  
  - macOS limits GPU performance on battery, even with Low Power Mode off.  
  - If capped at **30 FPS instead of 60**, try:  
    - **Plugging in your MacBook**  
    - **Using Chrome or Firefox** instead of Safari  
    - **Enabling WebGL High Performance in Safari**:  
      **Develop → Experimental Features → WebGL Power Preference → High Performance**  

- **Other Fixes**  
  - **Check hardware acceleration** (`chrome://gpu`)  
  - **Close background apps consuming CPU/GPU**  
  - **Ensure macOS isn’t throttling performance in settings**  
