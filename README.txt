FLING — CLEAN WEBSITE BUILD
============================

This build keeps the existing FLING visual design intact and removes the
previous motion override/patch layer.

Structure
---------
index.html   Markup and page sections
styles.css   Single source of truth for visual design/layout
app.js       Single motion + interaction controller
assets/      Product imagery, references and temporary GLB

Motion rules
------------
- No AOS.
- GSAP + ScrollTrigger are used only for authored motion.
- Animations avoid overwriting CSS transforms that define the design.
- No duplicate animation systems.
- No legacy scene.js / Three.js layer.
- No appended CSS override layer.
- Reduced-motion support is included.

3D
--
assets/fling-can.glb is a temporary generic can model for the interactive
Can Lab. Replace it later with the final FLING-branded GLB.

Run
---
Open index.html in a browser. Internet access is required for the Google Fonts,
GSAP, ScrollTrigger and model-viewer CDN dependencies.
