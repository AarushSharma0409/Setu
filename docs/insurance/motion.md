# Insurance motion

Sprint I8 uses the shared Setu reveal and CSS transition system. Motion tokens are exported from `@setu/ui`: instant (100ms), fast (160ms), normal (240ms), and slow (360ms), with centralized easing and spring profiles for future Motion-for-React integration.

Motion is limited to transform and opacity: public landing reveals, card elevation, progress updates, and compact status feedback. The global reduced-motion rule disables animation and nearly eliminates transition duration without changing content or interaction.

`motion/react` is not installed in this repository, so I8 intentionally does not introduce another animation dependency solely for decorative polish.
