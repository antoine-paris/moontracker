# MoonTracker

MoonTracker is an interactive web application for visualizing the Moon and Sun's positions, phases, and orientation in the sky from various locations. Built with React, TypeScript, and Vite, it leverages astronomical calculations to provide a dynamic and educational experience.

## Features

- **Lunar Phase Visualization:** See the current phase of the Moon, including realistic rendering using NASA imagery and custom SVG masks for crescent, gibbous, and half-moon shapes.
- **Sun and Moon Position Tracking:** View the altitude and azimuth of the Sun and Moon for any date, time, and location. The app projects their positions onto a simulated sky stage.
- **Location Selection:** Choose from a list of world capitals to instantly update the sky view and lunar data.
- **Follow Modes:** Center the view on the Sun, Moon, or cardinal directions (N, E, S, O) for different perspectives.
- **Animation Controls:** Animate the passage of time to watch the Sun and Moon move across the sky. Adjust the speed and pause/play the animation.
- **Phase Geometry:** The Moon's illuminated limb is calculated and oriented correctly, including the parallactic angle and bright limb direction.
- **Earthshine Simulation:** Optionally display the faint glow of earthshine on the Moon's dark side.
- **Cardinal Overlays:** Show cardinal points (N, E, S, O) on the Sun and Moon for orientation.
- **Responsive UI:** Works on desktop and mobile, with a modern, dark-themed interface.
- **Telemetry Cards:** Display real-time data for the Sun and Moon, including altitude, azimuth, phase percentage, and orientation.

## Technical Details

- **Astronomical Calculations:** Uses [SunCalc](https://github.com/mourner/suncalc) for Sun/Moon positions and illumination. Custom math for projection, phase geometry, and orientation.
- **SVG Rendering:** The Moon is rendered using SVG with dynamic masks for accurate phase shapes. NASA imagery is used for realism.
- **State Management:** React hooks manage UI state, animation, and astronomical data.
- **Performance:** Vite enables fast development and hot module replacement (HMR).

## Getting Started

1. Clone the repository:

   ```sh
   git clone https://github.com/yourusername/moontracker.git
   cd moontracker
   ```

2. Install dependencies:

   ```sh
   npm install
   ```

3. Start the development server:

   ```sh
   npm run dev
   ```

4. Open [http://localhost:5173](http://localhost:5173) in your browser.

## Technologies Used

- [React](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vitejs.dev/)
- [SunCalc](https://github.com/mourner/suncalc)

## Contributing

Contributions are welcome! Please open issues or submit pull requests for improvements and new features.

## License

This project is licensed under the MIT License.

---

